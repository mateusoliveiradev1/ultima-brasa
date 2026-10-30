import { paintRuinWall, paintDeadTree, paintBarrel, paintSpire } from '../../src/shared/paint.js';
document.body.style.cssText = 'margin:0;background:radial-gradient(circle at 50% 30%,#4a3326,#14100f);display:flex;gap:18px;padding:18px;align-items:flex-end;flex-wrap:wrap';
const t0 = performance.now();
for (const [f, n] of [[paintRuinWall, 'albedo'], [paintDeadTree], [paintBarrel], [paintSpire]]) { const r = f(1); r.albedo.style.cssText = 'height:420px'; document.body.append(r.albedo); r.normal.style.cssText = 'height:200px'; document.body.append(r.normal); }
window.__ms = performance.now() - t0; window.__ready = true;
