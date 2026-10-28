// Cenário pintado por código: ruínas, árvores mortas, carcaças, barris, pilares, placas.
// Todo sprite tem a âncora no centro da base (pé do objeto). Luz de brasa vem da esquerda-cima.
import { TAU, cv, mulberry32 } from './util.js';
import { rad, lin } from './art-chars.js';
import { buildFacade } from './art-env.js';

function grain(ctx, w, h, rnd, n = 900, dark = 0.22, light = 0.08) {
  ctx.save(); ctx.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < n; i++) {
    const x = rnd() * w, y = rnd() * h, s = 1 + rnd() * 2.2;
    ctx.fillStyle = rnd() < 0.7 ? `rgba(0,0,0,${dark * rnd()})` : `rgba(255,190,130,${light * rnd()})`;
    ctx.fillRect(x, y, s, s * (0.6 + rnd()));
  }
  ctx.restore();
}
function rimLeft(ctx, w, h, a = 0.22) {
  ctx.save(); ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, `rgba(255,160,90,${a})`], [0.35, 'rgba(255,140,80,0)'], [1, 'rgba(0,0,0,.35)']]);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = lin(ctx, 0, h * 0.6, 0, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.45)']]);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
function rust(ctx, x, y, w, h, rnd, n = 14) {
  ctx.save(); ctx.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < n; i++) {
    const rx = x + rnd() * w, ry = y + rnd() * h, r = 4 + rnd() * 18;
    ctx.fillStyle = rad(ctx, rx, ry, 0, r, [[0, 'rgba(150,64,26,.55)'], [1, 'rgba(150,64,26,0)']]);
    ctx.beginPath(); ctx.arc(rx, ry, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ── ruína de prédio: fachada com topo irregular, vergalhões e escombros na base ──
export function buildRuin(seed = 1) {
  const W = 256, H = 540, rnd = mulberry32(seed * 7919 + 13);
  const f = buildFacade(seed, 256, 512);
  const c = cv(W, H), x = c.getContext('2d');
  // máscara de silhueta com topo quebrado
  x.beginPath(); x.moveTo(8, H - 14);
  const topY = 40 + rnd() * 90; let cx = 8; x.lineTo(8, topY + rnd() * 40);
  while (cx < W - 8) { cx += 18 + rnd() * 40; x.lineTo(Math.min(cx, W - 8), topY + (rnd() - 0.2) * 110); }
  x.lineTo(W - 8, H - 14); x.closePath();
  x.save(); x.clip(); x.drawImage(f, 0, 14); x.restore();
  // espessura do topo (concreto exposto) e sombra interna
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = lin(x, 0, 0, 0, H, [[0, 'rgba(0,0,0,.55)'], [0.3, 'rgba(0,0,0,0)'], [0.85, 'rgba(0,0,0,.1)'], [1, 'rgba(0,0,0,.6)']]); x.fillRect(0, 0, W, H);
  x.fillStyle = lin(x, 0, 0, W, 0, [[0, 'rgba(255,150,80,.22)'], [0.3, 'rgba(255,140,80,0)'], [1, 'rgba(0,0,0,.4)']]); x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
  // vergalhões saindo do topo
  x.strokeStyle = '#4a2a1c'; x.lineWidth = 3; x.lineCap = 'round';
  for (let i = 0; i < 7; i++) { const bx = 24 + rnd() * (W - 48), by = topY + 30 + rnd() * 70; x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + (rnd() - 0.5) * 24, by - 30, bx + (rnd() - 0.5) * 40, by - 40 - rnd() * 30); x.stroke(); }
  // escombros na base
  for (let i = 0; i < 26; i++) {
    const bx = 4 + rnd() * (W - 8), s = 6 + rnd() * 22, by = H - 6 - rnd() * 16;
    x.fillStyle = `rgb(${34 + rnd() * 26},${30 + rnd() * 20},${28 + rnd() * 18})`;
    x.beginPath(); x.moveTo(bx - s, by); x.lineTo(bx - s * 0.5, by - s * 0.9); x.lineTo(bx + s * 0.4, by - s); x.lineTo(bx + s, by); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,170,110,.12)'; x.beginPath(); x.moveTo(bx - s * 0.5, by - s * 0.9); x.lineTo(bx + s * 0.4, by - s); x.lineTo(bx, by - s * 0.55); x.fill();
  }
  grain(x, W, H, rnd, 1400);
  return { canvas: c, w: 5.2, h: 11, anchor: 0.97 };
}

