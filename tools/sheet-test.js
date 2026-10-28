import { buildSheet, buildPickups, SHEETS } from '../src/shared/art-chars.js';
document.body.style.cssText='margin:0;background:#2a2220;color:#ccc;font:12px sans-serif';
const names = Object.keys(SHEETS);
const wrap=document.createElement('div');wrap.style.cssText='display:flex;flex-direction:column;gap:6px;padding:6px;align-items:flex-start';
document.body.appendChild(wrap);
for(const n of names){const s=buildSheet(n); s.canvas.style.cssText='background:radial-gradient(circle at 70% 60%,#4a3326,#14100f);border:1px solid #433;image-rendering:auto;max-width:100%;'; const l=document.createElement('div');l.textContent=n;wrap.append(l,s.canvas);}
const p=buildPickups();p.canvas.style.background='#14100f';wrap.append(p.canvas);
