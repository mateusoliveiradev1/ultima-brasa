// Forja de Mapas — editor no navegador. Edita o mesmo formato (mapspec) que o jogo lê em data/maps/<bioma>.json.
// Ferramentas: selecionar/mover, carimbo, pincel de espalhar, borracha, luz, trilha, mancha de terreno, ponto de partida.
import { CATALOG } from '../shared/paint-props.js';
import { FOOT, lint } from '../shared/mapspec.js';
import { paintGroundMacro } from '../shared/paint.js';
import { mulberry32, cv } from '../shared/util.js';
import { MAPS, tintFor } from '../game/maps.js';
import { recolor } from '../shared/art-biomes.js';

const SIN = 0.82, COS = Math.sqrt(1 - SIN * SIN), CAT = Object.fromEntries(CATALOG.map((e) => [e.id, e]));
const BIOMAS = [['ruinas', 'Ruínas Cinzentas'], ['pantano', 'Pântano Tóxico'], ['deserto', 'Deserto de Sucata'], ['tundra', 'Tundra Cinzenta']];
const PATCHES = [['scorch', 'Queimado'], ['asphalt', 'Asfalto'], ['rock', 'Rocha'], ['ash', 'Cinza']];
const PREFABS = [
  ['Acampamento', [['campfire', 0, 0], ['tent', -2.4, -1.2], ['tent', 2.5, -1], ['sandbags', 0, 2.4], ['crate', -1.6, 1.8], ['barrel', 2.2, 1.7]]],
  ['Barricada de estrada', [['barricade', -2.4, 0], ['barricade', 2.4, 0.3], ['sandbags', 0, -1.6], ['sandbags', -4.4, 1.4], ['sandbags', 4.5, 1.2]]],
  ['Casa com quintal', [['house', 0, 0], ['barrel', 3, 1.5], ['crate', -3, 1.4], ['deadbush', -4, -1], ['sign', 4, -0.8]]],
  ['Ônibus tombado', [['bus', 0, 0], ['tires', 3.5, 1], ['barrel', -3.4, 1.2], ['skeleton', 1, 2.4]]],
  ['Cruzamento sinalizado', [['billboard', 0, 0], ['lamp', -3, 1], ['trafficlight', 3, 1.2], ['sign', 0.4, 2.6]]],
  ['Brejo com cogumelos', [['mangrove', 0, 0], ['reeds', -2.6, 1.2], ['reeds', 2.4, 1.4], ['puddle', 0.2, 2.6], ['shroom', 3.4, -0.6]]],
  ['Palafita e barco', [['stilthut', 0, 0], ['boat', 4, 2], ['reeds', -3.2, 1.6], ['totem', -4.6, -0.6]]],
  ['Ossário', [['ribs', 0, 0], ['skeleton', 3.2, 1.6], ['boulder', -3.6, 0.8], ['sandmound', 1, 2.6]]],
  ['Cata-vento e sucata', [['windpump', 0, 0], ['tires', 2.4, 1.4], ['barrel', -2.2, 1.2], ['crate', 3.6, 0.6]]],
  ['Gruta de gelo', [['iceshard', 0, 0], ['iceshard', 2.4, 0.8], ['boulder', -2.4, 1], ['snowpine', -4.8, -1], ['snowdrift', 0.4, 2.4]]],
  ['Cerca (5 módulos)', [['fence', -5.6, 0], ['fence', -2.8, 0], ['fence', 0, 0], ['fence', 2.8, 0], ['fence', 5.6, 0]]],
  ['Bosque seco', [['tree', 0, 0], ['tree', 2.8, 1.2], ['tree', -2.6, 1.4], ['deadbush', 1, 2.6], ['skeleton', -1, 3]]],
];
const DRAFT = 'ub.mapdraft', LOCAL = 'ub.map.local';
const el = (t, a = {}, ...k) => { const e = document.createElement(t); for (const [n, v] of Object.entries(a)) { if (n === 'class') e.className = v; else if (n.startsWith('on')) e.addEventListener(n.slice(2), v); else if (v !== false && v != null) e.setAttribute(n, v); } for (const c of k.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c)); return e; };
const blank = () => ({ name: 'Novo mapa', biome: 'ruinas', seed: 1, bounds: { x: [-22, 22], z: [-20, 12] }, camera: { target: [0, -4], scale: 40 }, ground: { macroSeed: 5, half: 32, paths: [], patches: [] }, spawn: { x: 0, z: 0, r: 2.6 }, props: [], lights: [], smoke: [] });
const clone = (o) => JSON.parse(JSON.stringify(o));

