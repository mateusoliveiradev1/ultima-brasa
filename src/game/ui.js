// Interface do jogo: abrigo (hub) com Oficina incremental, HUD da expedição, cartas de nível, resultado e a Forja embutida.
import { fmt, fmtTime, cv } from '../shared/util.js';
import { GAME_TITLE } from '../shared/theme.js';
import { SKILLS, SKILL_IDS, PASSIVES, META, META_IDS, metaCost, catadorRate, RELICS, DEPTH_MULT, ENEMIES, BOSS_TIME } from './data.js';
import * as SV from './save.js';
import * as A from './audio.js';
import { Game, buildArt, skillIcon } from './game.js';
import { mountForja } from '../forja/forja.js';
import * as store from '../fx/store.js';

const el = (tag, props = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'html') e.innerHTML = v; else if (v !== undefined && v !== null) e[k] = v;
  }
  kids.flat().forEach((c) => c != null && c !== false && e.append(c.nodeType ? c : document.createTextNode(c)));
  return e;
};
const PASSIVE_ICO = { dmg: '✦', cdr: '⟳', spd: '»', hp: '♥', regen: '✚', magnet: '◎', area: '◌', luck: '☘', armor: '▣', crit: '✺' };
const NOMES_CHEFE = 'O Colosso';

export async function mountGame(root) {
  root.innerHTML = '';
  const save = SV.data();
  const stage = el('canvas', { class: 'g-stage' });
  const ui = el('div', { class: 'g-ui' });
  root.append(stage, ui);

  // ───────── carregamento ─────────
  const bar = el('i'), loadTxt = el('div', { class: 'g-loadtxt' }, 'Acendendo a brasa…');
  const loading = el('div', { class: 'g-loading' }, el('div', { class: 'g-logo big' }, GAME_TITLE), el('div', { class: 'g-bar' }, bar), loadTxt);
  ui.append(loading);
  await new Promise((r) => setTimeout(r, 30));
  const art = await buildArt((p) => { bar.style.width = Math.round(p * 100) + '%'; });
  loading.remove();

  let game = null, screen = 'hub', forja = null, hudT = 0, lastHud = 0;
  const hooks = {
    onLevelUp: (choices, rerolls) => showLevelUp(choices, rerolls),
    onChosen: () => { levelUp.classList.remove('show'); },
    onEnd: (r) => showResult(r),
    onWarn: (t) => banner(t),
    onBoss: () => banner('⚠ ' + NOMES_CHEFE + ' chegou', 3200),
  };
  game = new Game(stage, art, hooks); game.bloom = true; game.start();
  window.addEventListener('resize', () => game.resize());
  new ResizeObserver(() => game.resize()).observe(stage);

  // ───────── helpers ─────────
  const sfxClick = () => A.sfx('click', { vol: 0.4, vary: 0.05 });
  const sfxOver = () => A.sfx('over', { vol: 0.15, vary: 0.05, gap: 0.05 });
  const btn = (cls, label, onclick, extra = {}) => el('button', { class: 'g-btn ' + cls, onclick: (e) => { sfxClick(); onclick(e); }, onmouseenter: sfxOver, ...extra }, label);
  let toastT = 0;
  const toast = el('div', { class: 'g-toast' }); ui.append(toast);
  function showToast(t, ms = 3200) { toast.textContent = t; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), ms); }
  const bannerEl = el('div', { class: 'g-banner' }); ui.append(bannerEl); let banT = 0;
  function banner(t, ms = 2000) { bannerEl.textContent = t; bannerEl.classList.remove('show'); void bannerEl.offsetWidth; bannerEl.classList.add('show'); clearTimeout(banT); banT = setTimeout(() => bannerEl.classList.remove('show'), ms); }

  // ───────── ABRIGO (hub) ─────────
  const scrapVal = el('b', {}, '0'), scrapRate = el('small', {}, '');
  const topbar = el('div', { class: 'h-top' },
    el('div', { class: 'g-logo' }, GAME_TITLE, el('small', {}, 'roguelike incremental')),
    el('div', { class: 'h-sp' }),
    el('div', { class: 'h-scrap', title: 'Sucata: moeda permanente' }, el('span', { class: 'ic' }, '⬢'), scrapVal, scrapRate),
    btn('sm', '♪', () => { save.music = !save.music; save.sfx = save.music; A.setEnabled({ sfx: save.sfx, music: save.music }); SV.save(); syncSound(); }, { id: 'snd', title: 'Som ligado/desligado' }),
    btn('sm', 'Forja de Efeitos', () => openForja(), { title: 'Pinte os efeitos das habilidades' }));
  const syncSound = () => { const b = topbar.querySelector('#snd'); b.textContent = save.music ? '♪' : '✕'; b.classList.toggle('off', !save.music); };

  const shopList = el('div', { class: 'h-list' });
  const shop = el('section', { class: 'g-panel h-shop' }, el('h2', {}, 'Oficina', el('small', {}, 'melhorias permanentes')), shopList);
  const relicRow = el('div', { class: 'h-relics' });
  const depthVal = el('b', {}, '1'), depthInfo = el('div', { class: 'h-depthinfo' });
  const skillName = el('div', { class: 'h-skname' }), skillDesc = el('div', { class: 'h-skdesc' });
  const statsBox = el('div', { class: 'h-stats' });
  const go = btn('go', 'PARTIR', () => startRun());
  const expedition = el('section', { class: 'g-panel h-exp' },
    el('h2', {}, 'Expedição', el('small', {}, 'sobreviva ' + fmtTime(BOSS_TIME) + ' e derrube o Colosso')),
    el('div', { class: 'h-sub' }, 'Habilidade inicial'), relicRow, skillName, skillDesc,
    el('div', { class: 'h-sub' }, 'Profundidade'),
    el('div', { class: 'h-depth' }, btn('sm', '−', () => setDepth(-1)), el('div', { class: 'h-dv' }, 'Nível ', depthVal), btn('sm', '+', () => setDepth(1))), depthInfo,
    go, statsBox);
  const tabs = el('div', { class: 'h-tabs' }, btn('sm on', 'Oficina', () => setTab('shop'), { id: 'tshop' }), btn('sm', 'Expedição', () => setTab('exp'), { id: 'texp' }));
  const hub = el('div', { class: 'g-hub', 'data-tab': 'exp' }, topbar, tabs, shop, expedition);
  ui.append(hub);
  function setTab(t) { hub.dataset.tab = t; tabs.querySelector('#tshop').classList.toggle('on', t === 'shop'); tabs.querySelector('#texp').classList.toggle('on', t === 'exp'); }

  function renderShop() {
    shopList.innerHTML = '';
    for (const id of META_IDS) {
      const m = META[id], lvl = save.meta[id], max = lvl >= m.max, cost = metaCost(id, lvl), can = !max && save.scrap >= cost;
      const row = el('div', { class: 'h-up' + (can ? ' can' : '') + (max ? ' max' : '') },
        el('div', { class: 'h-upi' }, el('div', { class: 'h-upn' }, m.name, el('em', {}, ` ${lvl}/${m.max}`)), el('div', { class: 'h-upd' }, m.desc), el('div', { class: 'h-upv' }, lvl ? m.fmt(lvl) : '—', !max ? el('span', {}, '  →  ' + m.fmt(lvl + 1)) : null)),
        max ? el('div', { class: 'h-buy done' }, 'MÁX') : btn('h-buy', el('span', {}, '⬢ ' + fmt(cost)), () => buyMeta(id), { disabled: !can }));
      shopList.append(row);
    }
  }
  function buyMeta(id) {
    const lvl = save.meta[id], cost = metaCost(id, lvl); if (save.scrap < cost || lvl >= META[id].max) return;
    save.scrap -= cost; save.meta[id]++; SV.save(); A.sfx('coin2', { vol: 0.5 }); A.synth('tick', { f: 500 + lvl * 25, vol: 0.4 }); renderShop(); renderHubTop();
  }
  function renderRelics() {
    relicRow.innerHTML = '';
    for (const id of SKILL_IDS) {
      const owned = save.relics[id], sel = save.startSkill === id, cost = RELICS[id];
      const ic = skillIcon(id, 64); ic.className = 'ic';
      const b = el('button', { class: 'h-relic' + (sel ? ' sel' : '') + (owned ? '' : ' lock'), title: SKILLS[id].name + (owned ? '' : ` — desbloquear por ${fmt(cost)}`), onmouseenter: sfxOver,
        onclick: () => {
          sfxClick();
          if (!owned) { if (save.scrap >= cost) { save.scrap -= cost; save.relics[id] = true; save.startSkill = id; SV.save(); A.sfx('coin2', { vol: 0.5 }); renderAll(); } else showToast(`Faltam ${fmt(cost - save.scrap)} de sucata para a relíquia ${SKILLS[id].name}.`); return; }
          save.startSkill = id; SV.save(); renderAll();
        } }, ic, owned ? null : el('span', { class: 'lk' }, '⬢ ' + fmt(cost)));
      relicRow.append(b);
    }
    const s = SKILLS[save.startSkill]; skillName.textContent = s.name; skillName.style.color = s.color; skillDesc.textContent = s.tag + ' — ' + s.desc(1);
    if (game.mode === 'hub') game.setHubSkill(save.startSkill);
  }
  function setDepth(d) { save.depth = Math.max(1, Math.min(save.depthMax, save.depth + d)); SV.save(); renderDepth(); }
  function renderDepth() {
    depthVal.textContent = save.depth; const m = DEPTH_MULT(save.depth);
    depthInfo.innerHTML = `Inimigos <b>×${m.hp.toFixed(2)}</b> vida · <b>×${m.dmg.toFixed(2)}</b> dano &nbsp;|&nbsp; Sucata <b class="g">×${m.scrap.toFixed(2)}</b>` + (save.depthMax === save.depth && save.depthMax < 30 ? '<div class="dim">Vença o Colosso para liberar a próxima profundidade.</div>' : '');
  }
  function renderStats() {
    statsBox.innerHTML = '';
    const rows = [['Expedições', save.runs], ['Vitórias', save.wins], ['Melhor tempo', fmtTime(save.best.time)], ['Abates (total)', fmt(save.kills)], ['Maior nível', save.best.level]];
    rows.forEach(([a, b]) => statsBox.append(el('div', {}, el('span', {}, a), el('b', {}, b))));
  }
  function renderHubTop() { scrapVal.textContent = fmt(Math.floor(save.scrap)); const r = catadorRate(save.meta.catador); scrapRate.textContent = r > 0 ? `+${r.toFixed(2)}/s` : ''; }
  function renderAll() { renderShop(); renderRelics(); renderDepth(); renderStats(); renderHubTop(); syncSound(); }
  renderAll();

  // renda passiva dos Catadores
  let acc = 0; setInterval(() => {
    const r = catadorRate(save.meta.catador); if (r <= 0) return; acc += r * 0.5; if (acc >= 1) { const n = Math.floor(acc); acc -= n; save.scrap += n; save.lifetime += n; if (screen === 'hub') { renderHubTop(); if (Math.random() < 0.34) renderShop(); } }
  }, 500);
  setInterval(() => SV.save(), 5000);
  window.addEventListener('beforeunload', () => SV.save());
  const off = SV.offlineGain(); if (off) { renderAll(); setTimeout(() => showToast(`Seus catadores trouxeram ⬢ ${fmt(off.gain)} de sucata enquanto você estava fora.`, 5200), 600); }

  // ───────── HUD ─────────
  const hpFill = el('i'), hpTxt = el('span'), lvlTxt = el('b'), xpFill = el('i'), timeTxt = el('div', { class: 'r-time' }), subTxt = el('div', { class: 'r-sub' });
  const killsTxt = el('b'), scrapTxt = el('b'), bossFill = el('i'), bossBox = el('div', { class: 'r-boss' }, el('span', {}, NOMES_CHEFE), el('div', { class: 'g-bar' }, bossFill));
  const slotsBox = el('div', { class: 'r-slots' }), dashBtn = el('button', { class: 'r-dash', onpointerdown: (e) => { e.stopPropagation(); game.dashReq = true; } }, el('b', {}, 'Dash'), el('i'));
  const pauseBtn = btn('sm r-pause', 'II', () => setPaused(true));
  const joyBase = el('div', { class: 'r-joy' }, el('i')), joy = { id: null, ox: 0, oy: 0 };
  const hud = el('div', { class: 'g-hud' },
    el('div', { class: 'r-xp' }, xpFill),
    el('div', { class: 'r-hp' }, el('div', { class: 'g-bar hp' }, hpFill, hpTxt), el('div', { class: 'r-lvl' }, 'NV ', lvlTxt)),
    el('div', { class: 'r-mid' }, timeTxt, subTxt, bossBox),
    el('div', { class: 'r-right' }, el('div', { class: 'r-kv' }, 'Abates ', killsTxt), el('div', { class: 'r-kv s' }, '⬢ ', scrapTxt), pauseBtn),
    slotsBox, dashBtn, joyBase);
  ui.append(hud);
  let slotKey = '';
  function updateHud() {
    const s = game.hud();
    hpFill.style.width = Math.max(0, (s.hp / s.maxHp) * 100) + '%'; hpTxt.textContent = `${Math.ceil(Math.max(0, s.hp))} / ${s.maxHp}`; lvlTxt.textContent = s.level;
    xpFill.style.width = ((s.xp / s.xpNext) * 100).toFixed(1) + '%'; timeTxt.textContent = fmtTime(s.time);
    subTxt.textContent = game.bossSpawned ? '' : `Colosso em ${fmtTime(s.bossIn)}`;
    killsTxt.textContent = fmt(s.kills); scrapTxt.textContent = fmt(s.scrap);
    if (s.boss) { bossBox.classList.add('on'); bossFill.style.width = (s.boss.hp / s.boss.max) * 100 + '%'; } else bossBox.classList.remove('on');
    const key = s.skills.map((k) => k.id + k.lv).join(',');
    if (key !== slotKey) { slotKey = key; slotsBox.innerHTML = ''; for (const k of s.skills) { const ic = skillIcon(k.id, 64); ic.className = 'ic'; slotsBox.append(el('div', { class: 'r-slot', 'data-id': k.id, title: SKILLS[k.id].name, style: `--c:${SKILLS[k.id].color}` }, ic, el('i', { class: 'cd' }), el('b', {}, k.lv))); } }
    for (const k of s.skills) { const n = slotsBox.querySelector(`[data-id="${k.id}"] .cd`); if (n) n.style.height = (k.cd * 100) + '%'; }
    dashBtn.querySelector('i').style.height = (s.dash > 0 ? Math.min(100, (s.dash / 1.4) * 100) : 0) + '%'; dashBtn.classList.toggle('rdy', s.dash <= 0);
  }

  // ───────── cartas de nível ─────────
  const cardsBox = el('div', { class: 'lv-cards' }), rerollBtn = btn('sm', 'Trocar cartas', () => { game.reroll(); }), lvTitle = el('div', { class: 'lv-title' });
  const levelUp = el('div', { class: 'g-overlay lv' }, lvTitle, cardsBox, el('div', { class: 'lv-foot' }, rerollBtn, el('span', { class: 'dim' }, 'Teclas 1 · 2 · 3')));
  ui.append(levelUp);
  function showLevelUp(choices, rerolls) {
    lvTitle.innerHTML = `Subiu de nível <b>${game.level}</b>`; cardsBox.innerHTML = '';
    choices.forEach((c, i) => {
      const isSkill = c.kind === 'skill', def = isSkill ? SKILLS[c.id] : PASSIVES[c.id], col = isSkill ? def.color : '#ffb347', max = isSkill ? 6 : def.max;
      let icon; if (isSkill) { icon = skillIcon(c.id, 96); icon.className = 'ic'; } else icon = el('div', { class: 'ic glyph' }, PASSIVE_ICO[c.id]);
      const pips = el('div', { class: 'pips' }); for (let k = 1; k <= max; k++) pips.append(el('i', { class: k < c.lv ? 'on' : k === c.lv ? 'new' : '' }));
      cardsBox.append(el('button', { class: 'lv-card' + (c.isNew ? ' fresh' : ''), style: `--c:${col}`, onmouseenter: sfxOver, onclick: () => { sfxClick(); game.choose(i); } },
        el('div', { class: 'k' }, i + 1), c.isNew ? el('div', { class: 'tag' }, 'NOVA') : isSkill ? el('div', { class: 'tag u' }, `NV ${c.lv}`) : el('div', { class: 'tag p' }, 'PASSIVA'),
        icon, el('h3', {}, def.name), pips, el('p', {}, isSkill ? def.desc(c.lv) : def.desc)));
    });
    rerollBtn.disabled = rerolls <= 0; rerollBtn.textContent = `Trocar cartas (${rerolls})`;
    levelUp.classList.add('show'); game.keys.clear(); game.joy.x = game.joy.z = 0;
  }

  // ───────── pausa ─────────
  const pauseEl = el('div', { class: 'g-overlay pause' }, el('h2', {}, 'Pausado'), el('div', { class: 'ps-btns' }, btn('go sm2', 'Continuar', () => setPaused(false)), btn('', 'Abandonar expedição', () => { setPaused(false); game.finish(false); })), el('p', { class: 'dim' }, 'WASD / setas movem · Espaço ou Shift: dash · as habilidades disparam sozinhas'));
  ui.append(pauseEl);
  function setPaused(p) { if (game.mode !== 'run' || game.over || levelUp.classList.contains('show')) return; game.paused = p; pauseEl.classList.toggle('show', p); game.keys.clear(); }

  // ───────── resultado ─────────
  const resEl = el('div', { class: 'g-overlay result' }); ui.append(resEl);
  function showResult(r) {
    hud.classList.remove('on'); levelUp.classList.remove('show'); pauseEl.classList.remove('show');
    save.scrap += r.gain; save.lifetime += r.gain; save.runs++; save.kills += r.kills; if (r.victory) { save.wins++; if (r.depth >= save.depthMax) save.depthMax = Math.min(30, r.depth + 1); }
    save.best.time = Math.max(save.best.time, r.time); save.best.kills = Math.max(save.best.kills, r.kills); save.best.level = Math.max(save.best.level, r.level); SV.save();
    const unlocked = r.victory && r.depth === save.depthMax - 1;
    const gainEl = el('b', { class: 'g' }, '⬢ 0');
    resEl.innerHTML = '';
    resEl.append(el('div', { class: 'rs-card' + (r.victory ? ' win' : '') },
      el('div', { class: 'rs-t' }, r.victory ? 'O Colosso caiu' : 'A brasa se apagou'), el('div', { class: 'rs-s' }, r.victory ? `Profundidade ${r.depth} concluída` : `Você resistiu ${fmtTime(r.time)}`),
      el('div', { class: 'rs-grid' }, ...[['Tempo', fmtTime(r.time)], ['Abates', fmt(r.kills)], ['Nível', r.level], ['Sucata achada', '⬢ ' + fmt(Math.floor(r.scrapFound))]].map(([a, b]) => el('div', {}, el('span', {}, a), el('b', {}, b)))),
      el('div', { class: 'rs-gain' }, 'Sucata recolhida ', gainEl),
      unlocked ? el('div', { class: 'rs-unlock' }, `Profundidade ${save.depthMax} liberada!`) : null,
      el('div', { class: 'rs-btns' }, btn('go sm2', 'Nova expedição', () => { resEl.classList.remove('show'); startRun(); }), btn('', 'Voltar ao abrigo', () => { resEl.classList.remove('show'); toHub(); }))));
    resEl.classList.add('show'); A.sfx(r.victory ? 'bell' : 'creak', { vol: 0.6, rate: r.victory ? 1 : 0.7 });
    let v = 0; const t0 = performance.now(); const tick = () => { const u = Math.min(1, (performance.now() - t0) / 1300); v = Math.floor(r.gain * (1 - Math.pow(1 - u, 3))); gainEl.textContent = '⬢ ' + fmt(v); if (u < 1) requestAnimationFrame(tick); }; tick();
  }

  // ───────── fluxo ─────────
  function startRun() {
    A.init(); screen = 'run'; hub.classList.add('off'); hud.classList.add('on'); slotKey = '';
    game.startRun({ skill: save.startSkill, depth: save.depth, meta: { ...save.meta } }); renderHubTop(); banner('Sobreviva até o Colosso', 2200);
  }
  function toHub() { screen = 'hub'; hub.classList.remove('off'); hud.classList.remove('on'); game.enterHub({ skill: save.startSkill }); renderAll(); }

  // ───────── Forja embutida ─────────
  function openForja() {
    A.init(); if (forja) return; game.stop();
    const host = el('div', { class: 'g-forja' }); const back = btn('g-forjaback', '← Voltar ao jogo', () => closeForja());
    host.append(back); root.append(host);
    const fx = SKILL_FX_FOR(save.startSkill); forja = { host, inst: mountForja(host, { openId: fx }) };
  }
  const SKILL_FX_FOR = (id) => SKILLS[id].fx;
  function closeForja() { if (!forja) return; forja.inst.destroy(); forja.host.remove(); forja = null; game.fx.clear(); game.start(); renderRelics(); }

  // ───────── entrada ─────────
  const unlock = () => A.init().then(() => A.setEnabled({ sfx: save.sfx, music: save.music }));
  window.addEventListener('pointerdown', unlock, { once: false });
  window.addEventListener('keydown', (e) => {
    if (forja) return; unlock();
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (levelUp.classList.contains('show')) { if (['1', '2', '3'].includes(k)) game.choose(+k - 1); else if (k === 'r') game.reroll(); return; }
    if (screen === 'run') {
      if (k === 'escape' || k === 'p') { setPaused(!game.paused); return; }
      if (k === ' ' || k === 'shift') game.dashReq = true; else game.keys.add(k);
    } else if (screen === 'hub' && (k === 'enter')) startRun();
  });
  window.addEventListener('keyup', (e) => game.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => { game.keys.clear(); if (screen === 'run' && !game.over && !levelUp.classList.contains('show')) setPaused(true); });
  // joystick virtual (toque / arrastar na metade esquerda)
  stage.addEventListener('pointerdown', (e) => { if (screen !== 'run' || (e.pointerType === 'mouse')) return; if (e.clientX > innerWidth * 0.6 || joy.id !== null) return; joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; stage.setPointerCapture(e.pointerId); joyBase.style.cssText = `left:${e.clientX - 55}px;top:${e.clientY - 55}px;opacity:1`; });
  stage.addEventListener('pointermove', (e) => { if (e.pointerId !== joy.id) return; let dx = e.clientX - joy.ox, dz = e.clientY - joy.oy; const l = Math.hypot(dx, dz), m = 55; if (l > m) { dx = (dx / l) * m; dz = (dz / l) * m; } game.joy.x = dx / m; game.joy.z = dz / m; joyBase.firstChild.style.transform = `translate(${dx}px,${dz}px)`; });
  const endJoy = (e) => { if (e.pointerId !== joy.id) return; joy.id = null; game.joy.x = game.joy.z = 0; joyBase.style.opacity = 0; joyBase.firstChild.style.transform = ''; };
  stage.addEventListener('pointerup', endJoy); stage.addEventListener('pointercancel', endJoy);
  stage.addEventListener('contextmenu', (e) => e.preventDefault());

  // laço de UI
  setInterval(() => { if (screen === 'run' && !forja) updateHud(); }, 66);
  // expõe para testes automatizados
  window.__game = { game, save, startRun, toHub, openForja, closeForja };
}
