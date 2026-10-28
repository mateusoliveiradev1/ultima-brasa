import { buildAllProps } from '../src/shared/art-props.js';
import { buildSheet, SHEETS, buildPickups } from '../src/shared/art-chars.js';
document.body.style.cssText='margin:0;background:radial-gradient(circle at 50% 30%,#4a3326,#14100f);display:flex;flex-wrap:wrap;gap:8px;padding:8px;align-items:flex-end';
const P=buildAllProps();
for(const k of Object.keys(P)) for(const p of P[k]){ const c=p.canvas; c.style.cssText='height:'+Math.min(260,c.height)+'px;width:auto;'; document.body.append(c); }
for(const n of Object.keys(SHEETS)){ const s=buildSheet(n); s.canvas.style.cssText='height:200px'; document.body.append(s.canvas); }
document.body.append(buildPickups().canvas);
