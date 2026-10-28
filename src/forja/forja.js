// FORJA DE EFEITOS — pinte a textura, ajuste o comportamento, veja ao vivo em 2.5D, use no jogo.
import { PAL, SWATCHES } from '../shared/theme.js';
import { TAU, cv, clamp } from '../shared/util.js';
import { buildSheet, SHEETS } from '../shared/art-chars.js';
import { buildGround } from '../shared/art-env.js';
import * as T from '../shared/art-fx.js';
import { FxSystem, KINDS, ALPHA_CURVES, DEFAULT_DEF, normalizeDef, cloneDef, serializeDef, getTex } from '../fx/core.js';
import { drawFx, touchTex } from '../fx/canvas-renderer.js';
import * as store from '../fx/store.js';
import { SKILL_FX } from '../fx/defaults.js';
import { Painter } from './painter.js';
import { KENNEY_BASES, kenneyCanvas } from '../assets/kenney-tex.js';

const SKILL_NAMES = { lamina: 'Lâmina de Ferrugem', brasas: 'Brasas Orbitais', arco: 'Arco Tóxico', nova: 'Nova de Cinzas', chuva: 'Chuva de Sucata', lanca: 'Lança de Brasa', impacto: 'Impacto (acerto)' };
const BASES = { 'Corte (crescente)': T.texSlash, 'Chama': T.texFlame, 'Faísca': T.texSpark, 'Faísca tóxica': T.texToxicSpark, 'Fumaça': T.texSmoke, 'Raio': T.texBolt, 'Anel de choque': T.texRing, 'Lança': T.texLance, 'Meteoro': T.texMeteor, 'Explosão': T.texImpact };
const WHICH = { body: 'Corpo', part: 'Partícula', hit: 'Impacto' };

const el = (tag, props = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== undefined && v !== null) e[k] = v;
  }
  kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
  return e;
};
const getp = (o, path) => path.split('.').reduce((a, k) => a?.[k], o);
const setp = (o, path, v) => { const ks = path.split('.'); const l = ks.pop(); ks.reduce((a, k) => a[k], o)[l] = v; };

