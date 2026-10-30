// Catálogo de props pintados do mundo pós-apocalíptico. Cada entrada: pintor determinístico por seed + metadados
// (altura no mundo, espessura em fatias, biomas onde aparece). A Forja de Mapas lê este catálogo para a paleta de props.
import { TAU, mulberry32 } from './util.js';
import { paintProp, paintRuinWall, paintDeadTree, paintBarrel, paintSpire, paintSign, paintHouse, paintTower } from './paint.js';

const RUST = ['#1c1210', '#6a3a28', '#b0683a', '#f0b27a'], IRON = ['#0e0e12', '#34363e', '#6c727c', '#b8c0c8'], WOOD = ['#140e0c', '#4a3022', '#8a5a38', '#d9a066'];
const CLOTH = ['#14110c', '#4a4634', '#8a8660', '#c8c098'], BONE = ['#1a1612', '#6a5e50', '#b8a88c', '#f0e4c8'], BUS = ['#1c1408', '#6a5018', '#b08a30', '#f0d070'];
const GLOW = ['#2a0a06', '#a02a10', '#ff7a20', '#ffe0a0'], TOX = ['#08140c', '#1c4a2a', '#4aa860', '#c8f8b0'], SAND = ['#16120c', '#5a4a30', '#9a8658', '#d8c898'];
const lit = (c, f) => { c.globalCompositeOperation = 'lighter'; f(); c.globalCompositeOperation = 'source-atop'; };
const streaks = (c, r, n, x0, x1, y0, y1, rgb = '130,50,20') => { for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), L = 20 + r() * 80, g = c.createLinearGradient(0, y, 0, y + L); g.addColorStop(0, `rgba(${rgb},.5)`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(x, y, 2 + r() * 5, L); } };
const foot = (c, w, h, a = 0.55) => { const g = c.createLinearGradient(0, h - 70, 0, h); g.addColorStop(0, 'rgba(8,5,5,0)'); g.addColorStop(1, `rgba(8,5,5,${a})`); c.fillStyle = g; c.fillRect(0, h - 70, w, 70); };
const cracks = (c, r, n, x0, x1, y0, y1) => { c.strokeStyle = 'rgba(10,6,8,.85)'; c.lineWidth = 2; for (let i = 0; i < n; i++) { let x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0); c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 14; y += 7 + r() * 12; c.lineTo(x, y); } c.stroke(); } };

