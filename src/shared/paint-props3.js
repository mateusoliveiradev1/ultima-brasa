// Props de arquitetura e de cenário (3ª leva): muros, contêineres, torres, braseiros, gelo, pedra e pântano.
// Mesmo método do paint-props.js: a forma é uma máscara preta; o pincel pinta o volume por cima.
import { TAU, mulberry32 } from './util.js';
import { paintProp } from './paint.js';

const BRICK = ['#0e0a0a', '#3a2420', '#7a4a3a', '#c8957a'], RUST = ['#120a08', '#4a2418', '#8c4c2a', '#d89258'], IRON = ['#0e0e12', '#34363e', '#6c727c', '#b8c0c8'];
const PLANK = ['#120e0a', '#4a3a28', '#8a7248', '#cdb88a'], BONE = ['#1a1612', '#6a5e50', '#b8a88c', '#f0e4c8'], STONE = ['#100c0c', '#403632', '#7a6c62', '#c0b0a0'];
const SAND = ['#1c130a', '#7a5a34', '#b88e58', '#f4dca0'], ICE = ['#0a1220', '#2c4a74', '#6aa6d8', '#eaf8ff'], BARK = ['#100c08', '#3a2a1c', '#6a5030', '#b09468'];
const MOSS = ['#08120a', '#1f4228', '#4a8a48', '#b4e08c'], FIRE = ['#1a0a04', '#6a2a10', '#d8761c', '#ffe08a'], CLOTH = ['#140a0a', '#5a1e1a', '#a8402c', '#f0a070'];
const foot = (c, w, h, a = 0.5) => { const g = c.createLinearGradient(0, h - 60, 0, h); g.addColorStop(0, 'rgba(8,6,6,0)'); g.addColorStop(1, `rgba(8,6,6,${a})`); c.fillStyle = g; c.fillRect(0, h - 60, w, 60); };
const cut = (c, fn) => { c.globalCompositeOperation = 'destination-out'; fn(); c.globalCompositeOperation = 'source-over'; };

