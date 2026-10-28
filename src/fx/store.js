// Persistência dos efeitos editados na Forja (localStorage) + vínculo habilidade → efeito.
import { defaultDefs } from './defaults.js';
import { normalizeDef, serializeDef } from './core.js';

const KEY = 'ultimabrasa.fx.v1';
let state = null;

function load() {
  if (state) return state;
  try { state = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { state = {}; }
  state.defs ||= {}; state.bindings ||= {};
  return state;
}
function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('fx persist', e); } }

const live = new Map(); // id -> def normalizada em uso
export function allDefs() {
  const s = load(), D = defaultDefs(), out = new Map();
  for (const id of Object.keys(D)) out.set(id, D[id]);
  for (const id of Object.keys(s.defs)) { if (!live.has(id) || live.get(id).__src !== s.defs[id]) { const d = normalizeDef(JSON.parse(JSON.stringify(s.defs[id]))); d.__src = s.defs[id]; live.set(id, d); } out.set(id, live.get(id)); }
  return out;
}
export function isCustom(id) { return !!load().defs[id]; }
export function isBuiltin(id) { return !!defaultDefs()[id]; }
export function saveDef(def) { const s = load(); s.defs[def.id] = serializeDef(def); live.delete(def.id); persist(); }
export function removeDef(id) { const s = load(); delete s.defs[id]; live.delete(id); persist(); }
export function getBinding(skillId) { return load().bindings[skillId] || skillId; }
export function setBinding(skillId, fxId) { const s = load(); if (fxId === skillId) delete s.bindings[skillId]; else s.bindings[skillId] = fxId; persist(); }
export function resolveFx(skillId) { const all = allDefs(); return all.get(getBinding(skillId)) || all.get(skillId); }
export function exportAll() { const s = load(); return JSON.stringify({ app: 'ultima-brasa-fx', v: 1, defs: s.defs, bindings: s.bindings }, null, 1); }
export function importAll(text) {
  const j = JSON.parse(text);
  const s = load();
  if (j.app === 'ultima-brasa-fx') { Object.assign(s.defs, j.defs || {}); Object.assign(s.bindings, j.bindings || {}); }
  else if (j.id && j.kind) s.defs[j.id] = j; // um único efeito
  else throw new Error('Arquivo não reconhecido');
  live.clear(); persist();
}
