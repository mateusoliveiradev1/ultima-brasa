// Biblioteca de composição dos mapas temáticos: cada mapa é um conjunto de "cenas" posicionadas à mão,
// ligadas por estradas, com moldura de borda, luzes e detalhes soltos.
import { createMap, distToPath, FOOT, PATH_HALF } from '../src/shared/mapspec.js';
import { mulberry32 } from '../src/shared/util.js';

export const TINT = {
  ruinas: {},
  pantano: { tint: { color: '#3a8a5c', a: 0.5 }, propTint: { color: '#4d7a5a', a: 0.3 } },
  deserto: { tint: { color: '#c88a48', a: 0.5 }, propTint: { color: '#d0a060', a: 0.26 } },
  tundra: { tint: { color: '#8fb0d8', a: 0.5 }, propTint: { color: '#c0d8f4', a: 0.4 } },
};
export const BASE = { bounds: { x: [-30, 30], z: [-26, 22] }, camera: { target: [0, -2], scale: 36 }, spawn: { x: 0, z: 0, r: 3.2 } };
export const MAPS = {};
export const REJ = {}; // recusas por mapa (cena pedida que não coube)
let CUR = '';

export const def = (key, biome, name, blurb, seed, ground, build, over = {}) => {
  MAPS[key] = () => {
    CUR = key; REJ[key] = [];
    const m = createMap({ ...BASE, ...over, name, seed, ground: { macroSeed: seed + 3, half: 32, paths: [], patches: [], ...ground } });
    build(m); varied(m.spec, seed); const { backdrop, platforms, ...spec } = m.spec; return { ...spec, biome, blurb, ...TINT[biome] };
  };
};

// Variedade final: escala e espelhamento por prop (orgânicos variam bastante, estruturas pouco), sem mudar a composição.
const ORG = new Set(['snowpine', 'mangrove', 'willow', 'reeds', 'shroom', 'cactus', 'palm', 'boulder', 'snowdrift', 'iceshard', 'deadbush', 'tree', 'skeleton', 'bonepile', 'sandmound', 'spire', 'puddle', 'crater', 'totem', 'icewall', 'crystal', 'ribs']);
const STR = new Set(['house', 'ruin', 'tower', 'tent', 'crate', 'barrel', 'sign', 'lamp', 'bus', 'wreck', 'tank', 'container', 'wall', 'pillar', 'stilthut', 'mesa', 'igloo', 'obelisk', 'ironcross', 'tires', 'banner', 'boat', 'watchtower', 'brazier', 'sandbags']);
function varied(spec, seed) {
  const r = mulberry32(seed * 7919 + 13);
  for (const p of spec.props) {
    const f = FOOT[p.id]; if (!f) continue; const org = ORG.has(p.id), str = STR.has(p.id); if (p.s) continue;
    p.f = r() < 0.5 ? 1 : 0;
    if (f.decal) { if (org) p.s = +(0.7 + r() * 0.8).toFixed(2); continue; }
    const k = org ? 0.78 + r() * 0.62 : str ? 0.92 + r() * 0.2 : 1; if (k === 1) continue;
    const grow = k > 1 && f.block && !(p.y > 0) && spec.ground.paths.some((pa) => distToPath(p.x, p.z, pa) < PATH_HALF + f.r * k + 0.25);
    p.s = +(grow ? Math.min(k, 1) : k).toFixed(2);
  }
}
const pick = (m, ids) => ids[(m.rnd() * ids.length) | 0];

/** Amostra a curva Catmull-Rom (a mesma da trilha pintada) com espaçamento por comprimento de arco. */
export function sample(pts, step = 0.5) {
  const dense = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < 20; s++) { const u = s / 20, cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u); dense.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]); }
  }
  dense.push(pts[pts.length - 1]);
  const out = []; let acc = 0, next = 0;
  for (let i = 0; i < dense.length - 1; i++) {
    const a = dense[i], b = dense[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-9;
    while (next <= acc + L) { const t = (next - acc) / L, tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L; out.push({ x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, nx: -tz, nz: tx }); next += step; }
    acc += L;
  }
  return out;
}