export function paintBus(seed = 1) {
  return paintProp({ w: 440, h: 240, seed, palette: BUS, strokes: 1100, size: 14, rim: '#ff7a2a', inkAmt: 0.9,
    shape(c, w, h) { c.beginPath(); c.moveTo(24, h - 54); c.lineTo(24, 70); c.quadraticCurveTo(26, 46, 56, 44); c.lineTo(372, 40); c.quadraticCurveTo(414, 44, 420, 84); c.lineTo(424, h - 54); c.closePath(); c.fill();
      for (const x of [96, 330]) { c.beginPath(); c.arc(x, h - 40, 36, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 6; i++) if (i !== 3) c.fillRect(46 + i * 58, 74, 42, 44); c.globalCompositeOperation = 'source-over'; },
    details(c, w, h, r) { c.fillStyle = 'rgba(14,10,8,.75)'; c.fillRect(24, 130, 400, 10); c.fillRect(24, 150, 400, 4);
      for (const x of [96, 330]) { c.fillStyle = 'rgba(8,6,6,.9)'; c.beginPath(); c.arc(x, h - 40, 34, 0, TAU); c.fill(); c.fillStyle = 'rgba(70,64,60,.9)'; c.beginPath(); c.arc(x, h - 40, 14, 0, TAU); c.fill(); }
      streaks(c, r, 24, 30, 410, 50, 130); cracks(c, r, 4, 60, 380, 60, 120); foot(c, w, h, 0.35); lit(c, () => { c.fillStyle = 'rgba(255,110,36,.45)'; c.fillRect(300 + r() * 80, 90 + r() * 30, 14, 3); }); },
    flow: () => 0.02, texture: (x, y, r) => (r() < 0.05 ? 0.2 : 0) });
}

export function paintBarricade(seed = 1) {
  const rnd = mulberry32(seed * 5);
  return paintProp({ w: 420, h: 240, seed, palette: RUST, strokes: 1200, size: 13, rim: '#ff7a2a', inkAmt: 0.9,
    shape(c, w, h) { c.beginPath(); c.moveTo(20, h - 14); c.lineTo(30, 130); c.lineTo(80, 96); c.lineTo(140, 112); c.lineTo(200, 62); c.lineTo(270, 98); c.lineTo(330, 76); c.lineTo(392, 130); c.lineTo(404, h - 14); c.closePath(); c.fill();
      c.lineCap = 'round'; c.strokeStyle = '#000'; for (let i = 0; i < 7; i++) { c.lineWidth = 7; c.beginPath(); const x = 40 + rnd() * 340; c.moveTo(x, 90 + rnd() * 40); c.lineTo(x + (rnd() - 0.5) * 60, 36 + rnd() * 30); c.stroke(); } },
    details(c, w, h, r) { c.strokeStyle = 'rgba(12,8,8,.8)'; c.lineWidth = 3; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(20 + r() * 380, 90 + r() * 120); c.lineTo(20 + r() * 380, 90 + r() * 130); c.stroke(); }
      for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(10,8,8,.85)'; c.beginPath(); c.arc(70 + i * 90 + r() * 20, 170 + r() * 30, 26, 0, TAU); c.fill(); c.fillStyle = 'rgba(60,56,54,.8)'; c.beginPath(); c.arc(70 + i * 90, 170, 11, 0, TAU); c.fill(); }
      streaks(c, r, 22, 20, 400, 100, 200); foot(c, w, h, 0.5); lit(c, () => { c.fillStyle = 'rgba(255,110,36,.5)'; for (let i = 0; i < 5; i++) c.fillRect(40 + r() * 330, 120 + r() * 80, 3 + r() * 9, 2); }); },
    flow: () => 0.1, texture: (x, y, r) => (r() < 0.06 ? 0.22 : 0) });
}

