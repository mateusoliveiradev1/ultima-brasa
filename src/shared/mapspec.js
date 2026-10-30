// Forja de Mapas — formato declarativo de mapa + ajudantes de composição + avaliador (lint).
// Um mapa é dado puro (JSON-serializável): o mesmo arquivo alimenta a prévia 2D rápida e o render WebGL final.
import { mulberry32 } from './util.js';

// raio de pegada no chão (unidades de mundo) e se bloqueia o caminho do jogador
export const FOOT = {
  ruin: { r: 1.3, block: true }, house: { r: 1.9, block: true }, tower: { r: 2.2, block: true }, tree: { r: 0.55, block: true }, barrel: { r: 0.45, block: true }, spire: { r: 0.6, block: true },
  sign: { r: 0.3, block: false }, bus: { r: 2.2, block: true }, barricade: { r: 1.8, block: true }, lamp: { r: 0.3, block: false }, billboard: { r: 1.4, block: true }, trafficlight: { r: 0.3, block: false },
  tent: { r: 1.3, block: true }, campfire: { r: 0.7, block: true }, sandbags: { r: 1.0, block: true }, fence: { r: 1.4, block: true }, crate: { r: 0.6, block: true }, skeleton: { r: 0.6, block: false },
  deadbush: { r: 0.5, block: false }, crystal: { r: 0.7, block: true }, puddle: { r: 1.1, block: false, decal: true }, crater: { r: 1.6, block: false, decal: true },
};
export const PATH_HALF = 1.15; // meia-largura da trilha pintada (paintGroundMacro: 2.3)

export const dist2seg = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1e-9; let t = ((px - a[0]) * dx + (pz - a[1]) * dz) / l2; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t)); };
// distância à curva (aproxima a Catmull-Rom por amostragem)
export function distToPath(px, pz, pts) { let best = 1e9; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]; let prev = p1; for (let s = 1; s <= 12; s++) { const u = s / 12, cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u), cur = [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]; best = Math.min(best, dist2seg(px, pz, prev, cur)); prev = cur; } } return best; }

/** Construtor de mapa com colocação segura (rejeita sobreposição, trilha e spawn). */
export function createMap(base) {
  const spec = { name: 'sem nome', seed: 1, bounds: { x: [-24, 24], z: [-24, 14] }, camera: { target: [0, -5], scale: 38 }, ground: { macroSeed: 5, half: 32, paths: [] }, spawn: { x: 0, z: 0, r: 3 }, props: [], lights: [], smoke: [], ...base };
  const rnd = mulberry32(spec.seed);
  const api = {
    spec, rnd,
    ok(id, x, z, { allowPath = false, y = 0 } = {}) {
      const f = FOOT[id]; if (!f) throw new Error('prop desconhecido: ' + id);
      if (x < spec.bounds.x[0] || x > spec.bounds.x[1] || z < spec.bounds.z[0] || z > spec.bounds.z[1]) return false;
      if (Math.hypot(x - spec.spawn.x, z - spec.spawn.z) < spec.spawn.r + (f.decal ? 0 : f.r)) return false;
      if (!allowPath && f.block) for (const p of spec.ground.paths) if (distToPath(x, z, p) < PATH_HALF + f.r + 0.15) return false;
      for (const q of spec.props) { const g = FOOT[q.id]; if (f.decal || g.decal) continue; if (Math.hypot(q.x - x, q.z - z) < (f.r + g.r) * 0.85 && (q.y || 0) === y) return false; }
      return true;
    },
    place(id, x, z, opts = {}) { if (!opts.force && !api.ok(id, x, z, opts)) return null; const p = { id, x: +x.toFixed(2), z: +z.toFixed(2), v: opts.v ?? ((rnd() * 99) | 0) }; if (opts.y) p.y = opts.y; if (opts.s) p.s = opts.s; spec.props.push(p); return p; },
    /** Grupo orgânico: anda em espiral a partir do centro tentando cada item. items: ['house','barrel',...] */
    cluster(cx, cz, items, { spread = 3.4, y = 0, tries = 60, region } = {}) {
      let placed = 0;
      for (const id of items) for (let k = 0; k < tries; k++) {
        const a = rnd() * Math.PI * 2, d = (placed === 0 ? 0 : 0.9 + rnd() * spread), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d * 0.85;
        if (region && !region(x, z)) continue;
        if (api.place(id, x, z, { y })) { placed++; break; }
      }
      return placed;
    },
    /** Fileira (cerca, postes, sacos) de a→b com espaçamento. */
    line(id, a, b, step, { jitter = 0.15, y = 0 } = {}) { const n = Math.max(1, Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let i = 0; i <= n; i++) { const t = i / n; api.place(id, a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * jitter, a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * jitter, { y }); } },
    /** Espalha n itens soltos numa região retangular. */
    scatter(ids, n, [x0, x1, z0, z1], { y = 0 } = {}) { let c = 0; for (let k = 0; k < n * 25 && c < n; k++) if (api.place(ids[(rnd() * ids.length) | 0], x0 + rnd() * (x1 - x0), z0 + rnd() * (z1 - z0), { y })) c++; return c; },
    light(x, z, color = '#ff8a3a', i = 1, r = 6) { spec.lights.push({ x, z, color, i, r }); },
  };
  return api;
}

