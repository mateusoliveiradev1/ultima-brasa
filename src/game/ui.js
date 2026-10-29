// Interface do jogo: abrigo (hub) com Árvore da Brasa, HUD da expedição, cartas de nível, resultado e a Forja embutida.
import { fmt, fmtTime, cv } from '../shared/util.js';
import { GAME_TITLE } from '../shared/theme.js';
import { SKILLS, SKILL_IDS, PASSIVES, TREE, NODE, BRANCH, nodeCost, nodeOpen, hasRelic, RELIC_NODE, catadorRate, DEPTH_MULT, BOSS_TIME, cinzasFor, REBIRTH_MIN, patenteOf, patenteNeed, MILESTONES } from './data.js';
import { BIOMES, BIOME_ORDER, biomeUnlocked } from './biomes.js';
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
    onBoss: (b) => banner('⚠ ' + (b?.d?.name || 'O chefe') + ' chegou', 3200),
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
  const patente = () => patenteOf(save.lifetime);
  const mulOf = () => { const m = (1 + 0.08 * save.cinzas) * (1 + 0.01 * patente()); return { dmg: m, scrap: m }; };
  const scrapVal = el('b', {}, '0'), scrapRate = el('small', {}, '');
  const topbar = el('div', { class: 'h-top' },
    el('div', { class: 'g-logo' }, GAME_TITLE, el('small', {}, 'roguelike incremental')),
    el('div', { class: 'h-sp' }),
    el('div', { class: 'h-scrap', title: 'Sucata: moeda permanente' }, el('span', { class: 'ic' }, '⬢'), scrapVal, scrapRate),
    btn('sm', '♪', () => { save.music = !save.music; save.sfx = save.music; A.setEnabled({ sfx: save.sfx, music: save.music }); SV.save(); syncSound(); }, { id: 'snd', title: 'Som ligado/desligado' }),
    btn('sm', 'Forja de Efeitos', () => openForja(), { title: 'Pinte os efeitos das habilidades' }));
  const syncSound = () => { const b = topbar.querySelector('#snd'); b.textContent = save.music ? '♪' : '✕'; b.classList.toggle('off', !save.music); };

  // painel esquerdo: sobrevivente
  const rankName = el('div', { class: 'h-rank' }), rankBar = el('i'), rankSub = el('div', { class: 'h-ranksub' }), cinzasRow = el('div', { class: 'h-cinzas' });
  const treeBadge = el('span', { class: 'badge' }), treeBtn = btn('go tb', ['ÁRVORE DA BRASA', treeBadge], () => openTree());
  const msBtn = btn('', '', () => openMilestones());
  const statsBox = el('div', { class: 'h-stats' });
  const survivor = el('section', { class: 'g-panel h-surv' }, el('h2', {}, 'Sobrevivente', el('small', {}, 'sua conta permanente')),
    el('div', { class: 'h-rankbox' }, rankName, el('div', { class: 'g-bar' }, rankBar), rankSub), cinzasRow, el('div', { class: 'h-actions' }, treeBtn, msBtn), statsBox);

  // painel direito: expedição
  const mapsBox = el('div', { class: 'h-maps' }), relicRow = el('div', { class: 'h-relics' });
  const depthVal = el('b', {}, '1'), depthInfo = el('div', { class: 'h-depthinfo' });
  const skillName = el('div', { class: 'h-skname' }), skillDesc = el('div', { class: 'h-skdesc' });
  const go = btn('go', 'PARTIR', () => startRun());
  const expedition = el('section', { class: 'g-panel h-exp' },
    el('h2', {}, 'Expedição', el('small', {}, 'sobreviva ' + fmtTime(BOSS_TIME) + ' e derrube o chefe do mapa')),
    el('div', { class: 'h-sub' }, 'Mapa'), mapsBox,
    el('div', { class: 'h-sub' }, 'Habilidade inicial'), relicRow, skillName, skillDesc,
    el('div', { class: 'h-sub' }, 'Profundidade'),
    el('div', { class: 'h-depth' }, btn('sm', '−', () => setDepth(-1)), el('div', { class: 'h-dv' }, 'Nível ', depthVal), btn('sm', '+', () => setDepth(1))), depthInfo, go);
  const tabs = el('div', { class: 'h-tabs' }, btn('sm', 'Sobrevivente', () => setTab('surv'), { id: 'tsurv' }), btn('sm on', 'Expedição', () => setTab('exp'), { id: 'texp' }));
  const hub = el('div', { class: 'g-hub', 'data-tab': 'exp' }, topbar, tabs, survivor, expedition);
  ui.append(hub);
  function setTab(t) { hub.dataset.tab = t; tabs.querySelector('#tsurv').classList.toggle('on', t === 'surv'); tabs.querySelector('#texp').classList.toggle('on', t === 'exp'); }

  const affordable = () => TREE.filter((n) => (save.meta[n.id] || 0) < n.max && nodeOpen(n.id, save.meta) && save.scrap >= nodeCost(n.id, save.meta[n.id] || 0)).length;
  function renderSurvivor() {
    const p = patente(), lo = patenteNeed(p), hi = patenteNeed(p + 1);
    rankName.innerHTML = `Patente <b>${p}</b>`; rankBar.style.width = Math.max(0, Math.min(100, ((save.lifetime - lo) / (hi - lo)) * 100)) + '%';
    rankSub.textContent = `+${p}% de dano e sucata · próxima em ${fmt(Math.max(0, hi - save.lifetime))}`;
    cinzasRow.innerHTML = save.cinzas > 0 ? `<span>Cinzas</span><b>⬧ ${save.cinzas}</b><em>+${save.cinzas * 8}% dano e sucata</em>` : '<span class="dim">Renascer na Árvore dá Cinzas permanentes.</span>';
    const a = affordable(); treeBadge.textContent = a > 0 ? `${a} disponível${a > 1 ? 'is' : ''}` : ''; treeBadge.style.display = a > 0 ? '' : 'none';
    const done = MILESTONES.filter((m) => save.milestones[m.id]).length; msBtn.textContent = `Marcos  ${done}/${MILESTONES.length}`;
    statsBox.innerHTML = '';
    [['Expedições', save.runs], ['Vitórias', save.wins], ['Melhor tempo', fmtTime(save.best.time)], ['Abates (total)', fmt(save.kills)], ['Maior nível', save.best.level], ['Maior combo', save.best.combo || 0]].forEach(([x, y]) => statsBox.append(el('div', {}, el('span', {}, x), el('b', {}, y))));
  }
  function renderMaps() {
    mapsBox.innerHTML = '';
    for (const id of BIOME_ORDER) {
      const b = BIOMES[id], open = biomeUnlocked(id, save), sel = save.biome === id, prev = BIOMES[BIOME_ORDER[BIOME_ORDER.indexOf(id) - 1]];
      mapsBox.append(el('button', { class: 'h-map' + (sel ? ' sel' : '') + (open ? '' : ' lock'), style: `--c:${b.color}`, onmouseenter: sfxOver,
        onclick: () => { sfxClick(); if (!open) { showToast(`Derrote o chefe de ${prev.name} para liberar este mapa.`); return; } save.biome = id; SV.save(); game.enterHub({ skill: save.startSkill, biome: id }); renderAll(); } },
        el('b', {}, b.name), el('small', {}, open ? b.sub : '🔒 Vença em ' + prev.name), open ? el('em', {}, `chefe: ${ENEMIES_NAME(b.boss)} · sucata ×${b.scrap}`) : null));
    }
  }
  function renderRelics() {
    relicRow.innerHTML = '';
    for (const id of SKILL_IDS) {
      const owned = hasRelic(id, save.meta), sel = save.startSkill === id; const ic = skillIcon(id, 64); ic.className = 'ic';
      relicRow.append(el('button', { class: 'h-relic' + (sel ? ' sel' : '') + (owned ? '' : ' lock'), title: SKILLS[id].name + (owned ? '' : ' — libere na Árvore (ramo Forja)'), onmouseenter: sfxOver,
        onclick: () => { sfxClick(); if (!owned) { openTree(RELIC_NODE[id]); return; } save.startSkill = id; SV.save(); renderAll(); } }, ic, owned ? null : el('span', { class: 'lk' }, '🔒')));
    }
    if (!hasRelic(save.startSkill, save.meta)) save.startSkill = 'lamina';
    const s = SKILLS[save.startSkill]; skillName.textContent = s.name; skillName.style.color = s.color; skillDesc.textContent = s.tag + ' — ' + s.desc(1);
    if (game.mode === 'hub') game.setHubSkill(save.startSkill);
  }
  function setDepth(d) { save.depth = Math.max(1, Math.min(save.depthMax, save.depth + d)); SV.save(); renderDepth(); }
  function renderDepth() {
    save.depth = Math.min(save.depth, save.depthMax); depthVal.textContent = save.depth; const m = DEPTH_MULT(save.depth), b = BIOMES[save.biome];
    depthInfo.innerHTML = `Inimigos <b>×${(m.hp * b.hp).toFixed(2)}</b> vida · <b>×${(m.dmg * b.dmg).toFixed(2)}</b> dano &nbsp;|&nbsp; Sucata <b class="g">×${(m.scrap * b.scrap).toFixed(2)}</b>` + (save.depthMax === save.depth && save.depthMax < 30 ? '<div class="dim">Vença um chefe para liberar a próxima profundidade.</div>' : '');
  }
  function renderHubTop() { scrapVal.textContent = fmt(Math.floor(save.scrap)); const r = catadorRate(save.meta.catador) * SV.prestigeMul(); scrapRate.textContent = r > 0 ? `+${r.toFixed(2)}/s` : ''; }
  function renderAll() { renderMaps(); renderRelics(); renderDepth(); renderSurvivor(); renderHubTop(); syncSound(); if (treeOpen) refreshTree(); }
  function ENEMIES_NAME(id) { return ({ colosso: 'O Colosso', matriarca: 'A Matriarca', titan: 'Titã das Dunas', gigante: 'Gigante de Gelo' })[id]; }

  // ───────── Marcos ─────────
  const msList = el('div', { class: 'ms-list' });
  const msModal = el('div', { class: 'g-overlay ms' }, el('div', { class: 'ms-card' }, el('h2', {}, 'Marcos'), el('p', { class: 'dim' }, 'Metas permanentes. Cada marco concluído paga sucata na hora.'), msList, btn('sm', 'Fechar', () => msModal.classList.remove('show'))));
  ui.append(msModal);
  function openMilestones() { renderMilestones(); msModal.classList.add('show'); }
  function renderMilestones() {
    msList.innerHTML = '';
    for (const m of MILESTONES) { const v = Math.min(m.goal, m.get(save)), done = !!save.milestones[m.id];
      msList.append(el('div', { class: 'ms-row' + (done ? ' done' : '') }, el('div', { class: 'ms-i' }, el('b', {}, m.name), el('span', {}, m.desc), el('div', { class: 'g-bar' }, el('i', { style: `width:${(v / m.goal) * 100}%` }))), el('div', { class: 'ms-r' }, done ? '✓' : `⬢ ${fmt(m.reward)}`, el('small', {}, `${fmt(v)}/${fmt(m.goal)}`)))); }
  }
  function checkMilestones() {
    const got = []; for (const m of MILESTONES) if (!save.milestones[m.id] && m.get(save) >= m.goal) { save.milestones[m.id] = true; save.scrap += m.reward; save.lifetime += m.reward; save.earnedLife += m.reward; got.push(m); }
    if (got.length) { SV.save(); A.sfx('bell', { vol: 0.4, rate: 1.3 }); showToast('Marco: ' + got.map((m) => `${m.name} (+⬢ ${fmt(m.reward)})`).join(' · '), 5200); renderAll(); }
  }

  // ───────── Árvore da Brasa ─────────
  const U = 134, NS = 66; let treeOpen = false, selNode = null, view = { x: 0, y: 0, k: 1 };
  const nodeEls = {}, edgeEls = [];
  const svgNS = 'http://www.w3.org/2000/svg';
  const edgeSvg = document.createElementNS(svgNS, 'svg'); edgeSvg.setAttribute('class', 't-edges'); edgeSvg.setAttribute('width', 2400); edgeSvg.setAttribute('height', 2000); edgeSvg.setAttribute('viewBox', '-1200 -1000 2400 2000');
  const world = el('div', { class: 't-world' }, edgeSvg);
  const px = (n) => n.x * U, py = (n) => n.y * U;
  // ligações
  for (const n of TREE) { const parents = n.req.length ? n.req.map(([r]) => NODE[r]) : [{ id: 'root', x: 0, y: 0 }];
    for (const p of parents) { const ln = document.createElementNS(svgNS, 'line'); ln.setAttribute('x1', px(p)); ln.setAttribute('y1', py(p)); ln.setAttribute('x2', px(n)); ln.setAttribute('y2', py(n)); edgeSvg.append(ln); edgeEls.push({ ln, from: p.id, to: n.id, color: BRANCH[n.branch].color }); } }
  const rootEl = el('div', { class: 't-root', style: 'left:1200px;top:1000px' }, el('b', {}, '🔥'), el('span', {}, 'Brasa')); world.append(rootEl);
  for (const n of TREE) {
    const b = BRANCH[n.branch], e = el('button', { class: 't-node', style: `left:${1200 + px(n)}px;top:${1000 + py(n)}px;--c:${b.color}`, onclick: (ev) => { ev.stopPropagation(); selectNode(n.id); } }, el('span', { class: 'g' }, n.ico), el('i', { class: 'lv' }));
    nodeEls[n.id] = e; world.append(e);
  }
  for (const [k, t, x, y] of [['off', 'FÚRIA', 0, -4.5], ['def', 'CASCO', 0, 5.2], ['eco', 'ENGENHO', -5.2, -1.2], ['hab', 'FORJA', 4.9, 1.5]]) world.append(el('div', { class: 't-label', style: `left:${1200 + x * U}px;top:${1000 + y * U}px;color:${BRANCH[k].color}` }, t));
  const viewport = el('div', { class: 't-view' }, world);
  const tScrap = el('b'), detail = el('div', { class: 't-detail' });
  const rebirthBox = el('div', { class: 't-rebirth' });
  const tree = el('div', { class: 'g-tree' },
    el('div', { class: 't-head' }, el('div', { class: 'g-logo' }, 'Árvore da Brasa', el('small', {}, 'arraste para mover · role para ampliar')), el('div', { class: 'h-sp' }), el('div', { class: 'h-scrap' }, el('span', { class: 'ic' }, '⬢'), tScrap), btn('sm', 'Renascer', () => toggleRebirth()), btn('sm', 'Centralizar', () => fitTree()), btn('sm pri', 'Fechar', () => closeTree())),
    viewport, detail, rebirthBox);
  ui.append(tree);
  const applyView = () => { world.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.k})`; };
  function fitTree(focus) {
    const r = viewport.getBoundingClientRect(); const k = Math.max(0.42, Math.min(1, Math.min(r.width / (11.5 * U), r.height / (10.5 * U)))); view.k = k;
    const fx = focus ? 1200 + px(focus) : 1200, fy = focus ? 1000 + py(focus) : 1000; view.x = r.width / 2 - fx * k; view.y = r.height / 2 - fy * k; applyView();
  }
  // pan / zoom
  const ptrs = new Map(); let pinch = 0, moved = false;
  viewport.addEventListener('pointerdown', (e) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = false; pinch = 0; });
  viewport.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    if (ptrs.size === 1) { const dx = e.clientX - p.x, dy = e.clientY - p.y; if (!moved && Math.abs(dx) + Math.abs(dy) > 4) { moved = true; try { viewport.setPointerCapture(e.pointerId); } catch {} } if (!moved) return; view.x += dx; view.y += dy; applyView(); }
    p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinch); pinch = d; }
  });
  const endP = (e) => { ptrs.delete(e.pointerId); pinch = 0; }; viewport.addEventListener('pointerup', endP); viewport.addEventListener('pointercancel', endP);
  viewport.addEventListener('click', () => { if (!moved) selectNode(null); });
  function zoomAt(cx, cy, f) { const r = viewport.getBoundingClientRect(), k2 = Math.max(0.35, Math.min(1.8, view.k * f)), ff = k2 / view.k, ox = cx - r.left, oy = cy - r.top; view.x = ox - (ox - view.x) * ff; view.y = oy - (oy - view.y) * ff; view.k = k2; applyView(); }
  viewport.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });

  function lvlOf(id) { return save.meta[id] || 0; }
  function refreshTree() {
    tScrap.textContent = fmt(Math.floor(save.scrap));
    for (const n of TREE) {
      const lvl = lvlOf(n.id), open = nodeOpen(n.id, save.meta), max = lvl >= n.max, can = open && !max && save.scrap >= nodeCost(n.id, lvl), e = nodeEls[n.id];
      e.className = 't-node' + (open ? '' : ' locked') + (lvl > 0 ? ' bought' : '') + (max ? ' max' : '') + (can ? ' can' : '') + (selNode === n.id ? ' sel' : '');
      e.querySelector('.lv').textContent = n.max > 1 ? `${lvl}/${n.max}` : lvl ? '✓' : ''; e.style.setProperty('--p', (lvl / n.max) * 360 + 'deg');
    }
    for (const ed of edgeEls) { const fromOk = ed.from === 'root' || lvlOf(ed.from) >= (NODE[ed.to].req.find(([r]) => r === ed.from)?.[1] || 1), toLvl = lvlOf(ed.to) > 0; ed.ln.setAttribute('class', toLvl ? 'lit' : fromOk ? 'open' : ''); ed.ln.style.setProperty('--c', ed.color); }
    renderDetail();
  }
  function selectNode(id) { selNode = id; refreshTree(); if (id) A.sfx('click', { vol: 0.25 }); }
  function buy(id, n) {
    const node = NODE[id]; let bought = 0;
    while (bought < n && lvlOf(id) < node.max && nodeOpen(id, save.meta) && save.scrap >= nodeCost(id, lvlOf(id))) { save.scrap -= nodeCost(id, lvlOf(id)); save.meta[id] = lvlOf(id) + 1; bought++; }
    if (bought) { SV.save(); A.sfx('coin2', { vol: 0.5 }); A.synth('tick', { f: 520 + lvlOf(id) * 30, vol: 0.4 }); nodeEls[id].classList.add('pop'); setTimeout(() => nodeEls[id]?.classList.remove('pop'), 400); renderAll(); checkMilestones(); }
    else A.synth('hurt', { vol: 0.2 });
  }
  function maxAffordable(id) { let l = lvlOf(id), s = save.scrap, n = 0; while (l < NODE[id].max && s >= nodeCost(id, l)) { s -= nodeCost(id, l); l++; n++; } return n; }
  function renderDetail() {
    detail.innerHTML = ''; detail.classList.toggle('show', !!selNode); if (!selNode) return;
    const n = NODE[selNode], lvl = lvlOf(n.id), max = lvl >= n.max, open = nodeOpen(n.id, save.meta), cost = nodeCost(n.id, lvl), b = BRANCH[n.branch];
    const reqs = n.req.filter(([r, l]) => lvlOf(r) < l).map(([r, l]) => `${NODE[r].name} nv ${l}`);
    detail.style.setProperty('--c', b.color);
    detail.append(...[el('div', { class: 'd-top' }, el('div', { class: 'd-ico' }, n.ico), el('div', { class: 'd-name' }, el('b', {}, n.name), el('small', {}, `${b.name} · nível ${lvl}/${n.max}`)), btn('sm', '✕', () => selectNode(null))),
      el('p', {}, n.desc), el('div', { class: 'd-eff' }, el('span', {}, 'Agora ', el('b', {}, lvl ? n.fmt(lvl) : '—')), !max ? el('span', {}, 'Próximo ', el('b', { class: 'nx' }, n.fmt(lvl + 1))) : el('span', { class: 'g' }, 'Nível máximo')),
      !open ? el('div', { class: 'd-req' }, 'Requer: ' + reqs.join(', ')) : null,
      !max ? el('div', { class: 'd-buy' }, btn('go sm2', ['Comprar  ⬢ ' + fmt(cost)], () => buy(n.id, 1), { disabled: !open || save.scrap < cost }), btn('sm', '+10', () => buy(n.id, 10), { disabled: !open || maxAffordable(n.id) < 2 }), btn('sm', 'Máx', () => buy(n.id, 999), { disabled: !open || maxAffordable(n.id) < 2 })) : null].filter(Boolean));
  }
  function openTree(focusId) { A.init(); treeOpen = true; tree.classList.add('show'); hub.classList.add('under'); selNode = focusId || null; refreshTree(); requestAnimationFrame(() => fitTree(focusId ? NODE[focusId] : null)); }
  function closeTree() { treeOpen = false; tree.classList.remove('show'); hub.classList.remove('under'); rebirthBox.classList.remove('show'); renderAll(); }
  // Renascer (prestígio)
  function toggleRebirth() {
    rebirthBox.classList.toggle('show'); if (!rebirthBox.classList.contains('show')) return;
    const gain = cinzasFor(save.earnedLife), can = save.earnedLife >= REBIRTH_MIN && gain > 0;
    rebirthBox.innerHTML = '';
    rebirthBox.append(el('h3', {}, 'Renascer'), el('p', {}, 'Zera a sucata e os níveis da Árvore (relíquias ficam) e dá Cinzas: cada uma vale +8% de dano e sucata para sempre.'),
      el('div', { class: 'rb-row' }, el('span', {}, 'Sucata ganha nesta vida'), el('b', {}, fmt(save.earnedLife))), el('div', { class: 'rb-row' }, el('span', {}, 'Cinzas ao renascer'), el('b', { class: 'g' }, '⬧ ' + gain)),
      !can ? el('p', { class: 'dim' }, `Precisa de pelo menos ${fmt(REBIRTH_MIN)} de sucata ganha na vida atual.`) : null,
      el('div', { class: 'rb-btns' }, btn('go sm2', 'Confirmar', () => doRebirth(gain), { disabled: !can }), btn('sm', 'Cancelar', () => rebirthBox.classList.remove('show'))));
  }
  function doRebirth(gain) {
    for (const n of TREE) if (!n.id.startsWith('r_')) save.meta[n.id] = 0;
    save.scrap = 0; save.earnedLife = 0; save.cinzas += gain; save.rebirths++; SV.save(); rebirthBox.classList.remove('show'); selNode = null; A.sfx('bell', { vol: 0.7, rate: 0.7 }); showToast(`Você renasceu das cinzas. +${gain} Cinzas.`, 4200); renderAll();
  }
  renderAll();
  checkMilestones();

  // renda passiva dos Catadores
  let acc = 0; setInterval(() => {
    const r = catadorRate(save.meta.catador) * SV.prestigeMul(); if (r <= 0) return; acc += r * 0.5; if (acc >= 1) { const n = Math.floor(acc); acc -= n; save.scrap += n; save.lifetime += n; save.earnedLife += n; if (screen === 'hub') { renderHubTop(); if (treeOpen) refreshTree(); else if (Math.random() < 0.2) renderSurvivor(); } }
  }, 500);
  setInterval(() => SV.save(), 5000);
  window.addEventListener('beforeunload', () => SV.save());
  const off = SV.offlineGain(); if (off) { renderAll(); setTimeout(() => showToast(`Seus catadores trouxeram ⬢ ${fmt(off.gain)} de sucata enquanto você estava fora.`, 5200), 600); }

  // ───────── HUD ─────────
  const hpFill = el('i'), hpTxt = el('span'), lvlTxt = el('b'), xpFill = el('i'), timeTxt = el('div', { class: 'r-time' }), subTxt = el('div', { class: 'r-sub' });
  const bossName = el('span'), comboBox = el('div', { class: 'r-combo' }), comboFill = el('i'), comboTxt = el('b'), tideTxt = el('div', { class: 'r-tide' }, 'MARÉ DE SUCATA ×3');
  comboBox.append(comboTxt, el('div', { class: 'cbar' }, comboFill));
  const killsTxt = el('b'), scrapTxt = el('b'), bossFill = el('i'), bossBox = el('div', { class: 'r-boss' }, bossName, el('div', { class: 'g-bar' }, bossFill));
  const slotsBox = el('div', { class: 'r-slots' }), dashBtn = el('button', { class: 'r-dash', onpointerdown: (e) => { e.stopPropagation(); game.dashReq = true; } }, el('b', {}, 'Dash'), el('i'));
  const pauseBtn = btn('sm r-pause', 'II', () => setPaused(true));
  const joyBase = el('div', { class: 'r-joy' }, el('i')), joy = { id: null, ox: 0, oy: 0 };
  const hud = el('div', { class: 'g-hud' },
    el('div', { class: 'r-xp' }, xpFill),
    el('div', { class: 'r-hp' }, el('div', { class: 'g-bar hp' }, hpFill, hpTxt), el('div', { class: 'r-lvl' }, 'NV ', lvlTxt)),
    el('div', { class: 'r-mid' }, timeTxt, subTxt, bossBox, tideTxt), comboBox,
    el('div', { class: 'r-right' }, el('div', { class: 'r-kv' }, 'Abates ', killsTxt), el('div', { class: 'r-kv s' }, '⬢ ', scrapTxt), pauseBtn),
    slotsBox, dashBtn, joyBase);
  ui.append(hud);
  let slotKey = '';
  function updateHud() {
    const s = game.hud();
    hpFill.style.width = Math.max(0, (s.hp / s.maxHp) * 100) + '%'; hpTxt.textContent = `${Math.ceil(Math.max(0, s.hp))} / ${s.maxHp}`; lvlTxt.textContent = s.level;
    xpFill.style.width = ((s.xp / s.xpNext) * 100).toFixed(1) + '%'; timeTxt.textContent = fmtTime(s.time);
    subTxt.textContent = game.bossSpawned ? '' : `${game.endless ? 'Próximo chefe' : 'Chefe'} em ${fmtTime(s.bossIn)}`;
    killsTxt.textContent = fmt(s.kills); scrapTxt.textContent = fmt(s.scrap);
    tideTxt.classList.toggle('on', s.tide > 0);
    if (s.combo >= 3) { comboBox.classList.add('on'); comboTxt.textContent = `${s.combo} COMBO  ×${s.comboMul.toFixed(2)}`; comboFill.style.width = s.comboT * 100 + '%'; } else comboBox.classList.remove('on');
    if (s.boss) { bossName.textContent = s.boss.name; bossBox.classList.add('on'); bossFill.style.width = (s.boss.hp / s.boss.max) * 100 + '%'; } else bossBox.classList.remove('on');
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
  let runFlags = { won: false };
  function bank(r) {
    save.scrap += r.gain; save.lifetime += r.gain; save.earnedLife += r.gain; save.runs++; save.kills += r.kills; save.elites += r.elites;
    save.best.time = Math.max(save.best.time, r.time); save.best.kills = Math.max(save.best.kills, r.kills); save.best.level = Math.max(save.best.level, r.level); save.best.combo = Math.max(save.best.combo || 0, r.combo); SV.save();
  }
  function showResult(r) {
    hud.classList.remove('on'); levelUp.classList.remove('show'); pauseEl.classList.remove('show');
    const b = BIOMES[r.biome]; let unlockMsg = [];
    if (r.victory && !runFlags.won) {
      runFlags.won = true; save.wins++; save.biomeWins[r.biome] = (save.biomeWins[r.biome] || 0) + 1;
      if (r.depth >= save.depthMax && save.depthMax < 30) { save.depthMax = r.depth + 1; unlockMsg.push(`Profundidade ${save.depthMax} liberada!`); }
      const ni = BIOME_ORDER.indexOf(r.biome) + 1; if (ni < BIOME_ORDER.length && save.biomeWins[r.biome] === 1) unlockMsg.push(`Novo mapa: ${BIOMES[BIOME_ORDER[ni]].name}`);
    }
    const gainEl = el('b', { class: 'g' }, '⬢ 0'), close = () => { resEl.classList.remove('show'); };
    resEl.innerHTML = '';
    const btns = r.victory ? [btn('go sm2', 'Continuar (modo infinito)', () => { close(); hud.classList.add('on'); game.continueRun(); }), btn('', 'Coletar e voltar ao abrigo', () => { bank(r); close(); toHub(); })]
      : [btn('go sm2', 'Nova expedição', () => { bank(r); close(); startRun(); }), btn('', 'Voltar ao abrigo', () => { bank(r); close(); toHub(); })];
    resEl.append(el('div', { class: 'rs-card' + (r.victory ? ' win' : '') },
      el('div', { class: 'rs-t' }, r.victory ? 'Chefe derrotado' : 'A brasa se apagou'), el('div', { class: 'rs-s' }, r.victory ? `${b.name} · profundidade ${r.depth} concluída` : `${b.name} · resistiu ${fmtTime(r.time)}`),
      el('div', { class: 'rs-grid' }, ...[['Tempo', fmtTime(r.time)], ['Abates', fmt(r.kills)], ['Nível', r.level], ['Maior combo', r.combo], ['Elites', r.elites], ['Sucata achada', '⬢ ' + fmt(Math.floor(r.scrapFound))]].map(([a, v]) => el('div', {}, el('span', {}, a), el('b', {}, v)))),
      el('div', { class: 'rs-gain' }, r.victory ? 'Sucata a coletar ' : 'Sucata recolhida ', gainEl),
      ...unlockMsg.map((m) => el('div', { class: 'rs-unlock' }, m)),
      r.victory ? el('p', { class: 'dim' }, 'No modo infinito um chefe mais forte surge a cada 2:30 e a sucata continua acumulando. Se morrer, você ainda recolhe tudo.') : null,
      el('div', { class: 'rs-btns' }, ...btns)));
    resEl.classList.add('show'); A.sfx(r.victory ? 'bell' : 'creak', { vol: 0.6, rate: r.victory ? 1 : 0.7 });
    const t0 = performance.now(); const tick = () => { const u = Math.min(1, (performance.now() - t0) / 1300); gainEl.textContent = '⬢ ' + fmt(Math.floor(r.gain * (1 - Math.pow(1 - u, 3)))); if (u < 1) requestAnimationFrame(tick); }; tick();
    SV.save(); checkMilestones();
  }

  // ───────── fluxo ─────────
  function startRun() {
    A.init(); screen = 'run'; hub.classList.add('off'); hud.classList.add('on'); slotKey = '';
    runFlags = { won: false }; const mul = mulOf();
    game.startRun({ skill: save.startSkill, depth: save.depth, meta: { ...save.meta }, biome: save.biome, mul }); renderHubTop(); banner(BIOMES[save.biome].name + ' — sobreviva e derrube o chefe', 2600);
  }
  function toHub() { screen = 'hub'; hub.classList.remove('off'); hud.classList.remove('on'); game.enterHub({ skill: save.startSkill, biome: save.biome }); renderAll(); }

  // ───────── Forja embutida ─────────
  function openForja() {
    A.init(); if (forja) return; game.stop();
    const host = el('div', { class: 'g-forja' }); const back = btn('g-forjaback', '← Voltar ao jogo', () => closeForja());
    host.append(back); root.append(host);
    const fx = SKILL_FX_FOR(save.startSkill); forja = { host, inst: mountForja(host, { openId: fx }) };
  }
  const SKILL_FX_FOR = (id) => SKILLS[id].fx;
  function closeForja() { if (!forja) return; forja.inst.destroy(); forja.host.remove(); forja = null; game.fx.clear(); game.start(); renderAll(); }

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
