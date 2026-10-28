// Progresso salvo (localStorage) + ganhos offline dos Catadores.
import { META_IDS, catadorRate } from './data.js';

const KEY = 'ultimabrasa.save.v1';
const fresh = () => ({ v: 1, scrap: 0, lifetime: 0, meta: Object.fromEntries(META_IDS.map((k) => [k, 0])), relics: { lamina: true }, startSkill: 'lamina', depth: 1, depthMax: 1, best: { time: 0, kills: 0, level: 0 }, runs: 0, wins: 0, kills: 0, sfx: true, music: true, t: Date.now() });
let S = null;
export function save() { if (!S) return; S.t = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sem storage */ } }
export function data() {
  if (S) return S;
  let raw = null; try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { raw = null; }
  S = Object.assign(fresh(), raw || {});
  S.meta = Object.assign(fresh().meta, S.meta); S.relics = Object.assign({ lamina: true }, S.relics); S.best = Object.assign(fresh().best, S.best);
  return S;
}
// Ao abrir: converte o tempo ausente em sucata (máx. 3h)
export function offlineGain() {
  const d = data(), dt = Math.min(3 * 3600, Math.max(0, (Date.now() - (d.t || Date.now())) / 1000)), r = catadorRate(d.meta.catador);
  const g = Math.floor(dt * r); if (g > 0 && dt > 30) { d.scrap += g; d.lifetime += g; save(); return { gain: g, secs: dt }; }
  return null;
}
export function reset() { S = fresh(); save(); }