export function buildRubble(seed = 1) {
  const W = 256, H = 130, rnd = mulberry32(seed * 311 + 7), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.5)'; x.beginPath(); x.ellipse(W / 2, H - 20, 104, 20, 0, 0, TAU); x.fill();
  const chunks = [];
  for (let i = 0; i < 22; i++) chunks.push({ bx: 40 + rnd() * 176, by: H - 22 - rnd() * 34, s: 14 + rnd() * 30 });
  chunks.sort((a, b) => a.by - b.by);
  for (const k of chunks) {
    const g = 44 + rnd() * 30, j = () => (rnd() - 0.5) * k.s * 0.5;
    x.fillStyle = `rgb(${g + 8},${g},${g - 6})`;
    x.beginPath(); x.moveTo(k.bx - k.s, k.by); x.lineTo(k.bx - k.s * 0.8 + j(), k.by - k.s * 0.6); x.lineTo(k.bx - k.s * 0.1, k.by - k.s * 0.95); x.lineTo(k.bx + k.s * 0.7, k.by - k.s * 0.55 + j()); x.lineTo(k.bx + k.s, k.by); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,170,110,.18)'; x.beginPath(); x.moveTo(k.bx - k.s * 0.8, k.by - k.s * 0.6); x.lineTo(k.bx - k.s * 0.1, k.by - k.s * 0.95); x.lineTo(k.bx + k.s * 0.2, k.by - k.s * 0.5); x.lineTo(k.bx - k.s * 0.5, k.by - k.s * 0.2); x.fill();
    x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.moveTo(k.bx + k.s * 0.2, k.by - k.s * 0.5); x.lineTo(k.bx + k.s * 0.7, k.by - k.s * 0.55); x.lineTo(k.bx + k.s, k.by); x.lineTo(k.bx + k.s * 0.1, k.by); x.fill();
  }
  x.strokeStyle = '#5a2e1c'; x.lineWidth = 3; x.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const bx = 60 + rnd() * 130; x.beginPath(); x.moveTo(bx, H - 40); x.quadraticCurveTo(bx + (rnd() - 0.5) * 30, H - 70, bx + (rnd() - 0.5) * 60, H - 80 - rnd() * 24); x.stroke(); }
  grain(x, W, H, rnd, 500); rimLeft(x, W, H, 0.2);
  return { canvas: c, w: 4.2, h: 2.1, anchor: 0.84 };
}

export function buildDeadTree(seed = 1) {
  const W = 300, H = 420, rnd = mulberry32(seed * 523 + 3), c = cv(W, H), x = c.getContext('2d');
  x.lineCap = 'round'; x.lineJoin = 'round';
  const branch = (bx, by, ang, len, w, depth) => {
    if (depth > 5 || len < 10) return;
    const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len, mx = (bx + ex) / 2 + (rnd() - 0.5) * len * 0.35, my = (by + ey) / 2 + (rnd() - 0.5) * len * 0.25;
    x.strokeStyle = lin(x, bx - w, by, bx + w, by, [[0, '#4d3a30'], [0.5, '#2c211c'], [1, '#150f0e']]); x.lineWidth = w;
    x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(mx, my, ex, ey); x.stroke();
    const n = depth < 2 ? 3 : 2;
    for (let i = 0; i < n; i++) branch(ex, ey, ang + (rnd() - 0.5) * 1.5 + (i - 0.5) * 0.35, len * (0.62 + rnd() * 0.18), w * 0.66, depth + 1);
  };
  x.fillStyle = 'rgba(0,0,0,.5)'; x.beginPath(); x.ellipse(W / 2, H - 14, 60, 12, 0, 0, TAU); x.fill();
  x.strokeStyle = '#241a17'; x.lineWidth = 34; x.beginPath(); x.moveTo(W / 2 - 4, H - 14); x.quadraticCurveTo(W / 2 + 8, H - 80, W / 2 - 4, H - 150); x.stroke();
  x.lineWidth = 24; x.strokeStyle = '#33271f'; x.beginPath(); x.moveTo(W / 2 - 4, H - 14); x.quadraticCurveTo(W / 2 + 8, H - 80, W / 2 - 4, H - 150); x.stroke();
  branch(W / 2 - 4, H - 140, -Math.PI / 2 - 0.5, 110, 15, 0); branch(W / 2 - 4, H - 140, -Math.PI / 2 + 0.55, 100, 14, 0); branch(W / 2 - 4, H - 100, -Math.PI / 2 - 1.1, 70, 11, 1);
  grain(x, W, H, rnd, 700, 0.3, 0.1); rimLeft(x, W, H, 0.3);
  return { canvas: c, w: 6, h: 8.4, anchor: 0.97 };
}