/** Avalia o mapa e devolve { errors, warns, stats }. Erros = bloqueiam jogabilidade; avisos = composição. */
export function lint(spec) {
  const errors = [], warns = [], P = spec.props, [bx0, bx1] = spec.bounds.x, [bz0, bz1] = spec.bounds.z;
  const solid = P.filter((p) => !FOOT[p.id].decal);
  for (const p of P) { if (!FOOT[p.id]) errors.push(`prop desconhecido: ${p.id}`); }
  // sobreposição
  for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) { const a = solid[i], b = solid[j]; if ((a.y || 0) !== (b.y || 0)) continue; const d = Math.hypot(a.x - b.x, a.z - b.z), lim = (FOOT[a.id].r + FOOT[b.id].r) * 0.7; if (d < lim) warns.push(`sobreposição: ${a.id}(${a.x},${a.z}) × ${b.id}(${b.x},${b.z})`); }
  // bloqueio da trilha e do spawn
  for (const p of solid) { const f = FOOT[p.id]; if (f.block && !(p.y)) for (const path of spec.ground.paths) if (distToPath(p.x, p.z, path) < PATH_HALF + f.r * 0.6) errors.push(`bloqueia a trilha: ${p.id}(${p.x},${p.z})`); if (Math.hypot(p.x - spec.spawn.x, p.z - spec.spawn.z) < spec.spawn.r && f.block) errors.push(`dentro do spawn: ${p.id}(${p.x},${p.z})`); if (p.x < bx0 || p.x > bx1 || p.z < bz0 || p.z > bz1) warns.push(`fora dos limites: ${p.id}(${p.x},${p.z})`); }
  // conectividade da trilha ao spawn
  if (spec.ground.paths.length) { const dmin = Math.min(...spec.ground.paths.map((p) => distToPath(spec.spawn.x, spec.spawn.z, p))); if (dmin > 4) warns.push(`spawn longe da trilha (${dmin.toFixed(1)})`); }
  // variedade
  const cnt = {}; for (const p of P) cnt[p.id] = (cnt[p.id] || 0) + 1; const tot = P.length || 1;
  for (const [id, n] of Object.entries(cnt)) if (n / tot > 0.3 && tot > 12) warns.push(`pouca variedade: ${id} é ${Math.round(100 * n / tot)}% dos props`);
  if (Object.keys(cnt).length < 6) warns.push(`poucos tipos de prop (${Object.keys(cnt).length}); alvo ≥ 8`);
  // equilíbrio 3×3
  const gx = (bx1 - bx0) / 3, gz = (bz1 - bz0) / 3, grid = Array.from({ length: 9 }, () => 0);
  for (const p of solid) { const cx = Math.min(2, Math.max(0, Math.floor((p.x - bx0) / gx))), cz = Math.min(2, Math.max(0, Math.floor((p.z - bz0) / gz))); grid[cz * 3 + cx]++; }
  const names = ['fundo-esq', 'fundo', 'fundo-dir', 'meio-esq', 'centro', 'meio-dir', 'frente-esq', 'frente', 'frente-dir'];
  grid.forEach((n, i) => { if (n === 0 && i !== 4) warns.push(`região vazia: ${names[i]}`); });
  const avg = solid.length / 9; grid.forEach((n, i) => { if (avg > 3 && n > avg * 2.2) warns.push(`região lotada: ${names[i]} (${n})`); });
  // luz e atmosfera
  if (spec.lights.length < 3) warns.push(`poucas luzes (${spec.lights.length}); alvo ≥ 3 para pontos focais`);
  const heavy = solid.filter((p) => FOOT[p.id].r >= 1.2).length; if (heavy < 3) warns.push(`poucas âncoras grandes (${heavy}); a cena fica sem pontos focais`);
  // cada luz deveria iluminar algo
  for (const L of spec.lights) if (Math.hypot(L.x - spec.spawn.x, L.z - spec.spawn.z) > 1.5 && !solid.some((p) => Math.hypot(p.x - L.x, p.z - L.z) < L.r)) warns.push(`luz sem nada por perto: (${L.x},${L.z})`);
  return { errors, warns, stats: { props: P.length, tipos: Object.keys(cnt).length, grade: grid, porTipo: cnt } };
}
