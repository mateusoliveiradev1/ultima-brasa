// Mapas da Forja de Mapas no jogo: lê data/maps/*.json (vários por bioma; o jogo sorteia um a cada expedição).
// O mapa ocupa a área ao redor do ponto de partida; fora dela (e em biomas sem mapa) o mundo continua procedural.
// ?map=0 desliga os mapas · ?map=<nome> força um mapa publicado · ?map=local usa o rascunho salvo no editor.
import { CATALOG } from '../shared/paint-props.js';
import { FOOT } from '../shared/mapspec.js';
import { paintGroundMacro } from '../shared/paint.js';
import { recolor } from '../shared/art-biomes.js';
import { FILES } from './maps.index.js';

export const MAPS = FILES; // nome do arquivo → mapa (gerado por build.mjs a partir de data/maps/*.json)
for (const [k, sp] of Object.entries(MAPS)) sp.biome = sp.biome || k.split('-')[0];
const CAT = Object.fromEntries(CATALOG.map((e) => [e.id, e]));
export const mapsOf = (biomeId) => Object.values(MAPS).filter((m) => m.biome === biomeId);
const qParam = () => { try { return new URLSearchParams(location.search).get('map'); } catch { return null; } };

export function pickMap(biomeId) {
  const q = qParam();
  try {
    if (q === '0') return null;
    if (q === 'local') { const raw = localStorage.getItem('ub.map.local'); if (raw) return JSON.parse(raw); }
  } catch { /* sem storage: usa o publicado */ }
  if (q && MAPS[q]) return MAPS[q];
  const L = mapsOf(biomeId); return L.length ? L[(Math.random() * L.length) | 0] : null;
}

const spriteCache = new Map();
const tintKey = (t) => (t ? t.color + t.a : '');
function sprite(id, v, tint) {
  const e = CAT[id], k = id + ':' + (v % e.n) + tintKey(tint); let c = spriteCache.get(k);
  if (!c) { const base = sprite0(id, v); c = tint ? recolor(base, tint) : base; spriteCache.set(k, c); } return c;
}
function sprite0(id, v) {
  const e = CAT[id], k = id + ':' + (v % e.n); let c = spriteCache.get(k);
  if (!c) { c = e.paint((v % e.n) + 1).albedo; spriteCache.set(k, c); } return c;
}

const THEMED = ['pantano', 'deserto', 'tundra'];
export const tintFor = (sp, id) => (sp.propTint && !(CAT[id].tags || []).some((t) => THEMED.includes(t)) ? sp.propTint : null);
const keysOf = (sp) => { const out = []; for (const p of sp.props) if (CAT[p.id] && !((p.y || 0) > 0)) out.push([p.id, p.v || 0]); return out; };
const keyOf = (id, v, tint) => id + ':' + (v % CAT[id].n) + tintKey(tint);
/** Pinta, na tela de carregamento, os sprites dos mapas que podem aparecer primeiro (Ruínas e o mapa forçado/local). Os demais são pintados em segundo plano. */
export async function preloadMaps(onProgress = () => {}) {
  const q = qParam(); if (q === '0') return;
  const specs = new Set(mapsOf('ruinas')); if (q === 'local') { const l = pickMap('local'); if (l) specs.add(l); } if (q && MAPS[q]) specs.add(MAPS[q]);
  const jobs = []; for (const sp of specs) for (const [id, v] of keysOf(sp)) { const t = tintFor(sp, id), k = keyOf(id, v, t); if (!spriteCache.has(k) && !jobs.find((j) => j[0] === k)) jobs.push([k, id, v, t]); }
  let i = 0; for (const [, id, v, t] of jobs) { sprite(id, v, t); onProgress(++i / (jobs.length + 1)); await new Promise((r) => setTimeout(r, 0)); }
  onProgress(1); setTimeout(warmMaps, 2500);
}
/** Pinta em segundo plano os sprites dos outros mapas (um por vez, entre quadros) para a primeira expedição neles não travar. */
function warmMaps() {
  const jobs = []; for (const sp of Object.values(MAPS)) for (const [id, v] of keysOf(sp)) { const t = tintFor(sp, id), k = keyOf(id, v, t); if (!spriteCache.has(k) && !jobs.find((j) => j[0] === k)) jobs.push([k, id, v, t]); }
  const step = () => { const j = jobs.shift(); if (!j) return; try { sprite(j[1], j[2], j[3]); } catch { /* segue */ } setTimeout(step, 60); };
  step();
}

// chão macro: cada um ocupa ~17 MB, então só os 2 mais recentes ficam em memória
const macros = new Map();
function macroFor(spec) {
  let m = macros.get(spec); if (m) { macros.delete(spec); macros.set(spec, m); return m; }
  m = paintGroundMacro(2048, spec.ground.macroSeed, spec.ground.half, spec.ground.paths || [], spec.ground.patches || []);
  if (spec.tint) m = recolor(m, spec.tint);
  macros.set(spec, m); while (macros.size > 2) macros.delete(macros.keys().next().value); return m;
}

/** Converte o mapa em objetos do jogo (já na posição final: o ponto de partida do mapa vira a origem). */
export function buildMap(spec) {
  const ox = -spec.spawn.x, oz = -spec.spawn.z, [bx0, bx1] = spec.bounds.x, [bz0, bz1] = spec.bounds.z, props = [];
  for (const p of spec.props) {
    const e = CAT[p.id], f = FOOT[p.id]; if (!e || !f || (p.y || 0) > 0) continue;
    const x = p.x + ox, z = p.z + oz, h = e.h * 0.95 * (p.s || 1), cv0 = sprite(p.id, p.v || 0, tintFor(spec, p.id)), w = h * (cv0.width / cv0.height), decal = e.kind === 'decal';
    props.push({ type: p.id, v: p.v || 0, x, z, a: 1, flip: !decal && (p.f != null ? !!p.f : ((p.v || 0) & 1) === 1), fire: p.id === 'campfire', glow: !decal && p.id !== 'campfire' && e.light ? e.light : null, ph: (p.x * 7.3 + p.z * 3.1) % 6.28,
      box: f.block ? [x - f.r * 0.85, x + f.r * 0.85, z - f.r * 0.55, z + 0.15] : null,
      def: { w, h, canvas: cv0, anchor: 1, flat: decal, shadow: !decal && h > 0.9, tall: !decal && h > 3 } });
  }
  const half = spec.ground.half, lights = (spec.lights || []).map((l) => ({ x: l.x + ox, z: l.z + oz, color: l.color, i: l.i, r: l.r }));
  return { name: spec.name, ox, oz, half, macro: macroFor(spec), lights, props, arena: spec.arena ? { x: spec.arena.x + ox, z: spec.arena.z + oz, r: spec.arena.r } : null, bounds: [bx0 + ox - 1, bx1 + ox + 1, bz0 + oz - 1, bz1 + oz + 1] };
}