export function buildWreck(seed = 1) {
  const W = 420, H = 200, rnd = mulberry32(seed * 733 + 11), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.55)'; x.beginPath(); x.ellipse(W / 2, H - 22, 170, 22, 0, 0, TAU); x.fill();
  // carroceria
  x.fillStyle = lin(x, 0, 60, 0, 170, [[0, '#6b3a24'], [0.5, '#4a2818'], [1, '#2a1710']]);
  x.beginPath(); x.moveTo(30, 160); x.lineTo(34, 112); x.quadraticCurveTo(60, 100, 110, 96); x.lineTo(140, 62); x.quadraticCurveTo(210, 52, 270, 64); x.lineTo(312, 98); x.quadraticCurveTo(372, 104, 392, 126); x.lineTo(394, 160); x.closePath(); x.fill();
  // janelas estouradas
  x.fillStyle = '#0a0708'; x.beginPath(); x.moveTo(150, 94); x.lineTo(168, 70); x.lineTo(228, 68); x.lineTo(226, 94); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(238, 94); x.lineTo(240, 68); x.lineTo(278, 72); x.lineTo(302, 94); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(200,220,230,.25)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(170, 72); x.lineTo(200, 92); x.moveTo(250, 70); x.lineTo(280, 92); x.stroke();
  // portas e linha de cintura
  x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(232, 98); x.lineTo(232, 158); x.moveTo(142, 100); x.lineTo(140, 158); x.moveTo(34, 130); x.lineTo(392, 134); x.stroke();
  // rodas
  for (const wx of [100, 322]) {
    x.fillStyle = '#0d0a0a'; x.beginPath(); x.arc(wx, 160, 30, 0, TAU); x.fill();
    x.fillStyle = '#4a4540'; x.beginPath(); x.arc(wx, 160, 14, 0, TAU); x.fill(); x.fillStyle = '#1a1614'; x.beginPath(); x.arc(wx, 160, 5, 0, TAU); x.fill();
  }
  rust(x, 20, 60, 380, 110, rnd, 22);
  // chamuscado
  x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = lin(x, 0, 50, 0, 150, [[0, 'rgba(0,0,0,.6)'], [1, 'rgba(0,0,0,0)']]); x.fillRect(0, 40, W, 70); x.restore();
  grain(x, W, H, rnd, 1200, 0.3, 0.1); rimLeft(x, W, H, 0.28);
  return { canvas: c, w: 4.6, h: 2.2, anchor: 0.82 };
}

export function buildBarrel() {
  const W = 110, H = 150, rnd = mulberry32(99), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.5)'; x.beginPath(); x.ellipse(W / 2, H - 14, 40, 9, 0, 0, TAU); x.fill();
  x.fillStyle = lin(x, 20, 0, 90, 0, [[0, '#7a3c22'], [0.35, '#5a2c1a'], [1, '#26140d']]);
  x.beginPath(); x.moveTo(22, 52); x.quadraticCurveTo(14, 90, 22, H - 18); x.quadraticCurveTo(W / 2, H - 6, W - 22, H - 18); x.quadraticCurveTo(W - 14, 90, W - 22, 52); x.closePath(); x.fill();
  x.fillStyle = '#1a0f0b'; x.beginPath(); x.ellipse(W / 2, 52, 33, 11, 0, 0, TAU); x.fill();
  x.fillStyle = 'rgba(255,120,40,.5)'; x.beginPath(); x.ellipse(W / 2, 53, 26, 7, 0, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 3; for (const y of [66, 96, 124]) { x.beginPath(); x.ellipse(W / 2, y, 34, 7, 0, 0, Math.PI); x.stroke(); }
  rust(x, 14, 50, 80, 90, rnd, 10); grain(x, W, H, rnd, 300); rimLeft(x, W, H, 0.3);
  return { canvas: c, w: 1.5, h: 2.0, anchor: 0.92, fire: { x: 0, y: 1.55 } };
}