export function paintLamp(seed = 1) {
  const rnd = mulberry32(seed * 9);
  return paintProp({ w: 170, h: 440, seed, palette: IRON, strokes: 320, size: 8, rim: '#ff9a40', inkAmt: 0.95, ao: false,
    shape(c, w, h) { c.fillRect(66, 80, 12, h - 86); c.fillRect(54, h - 26, 36, 20); c.save(); c.translate(72, 86); c.rotate(-0.9 + rnd() * 0.2); c.fillRect(0, -5, 92, 10); c.translate(92, 0); c.beginPath(); c.moveTo(-8, 4); c.lineTo(24, 8); c.lineTo(18, 24); c.lineTo(-10, 20); c.closePath(); c.fill(); c.restore(); },
    details(c, w, h, r) { streaks(c, r, 10, 60, 80, 90, 300, '120,48,20'); lit(c, () => { c.fillStyle = 'rgba(255,170,90,.35)'; c.beginPath(); c.arc(140, 146, 6, 0, TAU); c.fill(); }); c.strokeStyle = 'rgba(8,6,6,.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(72, 120); c.quadraticCurveTo(110, 220, 120, 330); c.stroke(); foot(c, w, h, 0.5); },
    flow: () => -Math.PI / 2, texture: (x, y, r) => (r() < 0.04 ? 0.2 : 0) });
}

export function paintBillboard(seed = 1) {
  const rnd = mulberry32(seed * 11);
  return paintProp({ w: 380, h: 440, seed, palette: WOOD, strokes: 1000, size: 12, rim: '#ff7a2a', inkAmt: 0.9,
    shape(c, w, h) { c.fillRect(82, 200, 14, h - 206); c.fillRect(284, 190, 14, h - 196); c.beginPath(); c.moveTo(30, 40); c.lineTo(350, 24); c.lineTo(352, 190); c.lineTo(30, 202); c.closePath(); c.fill();
      c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.moveTo(210, 24); c.lineTo(300, 40); c.lineTo(262, 96); c.lineTo(214, 70); c.closePath(); c.fill(); for (let i = 0; i < 4; i++) { c.fillRect(40 + rnd() * 280, 60 + rnd() * 120, 18 + rnd() * 30, 6 + rnd() * 16); } c.globalCompositeOperation = 'source-over'; },
    details(c, w, h, r) { const cols = ['rgba(150,40,24,.7)', 'rgba(200,170,110,.6)', 'rgba(40,60,80,.6)']; for (let i = 0; i < 9; i++) { c.fillStyle = cols[i % 3]; c.fillRect(44 + r() * 200, 52 + i * 15 + r() * 4, 40 + r() * 110, 8 + r() * 4); }
      c.strokeStyle = 'rgba(20,14,10,.85)'; c.lineWidth = 3; c.strokeRect(34, 46, 312, 146); streaks(c, r, 16, 40, 340, 50, 190); foot(c, w, h, 0.5); cracks(c, r, 3, 40, 340, 70, 150); },
    flow: () => 0.03, texture: (x, y, r) => (r() < 0.05 ? 0.2 : 0) });
}

export function paintTrafficLight(seed = 1) {
  return paintProp({ w: 130, h: 360, seed, palette: IRON, strokes: 300, size: 7, rim: '#ff9a40', inkAmt: 0.95, ao: false,
    shape(c, w, h) { c.fillRect(56, 100, 12, h - 106); c.fillRect(44, h - 22, 36, 16); c.save(); c.translate(62, 120); c.rotate(0.38); c.fillRect(-20, -10, 40, 100); c.restore(); c.fillRect(54, 90, 24, 20); },
    details(c, w, h, r) { c.save(); c.translate(62, 120); c.rotate(0.38); c.fillStyle = 'rgba(8,6,6,.9)'; for (const y of [8, 38, 68]) { c.beginPath(); c.arc(0, y, 10, 0, TAU); c.fill(); } lit(c, () => { c.fillStyle = 'rgba(255,60,24,.7)'; c.beginPath(); c.arc(0, 8, 7, 0, TAU); c.fill(); }); c.restore(); streaks(c, r, 8, 52, 72, 110, 280, '120,48,20'); foot(c, w, h, 0.5); },
    flow: () => -Math.PI / 2, texture: () => 0 });
}

export function paintTent(seed = 1) {
  const rnd = mulberry32(seed * 3);
  return paintProp({ w: 340, h: 240, seed, palette: CLOTH, strokes: 900, size: 12, rim: '#ff9a40', inkAmt: 0.9,
    shape(c, w, h) { c.beginPath(); c.moveTo(22, h - 16); c.lineTo(150, 40); c.lineTo(168, 36); c.lineTo(318, h - 16); c.closePath(); c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.moveTo(138, h - 16); c.lineTo(166, 120); c.lineTo(196, h - 16); c.closePath(); c.fill(); c.globalCompositeOperation = 'source-over'; c.fillRect(158, 14, 5, 30); },
    details(c, w, h, r) { c.strokeStyle = 'rgba(14,10,8,.6)'; c.lineWidth = 3; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(160, 40); c.lineTo(30 + i * 52, h - 16); c.stroke(); }
      for (let i = 0; i < 4; i++) { c.fillStyle = ['rgba(120,50,30,.55)', 'rgba(70,86,60,.55)'][i % 2]; c.save(); c.translate(70 + r() * 200, 100 + r() * 90); c.rotate(r() - 0.5); c.fillRect(-18, -12, 36, 24); c.strokeStyle = 'rgba(10,8,6,.8)'; c.setLineDash([4, 3]); c.strokeRect(-18, -12, 36, 24); c.restore(); }
      streaks(c, r, 10, 40, 300, 60, 160, '60,40,20'); foot(c, w, h, 0.45); },
    flow: () => 0.4, texture: (x, y, r) => (r() < 0.05 ? 0.2 : 0) });
}