export function paintWall(seed = 1) {
  const r = mulberry32(seed * 41);
  return paintProp({ w: 440, h: 230, seed, palette: BRICK, strokes: 900, size: 11, rim: '#ffb070', inkAmt: 0.9,
    shape(c, w, h) { c.beginPath(); c.moveTo(14, h - 14); c.lineTo(14, 90); for (let x = 14; x <= 426; x += 28) c.lineTo(x, 60 + r() * 50 + (x > 150 && x < 290 ? 24 : 0)); c.lineTo(426, h - 14); c.closePath(); c.fill(); cut(c, () => { c.fillRect(70, 100, 46, 56); c.fillRect(300, 110, 40, 48); c.fillRect(160, 150, 50, 66); }); },
    details(c, w, h, rr) { c.strokeStyle = 'rgba(14,8,8,.55)'; c.lineWidth = 2; for (let y = 70; y < h - 10; y += 18) { c.beginPath(); c.moveTo(10, y); c.lineTo(w - 10, y); c.stroke(); for (let x = 14 + ((y / 18) % 2) * 20; x < w - 10; x += 40) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 18); c.stroke(); } } c.fillStyle = 'rgba(20,16,14,.4)'; for (let i = 0; i < 22; i++) c.fillRect(rr() * w, 70 + rr() * 140, 14 + rr() * 16, 8); foot(c, w, h, 0.5); },
    flow: () => 0, texture: (x, y, rr) => (rr() < 0.08 ? -0.18 : 0) });
}
export function paintContainer(seed = 1) {
  const r = mulberry32(seed * 42);
  return paintProp({ w: 420, h: 250, seed, palette: RUST, strokes: 900, size: 11, rim: '#ffb070', inkAmt: 0.9,
    shape(c, w, h) { c.beginPath(); c.moveTo(20, h - 16); c.lineTo(20, 90); c.lineTo(80, 50); c.lineTo(400, 50); c.lineTo(400, h - 16); c.closePath(); c.fill(); c.beginPath(); c.moveTo(80, 50); c.lineTo(110, 24 + r() * 6); c.lineTo(400, 24 + r() * 6); c.lineTo(400, 50); c.closePath(); c.fill(); },
    details(c, w, h, rr) { c.strokeStyle = 'rgba(10,6,4,.6)'; c.lineWidth = 3; for (let x = 100; x < 396; x += 22) { c.beginPath(); c.moveTo(x, 54); c.lineTo(x, h - 20); c.stroke(); } c.fillStyle = 'rgba(30,60,90,.35)'; c.fillRect(110, 70, 150, 90); c.fillStyle = 'rgba(240,230,210,.4)'; c.fillRect(130, 90, 90, 14); c.fillStyle = 'rgba(100,40,14,.4)'; for (let i = 0; i < 40; i++) c.fillRect(30 + rr() * 360, 56 + rr() * 170, 3, 8 + rr() * 16); foot(c, w, h, 0.5); },
    flow: () => 0, texture: (x, y, rr) => (rr() < 0.07 ? 0.2 : 0) });
}
export function paintWreck(seed = 1) {
  const r = mulberry32(seed * 43);
  return paintProp({ w: 380, h: 200, seed, palette: RUST, strokes: 820, size: 10, rim: '#ffb070', inkAmt: 0.9,
    shape(c, w, h) { c.beginPath(); c.moveTo(24, h - 40); c.lineTo(30, 100); c.lineTo(110, 92); c.lineTo(150, 46); c.lineTo(250, 44); c.lineTo(300, 92); c.lineTo(356, 104); c.lineTo(358, h - 40); c.closePath(); c.fill(); for (const x of [92, 286]) { c.beginPath(); c.ellipse(x, h - 36, 34, 30 - r() * 6, 0, 0, TAU); c.fill(); } cut(c, () => { c.beginPath(); c.moveTo(130, 98); c.lineTo(158, 60); c.lineTo(240, 58); c.lineTo(276, 98); c.closePath(); c.fill(); }); },
    details(c, w, h, rr) { c.fillStyle = 'rgba(8,6,6,.8)'; for (const x of [92, 286]) { c.beginPath(); c.arc(x, h - 36, 14, 0, TAU); c.fill(); } c.fillStyle = 'rgba(16,10,8,.55)'; c.fillRect(30, 104, 330, 12); c.fillStyle = 'rgba(20,16,14,.45)'; for (let i = 0; i < 18; i++) c.fillRect(30 + rr() * 320, 60 + rr() * 80, 8 + rr() * 20, 6); foot(c, w, h, 0.5); },
    flow: () => 0, texture: (x, y, rr) => (rr() < 0.08 ? -0.15 : 0) });
}
export function paintTank(seed = 1) {
  return paintProp({ w: 280, h: 360, seed, palette: IRON, strokes: 820, size: 10, rim: '#ffb070', inkAmt: 0.9,
    shape(c, w, h) { c.fillRect(54, 80, 172, h - 110); c.beginPath(); c.ellipse(140, 84, 86, 34, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(140, h - 34, 86, 30, 0, 0, TAU); c.fill(); c.fillRect(120, 30, 12, 52); c.fillRect(100, 24, 56, 12); for (const x of [70, 210]) c.fillRect(x - 5, h - 40, 10, 30); c.fillRect(224, 90, 8, h - 120); },
    details(c, w, h, rr) { c.strokeStyle = 'rgba(8,8,10,.6)'; c.lineWidth = 4; for (const y of [140, 220, 290]) { c.beginPath(); c.ellipse(140, y, 86, 18, 0, 0.05, Math.PI - 0.05); c.stroke(); } c.fillStyle = 'rgba(150,64,20,.4)'; for (let i = 0; i < 36; i++) c.fillRect(60 + rr() * 160, 90 + rr() * 220, 4, 10 + rr() * 22); c.fillStyle = 'rgba(220,200,140,.5)'; c.fillRect(100, 170, 80, 16); foot(c, w, h, 0.5); },
    flow: () => -Math.PI / 2, texture: (x, y, rr) => (rr() < 0.06 ? 0.2 : 0) });
}
export function paintPillar(seed = 1) {
  const r = mulberry32(seed * 44);
  return paintProp({ w: 170, h: 360, seed, palette: STONE, strokes: 520, size: 10, rim: '#ffb070', inkAmt: 0.9,
    shape(c, w, h) { c.beginPath(); c.moveTo(34, h - 14); c.lineTo(46, 80); c.lineTo(60, 52 + r() * 10); c.lineTo(94, 36 + r() * 20); c.lineTo(120, 70); c.lineTo(132, h - 14); c.closePath(); c.fill(); c.fillRect(24, h - 44, 122, 30); c.fillRect(32, 70, 106, 14); },
    details(c, w, h, rr) { c.strokeStyle = 'rgba(10,8,8,.55)'; c.lineWidth = 2.4; for (const x of [62, 85, 108]) { c.beginPath(); c.moveTo(x, 86); c.lineTo(x + (rr() - 0.5) * 4, h - 46); c.stroke(); } for (let i = 0; i < 4; i++) { let x = 50 + rr() * 70, y = 100 + rr() * 150; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rr() - 0.5) * 30, y + 20 + rr() * 20); c.stroke(); } foot(c, w, h, 0.5); },
    flow: () => -Math.PI / 2, texture: () => 0 });
}
export function paintWatchtower(seed = 1) {
  const r = mulberry32(seed * 45);
  return paintProp({ w: 260, h: 520, seed, palette: PLANK, strokes: 1000, size: 11, rim: '#ffb070', inkAmt: 0.9,
    shape(c, w, h) { c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 12; for (const [x0, x1] of [[56, 84], [204, 176]]) { c.beginPath(); c.moveTo(x0 - 14, h - 12); c.lineTo(x1, 170); c.stroke(); } c.lineWidth = 7; for (let y = h - 50; y > 200; y -= 62) { const t = (h - y) / (h - 170), xl = 42 + 42 * t, xr = 218 - 42 * t; c.beginPath(); c.moveTo(xl, y); c.lineTo(xr, y - 40); c.moveTo(xr, y); c.lineTo(xl, y - 40); c.moveTo(xl, y); c.lineTo(xr, y); c.stroke(); }
      c.fillRect(54, 150, 152, 20); c.fillRect(60, 80, 140, 72); c.beginPath(); c.moveTo(40, 86); c.lineTo(130, 28 + r() * 6); c.lineTo(220, 86); c.closePath(); c.fill(); cut(c, () => { c.fillRect(80, 104, 100, 30); }); },
    details(c, w, h, rr) { c.strokeStyle = 'rgba(10,8,6,.55)'; c.lineWidth = 2.4; for (let x = 66; x < 200; x += 18) { c.beginPath(); c.moveTo(x, 84); c.lineTo(x, 150); c.stroke(); } c.fillStyle = 'rgba(255,150,60,.35)'; c.fillRect(90, 110, 80, 18); foot(c, w, h, 0.45); },
    flow: () => -Math.PI / 2, texture: () => 0 });
}
export function paintBrazier(seed = 1) {
  const r = mulberry32(seed * 46);
  return paintProp({ w: 170, h: 250, seed, palette: IRON, strokes: 460, size: 8, rim: '#ffb060', inkAmt: 0.9,
    shape(c, w, h) { c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 9; for (const x of [50, 85, 120]) { c.beginPath(); c.moveTo(x, 100); c.lineTo(85 + (x - 85) * 1.5, h - 12); c.stroke(); } c.beginPath(); c.moveTo(26, 90); c.quadraticCurveTo(85, 160, 144, 90); c.lineTo(138, 78); c.lineTo(32, 78); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(48, 80); c.quadraticCurveTo(60 + r() * 10, 36, 85, 14); c.quadraticCurveTo(110, 40, 122, 80); c.closePath(); c.fill(); },
    details(c, w, h) { c.globalCompositeOperation = 'source-atop'; const g = c.createRadialGradient(85, 60, 4, 85, 60, 56); g.addColorStop(0, 'rgba(255,240,150,.95)'); g.addColorStop(0.5, 'rgba(255,140,40,.8)'); g.addColorStop(1, 'rgba(200,60,10,.0)'); c.fillStyle = g; c.fillRect(20, 0, 130, 100); foot(c, w, h, 0.4); },
    flow: () => -Math.PI / 2, texture: () => 0 });
}
export function paintBanner(seed = 1) {
  const r = mulberry32(seed * 47);
  return paintProp({ w: 190, h: 350, seed, palette: CLOTH, strokes: 520, size: 9, rim: '#ffb070', inkAmt: 0.85,
    shape(c, w, h) { c.fillRect(46, 30, 10, h - 40); c.beginPath(); c.arc(51, 26, 10, 0, TAU); c.fill(); c.beginPath(); c.moveTo(56, 46); for (let x = 56; x <= 164; x += 18) c.lineTo(x, 50 + Math.sin(x * 0.09) * 10); c.lineTo(160, 160); for (let x = 160; x >= 56; x -= 18) c.lineTo(x, 150 + Math.sin(x * 0.12) * 12 + (x < 110 ? r() * 24 : 0)); c.closePath(); c.fill(); },
    details(c, w, h) { c.fillStyle = 'rgba(20,10,8,.6)'; c.beginPath(); c.arc(106, 100, 20, 0, TAU); c.fill(); c.fillStyle = 'rgba(240,200,140,.7)'; c.fillRect(100, 78, 12, 44); c.fillRect(84, 94, 44, 12); foot(c, w, h, 0.35); },
    flow: () => 0.1, texture: () => 0 });
}
export function paintWillow(seed = 1) {
  const r = mulberry32(seed * 48);
  return paintProp({ w: 380, h: 430, seed, palette: MOSS, strokes: 1100, size: 11, rim: '#b8ffa0', inkAmt: 0.85,
    shape(c, w, h) { c.lineCap = 'round'; c.strokeStyle = '#000'; c.fillStyle = '#000'; c.lineWidth = 34; c.beginPath(); c.moveTo(190, h - 12); c.quadraticCurveTo(170, 200, 196, 110); c.stroke(); for (let k = 0; k < 7; k++) { c.beginPath(); c.ellipse(190 + (r() - 0.5) * 150, 90 + r() * 40, 60 + r() * 40, 30 + r() * 14, 0, 0, TAU); c.fill(); }
      c.lineWidth = 5; for (let k = 0; k < 30; k++) { const x = 60 + r() * 260, L = 120 + r() * 180; c.beginPath(); c.moveTo(x, 100 + r() * 20); c.quadraticCurveTo(x + (r() - 0.5) * 24, 100 + L * 0.5, x + (r() - 0.5) * 16, 100 + L); c.stroke(); } },
    details(c, w, h, rr) { const g = c.createLinearGradient(0, 40, 0, 320); g.addColorStop(0, 'rgba(120,200,90,.22)'); g.addColorStop(1, 'rgba(30,70,50,.18)'); c.fillStyle = g; c.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { c.fillStyle = i % 3 ? 'rgba(10,36,18,.35)' : 'rgba(170,230,110,.3)'; c.beginPath(); c.ellipse(60 + rr() * 260, 60 + rr() * 80, 10 + rr() * 22, 5 + rr() * 9, rr() * 3, 0, TAU); c.fill(); } c.strokeStyle = 'rgba(160,230,110,.35)'; c.lineWidth = 2; for (let i = 0; i < 40; i++) { const x = 60 + rr() * 260, y = 120 + rr() * 80; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rr() - 0.5) * 6, y + 40 + rr() * 90); c.stroke(); } foot(c, w, h, 0.5); },
    flow: () => Math.PI / 2, texture: () => 0 });
}
export function paintDock(seed = 1) {
  const r = mulberry32(seed * 49);
  return paintProp({ w: 420, h: 130, seed, palette: PLANK, strokes: 520, size: 10, rim: '#d8c08a', inkAmt: 0.8, ao: false,
    shape(c, w, h) { c.beginPath(); c.moveTo(10, 40); c.lineTo(400, 28); c.lineTo(414, 96); c.lineTo(24, 110); c.closePath(); c.fill(); for (const x of [40, 140, 240, 340]) c.fillRect(x, 96, 10, 24); },
    details(c, w, h, rr) { c.strokeStyle = 'rgba(10,8,6,.65)'; c.lineWidth = 3; for (let x = 24; x < 410; x += 26) { c.beginPath(); c.moveTo(x, 36); c.lineTo(x + 8, 108); c.stroke(); } c.fillStyle = 'rgba(60,120,70,.3)'; for (let i = 0; i < 12; i++) c.fillRect(rr() * w, 40 + rr() * 60, 24, 10); },
    flow: () => 0, texture: (x, y, rr) => (rr() < 0.08 ? -0.15 : 0) });
}
export function paintObelisk(seed = 1) {
  return paintProp({ w: 160, h: 400, seed, palette: SAND, strokes: 560, size: 9, rim: '#ffe49a', inkAmt: 0.9,
    shape(c, w, h) { c.beginPath(); c.moveTo(36, h - 14); c.lineTo(52, 90); c.lineTo(80, 20); c.lineTo(108, 90); c.lineTo(124, h - 14); c.closePath(); c.fill(); c.fillRect(24, h - 44, 112, 30); },
    details(c, w, h, rr) { c.strokeStyle = 'rgba(255,170,60,.85)'; c.lineWidth = 3; for (let i = 0; i < 7; i++) { const y = 110 + i * 34, x = 64 + (rr() - 0.5) * 8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 24, y); c.moveTo(x + 12, y); c.lineTo(x + 12, y + 18); c.moveTo(x, y + 18); c.lineTo(x + 24, y + 12); c.stroke(); } foot(c, w, h, 0.5); },
    flow: () => -Math.PI / 2, texture: () => 0 });
}
export function paintPalm(seed = 1) {
  const r = mulberry32(seed * 50);
  return paintProp({ w: 320, h: 420, seed, palette: BARK, strokes: 760, size: 10, rim: '#ffd890', inkAmt: 0.85,
    shape(c, w, h) { c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 22; c.beginPath(); c.moveTo(150, h - 12); c.quadraticCurveTo(190, 240, 168, 120); c.stroke(); c.lineWidth = 9; for (let i = 0; i < 9; i++) { const a = -Math.PI + (i / 8) * Math.PI + (r() - 0.5) * 0.2, L = 100 + r() * 60; c.beginPath(); c.moveTo(168, 116); c.quadraticCurveTo(168 + Math.cos(a) * L * 0.6, 116 + Math.sin(a) * L * 0.4 - 30, 168 + Math.cos(a) * L, 116 + Math.sin(a) * L * 0.5 + 40 + r() * 30); c.stroke(); } },
    details(c, w, h, rr) { c.strokeStyle = 'rgba(14,10,6,.55)'; c.lineWidth = 2; for (let y = 140; y < h - 30; y += 18) { c.beginPath(); c.moveTo(150 + (h - y) * 0.05, y); c.lineTo(176 + (h - y) * 0.02, y - 4); c.stroke(); } c.fillStyle = 'rgba(120,130,50,.35)'; c.fillRect(0, 60, w, 130); foot(c, w, h, 0.45); },
    flow: () => -Math.PI / 2, texture: () => 0 });
}
export function paintIronCross(seed = 1) {
  const r = mulberry32(seed * 51);
  return paintProp({ w: 260, h: 220, seed, palette: IRON, strokes: 520, size: 8, rim: '#ffb060', inkAmt: 0.9,
    shape(c, w, h) { for (const [x, top, s] of [[70, 60, 1], [150, 30, 1.2], [210, 92, 0.9]]) { const tilt = (r() - 0.5) * 8; c.save(); c.translate(x, h - 16); c.rotate(tilt * Math.PI / 180); c.fillRect(-6 * s, -(h - 16 - top), 12 * s, h - 16 - top); c.fillRect(-26 * s, -(h - 16 - top) + 24 * s, 52 * s, 11 * s); c.restore(); } c.beginPath(); c.ellipse(130, h - 16, 110, 14, 0, 0, TAU); c.fill(); },
    details(c, w, h, rr) { c.fillStyle = 'rgba(150,64,20,.4)'; for (let i = 0; i < 30; i++) c.fillRect(40 + rr() * 180, 40 + rr() * 150, 3, 8 + rr() * 14); foot(c, w, h, 0.4); },
    flow: () => -Math.PI / 2, texture: (x, y, rr) => (rr() < 0.06 ? 0.2 : 0) });
}
export function paintIgloo(seed = 1) {
  return paintProp({ w: 380, h: 250, seed, palette: ICE, strokes: 760, size: 11, rim: '#ffffff', inkAmt: 0.7,
    shape(c, w, h) { c.beginPath(); c.moveTo(24, h - 16); c.quadraticCurveTo(24, 40, 190, 34); c.quadraticCurveTo(356, 40, 356, h - 16); c.closePath(); c.fill(); c.fillRect(150, h - 70, 80, 56); c.beginPath(); c.arc(190, h - 70, 40, Math.PI, 0); c.fill(); cut(c, () => { c.beginPath(); c.arc(190, h - 60, 26, Math.PI, 0); c.fillRect(164, h - 60, 52, 46); c.fill(); }); },
    details(c, w, h, rr) { c.strokeStyle = 'rgba(40,80,130,.55)'; c.lineWidth = 2.4; for (let i = 1; i < 6; i++) { c.beginPath(); c.ellipse(190, h - 16, 166 * (1 - i * 0.04), 50 + i * 28, 0, Math.PI, 0); c.stroke(); } for (let x = 40; x < 340; x += 38) { c.beginPath(); c.moveTo(x, 60 + rr() * 80); c.lineTo(x + 4, h - 20); c.stroke(); } c.fillStyle = 'rgba(255,190,100,.5)'; c.beginPath(); c.arc(190, h - 38, 18, Math.PI, 0); c.fill(); foot(c, w, h, 0.3); },
    flow: () => 0, texture: () => 0.1 });
}
export function paintIceWall(seed = 1) {
  const r = mulberry32(seed * 52);
  return paintProp({ w: 430, h: 270, seed, palette: ICE, strokes: 700, size: 10, rim: '#eaf8ff', inkAmt: 0.7,
    shape(c, w, h) { c.beginPath(); c.moveTo(14, h - 16); c.lineTo(14, 120); for (let x = 14; x <= 416; x += 34) c.lineTo(x, 40 + r() * 80); c.lineTo(416, h - 16); c.closePath(); c.fill(); },
    details(c, w, h, rr) { const g = c.createLinearGradient(0, h, 0, 30); g.addColorStop(0, 'rgba(30,80,150,.55)'); g.addColorStop(1, 'rgba(235,250,255,.35)'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.6; for (let i = 0; i < 14; i++) { const x = 20 + rr() * 390; c.beginPath(); c.moveTo(x, 50 + rr() * 140); c.lineTo(x + (rr() - 0.5) * 30, h - 24); c.stroke(); } foot(c, w, h, 0.3); },
    flow: () => -Math.PI / 2, texture: () => 0.1 });
}
export function paintBonePile(seed = 1) {
  const r = mulberry32(seed * 53);
  return paintProp({ w: 300, h: 210, seed, palette: BONE, strokes: 640, size: 9, rim: '#ffe8b0', inkAmt: 0.85,
    shape(c, w, h) { c.beginPath(); c.ellipse(150, h - 56, 128, 56, 0, 0, TAU); c.fill(); c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 16; for (let i = 0; i < 16; i++) { const x = 50 + r() * 200, y = h - 100 - r() * 60, a = r() * TAU, L = 50 + r() * 40; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L * 0.7); c.stroke(); } for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(70 + i * 56 + r() * 10, h - 130 - r() * 30, 20, 0, TAU); c.fill(); } },
    details(c, w, h, rr) { c.fillStyle = 'rgba(10,8,6,.85)'; for (let i = 0; i < 4; i++) { const x = 70 + i * 56; c.beginPath(); c.arc(x - 6, h - 134, 5, 0, TAU); c.arc(x + 8, h - 134, 5, 0, TAU); c.fill(); } foot(c, w, h, 0.45); },
    flow: () => 0.3, texture: () => 0 });
}
export function paintMesa(seed = 1) {
  const r = mulberry32(seed * 54);
  return paintProp({ w: 470, h: 400, seed, palette: SAND, strokes: 1200, size: 13, rim: '#ffd890', inkAmt: 0.9,
    shape(c, w, h) { c.beginPath(); c.moveTo(20, h - 16); c.lineTo(46, 200); c.lineTo(70, 190 + r() * 20); c.lineTo(100, 90); c.lineTo(200, 70 + r() * 16); c.lineTo(290, 80); c.lineTo(330, 150); c.lineTo(380, 170); c.lineTo(430, h - 16); c.closePath(); c.fill(); cut(c, () => { c.beginPath(); c.moveTo(170, h - 16); c.lineTo(178, 250); c.quadraticCurveTo(220, 190, 262, 250); c.lineTo(270, h - 16); c.closePath(); c.fill(); }); },
    details(c, w, h, rr) { c.strokeStyle = 'rgba(100,60,26,.55)'; c.lineWidth = 3; for (let y = 130; y < h - 30; y += 36) { c.beginPath(); c.moveTo(40, y + rr() * 10); c.quadraticCurveTo(200, y - 14 + rr() * 20, 420, y + rr() * 14); c.stroke(); } foot(c, w, h, 0.5); },
    flow: () => 0.04, texture: (x, y, rr) => (y > 240 ? -0.1 : 0.08) });
}
export function paintRitual(seed = 1) {
  const r = mulberry32(seed * 55);
  return paintProp({ w: 360, h: 190, seed, palette: STONE, strokes: 360, size: 10, rim: '#ffb070', inkAmt: 0.3, ao: false,
    shape(c, w, h) { c.beginPath(); c.ellipse(180, 96, 160, 74, 0, 0, TAU); c.fill(); },
    details(c, w, h, rr) { c.strokeStyle = 'rgba(255,170,70,.85)'; c.lineWidth = 3; for (const k of [1, 0.72, 0.44]) { c.beginPath(); c.ellipse(180, 96, 150 * k, 68 * k, 0, 0, TAU); c.stroke(); } for (let i = 0; i < 9; i++) { const a = i * TAU / 9, x = 180 + Math.cos(a) * 110, y = 96 + Math.sin(a) * 50; c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x + 8, y); c.moveTo(x, y - 8); c.lineTo(x + (rr() - 0.5) * 12, y + 8); c.stroke(); } c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(180, 96, 6, 180, 96, 120); g.addColorStop(0, 'rgba(255,150,50,.4)'); g.addColorStop(1, 'rgba(255,100,20,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over'; },
    flow: () => 0, texture: () => 0 });
}

