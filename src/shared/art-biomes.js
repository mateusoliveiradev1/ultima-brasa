// Arte por bioma: recolore chão e cenário e pinta os adereços exclusivos (cogumelos, poças, costelas, cristais, rochedos).
import { TAU, cv, mulberry32 } from './util.js';
import { rad, lin } from './art-chars.js';

export function recolor(src, spec) {
  if (!spec) return src;
  const c = cv(src.width, src.height), x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'color'; x.globalAlpha = spec.a; x.fillStyle = spec.color; x.fillRect(0, 0, c.width, c.height);
  x.globalAlpha = 1; x.globalCompositeOperation = 'destination-in'; x.drawImage(src, 0, 0);
  return c;
}
const wrap = (ctx, size, fn) => { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { ctx.save(); ctx.translate(a * size, b * size); fn(); ctx.restore(); } };

export function tintGround(base, g) {
  if (!g) return base;
  const S = base.width, c = cv(S), x = c.getContext('2d'), rnd = mulberry32(4242);
  x.drawImage(base, 0, 0);
  x.globalCompositeOperation = 'color'; x.globalAlpha = g.a; x.fillStyle = g.color; x.fillRect(0, 0, S, S);
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  if (g.puddle) for (let i = 0; i < 16; i++) { const px = rnd() * S, py = rnd() * S, r = 18 + rnd() * 42; wrap(x, S, () => { x.fillStyle = rad(x, px, py, 0, r, [[0, 'rgba(10,50,40,.85)'], [0.7, 'rgba(14,70,56,.6)'], [1, 'rgba(66,224,180,0)']]); x.beginPath(); x.ellipse(px, py, r, r * 0.6, 0, 0, TAU); x.fill(); x.strokeStyle = 'rgba(120,255,210,.25)'; x.lineWidth = 1.5; x.beginPath(); x.ellipse(px, py, r * 0.8, r * 0.48, 0, 0, TAU); x.stroke(); }); }
  if (g.streaks) for (let i = 0; i < 60; i++) { const px = rnd() * S, py = rnd() * S, l = 40 + rnd() * 120; wrap(x, S, () => { x.strokeStyle = `rgba(255,214,150,${0.05 + rnd() * 0.08})`; x.lineWidth = 2 + rnd() * 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + l / 2, py - 8 - rnd() * 10, px + l, py); x.stroke(); }); }
  if (g.snow) {
    for (let i = 0; i < 26; i++) { const px = rnd() * S, py = rnd() * S, r = 24 + rnd() * 60; wrap(x, S, () => { x.fillStyle = rad(x, px, py, 0, r, [[0, 'rgba(230,242,255,.62)'], [1, 'rgba(230,242,255,0)']]); x.beginPath(); x.ellipse(px, py, r, r * 0.7, rnd() * 3, 0, TAU); x.fill(); }); }
    for (let i = 0; i < 10; i++) { let px = rnd() * S, py = rnd() * S, a = rnd() * TAU; wrap(x, S, () => { x.strokeStyle = 'rgba(190,230,255,.28)'; x.lineWidth = 1.6; x.beginPath(); let qx = px, qy = py, qa = a; x.moveTo(qx, qy); for (let k = 0; k < 8; k++) { qa += (Math.sin(k * 12.9 + i) * 0.9); qx += Math.cos(qa) * 22; qy += Math.sin(qa) * 22; x.lineTo(qx, qy); } x.stroke(); }); }
  }
  return c;
}

function grain(ctx, w, h, rnd, n = 500) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; for (let i = 0; i < n; i++) { ctx.fillStyle = rnd() < 0.7 ? `rgba(0,0,0,${0.22 * rnd()})` : `rgba(255,220,180,${0.08 * rnd()})`; ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); } ctx.restore(); }