export function paintCampfire(seed = 1) {
  const rnd = mulberry32(seed * 7);
  return paintProp({ w: 240, h: 200, seed, palette: WOOD, strokes: 520, size: 9, rim: '#ffb060', inkAmt: 0.9,
    shape(c, w, h) { for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; c.beginPath(); c.ellipse(120 + Math.cos(a) * 62, 150 + Math.sin(a) * 22, 15, 11, 0, 0, TAU); c.fill(); }
      c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 15; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(120 + (i - 1.5) * 24, 150); c.lineTo(120 + (i - 1.5) * 8, 96 + (i % 2) * 8); c.stroke(); } },
    details(c, w, h, r) { c.fillStyle = 'rgba(40,36,34,.35)'; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; c.beginPath(); c.ellipse(120 + Math.cos(a) * 62, 150 + Math.sin(a) * 22, 14, 10, 0, 0, TAU); c.fill(); }
      lit(c, () => { const g = c.createRadialGradient(120, 126, 2, 120, 126, 54); g.addColorStop(0, 'rgba(255,230,160,.95)'); g.addColorStop(0.4, 'rgba(255,120,36,.7)'); g.addColorStop(1, 'rgba(255,60,10,0)'); c.fillStyle = g; c.fillRect(50, 60, 140, 130); c.fillStyle = 'rgba(255,170,70,.8)'; c.beginPath(); c.moveTo(100, 140); c.quadraticCurveTo(110, 80, 124, 62); c.quadraticCurveTo(140, 90, 146, 140); c.closePath(); c.fill(); }); },
    flow: () => -Math.PI / 2, texture: () => 0 });
}

export function paintSandbags(seed = 1) {
  const rnd = mulberry32(seed * 2);
  return paintProp({ w: 340, h: 180, seed, palette: SAND, strokes: 700, size: 10, rim: '#ff9a40', inkAmt: 0.95,
    shape(c, w, h) { for (let row = 0; row < 4; row++) for (let i = 0; i < 6 - row; i++) { const x = 30 + row * 26 + i * 52 + (rnd() - 0.5) * 4, y = h - 30 - row * 32; c.beginPath(); c.ellipse(x + 26, y, 28, 17, (rnd() - 0.5) * 0.1, 0, TAU); c.fill(); } },
    details(c, w, h, r) { c.strokeStyle = 'rgba(20,14,8,.65)'; c.lineWidth = 2; for (let row = 0; row < 4; row++) for (let i = 0; i < 6 - row; i++) { const x = 30 + row * 26 + i * 52; c.beginPath(); c.moveTo(x + 6, h - 30 - row * 32); c.lineTo(x + 46, h - 30 - row * 32 + (r() - 0.5) * 4); c.stroke(); } foot(c, w, h, 0.4); streaks(c, r, 8, 30, 300, 60, 150, '70,50,24'); },
    flow: () => 0.05, texture: (x, y, r) => (r() < 0.05 ? 0.2 : 0) });
}

export function paintFence(seed = 1) {
  const rnd = mulberry32(seed * 4);
  return paintProp({ w: 420, h: 200, seed, palette: IRON, strokes: 380, size: 7, rim: '#ff9a40', inkAmt: 0.95, ao: false,
    shape(c, w, h) { for (let i = 0; i < 5; i++) { c.save(); c.translate(36 + i * 86, h - 14); c.rotate((rnd() - 0.5) * 0.3); c.fillRect(-4, -130, 8, 130); c.restore(); }
      c.lineWidth = 3; c.strokeStyle = '#000'; for (const y of [60, 100, 140]) { c.beginPath(); c.moveTo(20, y); for (let x = 20; x < 400; x += 20) c.lineTo(x, y + Math.sin(x * 0.07 + y) * 7); c.stroke(); } },
    details(c, w, h, r) { c.strokeStyle = 'rgba(140,70,34,.5)'; c.lineWidth = 1.5; for (let i = 0; i < 24; i++) { const x = 20 + r() * 380, y = 56 + r() * 90; c.beginPath(); c.moveTo(x - 5, y - 5); c.lineTo(x + 5, y + 5); c.moveTo(x + 5, y - 5); c.lineTo(x - 5, y + 5); c.stroke(); } },
    flow: () => 0, texture: () => 0 });
}