// ── esquema do inspetor ──
const R = (k, label, min, max, step, extra = {}) => ({ t: 'range', k, label, min, max, step, ...extra });
const S_ = (k, label, opts, extra = {}) => ({ t: 'select', k, label, opts, ...extra });
const SCHEMA = [
  { title: 'Geral', fields: [
    { t: 'text', k: 'name', label: 'Nome' },
    S_('kind', 'Tipo', KINDS, { rebuild: true }),
    R('life', 'Duração (s)', 0.05, 3, 0.01, { hide: (d) => d.kind === 'orbit' }),
    R('life', 'Duração (0 = contínuo)', 0, 3, 0.01, { show: (d) => d.kind === 'orbit' }),
    R('glow', 'Brilho (bloom)', 0.3, 3, 0.05),
    S_('blend', 'Mistura', { add: 'Luz (aditivo)', alpha: 'Normal (fumaça)' }),
    R('tint', 'Tingir pelas cores', 0, 1, 0.01),
  ] },
  { title: 'Cores ao longo da vida', colors: true },
  { title: 'Corpo', toggle: 'body.on', fields: [
    R('body.size0', 'Tamanho inicial', 0.1, 10, 0.05),
    R('body.size1', 'Tamanho final', 0.1, 14, 0.05, { hide: (d) => d.kind === 'nova' && d.args.useRadius !== false }),
    R('body.stretch', 'Esticar (comprimento)', 0.3, 3, 0.01),
    R('body.offset', 'Distância do herói', 0, 5, 0.05, { show: (d) => d.kind === 'slash' }),
    R('body.sweep', 'Varredura (°)', -180, 180, 1, { show: (d) => d.kind === 'slash' }),
    R('body.rot0', 'Rotação (°)', -180, 180, 1),
    R('body.spin', 'Giro (rad/s)', -12, 12, 0.1, { show: (d) => ['orbit', 'projectile', 'nova'].includes(d.kind) }),
    R('body.y', 'Altura', 0, 3, 0.05, { hide: (d) => d.body.flat }),
    S_('body.alpha', 'Curva de opacidade', Object.fromEntries(ALPHA_CURVES.map((k) => [k, { fade: 'Surge e some', flash: 'Clarão (some rápido)', hold: 'Mantém e some', pulse: 'Pulso' }[k]]))),
    S_('body.ease', 'Curva de tamanho', { out: 'Rápido → lento', lin: 'Linear', in: 'Lento → rápido' }),
    { t: 'check', k: 'body.flat', label: 'Deitado no chão' },
  ] },
  { title: 'Partículas', toggle: 'part.on', fields: [
    R('part.burst', 'Quantidade (explosão)', 0, 80, 1),
    R('part.rate', 'Taxa contínua (/s)', 0, 160, 1, { show: (d) => ['slash', 'projectile', 'orbit'].includes(d.kind) }),
    R('part.life', 'Vida (s)', 0.1, 2.5, 0.05),
    R('part.speed', 'Velocidade', 0, 16, 0.1),
    R('part.spread', 'Abertura (°)', 0, 360, 1),
    R('part.gravity', 'Gravidade', -8, 10, 0.1),
    R('part.drag', 'Atrito', 0, 6, 0.05),
    R('part.lift', 'Impulso p/ cima', -3, 6, 0.1),
    R('part.size0', 'Tamanho inicial', 0.05, 3, 0.01),
    R('part.size1', 'Tamanho final', 0, 3, 0.01),
    R('part.stretch', 'Alongar na velocidade', 0, 2, 0.01),
    R('part.spin', 'Giro', 0, 12, 0.1),
    R('part.y', 'Altura de nascimento', 0, 3, 0.05),
  ] },
  { title: 'Impacto (flash no alvo)', toggle: 'hit.on', fields: [
    R('hit.size0', 'Tamanho inicial', 0.1, 8, 0.05),
    R('hit.size1', 'Tamanho final', 0.1, 10, 0.05),
    R('hit.life', 'Duração (s)', 0.05, 1.2, 0.01),
    R('hit.y', 'Altura', 0, 3, 0.05),
    { t: 'check', k: 'hit.flat', label: 'Deitado no chão' },
  ] },
  { title: 'Específicos do tipo', fields: [
    R('args.arc', 'Arco de acerto (°)', 20, 360, 1, { show: (d) => d.kind === 'slash' }),
    R('args.speed', 'Velocidade do projétil', 4, 30, 0.5, { show: (d) => d.kind === 'projectile' }),
    R('args.radius', 'Raio da nova', 1.5, 12, 0.1, { show: (d) => d.kind === 'nova' }),
    R('args.count', 'Quantidade', 1, 12, 1, { show: (d) => ['orbit', 'rain'].includes(d.kind) }),
    R('args.orbitRadius', 'Raio da órbita', 0.8, 6, 0.1, { show: (d) => d.kind === 'orbit' }),
    R('args.orbitSpeed', 'Velocidade orbital (°/s)', -540, 540, 5, { show: (d) => d.kind === 'orbit' }),
    R('args.chains', 'Saltos do raio', 1, 10, 1, { show: (d) => d.kind === 'chain' }),
    R('args.thick', 'Espessura do raio', 0.2, 3, 0.05, { show: (d) => d.kind === 'chain' }),
    R('args.spread', 'Área de queda', 0.5, 9, 0.1, { show: (d) => d.kind === 'rain' }),
    R('args.fall', 'Tempo de queda (s)', 0.1, 1.2, 0.01, { show: (d) => d.kind === 'rain' }),
  ] },
];