export function buildShroom(seed = 1) {
  const W = 240, H = 190, rnd = mulberry32(seed * 31 + 9), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.ellipse(W / 2, H - 20, 86, 14, 0, 0, TAU); x.fill();
  const n = 5 + ((rnd() * 3) | 0); const caps = [];
  for (let i = 0; i < n; i++) caps.push({ x: 40 + rnd() * 160, base: H - 24 - rnd() * 10, h: 36 + rnd() * 70, r: 16 + rnd() * 24 });
  caps.sort((a, b) => a.base - b.base);
  for (const m of caps) {
    x.fillStyle = lin(x, m.x - 6, 0, m.x + 6, 0, [[0, '#8fd8c0'], [1, '#2a5a4a']]); x.beginPath(); x.moveTo(m.x - 5, m.base); x.quadraticCurveTo(m.x - 3, m.base - m.h / 2, m.x - 4, m.base - m.h); x.lineTo(m.x + 4, m.base - m.h); x.quadraticCurveTo(m.x + 3, m.base - m.h / 2, m.x + 5, m.base); x.fill();
    const cy = m.base - m.h; x.fillStyle = rad(x, m.x, cy - 6, 0, m.r * 1.8, [[0, 'rgba(66,224,180,.45)'], [1, 'rgba(66,224,180,0)']]); x.beginPath(); x.arc(m.x, cy - 6, m.r * 1.8, 0, TAU); x.fill();
    x.fillStyle = lin(x, m.x - m.r, cy - m.r, m.x + m.r, cy + 6, [[0, '#c8fff0'], [0.45, '#42e0b4'], [1, '#0e5a48']]); x.beginPath(); x.ellipse(m.x, cy, m.r, m.r * 0.62, 0, Math.PI, 0); x.quadraticCurveTo(m.x, cy + 10, m.x - m.r, cy); x.fill();
    x.fillStyle = 'rgba(255,255,255,.55)'; for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(m.x + (rnd() - 0.5) * m.r * 1.2, cy - rnd() * m.r * 0.4, 1.5 + rnd() * 2, 0, TAU); x.fill(); }
  }
  return { canvas: c, w: 2.9, h: 2.3, anchor: 0.87, glow: '#42e0b4', emissive: true };
}
export function buildPool(seed = 1) {
  const W = 360, H = 150, rnd = mulberry32(seed * 57 + 3), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = rad(x, W / 2, H / 2, 10, W / 2, [[0, 'rgba(8,60,48,.95)'], [0.75, 'rgba(10,80,64,.82)'], [1, 'rgba(66,224,180,0)']]); x.beginPath(); x.ellipse(W / 2, H / 2, W / 2 - 4, H / 2 - 6, 0, 0, TAU); x.fill();
  x.fillStyle = rad(x, W / 2, H / 2, 0, 120, [[0, 'rgba(120,255,214,.5)'], [1, 'rgba(120,255,214,0)']]); x.beginPath(); x.ellipse(W / 2, H / 2, 150, 52, 0, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(160,255,225,.4)'; x.lineWidth = 2; for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(W / 2 + (rnd() - 0.5) * 80, H / 2 + (rnd() - 0.5) * 16, 28 + i * 20, 9 + i * 6, 0, 0, TAU); x.stroke(); }
  return { canvas: c, w: 5.6, h: 2.3, anchor: 0.5, flat: true, glow: '#42e0b4' };
}
export function buildRibs(seed = 1) {
  const W = 380, H = 220, rnd = mulberry32(seed * 19 + 5), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.4)'; x.beginPath(); x.ellipse(W / 2, H - 22, 150, 16, 0, 0, TAU); x.fill();
  x.lineCap = 'round'; x.strokeStyle = lin(x, 0, 40, 0, 200, [[0, '#e8dcc2'], [1, '#8a7a62']]);
  x.lineWidth = 12; x.beginPath(); x.moveTo(40, H - 26); x.quadraticCurveTo(W / 2, H - 70, W - 50, H - 24); x.stroke();
  for (let i = 0; i < 7; i++) { const px = 70 + i * 40, h = 90 - Math.abs(i - 3) * 14 + rnd() * 10; x.lineWidth = 9 - Math.abs(i - 3) * 0.6; x.beginPath(); x.moveTo(px, H - 44 - Math.abs(i - 3) * 2); x.quadraticCurveTo(px + 22, H - 44 - h * 1.3, px + 10, H - 36 - h * 0.1 - 50 + h * 0.5); x.stroke(); }
  x.fillStyle = '#d8cbb0'; x.beginPath(); x.ellipse(60, H - 34, 26, 18, -0.2, 0, TAU); x.fill(); x.fillStyle = '#1a120c'; x.beginPath(); x.ellipse(54, H - 38, 6, 8, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(70, H - 36, 5, 7, 0, 0, TAU); x.fill();
  grain(x, W, H, rnd, 500);
  return { canvas: c, w: 5.6, h: 3.2, anchor: 0.88 };
}
export function buildCrystal(seed = 1) {
  const W = 220, H = 300, rnd = mulberry32(seed * 43 + 7), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.4)'; x.beginPath(); x.ellipse(W / 2, H - 20, 66, 12, 0, 0, TAU); x.fill();
  x.fillStyle = rad(x, W / 2, H - 120, 0, 130, [[0, 'rgba(140,200,255,.38)'], [1, 'rgba(140,200,255,0)']]); x.fillRect(0, 0, W, H);
  const sh = []; for (let i = 0; i < 6; i++) sh.push({ x: 50 + rnd() * 120, h: 70 + rnd() * 150 * (i === 0 ? 1.3 : 1), w: 16 + rnd() * 16, lean: (rnd() - 0.5) * 40 });
  sh.sort((a, b) => a.h - b.h).reverse();
  for (const s of sh) {
    const bx = s.x, by = H - 26, tx = bx + s.lean, ty = by - s.h;
    x.fillStyle = lin(x, bx - s.w, 0, bx + s.w, 0, [[0, '#dff2ff'], [0.5, '#7ab8f0'], [1, '#2a5a98']]); x.beginPath(); x.moveTo(bx - s.w, by); x.lineTo(tx - s.w * 0.55, ty + s.h * 0.18); x.lineTo(tx, ty); x.lineTo(tx + s.w * 0.55, ty + s.h * 0.18); x.lineTo(bx + s.w, by); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,.4)'; x.beginPath(); x.moveTo(bx - s.w, by); x.lineTo(tx - s.w * 0.55, ty + s.h * 0.18); x.lineTo(tx, ty); x.lineTo(bx - s.w * 0.1, by); x.fill();
  }
  return { canvas: c, w: 3.0, h: 4.0, anchor: 0.91, glow: '#8ac0ff', emissive: true };
}
export function buildSpire(seed = 1) {
  const W = 200, H = 330, rnd = mulberry32(seed * 71 + 2), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.ellipse(W / 2, H - 20, 70, 12, 0, 0, TAU); x.fill();
  const top = 30 + rnd() * 50, lean = (rnd() - 0.5) * 30;
  x.fillStyle = lin(x, 30, 0, 170, 0, [[0, '#8a7058'], [0.5, '#5a4636'], [1, '#2a1e16']]);
  x.beginPath(); x.moveTo(24, H - 22); x.lineTo(46, 180); x.lineTo(70 + lean, top + 50); x.lineTo(100 + lean, top); x.lineTo(124 + lean, top + 60); x.lineTo(150, 190); x.lineTo(176, H - 22); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 2.5; for (let i = 0; i < 7; i++) { const y = top + 70 + i * 32 + rnd() * 10; x.beginPath(); x.moveTo(40 + i * 3, y); x.lineTo(160 - i * 3, y + rnd() * 12 - 6); x.stroke(); }
  x.fillStyle = 'rgba(255,200,140,.18)'; x.beginPath(); x.moveTo(46, 180); x.lineTo(70 + lean, top + 50); x.lineTo(100 + lean, top); x.lineTo(98 + lean, 190); x.fill();
  grain(x, W, H, rnd, 700);
  return { canvas: c, w: 2.8, h: 4.9, anchor: 0.94 };
}
const SMALL = { shroom: buildShroom, pool: buildPool, ribs: buildRibs, crystal: buildCrystal, spire: buildSpire };
export function buildBiomeProps(base, biome) {
  const out = {};
  const tint = (d) => (biome.tint ? { ...d, canvas: recolor(d.canvas, biome.tint) } : d);
  for (const k of Object.keys(base)) out[k] = base[k].map((d) => (k === 'barrel' ? d : tint(d)));
  for (const k of Object.keys(SMALL)) out[k] = [1, 2].map((i) => { const d = SMALL[k](i); return (k === 'spire' && biome.tint) ? { ...d, canvas: recolor(d.canvas, biome.tint) } : d; });
  if (biome.id === 'tundra') out.tree = out.tree.map((d) => ({ ...d, canvas: recolor(d.canvas, { color: '#dff0ff', a: 0.55 }) }));
  return out;
}