export function paintSkeleton(seed = 1) {
  const rnd = mulberry32(seed * 6);
  return paintProp({ w: 260, h: 130, seed, palette: BONE, strokes: 360, size: 7, rim: '#ff9a40', inkAmt: 0.9, ao: false,
    shape(c, w, h) { c.beginPath(); c.ellipse(46, 72, 22, 19, 0, 0, TAU); c.fill(); c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 6;
      for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(100 + i * 14, 70); c.quadraticCurveTo(104 + i * 14, 36 - i, 120 + i * 14, 40); c.moveTo(100 + i * 14, 74); c.quadraticCurveTo(104 + i * 14, 104 + i, 120 + i * 14, 98); c.stroke(); }
      c.lineWidth = 7; c.beginPath(); c.moveTo(70, 72); c.lineTo(214, 72); c.stroke(); c.lineWidth = 8; c.beginPath(); c.moveTo(214, 72); c.lineTo(246, 50); c.moveTo(214, 72); c.lineTo(244, 98); c.stroke(); },
    details(c, w, h, r) { c.fillStyle = 'rgba(10,6,6,.85)'; c.beginPath(); c.ellipse(38, 70, 5, 6, 0, 0, TAU); c.ellipse(54, 70, 5, 6, 0, 0, TAU); c.fill(); c.fillRect(38, 84, 18, 4); },
    flow: () => 0, texture: () => 0 });
}

export function paintCrystal(seed = 1) {
  const rnd = mulberry32(seed * 8);
  return paintProp({ w: 200, h: 300, seed, palette: GLOW, strokes: 520, size: 9, rim: '#ffd890', inkAmt: 0.8,
    shape(c, w, h) { for (let i = 0; i < 6; i++) { const x = 40 + i * 24 + (rnd() - 0.5) * 14, top = 40 + rnd() * 120, bw = 22 + rnd() * 18; c.beginPath(); c.moveTo(x - bw / 2, h - 18); c.lineTo(x - bw / 3, top + 20); c.lineTo(x + (rnd() - 0.5) * 8, top); c.lineTo(x + bw / 3, top + 24); c.lineTo(x + bw / 2, h - 18); c.closePath(); c.fill(); } },
    details(c, w, h, r) { { const g = c.createLinearGradient(0, h, 0, 40); g.addColorStop(0, 'rgba(255,90,20,.5)'); g.addColorStop(1, 'rgba(255,220,150,.25)'); c.fillStyle = g; c.fillRect(0, 0, w, h); } c.strokeStyle = 'rgba(255,230,180,.5)'; c.lineWidth = 1.5; for (let i = 0; i < 10; i++) { const x = 40 + r() * 130; c.beginPath(); c.moveTo(x, 60 + r() * 120); c.lineTo(x + (r() - 0.5) * 10, h - 30); c.stroke(); } },
    flow: () => -Math.PI / 2, texture: () => 0.08 });
}

export function paintDeadBush(seed = 1) {
  const rnd = mulberry32(seed * 12);
  return paintProp({ w: 220, h: 170, seed, palette: WOOD, strokes: 380, size: 8, rim: '#ff7a2a', inkAmt: 0.95, ao: false,
    shape(c, w, h) { c.lineCap = 'round'; c.strokeStyle = '#000'; const br = (x, y, a, len, wd, d) => { if (d > 3 || len < 10) return; const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; c.lineWidth = wd; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); for (let i = 0; i < 2 + (d < 1 ? 1 : 0); i++) br(x2, y2, a + (rnd() - 0.5) * 1.6, len * 0.68, wd * 0.62, d + 1); };
      for (let i = 0; i < 5; i++) br(110, h - 10, -Math.PI / 2 + (i - 2) * 0.42, 54 + rnd() * 24, 7, 0); },
    details(c, w, h, r) { foot(c, w, h, 0.45); }, flow: () => -Math.PI / 2, texture: () => 0 });
}

