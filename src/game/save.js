// Progresso salvo (localStorage) + ganhos offline dos Catadores.
import { NODE_IDS, catadorRate, catadorMul, treeFx, RELIC_NODE } from './data.js';

const KEY = 'ultimabrasa.save.v1';
const fresh = () => ({ v: 2, scrap: 0, lifetime: 0, earnedLife: 0, cinzas: 0, rebirths: 0, meta: Object.fromEntries(NODE_IDS.map((k) => [k, 0])), startSkill: 'lamina', depth: 1, depthMax: 1, biome: 'ruinas', biomeWins: {}, milestones: {}, elites: 0, best: { time: 0, kills: 0, level: 0, combo: 0 }, runs: 0, wins: 0, kills: 0, sfx: true, music: true, opts: { shake: 1, numbers: true, bloom: true }, t: Date.now() });
let S = null;
export function save() { if (!S) return; S.t = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sem storage */ } }
export function data() {
  if (S) return S;
  let raw = null; try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { raw = null; }
  const f = fresh(); S = Object.assign(f, raw || {});
  S.meta = Object.assign(fresh().meta, S.meta); S.best = Object.assign(fresh().best, S.best); S.biomeWins = S.biomeWins || {}; S.opts = Object.assign(fresh().opts, S.opts); S.milestones = S.milestones || {};
  if (raw && raw.relics) { for (const [k, v] of Object.entries(raw.relics)) if (v && RELIC_NODE[k] && !S.meta[RELIC_NODE[k]]) S.meta[RELIC_NODE[k]] = 1; delete S.relics; }
  if (!S.earnedLife) S.earnedLife = S.lifetime || 0;
  return S;
}
export function prestigeMul() { return 1 + 0.08 * (S?.cinzas || 0); }
export function offlineGain() {
  const d = data(), dt = Math.min(3 * 3600, Math.max(0, (Date.now() - (d.t || Date.now())) / 1000)), r = catadorRate(d.meta.catador) * catadorMul(d.meta) * (1 + (treeFx(d.meta).offMul || 0)) * prestigeMul();
  const g = Math.floor(dt * r); if (g > 0 && dt > 30) { d.scrap += g; d.lifetime += g; d.earnedLife += g; save(); return { gain: g, secs: dt }; }
  return null;
}
export function reset() { S = fresh(); save(); }