export const CATALOG3 = [
  { id: 'wall', name: 'Muro em ruína', paint: paintWall, n: 5, h: 2.6, thick: [0.6, 5], tags: ['ruinas', 'cidade'] },
  { id: 'container', name: 'Contêiner enferrujado', paint: paintContainer, n: 5, h: 2.8, thick: [1.0, 7], tags: ['ruinas', 'cidade', 'tundra', 'deserto'] },
  { id: 'wreck', name: 'Carro destruído', paint: paintWreck, n: 5, h: 1.9, thick: [0.8, 6], tags: ['ruinas', 'tundra', 'deserto'] },
  { id: 'tank', name: 'Tanque de combustível', paint: paintTank, n: 3, h: 4.2, thick: [1.0, 7], tags: ['ruinas', 'deserto'] },
  { id: 'pillar', name: 'Coluna quebrada', paint: paintPillar, n: 4, h: 4.0, thick: [0.4, 4], tags: ['ruinas', 'deserto'] },
  { id: 'watchtower', name: 'Torre de vigia', paint: paintWatchtower, n: 2, h: 8.0, thick: [0.6, 5], tags: ['acampamento', 'pantano', 'tundra'] },
  { id: 'brazier', name: 'Braseiro', paint: paintBrazier, n: 2, h: 2.2, thick: [0.3, 3], tags: ['acampamento', 'ruinas'], light: '#ff9a40', lightI: 0.9, lightR: 6 },
  { id: 'banner', name: 'Estandarte rasgado', paint: paintBanner, n: 4, h: 4.0, thick: [0.2, 2], tags: ['acampamento', 'ruinas'] },
  { id: 'willow', name: 'Salgueiro de musgo', paint: paintWillow, n: 5, h: 6.6, thick: [0.5, 4], tags: ['pantano'] },
  { id: 'dock', name: 'Passarela de tábuas', paint: paintDock, n: 2, h: 1.4, kind: 'decal', tags: ['pantano'] },
  { id: 'obelisk', name: 'Obelisco de runas', paint: paintObelisk, n: 2, h: 5.4, thick: [0.5, 4], tags: ['deserto'], light: '#ffa840', lightI: 0.5, lightR: 5 },
  { id: 'palm', name: 'Palmeira seca', paint: paintPalm, n: 5, h: 6.4, thick: [0.3, 3], tags: ['deserto'] },
  { id: 'ironcross', name: 'Cruzes de ferro', paint: paintIronCross, n: 5, h: 2.4, thick: [0.5, 4], tags: ['deserto', 'ermo'] },
  { id: 'igloo', name: 'Iglu', paint: paintIgloo, n: 3, h: 2.8, thick: [1.0, 7], tags: ['tundra'], light: '#ffb070', lightI: 0.4, lightR: 4 },
  { id: 'icewall', name: 'Paredão de gelo', paint: paintIceWall, n: 5, h: 3.0, thick: [0.6, 5], tags: ['tundra'] },
  { id: 'bonepile', name: 'Pilha de ossos', paint: paintBonePile, n: 4, h: 1.8, thick: [0.6, 5], tags: ['ermo', 'pantano', 'deserto', 'tundra'] },
  { id: 'mesa', name: 'Formação rochosa', paint: paintMesa, n: 5, h: 6.0, thick: [1.4, 9], tags: ['deserto', 'ermo'] },
  { id: 'ritual', name: 'Círculo de runas', paint: paintRitual, n: 1, h: 2.6, kind: 'decal', tags: ['ermo', 'brasa'], light: '#ff9a40', lightI: 0.35, lightR: 4 },
];
export const FOOT3 = {
  wall: { r: 1.9, block: true }, container: { r: 2.0, block: true }, wreck: { r: 1.5, block: true }, tank: { r: 1.5, block: true }, pillar: { r: 0.6, block: true }, watchtower: { r: 1.1, block: true },
  brazier: { r: 0.5, block: true }, banner: { r: 0.3, block: false }, willow: { r: 0.9, block: true }, dock: { r: 1.8, block: false, decal: true }, obelisk: { r: 0.6, block: true }, palm: { r: 0.5, block: true },
  ironcross: { r: 1.1, block: true }, igloo: { r: 1.7, block: true }, icewall: { r: 1.9, block: true }, bonepile: { r: 1.0, block: true }, mesa: { r: 2.4, block: true }, ritual: { r: 1.7, block: false, decal: true },
};