export function mountForja(root, opts = {}) {
  const ui = {};
  let def = null, which = 'body', raf = 0, alive = true, saveT = 0;
  const painter = (ui.painter = new Painter(el('canvas', { width: 512, height: 512 })));
  const fx = new FxSystem({ sinTilt: 0.82 });
  const sheets = { player: buildSheet('player'), raider: buildSheet('raider') };
  const ground = buildGround(512);
  const S = { playing: true, speed: 1, auto: true, gizmo: true, aim: { x: 6, z: 0, dx: 1, dz: 0 }, last: 0, orbit: null, loopT: 0, bloom: true };

  // ───────────── estrutura ─────────────
  const wrap = el('div', { class: 'fj' });
  root.append(wrap);
  const head = el('div', { class: 'fj-head' });
  const sel = el('select', { style: 'min-width:210px', onchange: () => openDef(sel.value) });
  const savedTag = el('span', { class: 'saved' }, '✓ salvo no navegador');
  head.append(
    el('div', { class: 'fj-logo' }, 'FORJA', el('small', {}, 'DE EFEITOS')),
    sel,
    el('button', { onclick: () => newDef(), title: 'Criar efeito do zero' }, '＋ Novo'),
    el('button', { onclick: () => dupDef(), title: 'Duplicar o efeito atual' }, 'Duplicar'),
    ui.reset = el('button', { onclick: () => resetDef(), title: 'Voltar ao visual original' }, 'Restaurar padrão'),
    ui.del = el('button', { onclick: () => delDef() }, 'Excluir'),
    savedTag, el('div', { class: 'sp' }),
    el('button', { onclick: () => exportCur() }, '⬇ Exportar efeito'),
    el('button', { onclick: () => exportAll() }, '⬇ Exportar tudo'),
    el('button', { onclick: () => fileIn.click() }, '⬆ Importar'),
  );
  if (opts.onClose) head.append(el('button', { class: 'pri', onclick: () => opts.onClose() }, '✕ Fechar Forja'));
  const fileIn = el('input', { type: 'file', accept: '.json,application/json', style: 'display:none', onchange: async () => { const f = fileIn.files[0]; if (!f) return; try { store.importAll(await f.text()); refreshList(); toast('Importado!'); openDef(def.id); } catch (e) { toast('Falha ao importar: ' + e.message); } fileIn.value = ''; } });
  head.append(fileIn);

  const left = el('div', { class: 'fj-left' }), right = el('div', { class: 'fj-right' }), center = el('div', { class: 'fj-center' });
  wrap.append(head, left, center, right);
  const toastEl = el('div', { class: 'fj-toast' }); wrap.append(toastEl);
  let toastT = 0; const toast = (m) => { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200); };

  // ── esquerda: pintura ──
  left.append(el('div', { class: 'fj-title' }, '1 · PINTAR A TEXTURA'));
  const tabs = el('div', { class: 'fj-tabs' });
  Object.entries(WHICH).forEach(([k, n]) => tabs.append(el('button', { 'data-w': k, onclick: () => switchTex(k) }, n)));
  left.append(tabs, el('div', { class: 'fj-note', id: 'texNote' }));
  left.append(el('div', { class: 'fj-canvaswrap' }, painter.display));
  const tools = el('div', { class: 'fj-row' });
  [['glow', '✦ Luz'], ['solid', '● Sólido'], ['erase', '⌫ Borracha']].forEach(([k, n]) => tools.append(el('button', { 'data-t': k, onclick: () => { painter.tool = k; syncTools(); } }, n)));
  left.append(tools);
  const mkRange = (label, min, max, step, get, set, fmt = (v) => v) => {
    const out = el('output', {}, fmt(get())), inp = el('input', { type: 'range', min, max, step, value: get(), oninput: () => { set(+inp.value); out.textContent = fmt(+inp.value); painter.render(); } });
    const r = el('div', { class: 'fj-fld' }, el('label', {}, label), inp, out); r.sync = () => { inp.value = get(); out.textContent = fmt(get()); }; return r;
  };
  const rs = [
    mkRange('Tamanho', 2, 90, 1, () => painter.size, (v) => (painter.size = v)),
    mkRange('Opacidade', 0.05, 1, 0.01, () => painter.opacity, (v) => (painter.opacity = v), (v) => v.toFixed(2)),
    mkRange('Maciez', 0, 1, 0.01, () => painter.softness, (v) => (painter.softness = v), (v) => v.toFixed(2)),
    mkRange('Simetria (raios)', 1, 16, 1, () => painter.sym, (v) => (painter.sym = v)),
  ];
  left.append(...rs);
  const sw = el('div', { class: 'fj-sw' });
  SWATCHES.forEach((c) => sw.append(el('i', { style: `background:${c}`, title: c, onclick: () => { painter.color = c; colorIn.value = c; syncSw(); } })));
  const colorIn = el('input', { type: 'color', value: painter.color, style: 'width:46px;height:28px;border:1px solid #3a2a24;border-radius:5px;background:none;padding:0', oninput: () => { painter.color = colorIn.value; syncSw(); } });
  const syncSw = () => [...sw.children].forEach((i) => i.classList.toggle('sel', i.title.toLowerCase() === painter.color.toLowerCase()));
  left.append(sw, el('div', { class: 'fj-row' }, el('span', { class: 'fj-note' }, 'Cor livre:'), colorIn,
    ui.mirror = el('button', { class: 'sm', onclick: () => { painter.mirror = !painter.mirror; ui.mirror.classList.toggle('on', painter.mirror); painter.render(); } }, '⇋ Espelho'),
    ui.grid = el('button', { class: 'sm on', onclick: () => { painter.showGrid = !painter.showGrid; ui.grid.classList.toggle('on', painter.showGrid); painter.render(); } }, 'Guias'),
    el('button', { class: 'sm', onclick: () => { painter.bg = { dark: 'mid', mid: 'light', light: 'dark' }[painter.bg]; painter.render(); } }, 'Fundo')));
  const baseSel = el('select', { style: 'flex:1', onchange: async () => { const v = baseSel.value; baseSel.value = ''; if (!v) return; painter.replaceWith(BASES[v] ? BASES[v]() : await kenneyCanvas(KENNEY_BASES[v])); } }, el('option', { value: '' }, 'Carregar base pintada…'), el('optgroup', { label: 'Pintadas à mão (tema)' }, ...Object.keys(BASES).map((k) => el('option', { value: k }, k))), el('optgroup', { label: 'Kenney.nl (CC0)' }, ...Object.keys(KENNEY_BASES).map((k) => el('option', { value: k }, k))));
  const pngIn = el('input', { type: 'file', accept: 'image/*', style: 'display:none', onchange: () => { const f = pngIn.files[0]; if (!f) return; const im = new Image(); im.onload = () => painter.replaceWith(im); im.src = URL.createObjectURL(f); pngIn.value = ''; } });
  left.append(el('div', { class: 'fj-row' }, baseSel, el('button', { class: 'sm', onclick: () => pngIn.click() }, 'PNG…'), pngIn));
  left.append(el('div', { class: 'fj-row' },
    el('button', { class: 'sm', onclick: () => painter.undo() }, '↶ Desfazer'), el('button', { class: 'sm', onclick: () => painter.redo() }, '↷ Refazer'),
    el('button', { class: 'sm', onclick: () => painter.glowPass() }, '✺ Acender'),
    el('button', { class: 'sm', onclick: () => painter.transform('flipH') }, '⇆'), el('button', { class: 'sm', onclick: () => painter.transform('flipV') }, '⇅'), el('button', { class: 'sm', onclick: () => painter.transform('rot90') }, '⟳90°'),
    el('button', { class: 'sm', onclick: () => painter.clear() }, 'Limpar')));
  left.append(el('div', { class: 'fj-note' }, 'Dica: use “Luz” com simetria 6–12 para criar runas e chamas em segundos. O “FRENTE →” da textura aponta para onde o efeito vai. Atalhos: Ctrl+Z / Ctrl+Y, B = luz, E = borracha, [ ] = tamanho, Espaço = disparar.'));

  // ── centro: palco ──
  const stage = el('canvas', {});
  const stageWrap = el('div', { class: 'fj-stagewrap' }, stage, el('div', { class: 'fj-hint' }, 'Clique no palco para mirar o efeito'));
  const trans = el('div', { class: 'fj-trans' },
    el('button', { class: 'pri', onclick: () => cast() }, '▶ Disparar'),
    ui.auto = el('button', { class: 'on', onclick: () => { S.auto = !S.auto; ui.auto.classList.toggle('on', S.auto); } }, '↻ Repetir'),
    ui.pause = el('button', { onclick: () => { S.playing = !S.playing; ui.pause.textContent = S.playing ? '❚❚ Pausar' : '▶ Continuar'; } }, '❚❚ Pausar'),
    el('label', {}, 'Velocidade', ui.spd = el('input', { type: 'range', min: 0.1, max: 1.5, step: 0.05, value: 1, style: 'width:90px', oninput: () => (S.speed = +ui.spd.value) })),
    ui.gz = el('button', { class: 'on', onclick: () => { S.gizmo = !S.gizmo; ui.gz.classList.toggle('on', S.gizmo); } }, 'Área de acerto'),
    ui.bl = el('button', { class: 'on', onclick: () => { S.bloom = !S.bloom; ui.bl.classList.toggle('on', S.bloom); } }, 'Bloom'),
  );
  center.append(stageWrap, trans);

  // ── direita: inspetor ──
  const inspector = el('div', { style: 'display:flex;flex-direction:column;gap:10px' });
  right.append(el('div', { class: 'fj-title' }, '2 · COMPORTAMENTO'), inspector);
  const bindBox = el('div', { class: 'fj-sec' });
  right.append(bindBox);

  // ───────────── dados ─────────────
  function refreshList() {
    const all = store.allDefs();
    const cur = def?.id;
    sel.innerHTML = '';
    for (const [id, d] of all) sel.append(el('option', { value: id }, (store.isCustom(id) ? '✎ ' : '') + d.name));
    if (cur && all.has(cur)) sel.value = cur;
  }
  async function decodeTextures(d) {
    for (const w of Object.keys(WHICH)) {
      const t = d.tex[w];
      if (typeof t === 'string') {
        await new Promise((res) => { const im = new Image(); im.onload = () => { const c = cv(256); c.getContext('2d').drawImage(im, 0, 0, 256, 256); d.tex[w] = c; res(); }; im.onerror = res; im.src = t; });
      } else if (t && (t.width !== 256)) { const c = cv(256); c.getContext('2d').drawImage(t, 0, 0, 256, 256); d.tex[w] = c; }
      else if (t) { const c = cv(256); c.getContext('2d').drawImage(t, 0, 0); d.tex[w] = c; } // copia p/ não mutar o padrão
      if (!d.tex[w]) d.tex[w] = cv(256);
    }
  }
  async function openDef(id) {
    const src = store.allDefs().get(id);
    if (!src) return;
    const d = cloneDef(src);
    await decodeTextures(d);
    def = d; sel.value = id;
    fx.clear(); S.orbit = null; S.last = -9;
    buildInspector(); switchTex(which); updateButtons(); buildBindings();
    cast();
  }
  function newDef() {
    const d = normalizeDef(DEFAULT_DEF());
    d.id = 'fx_' + Math.random().toString(36).slice(2, 7); d.name = 'Novo efeito';
    d.tex = { body: cv(256), part: cv(256), hit: cv(256) };
    T.texSpark && d.tex.part.getContext('2d').drawImage(T.texSpark(), 0, 0);
    d.tex.body.getContext('2d').drawImage(T.texSlash(), 0, 0);
    store.saveDef(d); refreshList(); openDef(d.id);
  }
  function dupDef() {
    const d = cloneDef(def); d.id = 'fx_' + Math.random().toString(36).slice(2, 7); d.name = def.name + ' (cópia)';
    store.saveDef({ ...d, tex: def.tex }); refreshList(); openDef(d.id);
  }
  function resetDef() { if (!store.isBuiltin(def.id)) return; store.removeDef(def.id); refreshList(); openDef(def.id); toast('Efeito restaurado'); }
  function delDef() { if (store.isBuiltin(def.id)) return; store.removeDef(def.id); refreshList(); openDef([...store.allDefs().keys()][0]); }
  function updateButtons() { ui.reset.style.display = store.isBuiltin(def.id) ? '' : 'none'; ui.del.style.display = store.isBuiltin(def.id) ? 'none' : ''; }

  function scheduleSave() {
    clearTimeout(saveT);
    saveT = setTimeout(() => { store.saveDef(def); refreshList(); updateButtons(); savedTag.classList.add('show'); setTimeout(() => savedTag.classList.remove('show'), 1400); }, 450);
  }
  const download = (name, text) => { const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: name }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  function exportCur() { download(`fx-${def.id}.json`, JSON.stringify(serializeDef(def), null, 1)); }
  function exportAll() { store.saveDef(def); download('ultima-brasa-efeitos.json', store.exportAll()); }

  // ───────────── pintura ─────────────
  function switchTex(w) {
    which = w;
    [...tabs.children].forEach((b) => b.classList.toggle('on', b.dataset.w === w));
    painter.attach(def.tex[w]);
    painter.onChange = () => { scheduleSave(); };
    const notes = { body: 'Forma principal do efeito (lâmina, chama, raio, ring, meteoro…).', part: 'Partícula emitida (faíscas, brasas, fumaça). Pequena e brilhante funciona melhor.', hit: 'Flash que aparece onde o efeito acerta (ative “Impacto” no inspetor).' };
    left.querySelector('#texNote').textContent = notes[w];
    syncTools(); syncSw();
  }
  function syncTools() { [...tools.children].forEach((b) => b.classList.toggle('on', b.dataset.t === painter.tool)); rs.forEach((r) => r.sync()); painter.render(); }

  // ───────────── inspetor ─────────────
  function field(f) {
    const d = def;
    const wrapf = (inner) => inner;
    const cur = getp(d, f.k);
    if (f.t === 'range') {
      const out = el('output', {}, cur), inp = el('input', { type: 'range', min: f.min, max: f.max, step: f.step, value: cur, oninput: () => { setp(d, f.k, +inp.value); out.textContent = (+inp.value).toFixed(f.step < 0.1 ? 2 : f.step < 1 ? 1 : 0); changed(f); } });
      out.textContent = (+cur).toFixed(f.step < 0.1 ? 2 : f.step < 1 ? 1 : 0);
      return el('div', { class: 'fj-fld' }, el('label', {}, f.label), inp, out);
    }
    if (f.t === 'select') return el('div', { class: 'fj-fld wide' }, el('label', {}, f.label), el('select', { onchange: (e) => { setp(d, f.k, e.target.value); changed(f); } }, ...Object.entries(f.opts).map(([k, n]) => el('option', { value: k, selected: k === cur }, n))));
    if (f.t === 'text') return el('div', { class: 'fj-fld wide' }, el('label', {}, f.label), el('input', { type: 'text', value: cur, oninput: (e) => { setp(d, f.k, e.target.value); changed(f); } }));
    if (f.t === 'check') return el('div', { class: 'fj-fld wide' }, el('label', {}, f.label), el('input', { type: 'checkbox', checked: !!cur, onchange: (e) => { setp(d, f.k, e.target.checked); changed(f, true); }, style: 'accent-color:#ff7a2a;width:18px;height:18px' }));
  }
  function changed(f, rebuild) {
    normalizeDef(def);
    if (f?.rebuild || rebuild) { buildInspector(); }
    if (f?.k === 'kind') { fx.clear(); S.orbit = null; S.last = -9; }
    if (f?.k?.startsWith('args.count') || f?.k === 'life' || f?.k === 'kind') { S.orbit = null; if (def.kind === 'orbit') fx.clear(); }
    scheduleSave();
  }
  function buildInspector() {
    inspector.innerHTML = '';
    for (const sec of SCHEMA) {
      const box = el('div', { class: 'fj-sec' });
      const h = el('h4', {}, sec.title);
      box.append(h);
      if (sec.toggle) {
        const on = getp(def, sec.toggle);
        h.append(el('span', { class: 'sw' }, on ? 'ativo' : 'desligado'));
        box.classList.toggle('off', !on);
        h.onclick = () => { setp(def, sec.toggle, !getp(def, sec.toggle)); changed(null); buildInspector(); };
      }
      if (sec.colors) {
        const row = el('div', { class: 'fj-row' });
        ['Início', 'Meio', 'Fim'].forEach((n, i) => row.append(el('div', { style: 'flex:1;display:flex;flex-direction:column;gap:3px;font-size:11px;color:var(--ash)' }, n, el('input', { type: 'color', value: def.colors[i], style: 'width:100%;height:30px;border:1px solid #3a2a24;border-radius:5px;background:none;padding:0', oninput: (e) => { def.colors[i] = e.target.value; normalizeDef(def); scheduleSave(); } }))));
        box.append(row, el('div', { class: 'fj-note' }, 'O efeito passa por estas 3 cores durante a vida. “Tingir pelas cores” mistura com a pintura da textura.'));
        // paleta rápida do tema
        const pal = el('div', { class: 'fj-sw', style: 'grid-template-columns:repeat(16,1fr)' });
        SWATCHES.forEach((c) => pal.append(el('i', { style: `background:${c}`, title: 'aplicar ao Meio', onclick: () => { def.colors[1] = c; normalizeDef(def); buildInspector(); scheduleSave(); } })));
        box.append(pal);
      } else {
        for (const f of sec.fields) {
          if (f.show && !f.show(def)) continue;
          if (f.hide && f.hide(def)) continue;
          box.append(field(f));
        }
      }
      inspector.append(box);
    }
  }
  function buildBindings() {
    bindBox.innerHTML = '';
    bindBox.append(el('h4', { style: 'cursor:default' }, 'Vínculos com o jogo'), el('div', { class: 'fj-note' }, 'Escolha qual efeito cada habilidade usa. Vale na hora no jogo.'));
    const grid = el('div', { class: 'fj-bind' });
    const all = [...store.allDefs()];
    SKILL_FX.forEach((sid) => {
      grid.append(el('label', {}, SKILL_NAMES[sid]));
      const s = el('select', { onchange: () => { store.setBinding(sid, s.value); toast('Vínculo salvo'); } }, ...all.map(([id, d]) => el('option', { value: id, selected: store.getBinding(sid) === id }, d.name)));
      grid.append(s);
    });
    bindBox.append(grid, el('button', { class: 'sm', style: 'margin-top:6px', onclick: () => { store.saveDef(def); buildBindings(); toast('Efeito atual salvo'); } }, 'Salvar efeito atual agora'));
  }

  // ───────────── palco ─────────────
  const hero = { x: 0, z: 0 };
  const dummies = [{ x: 5.2, z: 0.2 }, { x: 7.6, z: -2.2 }, { x: 4.4, z: -3.4 }, { x: 7.8, z: 2.4 }, { x: 3.6, z: 2.8 }];
  const view = { ppu: 56, ox: 0, oy: 0, dpr: 1 };
  const proj = (x, y, z) => [view.ox + x * view.ppu, view.oy + (z * fx.sinTilt - y * fx.cosTilt) * view.ppu];
  function resize() {
    const r = stageWrap.getBoundingClientRect(); view.dpr = Math.min(2, window.devicePixelRatio || 1);
    stage.width = Math.max(100, Math.floor(r.width * view.dpr)); stage.height = Math.max(100, Math.floor(r.height * view.dpr));
    view.ppu = Math.min(stage.width / 17, stage.height / 9.5);
    view.ox = stage.width * 0.2; view.oy = stage.height * 0.66;
  }
  const ro = new ResizeObserver(resize); ro.observe(stageWrap);

  function aimDir() { const d = Math.hypot(S.aim.x - hero.x, S.aim.z - hero.z) || 1; return { dx: (S.aim.x - hero.x) / d, dz: (S.aim.z - hero.z) / d }; }
  stage.addEventListener('pointerdown', (e) => {
    const r = stage.getBoundingClientRect(), sx = (e.clientX - r.left) * view.dpr, sy = (e.clientY - r.top) * view.dpr;
    S.aim.x = (sx - view.ox) / view.ppu; S.aim.z = (sy - view.oy) / (view.ppu * fx.sinTilt);
    cast();
  });
  function cast() {
    if (!def) return;
    const { dx, dz } = aimDir(), k = def.kind;
    if (k === 'orbit') { if (S.orbit && fx.insts.includes(S.orbit)) return; S.orbit = fx.spawn(def, { x: hero.x, z: hero.z, follow: hero, loop: true }); return; }
    const o = { x: hero.x, z: hero.z, dx, dz };
    if (k === 'projectile') { o.x += dx * 0.8; o.z += dz * 0.8; o.maxT = Math.min(def.life, 1.0); }
    if (k === 'chain') {
      const t = [...dummies].sort((a, b) => Math.hypot(a.x - hero.x, a.z - hero.z) - Math.hypot(b.x - hero.x, b.z - hero.z)).slice(0, def.args.chains);
      o.targets = t.map((d) => ({ x: d.x, z: d.z }));
    }
    if (k === 'rain') { o.x = S.aim.x; o.z = S.aim.z; }
    fx.spawn(def, o);
    S.last = performance.now();
  }

  function drawScene(ctx) {
    const W = stage.width, H = stage.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0a0708'; ctx.fillRect(0, 0, W, H);
    // chão em perspectiva
    ctx.save();
    ctx.translate(view.ox, view.oy); ctx.scale(1, fx.sinTilt);
    const pat = ctx.createPattern(ground, 'repeat'); const sc = view.ppu / 38; ctx.scale(sc, sc);
    ctx.fillStyle = pat; ctx.globalAlpha = 0.9; ctx.fillRect(-W, -H * 1.5, W * 2, H * 3);
    ctx.restore();
    // luz da brasa + vinheta
    const [hx, hy] = proj(hero.x, 0, hero.z);
    let g = ctx.createRadialGradient(hx + view.ppu * 0.8, hy - view.ppu * 0.7, 0, hx + view.ppu * 0.8, hy - view.ppu * 0.7, view.ppu * 9);
    g.addColorStop(0, 'rgba(255,150,70,.30)'); g.addColorStop(0.5, 'rgba(120,50,20,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(5,3,3,.82)');
    ctx.globalCompositeOperation = 'source-over';
    // personagens, ordenados por profundidade
    const ents = [{ z: hero.z, x: hero.x, s: sheets.player, f: 0, flip: false }, ...dummies.map((d, i) => ({ z: d.z, x: d.x, s: sheets.raider, f: (Math.floor(performance.now() / 200) + i) % 4, flip: true }))].sort((a, b) => a.z - b.z);
    for (const e of ents) {
      const [sx, sy] = proj(e.x, 0, e.z), h = e.s.h * view.ppu, w = (h * e.s.fw) / e.s.fh;
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.ellipse(sx, sy, w * 0.28, w * 0.1, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(sx, sy + h * 0.07); if (e.flip) ctx.scale(-1, 1);
      ctx.drawImage(e.s.canvas, e.f * e.s.fw, 0, e.s.fw, e.s.fh, -w / 2, -h, w, h); ctx.restore();
    }
    // gizmos
    if (S.gizmo && def) {
      ctx.save(); ctx.strokeStyle = 'rgba(66,224,180,.55)'; ctx.fillStyle = 'rgba(66,224,180,.07)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
      const ring = (cx, cz, r) => { const [x, y] = proj(cx, 0, cz); ctx.beginPath(); ctx.ellipse(x, y, r * view.ppu, r * view.ppu * fx.sinTilt, 0, 0, TAU); ctx.fill(); ctx.stroke(); };
      const a = def.args, k = def.kind;
      if (k === 'nova') ring(hero.x, hero.z, a.radius);
      if (k === 'orbit') ring(hero.x, hero.z, a.orbitRadius);
      if (k === 'rain') ring(S.aim.x, S.aim.z, a.spread);
      if (k === 'slash') {
        const { dx, dz } = aimDir(), ang = Math.atan2(dz, dx), half = (a.arc * Math.PI) / 360, range = def.body.size0 * 0.85 + def.body.offset;
        ctx.beginPath(); ctx.moveTo(...proj(hero.x, 0, hero.z));
        for (let i = 0; i <= 24; i++) { const t = ang - half + (i / 24) * half * 2; ctx.lineTo(...proj(hero.x + Math.cos(t) * range, 0, hero.z + Math.sin(t) * range)); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      if (k === 'projectile' || k === 'chain') { const [x, y] = proj(S.aim.x, 0, S.aim.z); ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(x, y); ctx.stroke(); }
      ctx.restore();
    }
    const [ax, ay] = proj(S.aim.x, 0, S.aim.z);
    ctx.strokeStyle = 'rgba(255,179,71,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(ax, ay, 9, 9 * fx.sinTilt, 0, 0, TAU); ctx.moveTo(ax - 14, ay); ctx.lineTo(ax + 14, ay); ctx.moveTo(ax, ay - 8); ctx.lineTo(ax, ay + 8); ctx.stroke();
  }

  let prev = performance.now();
  function loop(now) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now; if (!def) return;
    if (S.playing) {
      if (def.kind === 'orbit') { if (S.orbit) S.orbit.count = def.args.count; }
      fx.step(dt * S.speed);
      const busy = fx.insts.some((i) => !i.loop);
      if (S.auto && !busy && fx.parts.length < 4 && now - S.last > 500) cast();
      if (def.kind === 'orbit' && !(S.orbit && fx.insts.includes(S.orbit))) cast();
    }
    const ctx = stage.getContext('2d');
    drawScene(ctx);
    drawFx(ctx, fx.items, proj, view.ppu, fx.sinTilt, S.bloom);
    // vinheta por cima
    const W = stage.width, H = stage.height, g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.7);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(4,2,2,.75)'); ctx.fillStyle = g; ctx.globalCompositeOperation = 'source-over'; ctx.fillRect(0, 0, W, H);
  }

  // ───────────── atalhos ─────────────
  const onKey = (e) => {
    if (!alive || /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '') && document.activeElement.type !== 'range') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? painter.redo() : painter.undo(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); painter.redo(); }
    else if (e.key === 'b') { painter.tool = 'glow'; syncTools(); } else if (e.key === 'e') { painter.tool = 'erase'; syncTools(); }
    else if (e.key === '[') { painter.size = clamp(painter.size - 3, 2, 90); syncTools(); } else if (e.key === ']') { painter.size = clamp(painter.size + 3, 2, 90); syncTools(); }
    else if (e.key === ' ' && !e.target.closest?.('button')) { e.preventDefault(); cast(); }
  };
  window.addEventListener('keydown', onKey);

  // ───────────── início ─────────────
  refreshList();
  resize();
  openDef(opts.openId && store.allDefs().has(opts.openId) ? opts.openId : 'lamina');
  raf = requestAnimationFrame(loop);

  return {
    destroy() { alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); ro.disconnect(); if (def) store.saveDef(def); wrap.remove(); },
  };
}