export function paintCrate(seed = 1) {
  const rnd = mulberry32(seed * 14);
  return paintProp({ w: 220, h: 190, seed, palette: WOOD, strokes: 520, size: 10, rim: '#ff9a40', inkAmt: 0.95,
    shape(c, w, h) { c.save(); c.translate(110, 100); c.rotate((rnd() - 0.5) * 0.12); c.fillRect(-72, -62, 144, 124); c.restore(); },
    details(c, w, h, r) { c.strokeStyle = 'rgba(14,8,6,.8)'; c.lineWidth = 4; c.strokeRect(40, 42, 140, 120); c.beginPath(); c.moveTo(40, 42); c.lineTo(180, 162); c.moveTo(180, 42); c.lineTo(40, 162); c.stroke();
      c.strokeStyle = 'rgba(20,14,10,.6)'; c.lineWidth = 2; for (let y = 62; y < 160; y += 24) { c.beginPath(); c.moveTo(40, y); c.lineTo(180, y); c.stroke(); } c.fillStyle = 'rgba(180,150,110,.5)'; for (const [x, y] of [[48, 50], [172, 50], [48, 154], [172, 154]]) { c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(150,40,24,.65)'; c.fillRect(64, 90, 92, 14); foot(c, w, h, 0.45); },
    flow: () => 0, texture: (x, y, r) => (r() < 0.05 ? 0.2 : 0) });
}

/** Decalques de chão (plano deitado): poça tóxica e cratera. */
export function paintPuddle(seed = 1) {
  return paintProp({ w: 320, h: 200, seed, palette: TOX, strokes: 520, size: 12, rim: '#b8ffa0', inkAmt: 0.5, ao: false,
    shape(c, w, h) { c.beginPath(); c.ellipse(160, 100, 134, 74, 0, 0, TAU); c.fill(); },
    details(c, w, h, r) { lit(c, () => { const g = c.createRadialGradient(160, 100, 6, 160, 100, 120); g.addColorStop(0, 'rgba(160,255,140,.5)'); g.addColorStop(1, 'rgba(40,140,60,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }); c.strokeStyle = 'rgba(200,255,190,.4)'; c.lineWidth = 1.6; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(130 + r() * 60, 90 + r() * 30, 20 + r() * 50, 8 + r() * 20, 0, 0, TAU); c.stroke(); } },
    flow: () => 0.1, texture: () => 0 });
}
export function paintCrater(seed = 1) {
  return paintProp({ w: 340, h: 210, seed, palette: ['#0c0808', '#2a1a14', '#5a3a2a', '#9a6a46'], strokes: 560, size: 13, rim: '#ff7a2a', inkAmt: 0.7, ao: false,
    shape(c, w, h) { c.beginPath(); c.ellipse(170, 106, 150, 82, 0, 0, TAU); c.fill(); },
    details(c, w, h, r) { const g = c.createRadialGradient(170, 112, 10, 170, 106, 140); g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(0.6, 'rgba(10,6,6,.4)'); g.addColorStop(1, 'rgba(255,200,150,.2)'); c.fillStyle = g; c.fillRect(0, 0, w, h); lit(c, () => { c.strokeStyle = 'rgba(255,110,36,.5)'; c.lineWidth = 2; for (let i = 0; i < 7; i++) { const a = r() * TAU; c.beginPath(); c.moveTo(170 + Math.cos(a) * 30, 112 + Math.sin(a) * 18); c.lineTo(170 + Math.cos(a) * (60 + r() * 60), 112 + Math.sin(a) * (30 + r() * 30)); c.stroke(); } }); cracks(c, r, 6, 40, 300, 60, 140); },
    flow: () => 0.2, texture: () => 0 });
}

// kind: 'prop' (em pé, fatias de espessura) | 'decal' (deitado no chão) ; h = altura no mundo; thick = [espessura, fatias]
export const CATALOG = [
  { id: 'ruin', name: 'Parede em ruína', paint: paintRuinWall, n: 3, h: 5.2, thick: [0.9, 9], tags: ['ruinas', 'cidade'] },
  { id: 'house', name: 'Casa destruída', paint: paintHouse, n: 3, h: 4.5, thick: [1.2, 10], tags: ['ruinas', 'cidade'] },
  { id: 'tower', name: 'Torre perdida', paint: paintTower, n: 3, h: 12, thick: [1.3, 10], tags: ['cidade', 'fundo'] },
  { id: 'tree', name: 'Árvore seca', paint: paintDeadTree, n: 3, h: 6.6, thick: [0.3, 3], tags: ['ruinas', 'ermo'] },
  { id: 'barrel', name: 'Barril', paint: paintBarrel, n: 2, h: 1.6, thick: [0.6, 6], tags: ['ruinas', 'cidade', 'acampamento'] },
  { id: 'spire', name: 'Pilar de rocha', paint: paintSpire, n: 2, h: 3.8, thick: [0.5, 6], tags: ['ermo'] },
  { id: 'sign', name: 'Placa de aviso', paint: paintSign, n: 2, h: 3.2, thick: [0.12, 2], tags: ['ruinas', 'cidade'] },
  { id: 'bus', name: 'Ônibus tombado', paint: paintBus, n: 2, h: 2.6, thick: [1.4, 8], tags: ['cidade'] },
  { id: 'barricade', name: 'Barricada de carros', paint: paintBarricade, n: 2, h: 2.8, thick: [1.0, 7], tags: ['cidade'] },
  { id: 'lamp', name: 'Poste caído', paint: paintLamp, n: 2, h: 4.8, thick: [0.1, 2], tags: ['cidade'] },
  { id: 'billboard', name: 'Outdoor rasgado', paint: paintBillboard, n: 2, h: 5.2, thick: [0.4, 4], tags: ['cidade'] },
  { id: 'trafficlight', name: 'Semáforo torto', paint: paintTrafficLight, n: 1, h: 3.8, thick: [0.1, 2], tags: ['cidade'] },
  { id: 'tent', name: 'Tenda remendada', paint: paintTent, n: 2, h: 2.4, thick: [1.0, 7], tags: ['acampamento'] },
  { id: 'campfire', name: 'Fogueira', paint: paintCampfire, n: 1, h: 1.6, thick: [0.5, 4], tags: ['acampamento'], light: '#ff8a3a', lightI: 1.2 },
  { id: 'sandbags', name: 'Sacos de areia', paint: paintSandbags, n: 2, h: 1.3, thick: [0.7, 5], tags: ['acampamento', 'cidade'] },
  { id: 'fence', name: 'Cerca de arame', paint: paintFence, n: 2, h: 2.2, thick: [0.1, 2], tags: ['acampamento', 'ermo'] },
  { id: 'crate', name: 'Caixa de suprimentos', paint: paintCrate, n: 2, h: 1.3, thick: [0.8, 6], tags: ['acampamento', 'cidade'] },
  { id: 'skeleton', name: 'Esqueleto', paint: paintSkeleton, n: 2, h: 0.9, thick: [0.3, 3], tags: ['ermo', 'ruinas'] },
  { id: 'deadbush', name: 'Arbusto morto', paint: paintDeadBush, n: 2, h: 1.3, thick: [0.3, 3], tags: ['ermo'] },
  { id: 'crystal', name: 'Cristal de brasa', paint: paintCrystal, n: 2, h: 2.6, thick: [0.5, 5], tags: ['brasa'], light: '#ff7a20' },
  { id: 'puddle', name: 'Poça tóxica', paint: paintPuddle, n: 1, h: 1.6, kind: 'decal', tags: ['ermo', 'cidade'], light: '#5ae870', lightI: 0.22, lightR: 3 },
  { id: 'crater', name: 'Cratera', paint: paintCrater, n: 1, h: 2.2, kind: 'decal', tags: ['ermo', 'brasa'] },
];
