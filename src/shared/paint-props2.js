// Props temáticos por bioma (pântano, deserto, tundra) + peças genéricas. Mesmo método do paint-props.js.
import { TAU, mulberry32 } from './util.js';
import { paintProp } from './paint.js';

const MOSS = ['#08120a', '#1f4228', '#4a8a48', '#b4e08c'], BARK = ['#100c08', '#3a2a1c', '#6a5030', '#b09468'], FUNG = ['#0a1816', '#1c5a50', '#3cc0a0', '#d8fff0'];
const PLANK = ['#120e0a', '#4a3a28', '#8a7248', '#cdb88a'], BONE = ['#1a1612', '#6a5e50', '#b8a88c', '#f0e4c8'], CACT = ['#0c1608', '#2a4a22', '#5a8a3a', '#b8d878'];
const IRON = ['#0e0e12', '#34363e', '#6c727c', '#b8c0c8'], ICE = ['#0a1220', '#2c4a74', '#6aa6d8', '#eaf8ff'], SNOW = ['#1a2230', '#6a7e98', '#bccce0', '#ffffff'];
const ROCK = ['#100c0c', '#403632', '#7a6c62', '#c0b0a0'], SANDC = ['#18120a', '#6a5430', '#b09458', '#f0dca8'], RUBR = ['#0c0a0a', '#2a2422', '#4a423e', '#8a7e76'];
const foot = (c, w, h, a = 0.5) => { const g = c.createLinearGradient(0, h - 60, 0, h); g.addColorStop(0, 'rgba(8,6,6,0)'); g.addColorStop(1, `rgba(8,6,6,${a})`); c.fillStyle = g; c.fillRect(0, h - 60, w, 60); };
const strokeLn = (c, pts, wd, col = '#000') => { c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col; c.lineWidth = wd; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };

