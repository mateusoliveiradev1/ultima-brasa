// Galeria do catálogo de props pintados (revisão visual rápida, sem WebGL).
import { CATALOG } from '../../src/shared/paint-props.js';
document.body.style.cssText = 'margin:0;background:radial-gradient(circle at 50% 20%,#4a3326,#120e0d);font:12px sans-serif;color:#e8c8a0;display:grid;grid-template-columns:repeat(6,1fr);gap:10px;padding:12px;width:1500px';
const t0 = performance.now(), errs = [];
for (const e of CATALOG) {
  const cell = document.createElement('div'); cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;height:230px;justify-content:flex-end;position:relative';
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:6px;align-items:flex-end';
  try { for (let i = 1; i <= Math.min(2, e.n); i++) { const r = e.paint(i); const c = r.albedo; c.style.cssText = `height:${Math.min(190, 40 + e.h * 22)}px;max-width:${e.n > 1 ? 120 : 240}px;object-fit:contain`; row.append(c); } } catch (err) { errs.push(e.id + ': ' + err.message); }
  const l = document.createElement('div'); l.textContent = e.name; cell.append(row, l); document.body.append(cell);
}
window.__errs = errs; window.__ms = performance.now() - t0; window.__ready = true;