/** Conjunto composto: items = [id, dx, dz, {opts}] relativos a (cx,cz). flip espelha em x. Registra o que não coube. */
export function set(m, cx, cz, items, { flip = false, force = false } = {}) {
  let n = 0;
  for (const [id, dx, dz, o = {}] of items) {
    const p = m.place(id, cx + (flip ? -dx : dx), cz + dz, { force, ...o });
    if (p) n++; else REJ[CUR].push(`${id}@${(cx + dx).toFixed(1)},${(cz + dz).toFixed(1)}`);
  }
  return n;
}
/** Props ao longo de uma trilha, em ambos os lados (off = distância lateral). */
export function along(m, ids, pts, { step = 4, off = 3, sides = [-1, 1], jit = 0.35, skip = 0, from = 0, to = 1 } = {}) {
  const S = sample(pts, step), a = Math.floor(S.length * from), b = Math.ceil(S.length * to);
  for (let i = a; i < b; i++) for (const sd of sides) { if (m.rnd() < skip) continue; const q = S[i]; m.place(pick(m, ids), q.x + q.nx * off * sd + (m.rnd() - 0.5) * jit * 2, q.z + q.nz * off * sd + (m.rnd() - 0.5) * jit * 2); }
}
/** Arco de elipse (ângulos em radianos), n itens. */
export function arc(m, ids, cx, cz, rx, rz, a0, a1, n, { jit = 0.4 } = {}) {
  for (let i = 0; i < n; i++) { const a = a0 + (n === 1 ? 0 : (i / (n - 1))) * (a1 - a0); m.place(pick(m, ids), cx + Math.cos(a) * rx + (m.rnd() - 0.5) * jit * 2, cz + Math.sin(a) * rz + (m.rnd() - 0.5) * jit * 2); }
}
/** Anel completo com passo angular fixo (cercas, paliçadas). */
export function loop(m, id, cx, cz, rx, rz, step = 2.8, { jit = 0.12 } = {}) {
  const per = Math.PI * (3 * (rx + rz) - Math.sqrt((3 * rx + rz) * (rx + 3 * rz))), n = Math.max(6, Math.round(per / step));
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; m.place(Array.isArray(id) ? pick(m, id) : id, cx + Math.cos(a) * rx + (m.rnd() - 0.5) * jit * 2, cz + Math.sin(a) * rz + (m.rnd() - 0.5) * jit * 2); }
}
/** Moldura dos limites do mapa: faz a borda parecer um acidente natural em vez de um corte. */
export function frame(m, ids, { inset = 1.8, step = 3.4, jit = 0.9, depth = 1 } = {}) {
  const [x0, x1] = m.spec.bounds.x, [z0, z1] = m.spec.bounds.z;
  for (let d = 0; d < depth; d++) {
    const k = inset + d * 2.6, off = d * 1.3;
    for (let x = x0 + k; x <= x1 - k; x += step) { m.place(pick(m, ids), x + (m.rnd() - 0.5) * jit * 2 + off, z0 + k + (m.rnd() - 0.5) * jit); m.place(pick(m, ids), x + (m.rnd() - 0.5) * jit * 2 - off, z1 - k + (m.rnd() - 0.5) * jit); }
    for (let z = z0 + k + step; z <= z1 - k - step; z += step) { m.place(pick(m, ids), x0 + k + (m.rnd() - 0.5) * jit, z + (m.rnd() - 0.5) * jit * 2); m.place(pick(m, ids), x1 - k + (m.rnd() - 0.5) * jit, z + (m.rnd() - 0.5) * jit * 2); }
  }
}
/** Mancha densa (bosque, juncal, pedreira) dentro de uma elipse. */
export function blob(m, ids, cx, cz, rx, rz, n) {
  let c = 0; for (let k = 0; k < n * 30 && c < n; k++) { const a = m.rnd() * Math.PI * 2, d = Math.sqrt(m.rnd()); if (m.place(pick(m, ids), cx + Math.cos(a) * rx * d, cz + Math.sin(a) * rz * d)) c++; } return c;
}
export const glow = (m, x, z, color = '#ff8a3a', i = 1, r = 6) => m.light(x, z, color, i, r);
/** Trilha entre pontos (útil para ramos secundários). */
export const dist = distToPath;