export function mountMapEditor(root, art) {
  root.innerHTML = '';
  let spec; try { spec = JSON.parse(localStorage.getItem(DRAFT)); } catch { spec = null; } if (!spec || !spec.props) spec = clone(MAPS.ruinas || blank());
  spec.biome = spec.biome || 'ruinas'; spec.ground.patches = spec.ground.patches || []; spec.lights = spec.lights || []; spec.smoke = spec.smoke || [];
  const S = { mirror: false, pf: 0, clip: null, tool: 'sel', stamp: 'barrel', sel: null, view: { tx: 0, tz: -4, s: 34 }, brush: 3, dens: 0.5, scale: 1, lcol: '#ff8a3a', li: 1, lr: 6, patch: 'scorch', path: null, hist: [], redo: [], mouse: { x: 0, z: 0, sx: 0, sz: 0 }, drag: null, tag: 'todos' };
  const canvas = el('canvas', { class: 'mp-cv' }), panel = el('div', { class: 'mp-panel' }), status = el('div', { class: 'mp-status' });
  root.append(el('div', { class: 'mp-root' }, canvas, panel), status);
  const ctx = canvas.getContext('2d');

  // ── sprites (pintura lenta: fila de uma por quadro) ──
  const sprites = new Map(), queue = [];
  const raw = new Map();
  const sprite = (id, v) => { const e = CAT[id]; if (!e) return null; const t = tintFor(spec, id), k = id + ':' + (v % e.n) + (t ? t.color + t.a : ''); if (sprites.has(k)) return sprites.get(k); sprites.set(k, null); queue.push([k, id, v % e.n, t]); return null; };
  const pump = () => { const q = queue.shift(); if (q) { try { const rk = q[1] + ':' + q[2]; let b = raw.get(rk); if (!b) { b = CAT[q[1]].paint(q[2] + 1).albedo; raw.set(rk, b); } sprites.set(q[0], q[3] ? recolor(b, q[3]) : b); dirty = true; } catch { sprites.set(q[0], cv(8)); } } };

  // ── chão macro em cache ──
  let macro = null, macroKey = '', macroT = 0;
  const macroNow = () => { const g = spec.ground, k = JSON.stringify([g.macroSeed, g.half, g.paths, g.patches, spec.tint]); if (k !== macroKey && !macroT) macroT = setTimeout(() => { macroT = 0; macroKey = k; macro = paintGroundMacro(1024, g.macroSeed, g.half, g.paths, g.patches); if (spec.tint) macro = recolor(macro, spec.tint); dirty = true; }, 220); };

  let dirty = true;
  const proj = (x, z, y = 0) => [canvas.width / 2 + (x - S.view.tx) * S.view.s, canvas.height / 2 + (z - S.view.tz) * S.view.s * SIN - y * S.view.s * COS];
  const unproj = (sx, sy) => [S.view.tx + (sx - canvas.width / 2) / S.view.s, S.view.tz + (sy - canvas.height / 2) / (S.view.s * SIN)];
  const flipOf = (p) => (p.f != null ? !!p.f : ((p.v || 0) & 1) === 1);
  const rect = (p) => { const e = CAT[p.id], k = sprite(p.id, p.v || 0), h = e.h * 0.95 * (p.s || 1) * S.view.s, w = k ? h * (k.width / k.height) : h * 0.6, [sx, sy] = proj(p.x, p.z, p.y || 0); return { x: sx - w / 2, y: sy - h, w, h, sx, sy, k }; };

  // ── histórico ──
  const snap = () => JSON.stringify(spec);
  const commit = () => { S.hist.push(S.last); if (S.hist.length > 80) S.hist.shift(); S.redo.length = 0; S.last = snap(); try { localStorage.setItem(DRAFT, S.last); } catch {} dirty = true; refresh(); };
  S.last = snap();
  const restore = (s) => { spec = JSON.parse(s); S.sel = null; S.last = s; try { localStorage.setItem(DRAFT, s); } catch {} dirty = true; refresh(); };
  const undo = () => { if (S.hist.length) { S.redo.push(S.last); restore(S.hist.pop()); } };
  const redoF = () => { if (S.redo.length) { S.hist.push(S.last); restore(S.redo.pop()); } };

  // ── desenho ──
  function draw() {
    const W = canvas.width, H = canvas.height, s = S.view.s, x = ctx; x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.fillStyle = '#150d0a'; x.fillRect(0, 0, W, H);
    const g = art.biome(spec.biome).ground, ps = s / 38; x.save(); const [ox, oy] = proj(0, 0); x.translate(ox, oy); x.scale(1, SIN); x.scale(ps, ps); x.fillStyle = x.createPattern(g, 'repeat'); x.fillRect(-ox / ps - 50, -oy / (SIN * ps) - 50, W / ps + 100, H / (SIN * ps) + 100); x.restore();
    macroNow(); if (macro) { const half = spec.ground.half, [mx, my] = proj(-half, -half); x.drawImage(macro, mx, my, 2 * half * s, 2 * half * s * SIN); }
    const [b0x, b0z] = proj(spec.bounds.x[0], spec.bounds.z[0]), [b1x, b1z] = proj(spec.bounds.x[1], spec.bounds.z[1]);
    x.strokeStyle = 'rgba(255,170,80,.6)'; x.setLineDash([8, 6]); x.lineWidth = 2; x.strokeRect(b0x, b0z, b1x - b0x, b1z - b0z); x.setLineDash([]);
    const [px, pz] = proj(spec.spawn.x, spec.spawn.z); x.strokeStyle = 'rgba(120,255,200,.8)'; x.lineWidth = 2; x.beginPath(); x.ellipse(px, pz, spec.spawn.r * s, spec.spawn.r * s * SIN, 0, 0, 7); x.stroke(); x.fillStyle = '#7dffcf'; x.beginPath(); x.arc(px, pz, 5, 0, 7); x.fill();
    spec.ground.patches.forEach((p, i) => { const [qx, qz] = proj(p.x, p.z); x.strokeStyle = S.sel?.k === 'patch' && S.sel.i === i ? '#fff' : 'rgba(255,255,255,.3)'; x.lineWidth = 1.5; x.beginPath(); x.ellipse(qx, qz, p.rx * s, p.rz * s * SIN, p.rot || 0, 0, 7); x.stroke(); });
    spec.ground.paths.forEach((pa, i) => { x.strokeStyle = S.sel?.k === 'path' && S.sel.i === i ? '#fff' : 'rgba(255,220,140,.55)'; x.lineWidth = 2; x.beginPath(); pa.forEach((q, j) => { const [a, b] = proj(q[0], q[1]); j ? x.lineTo(a, b) : x.moveTo(a, b); }); x.stroke(); for (const q of pa) { const [a, b] = proj(q[0], q[1]); x.fillStyle = 'rgba(255,220,140,.9)'; x.fillRect(a - 3, b - 3, 6, 6); } });
    if (S.path) { x.strokeStyle = '#ffe9a0'; x.lineWidth = 2; x.beginPath(); S.path.forEach((q, j) => { const [a, b] = proj(q[0], q[1]); j ? x.lineTo(a, b) : x.moveTo(a, b); }); const [mx2, mz2] = proj(S.mouse.x, S.mouse.z); x.lineTo(mx2, mz2); x.stroke(); }
    const items = spec.props.map((p, i) => ({ p, i })).sort((a, b) => (CAT[a.p.id]?.kind === 'decal' ? -9999 : a.p.z + (a.p.y || 0) * 0.01) - (CAT[b.p.id]?.kind === 'decal' ? -9999 : b.p.z + (b.p.y || 0) * 0.01));
    S.order = items;
    for (const { p, i } of items) { if (!CAT[p.id]) continue; const r = rect(p), dec = CAT[p.id].kind === 'decal';
      if (!dec) { x.fillStyle = 'rgba(0,0,0,.4)'; x.beginPath(); x.ellipse(r.sx, r.sy, r.w * 0.38, r.w * 0.38 * SIN * 0.5, 0, 0, 7); x.fill(); }
      if (r.k) { if (dec) { x.drawImage(r.k, r.sx - r.w / 2, r.sy - r.w * (r.k.height / r.k.width) * SIN / 2, r.w, r.w * (r.k.height / r.k.width) * SIN); } else if (flipOf(p)) { x.save(); x.translate(r.sx, 0); x.scale(-1, 1); x.drawImage(r.k, -r.w / 2, r.y, r.w, r.h); x.restore(); } else x.drawImage(r.k, r.x, r.y, r.w, r.h); } else { x.fillStyle = 'rgba(255,200,120,.25)'; x.fillRect(r.x, r.y, r.w, r.h); }
      if (S.sel?.k === 'prop' && S.sel.i === i) { x.strokeStyle = '#7dffcf'; x.lineWidth = 2; x.strokeRect(r.x, r.y, r.w, r.h); } }
    spec.lights.forEach((l, i) => { const [a, b] = proj(l.x, l.z, 1), rr = l.r * s; const gr = x.createRadialGradient(a, b, 0, a, b, rr); gr.addColorStop(0, l.color + '66'); gr.addColorStop(1, l.color + '00'); x.fillStyle = gr; x.beginPath(); x.ellipse(a, b, rr, rr * SIN, 0, 0, 7); x.fill(); x.fillStyle = l.color; x.strokeStyle = S.sel?.k === 'light' && S.sel.i === i ? '#fff' : '#000'; x.lineWidth = 2; x.beginPath(); x.arc(a, b, 6, 0, 7); x.fill(); x.stroke(); });
    // pré-visualização da ferramenta
    const [mx, mz] = proj(S.mouse.x, S.mouse.z);
    if (S.tool === 'stamp' && CAT[S.stamp]) { const r = rect({ id: S.stamp, v: 0, x: S.mouse.x, z: S.mouse.z, s: S.scale }); x.globalAlpha = 0.6; if (r.k) x.drawImage(r.k, r.x, r.y, r.w, r.h); x.globalAlpha = 1; }
    if (S.tool === 'prefab') { x.globalAlpha = 0.5; for (const [id, dx, dz] of PREFABS[S.pf][1]) { const r = rect({ id, v: 0, x: S.mouse.x + (S.mirror ? -dx : dx), z: S.mouse.z + dz }); if (r.k) x.drawImage(r.k, r.x, r.y, r.w, r.h); } x.globalAlpha = 1; }
    if (S.tool === 'brush' || S.tool === 'erase') { x.strokeStyle = S.tool === 'erase' ? '#ff6a5a' : '#7dffcf'; x.lineWidth = 2; x.beginPath(); x.ellipse(mx, mz, S.brush * s, S.brush * s * SIN, 0, 0, 7); x.stroke(); }
  }

  // ── operações ──
  const rnd = mulberry32((Date.now() & 0xffff) + 1);
  const place = (id, wx, wz, extra = {}) => { const p = { id, x: +wx.toFixed(2), z: +wz.toFixed(2), v: (rnd() * 99) | 0, ...extra }; if (S.scale !== 1) p.s = S.scale; spec.props.push(p); return p; };
  const near = (wx, wz, r) => spec.props.map((p, i) => [p, i]).filter(([p]) => Math.hypot(p.x - wx, p.z - wz) < r);
  const pickAt = (sx, sy) => { for (let k = (S.order || []).length - 1; k >= 0; k--) { const { p, i } = S.order[k]; if (!CAT[p.id]) continue; const r = rect(p), dec = CAT[p.id].kind === 'decal'; if (dec ? Math.hypot(sx - r.sx, (sy - r.sy) / SIN) < r.w / 2 : sx >= r.x && sx <= r.x + r.w && sy >= r.y && sy <= r.y + r.h) return { k: 'prop', i }; }
    for (let i = spec.lights.length - 1; i >= 0; i--) { const [a, b] = proj(spec.lights[i].x, spec.lights[i].z, 1); if (Math.hypot(sx - a, sy - b) < 10) return { k: 'light', i }; }
    for (let i = spec.ground.patches.length - 1; i >= 0; i--) { const p = spec.ground.patches[i], [a, b] = proj(p.x, p.z); if (((sx - a) / (p.rx * S.view.s)) ** 2 + ((sy - b) / (p.rz * S.view.s * SIN)) ** 2 < 1) return { k: 'patch', i }; }
    return null; };
  const brushScatter = (wx, wz) => { const n = Math.max(1, Math.round(S.brush * S.brush * S.dens * 0.4)); for (let i = 0; i < n; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * S.brush, x = wx + Math.cos(a) * d, z = wz + Math.sin(a) * d * 1; const f = FOOT[S.stamp]; if (f && !f.decal && spec.props.some((q) => FOOT[q.id] && !FOOT[q.id].decal && Math.hypot(q.x - x, q.z - z) < (f.r + FOOT[q.id].r) * 0.85)) continue; place(S.stamp, x, z); } };

  function down(e) {
    canvas.setPointerCapture(e.pointerId); const r = canvas.getBoundingClientRect(), sx = (e.clientX - r.left) * (canvas.width / r.width), sy = (e.clientY - r.top) * (canvas.height / r.height), [wx, wz] = unproj(sx, sy);
    if (e.button === 1 || e.button === 2 || e.shiftKey && S.tool === 'sel' && false || S.space) { S.drag = { pan: true, sx, sy, tx: S.view.tx, tz: S.view.tz }; return; }
    const t = S.tool;
    if (t === 'sel') { const h = pickAt(sx, sy); S.sel = h; if (h) { const o = h.k === 'prop' ? spec.props[h.i] : h.k === 'light' ? spec.lights[h.i] : spec.ground.patches[h.i]; S.drag = { move: true, ox: wx - o.x, oz: wz - o.z, moved: false }; } refresh(); dirty = true; }
    else if (t === 'stamp') { place(S.stamp, wx, wz); commit(); }
    else if (t === 'prefab') { for (const [id, dx, dz] of PREFABS[S.pf][1]) place(id, wx + (S.mirror ? -dx : dx), wz + dz, S.mirror && CAT[id].kind !== 'decal' ? { f: 1 } : {}); commit(); }
    else if (t === 'brush') { brushScatter(wx, wz); S.drag = { brush: true }; dirty = true; }
    else if (t === 'erase') { const hit = near(wx, wz, S.brush).map(([, i]) => i); if (hit.length) { spec.props = spec.props.filter((_, i) => !hit.includes(i)); S.sel = null; } S.drag = { erase: true }; dirty = true; }
    else if (t === 'light') { spec.lights.push({ x: +wx.toFixed(2), z: +wz.toFixed(2), color: S.lcol, i: S.li, r: S.lr }); S.sel = { k: 'light', i: spec.lights.length - 1 }; commit(); }
    else if (t === 'path') { S.path = S.path || []; S.path.push([+wx.toFixed(1), +wz.toFixed(1)]); dirty = true; }
    else if (t === 'patch') { spec.ground.patches.push({ type: S.patch, x: +wx.toFixed(1), z: +wz.toFixed(1), rx: 4, rz: 2.5 }); S.sel = { k: 'patch', i: spec.ground.patches.length - 1 }; commit(); }
    else if (t === 'spawn') { spec.spawn.x = +wx.toFixed(1); spec.spawn.z = +wz.toFixed(1); commit(); }
  }
  function move(e) {
    const r = canvas.getBoundingClientRect(), sx = (e.clientX - r.left) * (canvas.width / r.width), sy = (e.clientY - r.top) * (canvas.height / r.height), [wx, wz] = unproj(sx, sy); S.mouse = { x: wx, z: wz, sx, sz: sy }; dirty = true;
    status.textContent = `x ${wx.toFixed(1)}  z ${wz.toFixed(1)}  ·  ${spec.props.length} props · ${spec.lights.length} luzes  ·  ferramenta: ${S.tool}`;
    const d = S.drag; if (!d) return;
    if (d.pan) { S.view.tx = d.tx - (sx - d.sx) / S.view.s; S.view.tz = d.tz - (sy - d.sy) / (S.view.s * SIN); }
    else if (d.move && S.sel) { const o = S.sel.k === 'prop' ? spec.props[S.sel.i] : S.sel.k === 'light' ? spec.lights[S.sel.i] : spec.ground.patches[S.sel.i]; o.x = +(wx - d.ox).toFixed(2); o.z = +(wz - d.oz).toFixed(2); d.moved = true; }
    else if (d.brush) brushScatter(wx, wz);
    else if (d.erase) { const hit = near(wx, wz, S.brush).map(([, i]) => i); if (hit.length) spec.props = spec.props.filter((_, i) => !hit.includes(i)); }
  }
  function up() { const d = S.drag; S.drag = null; if (d && (d.moved || d.brush || d.erase)) commit(); }
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('dblclick', () => { if (S.tool === 'path') finishPath(); });
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); S.view.s = Math.max(10, Math.min(120, S.view.s * (e.deltaY < 0 ? 1.1 : 0.9))); dirty = true; }, { passive: false });
  function finishPath() { if (S.path && S.path.length > 1) { spec.ground.paths.push(S.path); commit(); } S.path = null; dirty = true; }
  const del = () => { const s = S.sel; if (!s) return; if (s.k === 'prop') spec.props.splice(s.i, 1); else if (s.k === 'light') spec.lights.splice(s.i, 1); else if (s.k === 'patch') spec.ground.patches.splice(s.i, 1); else if (s.k === 'path') spec.ground.paths.splice(s.i, 1); S.sel = null; commit(); };
  const onKey = (e) => {
    if (!root.isConnected || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; const k = e.key.toLowerCase();
    if (k === ' ') { S.space = e.type === 'keydown'; if (e.type === 'keydown') e.preventDefault(); return; } if (e.type !== 'keydown') return;
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redoF() : undo(); return; } if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redoF(); return; }
    const T = { v: 'sel', g: 'prefab', p: 'stamp', b: 'brush', x: 'erase', l: 'light', t: 'path', m: 'patch', s: 'spawn' }; if (T[k] && !e.ctrlKey) { setTool(T[k]); return; }
    if (k === 'delete' || k === 'backspace') { if (S.path && S.path.length) S.path.pop(); else del(); dirty = true; } if (k === 'enter') finishPath(); if (k === 'escape') { S.path = null; S.sel = null; refresh(); dirty = true; }
    if (k === '0') { fitView(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'c' && S.sel?.k === 'prop') { S.clip = clone(spec.props[S.sel.i]); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'v' && S.clip) { e.preventDefault(); const c = clone(S.clip); c.x = +S.mouse.x.toFixed(2); c.z = +S.mouse.z.toFixed(2); spec.props.push(c); S.sel = { k: 'prop', i: spec.props.length - 1 }; commit(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'd' && S.sel?.k === 'prop') { e.preventDefault(); const c = clone(spec.props[S.sel.i]); c.x += 1.2; c.z += 0.6; spec.props.push(c); S.sel = { k: 'prop', i: spec.props.length - 1 }; commit(); return; }
    if (S.sel?.k === 'prop' && k === 'f' && !e.ctrlKey) { const p = spec.props[S.sel.i]; p.f = flipOf(p) ? 0 : 1; commit(); return; }
    if (S.sel?.k === 'prop') { const p = spec.props[S.sel.i]; if (k === '[') { p.v = Math.max(0, (p.v || 0) - 1); commit(); } if (k === ']') { p.v = (p.v || 0) + 1; commit(); } if (k === 'q') { p.s = +Math.max(0.3, (p.s || 1) - 0.1).toFixed(2); commit(); } if (k === 'e') { p.s = +Math.min(3, (p.s || 1) + 0.1).toFixed(2); commit(); } const st = e.shiftKey ? 1 : 0.2; if (k === 'arrowleft') { p.x -= st; commit(); } if (k === 'arrowright') { p.x += st; commit(); } if (k === 'arrowup') { p.z -= st; commit(); } if (k === 'arrowdown') { p.z += st; commit(); } }
  };
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);

  // ── painel ──
  function setTool(t) { S.tool = t; if (t !== 'path') S.path = null; refresh(); dirty = true; }
  const num = (label, get, set, step = 1, min = -999, max = 999) => el('label', { class: 'mp-f' }, label, el('input', { type: 'number', step, min, max, value: get(), onchange: (e) => { set(+e.target.value); commit(); } }));
  const rng = (label, get, set, min, max, step) => el('label', { class: 'mp-f' }, label + ' ', el('b', {}, String(get())), el('input', { type: 'range', min, max, step, value: get(), oninput: (e) => { set(+e.target.value); e.target.previousSibling.textContent = String(get()); dirty = true; } }));
  const btn = (t, f, c = '') => el('button', { class: 'mp-b ' + c, onclick: f }, t);
  function download(name, text) { const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: name }); document.body.append(a); a.click(); a.remove(); }
  const tintRow = (label, key) => { const t = spec[key]; return el('label', { class: 'mp-f' }, label + ' ', el('input', { type: 'color', value: t?.color || '#888888', onchange: (e) => { spec[key] = { color: e.target.value, a: spec[key]?.a ?? 0.4 }; commit(); } }), el('input', { type: 'range', min: 0, max: 0.8, step: 0.05, value: t?.a ?? 0, style: 'width:70px', onchange: (e) => { const a = +e.target.value; if (a <= 0) delete spec[key]; else spec[key] = { color: spec[key]?.color || '#888888', a }; commit(); } })); };
  function refresh() {
    panel.innerHTML = '';
    const tools = [['sel', 'Selecionar (V)'], ['stamp', 'Carimbo (P)'], ['prefab', 'Pré-fabricado (G)'], ['brush', 'Pincel (B)'], ['erase', 'Borracha (X)'], ['light', 'Luz (L)'], ['path', 'Trilha (T)'], ['patch', 'Terreno (M)'], ['spawn', 'Partida (S)']];
    panel.append(el('h2', {}, 'Forja de Mapas'), el('div', { class: 'mp-tools' }, tools.map(([k, n]) => btn(n, () => setTool(k), S.tool === k ? 'on' : ''))));
    const opts = el('div', { class: 'mp-sec' });
    if (S.tool === 'stamp' || S.tool === 'brush') {
      const tags = ['todos', ...new Set(CATALOG.flatMap((e) => e.tags || []))];
      opts.append(el('select', { onchange: (e) => { S.tag = e.target.value; refresh(); } }, tags.map((t) => el('option', { value: t, selected: t === S.tag }, t))));
      opts.append(el('div', { class: 'mp-pal' }, CATALOG.filter((e) => S.tag === 'todos' || (e.tags || []).includes(S.tag)).map((e) => btn(e.name, () => { S.stamp = e.id; refresh(); }, S.stamp === e.id ? 'on' : ''))), rng('Escala', () => S.scale, (v) => (S.scale = v), 0.4, 2.5, 0.1));
      if (S.tool === 'brush') opts.append(rng('Raio', () => S.brush, (v) => (S.brush = v), 1, 12, 0.5), rng('Densidade', () => S.dens, (v) => (S.dens = v), 0.1, 1, 0.1));
    } else if (S.tool === 'prefab') opts.append(el('div', { class: 'mp-pal' }, PREFABS.map(([n], i) => btn(n, () => { S.pf = i; refresh(); }, S.pf === i ? 'on' : ''))), el('label', { class: 'mp-f' }, 'Espelhar ', el('input', { type: 'checkbox', checked: S.mirror ? 'checked' : null, onchange: (e) => (S.mirror = e.target.checked) })));
    else if (S.tool === 'erase') opts.append(rng('Raio', () => S.brush, (v) => (S.brush = v), 0.5, 12, 0.5));
    else if (S.tool === 'light') opts.append(el('label', { class: 'mp-f' }, 'Cor ', el('input', { type: 'color', value: S.lcol, oninput: (e) => (S.lcol = e.target.value) })), rng('Intensidade', () => S.li, (v) => (S.li = v), 0.2, 2, 0.1), rng('Alcance', () => S.lr, (v) => (S.lr = v), 2, 14, 0.5));
    else if (S.tool === 'patch') opts.append(el('select', { onchange: (e) => (S.patch = e.target.value) }, PATCHES.map(([k, n]) => el('option', { value: k, selected: k === S.patch }, n))), el('p', { class: 'mp-h' }, 'Clique para criar; selecione (V) para mover e ajustar o tamanho.'));
    else if (S.tool === 'path') opts.append(el('p', { class: 'mp-h' }, 'Clique para marcar pontos; Enter ou duplo clique termina; Backspace desfaz o último ponto.'), btn('Terminar trilha', finishPath));
    else if (S.tool === 'sel') opts.append(el('p', { class: 'mp-h' }, 'Arraste para mover. Delete apaga. [ ] troca a variação, Q/E muda a escala, setas ajustam. Espaço+arrastar ou botão direito move a câmera.'));
    panel.append(opts);
    const s = S.sel; if (s) { const sec = el('div', { class: 'mp-sec' }, el('h3', {}, { prop: 'Prop', light: 'Luz', patch: 'Terreno', path: 'Trilha' }[s.k])); const o = s.k === 'prop' ? spec.props[s.i] : s.k === 'light' ? spec.lights[s.i] : s.k === 'patch' ? spec.ground.patches[s.i] : null;
      if (s.k === 'prop' && o) sec.append(el('p', {}, CAT[o.id]?.name || o.id), num('Variação', () => o.v || 0, (v) => (o.v = v), 1, 0, 99), num('Escala', () => o.s || 1, (v) => (o.s = v), 0.1, 0.3, 3), num('Altura (y)', () => o.y || 0, (v) => (o.y = v), 0.5, 0, 20), btn('Virar (F)', () => { o.f = flipOf(o) ? 0 : 1; commit(); }), btn('Duplicar (Ctrl+D)', () => { const c = clone(o); c.x += 1.2; c.z += 0.6; spec.props.push(c); S.sel = { k: 'prop', i: spec.props.length - 1 }; commit(); }));
      if (s.k === 'light' && o) sec.append(el('label', { class: 'mp-f' }, 'Cor ', el('input', { type: 'color', value: o.color, onchange: (e) => { o.color = e.target.value; commit(); } })), num('Intensidade', () => o.i, (v) => (o.i = v), 0.1, 0.1, 3), num('Alcance', () => o.r, (v) => (o.r = v), 0.5, 1, 20));
      if (s.k === 'patch' && o) sec.append(num('Raio X', () => o.rx, (v) => (o.rx = v), 0.5, 0.5, 30), num('Raio Z', () => o.rz, (v) => (o.rz = v), 0.5, 0.5, 30), num('Rotação', () => o.rot || 0, (v) => (o.rot = v), 0.1, -3.2, 3.2));
      sec.append(btn('Apagar', del, 'bad')); panel.append(sec); }
    const g = spec.ground, mapSec = el('div', { class: 'mp-sec' }, el('h3', {}, 'Mapa'),
      el('label', { class: 'mp-f' }, 'Nome ', el('input', { type: 'text', value: spec.name, onchange: (e) => { spec.name = e.target.value; commit(); } })),
      el('label', { class: 'mp-f' }, 'Bioma ', el('select', { onchange: (e) => { spec.biome = e.target.value; commit(); } }, BIOMAS.map(([k, n]) => el('option', { value: k, selected: k === spec.biome }, n)))),
      num('Semente do chão', () => g.macroSeed, (v) => (g.macroSeed = v), 1, 1, 999), num('Tamanho do chão', () => g.half, (v) => (g.half = v), 2, 10, 60),
      num('Limite X mín', () => spec.bounds.x[0], (v) => (spec.bounds.x[0] = v), 1), num('Limite X máx', () => spec.bounds.x[1], (v) => (spec.bounds.x[1] = v), 1), num('Limite Z mín', () => spec.bounds.z[0], (v) => (spec.bounds.z[0] = v), 1), num('Limite Z máx', () => spec.bounds.z[1], (v) => (spec.bounds.z[1] = v), 1), num('Área livre da partida', () => spec.spawn.r, (v) => (spec.spawn.r = v), 0.5, 1, 10),
      el('h3', {}, 'Tintura do bioma'), tintRow('Chão', 'tint'), tintRow('Props', 'propTint'));
    panel.append(mapSec);
    const lt = lint(spec); panel.append(el('div', { class: 'mp-sec' }, el('h3', {}, `Avaliador: ${lt.errors.length} erros, ${lt.warns.length} avisos`), el('ul', { class: 'mp-lint' }, [...lt.errors.map((m) => el('li', { class: 'e' }, m)), ...lt.warns.map((m) => el('li', {}, m))].slice(0, 14))));
    const paths = spec.ground.paths.map((_, i) => btn('Trilha ' + (i + 1), () => { S.sel = { k: 'path', i }; refresh(); dirty = true; }, S.sel?.k === 'path' && S.sel.i === i ? 'on' : '')); if (paths.length) panel.append(el('div', { class: 'mp-sec' }, el('h3', {}, 'Trilhas'), paths));
    panel.append(el('div', { class: 'mp-sec' }, el('h3', {}, 'Arquivo'), el('div', { class: 'mp-tools' },
      btn('Desfazer', undo), btn('Refazer', redoF),
      btn('Exportar JSON', () => download(spec.biome + '.json', JSON.stringify(spec, null, 1))), btn('Importar', () => { const f = el('input', { type: 'file', accept: '.json' }); f.onchange = async () => { try { const d = JSON.parse(await f.files[0].text()); if (!d.props || !d.bounds) throw 0; spec = d; spec.ground.patches = spec.ground.patches || []; spec.lights = spec.lights || []; spec.smoke = spec.smoke || []; spec.biome = spec.biome || 'ruinas'; S.sel = null; commit(); } catch { alert('Arquivo de mapa inválido.'); } }; f.click(); }),
      el('select', { id: 'mp-load' }, Object.entries(MAPS).map(([k, m]) => el('option', { value: k }, m.name || k))), btn('Carregar publicado', () => { const k = document.getElementById('mp-load').value; if (MAPS[k]) { spec = clone(MAPS[k]); spec.ground.patches = spec.ground.patches || []; spec.lights = spec.lights || []; spec.smoke = spec.smoke || []; spec.biome = spec.biome || k.split('-')[0]; S.sel = null; commit(); fitView(); } }),
      btn('Novo mapa', () => { if (confirm('Começar um mapa em branco?')) { spec = blank(); S.sel = null; commit(); } }), 
      btn('Testar no jogo', () => { try { localStorage.setItem(LOCAL, JSON.stringify(spec)); } catch {} location.href = location.pathname + '?map=local'; }, 'go')),
      el('p', { class: 'mp-h' }, 'Para publicar: exporte o JSON e me envie (ou salve em data/maps/<bioma>.json). O jogo usa o mapa dentro dos limites e o mundo procedural fora deles.')));
  }
  refresh();
  function fitView() { const bw = spec.bounds.x[1] - spec.bounds.x[0], bh = spec.bounds.z[1] - spec.bounds.z[0]; S.view.s = Math.max(10, Math.min(canvas.width / (bw + 4), canvas.height / ((bh + 3) * SIN))); S.view.tx = (spec.bounds.x[0] + spec.bounds.x[1]) / 2; S.view.tz = (spec.bounds.z[0] + spec.bounds.z[1]) / 2; dirty = true; }
  const fit = () => { const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.max(300, Math.floor(r.width * d)); canvas.height = Math.max(300, Math.floor(r.height * d)); dirty = true; };
  new ResizeObserver(fit).observe(canvas); fit();
  fitView();
  let alive = true; (function loop() { if (!alive || !root.isConnected) { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); return; } pump(); if (dirty || queue.length) { dirty = false; draw(); } requestAnimationFrame(loop); })();
  return { stop() { alive = false; } };
}