export function paintMangrove(seed = 1) {
  const r = mulberry32(seed * 21);
  return paintProp({ w: 320, h: 340, seed, palette: BARK, strokes: 900, size: 11, rim: '#8affc0', inkAmt: 0.9,
    shape(c, w, h) { c.lineCap = 'round'; c.strokeStyle = '#000'; c.fillStyle = '#000';
      for (let i = 0; i < 6; i++) { const x0 = 70 + i * 36 + (r() - 0.5) * 10, x1 = 150 + (i - 2.5) * 12; c.lineWidth = 12 - Math.abs(i - 2.5) * 1.6; c.beginPath(); c.moveTo(x0, h - 10); c.quadraticCurveTo(x0 + (x1 - x0) * 0.3, h - 120, x1, 150); c.stroke(); }
      c.lineWidth = 34; c.beginPath(); c.moveTo(150, 170); c.lineTo(156, 90); c.stroke();
      for (let k = 0; k < 9; k++) { const a = r() * TAU, d = 20 + r() * 62; c.beginPath(); c.ellipse(158 + Math.cos(a) * d, 70 + Math.sin(a) * d * 0.5, 38 + r() * 20, 26 + r() * 12, 0, 0, TAU); c.fill(); }
      c.lineWidth = 4; for (let k = 0; k < 16; k++) { const x = 70 + r() * 180, y = 90 + r() * 30, L = 40 + r() * 100; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (r() - 0.5) * 14, y + L * 0.5, x + (r() - 0.5) * 8, y + L); c.stroke(); } },
    details(c, w, h) { const g = c.createLinearGradient(0, 0, 0, 130); g.addColorStop(0, 'rgba(70,150,70,.75)'); g.addColorStop(1, 'rgba(40,100,60,0)'); c.fillStyle = g; c.fillRect(0, 0, w, 140); c.fillStyle = 'rgba(30,60,40,.35)'; c.fillRect(0, h - 120, w, 120); foot(c, w, h, 0.5); },
    flow: () => -Math.PI / 2, texture: () => 0 });
}
export function paintReeds(seed = 1) {
  const r = mulberry32(seed * 22);
  return paintProp({ w: 250, h: 270, seed, palette: MOSS, strokes: 380, size: 8, rim: '#d8ff9a', inkAmt: 0.8, ao: false,
    shape(c, w, h) { c.lineCap = 'round'; c.strokeStyle = '#000'; c.fillStyle = '#000'; for (let i = 0; i < 16; i++) { const x = 60 + r() * 130, top = 40 + r() * 120, bend = (r() - 0.5) * 60; c.lineWidth = 4 + r() * 3; c.beginPath(); c.moveTo(x, h - 10); c.quadraticCurveTo(x + bend * 0.2, h * 0.55, x + bend, top); c.stroke(); if (r() < 0.4) { c.beginPath(); c.ellipse(x + bend, top - 8, 6, 17, bend * 0.01, 0, TAU); c.fill(); } } },
    details(c, w, h) { foot(c, w, h, 0.5); }, flow: () => -Math.PI / 2, texture: () => 0 });
}
export function paintShroom(seed = 1) {
  const r = mulberry32(seed * 23);
  return paintProp({ w: 280, h: 260, seed, palette: FUNG, strokes: 700, size: 10, rim: '#aaffe0', inkAmt: 0.85,
    shape(c, w, h) { const caps = [[140, 120, 74, 36, 120], [70, 168, 44, 22, 170], [214, 176, 46, 24, 176]]; for (const [x, y, rx, ry, base] of caps) { c.fillRect(x - rx * 0.16, y, rx * 0.32, h - 18 - y); c.beginPath(); c.ellipse(x, y, rx, ry, 0, Math.PI, 0); c.lineTo(x + rx * 0.9, y + 6); c.quadraticCurveTo(x, y + 20, x - rx * 0.9, y + 6); c.closePath(); c.fill(); } },
    details(c, w, h) { c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(140, 120, 6, 140, 120, 120); g.addColorStop(0, 'rgba(80,255,200,.5)'); g.addColorStop(1, 'rgba(20,120,100,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(220,255,240,.7)'; for (let i = 0; i < 22; i++) { c.beginPath(); c.arc(80 + r() * 130, 100 + r() * 40, 2 + r() * 3, 0, TAU); c.fill(); } foot(c, w, h, 0.4); },
    flow: () => -Math.PI / 2, texture: () => 0.08 });
}
export function paintStiltHut(seed = 1) {
  const r = mulberry32(seed * 24);
  return paintProp({ w: 380, h: 360, seed, palette: PLANK, strokes: 1300, size: 12, rim: '#8affc0', inkAmt: 0.9,
    shape(c, w, h) { for (const x of [70, 130, 250, 310]) c.fillRect(x - 6, 190, 12, h - 200); c.fillRect(54, 176, 272, 22);
      c.fillRect(70, 84, 240, 96); c.beginPath(); c.moveTo(50, 90); c.lineTo(190, 14); c.lineTo(330, 90); c.lineTo(310, 100); c.lineTo(190, 38); c.lineTo(70, 100); c.closePath(); c.fill(); c.fillRect(70, 70, 240, 22);
      c.globalCompositeOperation = 'destination-out'; c.fillRect(94, 110, 44, 40); c.fillRect(236, 110, 44, 40); c.fillRect(168, 118, 40, 62); c.globalCompositeOperation = 'source-over'; c.fillRect(326, 186, 10, 150); c.save(); c.translate(340, 190); c.rotate(0.35); c.fillRect(0, 0, 10, 150); c.restore(); },
    details(c, w, h) { c.strokeStyle = 'rgba(10,8,6,.55)'; c.lineWidth = 2.5; for (let x = 80; x < 310; x += 20) { c.beginPath(); c.moveTo(x, 90); c.lineTo(x, 180); c.stroke(); } c.fillStyle = 'rgba(70,150,80,.4)'; c.fillRect(54, 70, 280, 30); c.fillRect(0, h - 90, w, 90); foot(c, w, h, 0.55); },
    flow: () => 0.1, texture: (x, y, rr) => (rr() < 0.06 ? 0.2 : 0) });
}
export function paintBoat(seed = 1) {
  return paintProp({ w: 380, h: 190, seed, palette: PLANK, strokes: 760, size: 11, rim: '#8affc0', inkAmt: 0.9,
    shape(c, w, h) { c.beginPath(); c.moveTo(20, 70); c.quadraticCurveTo(190, 150, 360, 56); c.lineTo(340, 120); c.quadraticCurveTo(190, 176, 50, 126); c.closePath(); c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.moveTo(60, 78); c.quadraticCurveTo(190, 130, 330, 70); c.lineTo(324, 84); c.quadraticCurveTo(190, 146, 66, 92); c.closePath(); c.fill(); c.globalCompositeOperation = 'source-over'; c.fillRect(160, 20, 8, 80); },
    details(c, w, h) { c.strokeStyle = 'rgba(10,8,6,.6)'; c.lineWidth = 3; for (let x = 70; x < 330; x += 38) { c.beginPath(); c.moveTo(x, 80); c.lineTo(x + 6, 140); c.stroke(); } c.fillStyle = 'rgba(60,130,70,.35)'; c.fillRect(0, 100, w, 80); foot(c, w, h, 0.5); },
    flow: () => 0.15, texture: () => 0 });
}
export function paintRibs(seed = 1) {
  const r = mulberry32(seed * 25);
  return paintProp({ w: 400, h: 280, seed, palette: BONE, strokes: 800, size: 11, rim: '#ffd890', inkAmt: 0.85,
    shape(c, w, h) { c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 24; c.beginPath(); c.moveTo(24, h - 40); c.quadraticCurveTo(200, h - 20, 380, h - 44); c.stroke();
      for (let i = 0; i < 6; i++) { const x = 70 + i * 52, top = 50 + Math.abs(i - 2.5) * 22 + r() * 14; c.lineWidth = 24 - Math.abs(i - 2.5) * 2; c.beginPath(); c.moveTo(x, h - 36); c.quadraticCurveTo(x + 22, top - 10, x + 6, top + 40); c.quadraticCurveTo(x - 6, top + 80, x - 26, h - 70); c.stroke(); }
      c.beginPath(); c.ellipse(380, h - 52, 30, 20, 0, 0, TAU); c.fill(); },
    details(c, w, h) { foot(c, w, h, 0.4); }, flow: () => -Math.PI / 2, texture: (x, y, rr) => (rr() < 0.05 ? 0.2 : 0) });
}
export function paintCactus(seed = 1) {
  const r = mulberry32(seed * 26);
  return paintProp({ w: 190, h: 320, seed, palette: CACT, strokes: 520, size: 9, rim: '#ffe49a', inkAmt: 0.85,
    shape(c, w, h) { c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 40; c.beginPath(); c.moveTo(95, h - 14); c.lineTo(95, 50); c.stroke(); c.lineWidth = 24; c.beginPath(); c.moveTo(95, 200 + r() * 20); c.lineTo(42, 190); c.lineTo(38, 120 + r() * 20); c.stroke(); c.beginPath(); c.moveTo(95, 150 + r() * 20); c.lineTo(148, 142); c.lineTo(152, 84 + r() * 20); c.stroke(); },
    details(c, w, h) { c.strokeStyle = 'rgba(8,16,6,.5)'; c.lineWidth = 2; for (const x of [80, 95, 110]) { c.beginPath(); c.moveTo(x, h - 14); c.lineTo(x, 50); c.stroke(); } c.fillStyle = 'rgba(240,230,170,.7)'; for (let i = 0; i < 30; i++) c.fillRect(60 + r() * 70, 60 + r() * 230, 2, 3); foot(c, w, h, 0.45); },
    flow: () => -Math.PI / 2, texture: () => 0 });
}
export function paintWindPump(seed = 1) {
  const r = mulberry32(seed * 27);
  return paintProp({ w: 230, h: 440, seed, palette: IRON, strokes: 700, size: 9, rim: '#ffb060', inkAmt: 0.9,
    shape(c, w, h) { c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 9; c.beginPath(); c.moveTo(70, h - 10); c.lineTo(104, 130); c.moveTo(150, h - 10); c.lineTo(116, 130); c.stroke(); c.lineWidth = 5; for (let y = h - 40; y > 150; y -= 52) { const t = (h - y) / (h - 130), xl = 70 + 34 * t, xr = 150 - 34 * t; c.beginPath(); c.moveTo(xl, y); c.lineTo(xr, y - 30); c.moveTo(xr, y); c.lineTo(xl, y - 30); c.stroke(); }
      c.lineWidth = 8; c.beginPath(); c.moveTo(110, 130); c.lineTo(110, 90); c.stroke(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + (r() - 0.5) * 0.08, L = 62 - (i % 2) * 6; c.lineWidth = 12; c.beginPath(); c.moveTo(110, 90); c.lineTo(110 + Math.cos(a) * L, 90 + Math.sin(a) * L); c.stroke(); }
      c.lineWidth = 6; c.beginPath(); c.arc(110, 90, 66, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(114, 90); c.lineTo(190, 100); c.stroke(); c.fillRect(186, 86, 22, 36); },
    details(c, w, h) { c.fillStyle = 'rgba(130,60,24,.4)'; for (let i = 0; i < 40; i++) c.fillRect(60 + r() * 100, 80 + r() * 350, 3, 6 + r() * 10); foot(c, w, h, 0.45); },
    flow: () => -Math.PI / 2, texture: (x, y, rr) => (rr() < 0.05 ? 0.2 : 0) });
}
export function paintIceShard(seed = 1) {
  const r = mulberry32(seed * 28);
  return paintProp({ w: 230, h: 340, seed, palette: ICE, strokes: 560, size: 9, rim: '#eaf8ff', inkAmt: 0.75,
    shape(c, w, h) { for (let i = 0; i < 7; i++) { const x = 36 + i * 26 + (r() - 0.5) * 12, top = 30 + r() * 180, bw = 24 + r() * 22; c.beginPath(); c.moveTo(x - bw / 2, h - 18); c.lineTo(x - bw / 3, top + 28); c.lineTo(x + (r() - 0.5) * 10, top); c.lineTo(x + bw / 3, top + 30); c.lineTo(x + bw / 2, h - 18); c.closePath(); c.fill(); } },
    details(c, w, h, rr) { const g = c.createLinearGradient(0, h, 0, 30); g.addColorStop(0, 'rgba(40,90,150,.5)'); g.addColorStop(1, 'rgba(230,248,255,.35)'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.4; for (let i = 0; i < 12; i++) { const x = 30 + rr() * 170; c.beginPath(); c.moveTo(x, 60 + rr() * 200); c.lineTo(x + (rr() - 0.5) * 20, h - 24); c.stroke(); } foot(c, w, h, 0.35); },
    flow: () => -Math.PI / 2, texture: () => 0.1 });
}
export function paintSnowPine(seed = 1) {
  const r = mulberry32(seed * 29);
  return paintProp({ w: 290, h: 420, seed, palette: BARK, strokes: 800, size: 10, rim: '#dff0ff', inkAmt: 0.85,
    shape(c, w, h) { c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 16; c.beginPath(); c.moveTo(146, h - 12); c.lineTo(144, 40); c.stroke(); for (let y = 100; y < h - 60; y += 36 + r() * 12) { const L = 20 + (y / h) * 90, side = r() < 0.5 ? -1 : 1; c.lineWidth = 8; c.beginPath(); c.moveTo(144, y); c.lineTo(144 + side * L, y + 22 + r() * 8); c.stroke(); c.beginPath(); c.moveTo(144, y + 14); c.lineTo(144 - side * L * 0.7, y + 30); c.stroke(); } },
    details(c, w, h, rr) { c.fillStyle = 'rgba(240,248,255,.78)'; for (let i = 0; i < 26; i++) { c.beginPath(); c.ellipse(60 + rr() * 170, 90 + rr() * 300, 7 + rr() * 10, 3 + rr() * 3, 0, 0, TAU); c.fill(); } c.fillStyle = 'rgba(230,240,252,.7)'; c.fillRect(0, h - 40, w, 40); foot(c, w, h, 0.35); },
    flow: () => -Math.PI / 2, texture: () => 0 });
}
export function paintBoulder(seed = 1) {
  const r = mulberry32(seed * 30);
  return paintProp({ w: 260, h: 200, seed, palette: ROCK, strokes: 520, size: 12, rim: '#ffb070', inkAmt: 0.9,
    shape(c, w, h) { c.beginPath(); c.moveTo(20, h - 14); c.lineTo(34, 100); c.lineTo(80, 50 + r() * 14); c.lineTo(150, 30 + r() * 16); c.lineTo(214, 76); c.lineTo(240, h - 14); c.closePath(); c.fill(); c.beginPath(); c.moveTo(150, h - 14); c.lineTo(180, 90); c.lineTo(250, 120); c.lineTo(252, h - 14); c.closePath(); c.fill(); },
    details(c, w, h, rr) { c.strokeStyle = 'rgba(10,8,8,.65)'; c.lineWidth = 2.4; for (let i = 0; i < 6; i++) { c.beginPath(); let x = 40 + rr() * 180, y = 50 + rr() * 60; c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rr() - 0.5) * 26; y += 16 + rr() * 16; c.lineTo(x, y); } c.stroke(); } foot(c, w, h, 0.45); },
    flow: () => 0.5, texture: () => 0 });
}
export function paintTires(seed = 1) {
  return paintProp({ w: 230, h: 190, seed, palette: RUBR, strokes: 520, size: 9, rim: '#ff9a40', inkAmt: 0.9,
    shape(c, w, h) { const T = [[70, h - 40], [150, h - 40], [110, h - 86], [40, h - 90], [180, h - 88], [110, h - 130]]; for (const [x, y] of T) { c.beginPath(); c.ellipse(x, y, 40, 30, 0, 0, TAU); c.fill(); } },
    details(c, w, h) { c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = 3; const T = [[70, h - 40], [150, h - 40], [110, h - 86], [40, h - 90], [180, h - 88], [110, h - 130]]; for (const [x, y] of T) { c.beginPath(); c.ellipse(x, y, 18, 12, 0, 0, TAU); c.stroke(); } foot(c, w, h, 0.5); },
    flow: () => 0, texture: () => 0 });
}
export function paintTotem(seed = 1) {
  const r = mulberry32(seed * 31);
  return paintProp({ w: 170, h: 340, seed, palette: BONE, strokes: 520, size: 9, rim: '#8affc0', inkAmt: 0.9,
    shape(c, w, h) { c.fillRect(76, 60, 20, h - 70); for (let i = 0; i < 4; i++) { const y = 70 + i * 62; c.beginPath(); c.ellipse(86, y + 20, 34 - i * 2, 28, 0, 0, TAU); c.fill(); } c.fillRect(30, 130, 110, 10); c.beginPath(); c.moveTo(50, 60); c.lineTo(70, 20); c.lineTo(86, 44); c.lineTo(102, 18); c.lineTo(122, 60); c.closePath(); c.fill(); },
    details(c, w, h) { c.fillStyle = 'rgba(8,8,6,.85)'; for (let i = 0; i < 4; i++) { const y = 70 + i * 62; c.beginPath(); c.arc(74, y + 16, 6, 0, TAU); c.arc(98, y + 16, 6, 0, TAU); c.fill(); c.fillRect(80, y + 28, 12, 8); } c.fillStyle = 'rgba(70,230,170,.22)'; c.fillRect(0, 0, w, h); foot(c, w, h, 0.4); },
    flow: () => -Math.PI / 2, texture: () => 0 });
}
/** Decalques: montes de neve e de areia. */
export function paintSnowDrift(seed = 1) {
  return paintProp({ w: 340, h: 170, seed, palette: SNOW, strokes: 420, size: 12, rim: '#ffffff', inkAmt: 0.3, ao: false,
    shape(c, w, h) { c.beginPath(); c.ellipse(170, 90, 150, 56, 0, 0, TAU); c.fill(); },
    details(c, w, h, r) { c.strokeStyle = 'rgba(120,150,190,.35)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(170, 96, 40 + i * 24, 12 + i * 8, 0, 0.1, Math.PI - 0.1); c.stroke(); } },
    flow: () => 0.05, texture: () => 0.1 });
}
export function paintSandMound(seed = 1) {
  return paintProp({ w: 340, h: 160, seed, palette: SANDC, strokes: 420, size: 12, rim: '#ffe49a', inkAmt: 0.3, ao: false,
    shape(c, w, h) { c.beginPath(); c.ellipse(170, 86, 150, 50, 0, 0, TAU); c.fill(); },
    details(c, w, h) { c.strokeStyle = 'rgba(110,80,40,.35)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(40, 60 + i * 12); c.quadraticCurveTo(170, 40 + i * 12 + (i % 2) * 8, 300, 62 + i * 12); c.stroke(); } },
    flow: () => 0.02, texture: () => 0.06 });
}

export const CATALOG2 = [
  { id: 'mangrove', name: 'Mangue retorcido', paint: paintMangrove, n: 5, h: 6.2, thick: [0.3, 3], tags: ['pantano'] },
  { id: 'reeds', name: 'Juncos', paint: paintReeds, n: 5, h: 2.0, thick: [0.2, 2], tags: ['pantano'] },
  { id: 'shroom', name: 'Cogumelo luminoso', paint: paintShroom, n: 4, h: 2.4, thick: [0.4, 4], tags: ['pantano'], light: '#4af0c0', lightI: 0.5, lightR: 4 },
  { id: 'stilthut', name: 'Palafita', paint: paintStiltHut, n: 4, h: 5.0, thick: [1.2, 8], tags: ['pantano'] },
  { id: 'boat', name: 'Barco encalhado', paint: paintBoat, n: 2, h: 1.7, thick: [0.8, 5], tags: ['pantano'] },
  { id: 'totem', name: 'Totem de ossos', paint: paintTotem, n: 4, h: 3.4, thick: [0.3, 3], tags: ['pantano', 'ermo'], light: '#4af0c0', lightI: 0.4, lightR: 3.5 },
  { id: 'ribs', name: 'Costelas gigantes', paint: paintRibs, n: 2, h: 3.4, thick: [0.5, 5], tags: ['deserto'] },
  { id: 'cactus', name: 'Cacto', paint: paintCactus, n: 5, h: 3.2, thick: [0.3, 3], tags: ['deserto'] },
  { id: 'windpump', name: 'Cata-vento enferrujado', paint: paintWindPump, n: 2, h: 9, thick: [0.5, 5], tags: ['deserto', 'ermo'] },
  { id: 'tires', name: 'Pilha de pneus', paint: paintTires, n: 3, h: 1.6, thick: [0.7, 5], tags: ['deserto', 'ruinas', 'acampamento'] },
  { id: 'boulder', name: 'Pedregulho', paint: paintBoulder, n: 6, h: 2.2, thick: [0.8, 6], tags: ['ermo', 'deserto', 'tundra', 'pantano'] },
  { id: 'iceshard', name: 'Cristal de gelo', paint: paintIceShard, n: 6, h: 3.6, thick: [0.5, 5], tags: ['tundra'], light: '#9ad0ff', lightI: 0.3, lightR: 3.5 },
  { id: 'snowpine', name: 'Pinheiro morto', paint: paintSnowPine, n: 6, h: 7.4, thick: [0.3, 3], tags: ['tundra'] },
  { id: 'snowdrift', name: 'Monte de neve', paint: paintSnowDrift, n: 5, h: 2.0, kind: 'decal', tags: ['tundra'] },
  { id: 'sandmound', name: 'Duna baixa', paint: paintSandMound, n: 4, h: 2.0, kind: 'decal', tags: ['deserto'] },
];
export const FOOT2 = {
  mangrove: { r: 0.9, block: true }, reeds: { r: 0.6, block: false }, shroom: { r: 0.7, block: true }, stilthut: { r: 2.0, block: true }, boat: { r: 1.5, block: true }, totem: { r: 0.5, block: true },
  ribs: { r: 1.5, block: true }, cactus: { r: 0.5, block: true }, windpump: { r: 0.8, block: true }, tires: { r: 0.9, block: true }, boulder: { r: 1.1, block: true },
  iceshard: { r: 0.9, block: true }, snowpine: { r: 0.6, block: true }, snowdrift: { r: 1.5, block: false, decal: true }, sandmound: { r: 1.6, block: false, decal: true },
};