export function buildPillar(seed = 1) {
  const W = 150, H = 340, rnd = mulberry32(seed * 91 + 5), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.5)'; x.beginPath(); x.ellipse(W / 2, H - 14, 52, 11, 0, 0, TAU); x.fill();
  const top = 40 + rnd() * 60;
  x.fillStyle = lin(x, 30, 0, 120, 0, [[0, '#5a504a'], [0.45, '#3e3733'], [1, '#1c1816']]);
  x.beginPath(); x.moveTo(30, H - 16); x.lineTo(34, top + 30); x.lineTo(46, top); x.lineTo(70, top + 18); x.lineTo(92, top - 6); x.lineTo(118, top + 24); x.lineTo(120, H - 16); x.closePath(); x.fill();
  x.strokeStyle = '#6a361e'; x.lineWidth = 3.5; x.lineCap = 'round';
  for (let i = 0; i < 5; i++) { const bx = 44 + i * 16; x.beginPath(); x.moveTo(bx, top + 10); x.quadraticCurveTo(bx + (rnd() - 0.5) * 20, top - 24, bx + (rnd() - 0.5) * 36, top - 40 - rnd() * 30); x.stroke(); }
  x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 2; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(34, 90 + i * 50 + rnd() * 20); x.lineTo(120, 80 + i * 50 + rnd() * 20); x.stroke(); }
  rust(x, 30, top, 90, H - top, rnd, 8); grain(x, W, H, rnd, 700); rimLeft(x, W, H, 0.25);
  return { canvas: c, w: 2.4, h: 5.4, anchor: 0.96 };
}

export function buildSign(seed = 1) {
  const W = 130, H = 280, rnd = mulberry32(seed * 17 + 1), c = cv(W, H), x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,.5)'; x.beginPath(); x.ellipse(W / 2, H - 12, 24, 7, 0, 0, TAU); x.fill();
  x.strokeStyle = '#33291f'; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(W / 2, H - 14); x.quadraticCurveTo(W / 2 + 6, 140, W / 2 - 2, 62); x.stroke();
  x.save(); x.translate(W / 2 - 2, 62); x.rotate(-0.22 + rnd() * 0.1);
  x.fillStyle = lin(x, -44, -30, 44, 30, [[0, '#8a3a1c'], [1, '#4a1e10']]); x.beginPath(); x.moveTo(-44, -28); x.lineTo(40, -32); x.lineTo(44, 22); x.lineTo(-40, 26); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(240,220,190,.7)'; x.lineWidth = 3; x.beginPath(); x.moveTo(-30, -14); x.lineTo(28, -16); x.moveTo(-28, 4); x.lineTo(22, 6); x.stroke();
  x.restore();
  rust(x, 10, 20, 110, 80, rnd, 8); grain(x, W, H, rnd, 300); rimLeft(x, W, H, 0.3);
  return { canvas: c, w: 1.6, h: 3.4, anchor: 0.95 };
}

export function buildAllProps() {
  const P = { ruin: [], rubble: [], tree: [], wreck: [], pillar: [], sign: [] };
  for (let i = 1; i <= 4; i++) P.ruin.push(buildRuin(i));
  for (let i = 1; i <= 3; i++) P.rubble.push(buildRubble(i));
  for (let i = 1; i <= 3; i++) P.tree.push(buildDeadTree(i));
  for (let i = 1; i <= 2; i++) P.wreck.push(buildWreck(i));
  for (let i = 1; i <= 2; i++) P.pillar.push(buildPillar(i));
  P.sign.push(buildSign(1), buildSign(2));
  P.barrel = [buildBarrel()];
  return P;
}
