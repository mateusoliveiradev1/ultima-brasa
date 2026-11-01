// Mapas da Forja de Mapas no jogo: lê data/maps/<bioma>.json (e ?map=local para testar o mapa salvo no editor).
// O mapa ocupa a área ao redor do ponto de partida; fora dela (e em biomas sem mapa) o mundo continua procedural.
import { CATALOG } from '../shared/paint-props.js';
import { FOOT } from '../shared/mapspec.js';
import { paintGroundMacro } from '../shared/paint.js';
import { FILES } from './maps.index.js';

export const MAPS = FILES; // gerado por build.mjs a partir de data/maps/*.json
const CAT = Object.fromEntries(CATALOG.map((e) => [e.id, e]));

export function pickMap(biomeId) {
  try {
    const q = new URLSearchParams(location.search).get('map');
    if (q === '0') return null;
    if (q === 'local') { const raw = localStorage.getItem('ub.map.local'); if (raw) return JSON.parse(raw); }
  } catch { /* sem storage: usa o publicado */ }
  return MAPS[biomeId] || null;
}

const spriteCache = new Map();
function sprite(id, v) {
  const e = CAT[id], k = id + ':' + (v % e.n); let c = spriteCache.get(k);
  if (!c) { c = e.paint((v % e.n) + 1).albedo; spriteCache.set(k, c); } return c;
}

/** Converte o mapa em objetos do jogo (já na posição final: o ponto de partida do mapa vira a origem). */
/** Pinta os sprites e o chão dos mapas durante a tela de carregamento (cada pintura leva de dezenas de ms a ~1 s). */
export async function preloadMaps(onProgress = () => {}) {
  const specs = new Set(Object.values(MAPS)); let q = null; try { q = new URLSearchParams(location.search).get('map'); } catch {}
  if (q === '0') return; if (q === 'local') { const l = pickMap('local'); if (l) specs.add(l); }
  const keys = []; for (const sp of specs) for (const p of sp.props) if (CAT[p.id] && !((p.y || 0) > 0)) { const k = p.id + ':' + ((p.v || 0) % CAT[p.id].n); if (!spriteCache.has(k) && !keys.find((x) => x[0] === k)) keys.push([k, p.id, p.v || 0]); }
  let i = 0; for (const [, id, v] of keys) { sprite(id, v); onProgress(++i / (keys.length + 1)); await new Promise((r) => setTimeout(r, 0)); }
  for (const sp of specs) buildMap(sp); onProgress(1);
}

const built = new WeakMap();
export function buildMap(spec) {
  if (built.has(spec)) return built.get(spec);
  const ox = -spec.spawn.x, oz = -spec.spawn.z, [bx0, bx1] = spec.bounds.x, [bz0, bz1] = spec.bounds.z, props = [];
  for (const p of spec.props) {
    const e = CAT[p.id], f = FOOT[p.id]; if (!e || !f || (p.y || 0) > 0) continue;
    const x = p.x + ox, z = p.z + oz, h = e.h * 0.95 * (p.s || 1), cv0 = sprite(p.id, p.v || 0), w = h * (cv0.width / cv0.height), decal = e.kind === 'decal';
    props.push({ type: p.id, v: p.v || 0, x, z, a: 1, flip: ((p.v || 0) & 1) === 1 && !decal, fire: p.id === 'campfire', glow: p.id === 'crystal' ? '#ff7a20' : null, ph: (p.x * 7.3 + p.z * 3.1) % 6.28,
      box: f.block ? [x - f.r * 0.85, x + f.r * 0.85, z - f.r * 0.55, z + 0.15] : null,
      def: { w, h, canvas: cv0, anchor: 1, flat: decal, shadow: !decal && h > 0.9, tall: !decal && h > 3 } });
  }
  const half = spec.ground.half;
  const macro = paintGroundMacro(2048, spec.ground.macroSeed, half, spec.ground.paths || [], spec.ground.patches || []);
  const lights = (spec.lights || []).map((l) => ({ x: l.x + ox, z: l.z + oz, color: l.color, i: l.i, r: l.r }));
  const r = { name: spec.name, ox, oz, half, macro, lights, props, bounds: [bx0 + ox - 1, bx1 + ox + 1, bz0 + oz - 1, bz1 + oz + 1] }; built.set(spec, r); return r;
}
