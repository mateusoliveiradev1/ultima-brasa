// Motor de pintura de props ("Pintor"): silhueta → volume → pinceladas com cerdas → contorno de tinta → normal map.
// Tudo determinístico por seed. Usado pela Forja de Mapas para pintar props que só o nosso jogo tem.
import { TAU, cv, mulberry32, hexToRgb } from './util.js';

const LIGHT = (() => { const l = [-0.55, -0.75, 0.62]; const n = Math.hypot(...l); return l.map((v) => v / n); })();
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;

function blurred(src, px) { const c = cv(src.width, src.height), x = c.getContext('2d'); x.filter = `blur(${px}px)`; x.drawImage(src, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; }

// rampa de 4 cores (sombra, meio, luz, brilho) → cor para valor 0..1
function ramp(pal) { const s = pal.map((h) => hexToRgb(h)); return (v) => { v = Math.max(0, Math.min(1, v)) * 3; const i = Math.min(2, Math.floor(v)); return mix(s[i], s[i + 1], v - i); }; }

/**
 * opts: { w, h, seed, shape(ctx,w,h), palette:[sombra,meio,luz,brilho], strokes, size, flow(x,y)->ang, ink, rim, texture }
 * retorna { albedo, normal, mask }
 */
export function paintProp(o) {
  const { w, h } = o, rnd = mulberry32(o.seed || 1), col = ramp(o.palette), flow = o.flow || (() => -Math.PI / 2 + 0.25);
  const mask = cv(w, h), mx = mask.getContext('2d'); mx.fillStyle = '#000'; o.shape(mx, w, h);
  const mdata = mx.getImageData(0, 0, w, h).data, inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mdata[((y | 0) * w + (x | 0)) * 4 + 3] > 128;
  // volume: máscara borrada em duas escalas
  const b1 = blurred(mask, Math.max(2, w * 0.02)), b2 = blurred(mask, Math.max(4, w * 0.06));
  const N = w * h, H = new Float32Array(N);
  for (let i = 0; i < N; i++) H[i] = (b1[i * 4 + 3] * 0.55 + b2[i * 4 + 3] * 0.45) / 255;
  const hAt = (x, y) => H[Math.max(0, Math.min(h - 1, y | 0)) * w + Math.max(0, Math.min(w - 1, x | 0))];
  const shadeAt = (x, y) => { const gx = (hAt(x + 2, y) - hAt(x - 2, y)) * 9, gy = (hAt(x, y + 2) - hAt(x, y - 2)) * 9, l = Math.hypot(gx, gy, 1); let v = ((-gx * LIGHT[0] - gy * LIGHT[1] + LIGHT[2]) / l); v = Math.max(0, Math.min(1, (v - 0.35) * 1.5 + 0.18)); const ao = o.ao === false ? 1 : 0.55 + 0.45 * Math.min(1, (h - y) / (h * 0.2)); return Math.max(0, Math.min(1, v * ao + (1 - ao) * -0.2)); };

  const albedo = cv(w, h), ax = albedo.getContext('2d'), bump = cv(w, h), bx = bump.getContext('2d');
  // base: sombreamento por volume, em blocos suaves
  const img = ax.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4; if (mdata[k + 3] < 8) continue; const c = col(shadeAt(x, y)); img.data[k] = c[0] * 255; img.data[k + 1] = c[1] * 255; img.data[k + 2] = c[2] * 255; img.data[k + 3] = mdata[k + 3]; }
  ax.putImageData(img, 0, 0);
  bx.fillStyle = '#808080'; bx.fillRect(0, 0, w, h);

  // pinceladas: cada uma é um feixe de cerdas seguindo o fluxo, com a cor da luz local + variação
  const nStr = (o.strokes || 900) * 2.4, size = o.size || 14;
  ax.save(); ax.globalCompositeOperation = 'source-atop';
  for (let s = 0; s < nStr; s++) {
    let x = rnd() * w, y = rnd() * h, tries = 0; while (!inside(x, y) && tries++ < 12) { x = rnd() * w; y = rnd() * h; } if (!inside(x, y)) continue;
    const sh = shadeAt(x, y), tint = (rnd() - 0.5) * 0.28 + (o.texture ? o.texture(x, y, rnd) : 0), len = size * (0.9 + rnd() * 1.8), wd = size * (0.3 + rnd() * 0.55), a = flow(x, y) + (rnd() - 0.5) * 0.7;
    const c = col(sh + tint), nb = 7 + ((rnd() * 5) | 0), ca = Math.cos(a), sa = Math.sin(a);
    for (let b = 0; b < nb; b++) {
      const off = (b / (nb - 1) - 0.5) * wd, ox = -sa * off, oy = ca * off, jit = (rnd() - 0.5) * 0.18, cc = mix(c, col(sh + tint + (rnd() - 0.5) * 0.2), 0.5);
      ax.strokeStyle = css(cc, 0.35 + rnd() * 0.45); ax.lineCap = 'round';
      const sx0 = x + ox, sy0 = y + oy, mxp = sx0 + ca * len * 0.5 - sa * len * jit, myp = sy0 + sa * len * 0.5 + ca * len * jit, ex2 = sx0 + ca * len, ey2 = sy0 + sa * len, lw = Math.max(0.8, wd / nb * (1.1 + rnd()));
      ax.lineWidth = lw; ax.beginPath(); ax.moveTo(sx0, sy0); ax.quadraticCurveTo(mxp, myp, mxp * 0.5 + ex2 * 0.5, myp * 0.5 + ey2 * 0.5); ax.stroke(); ax.lineWidth = lw * 0.55; ax.beginPath(); ax.moveTo(mxp * 0.5 + ex2 * 0.5, myp * 0.5 + ey2 * 0.5); ax.lineTo(ex2, ey2); ax.stroke();
      // relevo da cerda
      bx.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.10)'; bx.lineWidth = Math.max(1, wd / nb * 0.8);
      bx.beginPath(); bx.moveTo(x + ox, y + oy); bx.lineTo(x + ox + ca * len, y + oy + sa * len); bx.stroke();
    }
  }
  ax.restore();
  if (o.details) { ax.save(); ax.globalCompositeOperation = 'source-atop'; o.details(ax, w, h, rnd, shadeAt); ax.restore(); const dd = o.details; }

  // contorno de tinta: borda da máscara, irregular, mais grossa embaixo (peso)
  if (o.ink !== false) {
    const edge = cv(w, h), ex = edge.getContext('2d'); ex.drawImage(mask, 0, 0); ex.globalCompositeOperation = 'source-in';
    const outl = cv(w, h), ox2 = outl.getContext('2d'); ox2.filter = 'blur(1.6px)'; ox2.drawImage(mask, 0, 0); const od = ox2.getImageData(0, 0, w, h).data;
    const e = ax.getImageData(0, 0, w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, m = mdata[k + 3]; if (m < 8) continue; const soft = od[k + 3]; const edgeV = 1 - soft / 255; const wob = 0.12 * Math.sin(x * 0.31 + y * 0.17) + 0.1 * Math.sin(y * 0.23 - x * 0.11); const t = Math.max(0, Math.min(1, (edgeV + wob * edgeV) * 3.2)) * (o.inkAmt || 0.85);
      if (t > 0) { e.data[k] = e.data[k] * (1 - t) + 18 * t; e.data[k + 1] = e.data[k + 1] * (1 - t) + 10 * t; e.data[k + 2] = e.data[k + 2] * (1 - t) + 8 * t; } }
    ax.putImageData(e, 0, 0);
  }
  // luz de brasa (rim) na borda voltada pra baixo/direita
  if (o.rim) {
    const e = ax.getImageData(0, 0, w, h), rc = hexToRgb(o.rim);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4; if (mdata[k + 3] < 8) continue; const gx = hAt(x - 3, y) - hAt(x + 3, y), gy = hAt(x, y - 3) - hAt(x, y + 3), edge = Math.max(0, Math.min(1, (1 - hAt(x, y)) * 2.2)), facing = Math.max(0, gx * 0.6 + gy * 0.8) * 6; const t = Math.min(0.7, edge * facing); if (t > 0.01) { e.data[k] = Math.min(255, e.data[k] + rc[0] * 255 * t); e.data[k + 1] = Math.min(255, e.data[k + 1] + rc[1] * 255 * t); e.data[k + 2] = Math.min(255, e.data[k + 2] + rc[2] * 255 * t); } }
    ax.putImageData(e, 0, 0);
  }
  // normal map: volume + cerdas
  const bd = bx.getImageData(0, 0, w, h).data, nm = cv(w, h), nx = nm.getContext('2d'), no = nx.createImageData(w, h);
  const hh = (x, y) => { const i = Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x)); return H[i] * 1.0 + (bd[i * 4] - 128) / 255 * 0.5; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, dx = (hh(x + 1, y) - hh(x - 1, y)) * 7, dy = (hh(x, y + 1) - hh(x, y - 1)) * 7, l = Math.hypot(dx, dy, 1); no.data[k] = (-dx / l * 0.5 + 0.5) * 255; no.data[k + 1] = (dy / l * 0.5 + 0.5) * 255; no.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; no.data[k + 3] = mdata[k + 3] < 8 ? 0 : 255; }
  nx.putImageData(no, 0, 0);
  return { albedo, normal: nm, mask };
}

// ───────── props pintados do nosso mundo ─────────
const RUST = ['#1c1210', '#6a3a28', '#b0683a', '#f0b27a'], STONE = ['#1a1618', '#4a4146', '#8a7d78', '#d6c4b0'], WOOD = ['#140e0c', '#4a3022', '#8a5a38', '#d9a066'], IRON = ['#0e0e12', '#34363e', '#6c727c', '#b8c0c8'];

export function paintRuinWall(seed = 1) {
  const rnd = mulberry32(seed * 7);
  return paintProp({ w: 320, h: 440, seed, palette: STONE, strokes: 1500, size: 16, rim: '#ff7a2a', inkAmt: 0.9,
    shape(c, w, h) { c.beginPath(); c.moveTo(40, h - 16); c.lineTo(34, 150); c.lineTo(70, 128); c.lineTo(96, 150); c.lineTo(120, 92); c.lineTo(168, 60); c.lineTo(208, 104); c.lineTo(236, 84); c.lineTo(272, 140); c.lineTo(284, h - 16); c.closePath(); c.fill(); c.globalCompositeOperation = 'destination-out';
      const win = (x, y, ww, hh) => { c.beginPath(); c.moveTo(x, y + hh); c.lineTo(x, y + 18); c.quadraticCurveTo(x + ww / 2, y - 18, x + ww, y + 18); c.lineTo(x + ww, y + hh); c.closePath(); c.fill(); };
      win(78, 200, 54, 96); win(176, 190, 58, 104); c.beginPath(); c.arc(150, 130, 14 + rnd() * 6, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; },
    details(c, w, h, r, shade) {
      // fiadas de tijolo irregulares
      c.lineCap = 'round';
      for (let y = 130, row = 0; y < h - 10; y += 26, row++) { c.strokeStyle = 'rgba(14,8,10,.8)'; c.lineWidth = 2.8; c.beginPath(); c.moveTo(20, y + (r() - 0.5) * 2); c.lineTo(w - 20, y + (r() - 0.5) * 2); c.stroke();
        for (let x = 30 + (row % 2) * 30; x < w - 20; x += 60 + r() * 6) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 2, y + 26); c.stroke(); if (r() < 0.8) { c.fillStyle = r() < 0.5 ? 'rgba(255,200,150,.2)' : 'rgba(0,0,0,.24)'; c.fillRect(x + 4, y + 4, 52, 18); c.fillStyle = 'rgba(255,225,190,.16)'; c.fillRect(x + 4, y + 4, 52, 3); } } }
      // rachaduras
      c.strokeStyle = 'rgba(10,6,8,.85)'; c.lineWidth = 2;
      for (let i = 0; i < 4; i++) { let x = 50 + r() * 210, y = 150 + r() * 120; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 18; y += 8 + r() * 14; c.lineTo(x, y); } c.stroke(); }
      // fuligem e musgo morto na base; brasa nas frestas
      const g = c.createLinearGradient(0, h - 120, 0, h); g.addColorStop(0, 'rgba(10,6,6,0)'); g.addColorStop(1, 'rgba(10,6,6,.6)'); c.fillStyle = g; c.fillRect(0, h - 120, w, 120);
      for (let i = 0; i < 40; i++) { const x = r() * w, y = h - 20 - r() * 80; c.fillStyle = `rgba(${70 + r() * 30},${80 + r() * 30},${40},${0.12 + r() * 0.2})`; c.beginPath(); c.ellipse(x, y, 3 + r() * 9, 2 + r() * 4, r() * 3, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const x = 40 + r() * 240, y = 160 + r() * 200; c.fillStyle = 'rgba(255,120,40,.5)'; c.fillRect(x, y, 2 + r() * 8, 1.5); } c.globalCompositeOperation = 'source-atop';
    }, flow: () => 0.04, texture: (x, y, r) => (r() < 0.04 ? 0.25 : 0) });
}
export function paintDeadTree(seed = 1) {
  const rnd = mulberry32(seed * 13);
  return paintProp({ w: 300, h: 420, seed, palette: WOOD, strokes: 1100, size: 11, rim: '#ff7a2a', inkAmt: 0.95,
    shape(c, w, h) { const br = (x, y, a, len, wd, d) => { if (d > 4 || len < 14) return; const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = wd; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + x2) / 2 + (rnd() - 0.5) * 16, (y + y2) / 2, x2, y2); c.stroke();
      const n = d < 2 ? 2 : 1 + ((rnd() * 2) | 0); for (let i = 0; i < n; i++) br(x2, y2, a + (rnd() - 0.5) * 1.5 + (i ? 0.5 : -0.4), len * (0.62 + rnd() * 0.2), wd * 0.66, d + 1); };
      c.fillStyle = '#000'; c.beginPath(); c.moveTo(w / 2 - 32, h - 8); c.quadraticCurveTo(w / 2 - 16, h - 60, w / 2 - 14, h - 130); c.lineTo(w / 2 + 14, h - 130); c.quadraticCurveTo(w / 2 + 18, h - 60, w / 2 + 36, h - 8); c.closePath(); c.fill(); br(w / 2, h - 120, -Math.PI / 2 - 0.1, 112, 24, 0); },
    details(c, w, h, r) { c.strokeStyle = 'rgba(14,8,6,.6)'; c.lineWidth = 1.6; for (let i = 0; i < 38; i++) { const x = w / 2 - 22 + r() * 44, y = h - 20 - r() * 160; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 6, y - 14 - r() * 30); c.stroke(); }
      const g = c.createLinearGradient(0, h - 70, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = g; c.fillRect(0, h - 70, w, 70); },
    flow: (x, y) => -Math.PI / 2 + (x - 150) * 0.004, texture: (x, y) => (Math.sin(x * 0.5 + y * 0.03) > 0.55 ? -0.15 : 0) });
}
export function paintBarrel(seed = 1) {
  return paintProp({ w: 180, h: 220, seed, palette: RUST, strokes: 520, size: 9, rim: '#ff9a40', inkAmt: 0.9,
    shape(c, w, h) { c.beginPath(); c.moveTo(34, 40); c.quadraticCurveTo(w / 2, 14, w - 34, 40); c.quadraticCurveTo(w - 14, h / 2, w - 30, h - 34); c.quadraticCurveTo(w / 2, h - 10, 30, h - 34); c.quadraticCurveTo(14, h / 2, 34, 40); c.closePath(); c.fill(); },
    details(c, w, h, r) {
      // aros de ferro e tábuas
      for (const y of [58, 108, 160]) { c.fillStyle = 'rgba(20,14,14,.8)'; c.beginPath(); c.moveTo(18, y); c.quadraticCurveTo(w / 2, y + 12, w - 18, y); c.lineTo(w - 18, y + 9); c.quadraticCurveTo(w / 2, y + 21, 18, y + 9); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,200,150,.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(22, y + 1); c.quadraticCurveTo(w / 2, y + 12, w - 22, y + 1); c.stroke(); }
      c.strokeStyle = 'rgba(16,10,8,.6)'; c.lineWidth = 1.5; for (let x = 44; x < w - 30; x += 22) { c.beginPath(); c.moveTo(x, 30); c.lineTo(x + (r() - 0.5) * 4, h - 30); c.stroke(); }
      for (let i = 0; i < 14; i++) { c.fillStyle = 'rgba(255,200,150,.5)'; c.beginPath(); c.arc(30 + r() * 120, 62 + (i % 3) * 50, 1.6, 0, TAU); c.fill(); }
      // envelhecimento: ferrugem escorrida, arranhões, amassados e tábua quebrada
      for (let i = 0; i < 22; i++) { const x = 28 + r() * 124, y = 36 + r() * 60, L = 30 + r() * 120, gr = c.createLinearGradient(0, y, 0, y + L); gr.addColorStop(0, `rgba(${150 + r() * 50},${60 + r() * 30},20,${0.35 + r() * 0.3})`); gr.addColorStop(1, 'rgba(90,30,10,0)'); c.fillStyle = gr; c.fillRect(x, y, 2 + r() * 6, L); }
      c.strokeStyle = 'rgba(8,5,4,.7)'; c.lineWidth = 1.3; for (let i = 0; i < 16; i++) { const x = 24 + r() * 130, y = 30 + r() * 150; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 8 + r() * 22, y + (r() - 0.5) * 16); c.stroke(); }
      c.fillStyle = 'rgba(0,0,0,.65)'; c.beginPath(); c.moveTo(96, 116); c.lineTo(112, 122); c.lineTo(104, 170); c.lineTo(92, 160); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,170,100,.4)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(96, 116); c.lineTo(112, 122); c.stroke();
      const g = c.createLinearGradient(0, h - 70, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = g; c.fillRect(0, h - 70, w, 70);
    }, flow: () => Math.PI / 2, texture: (x, y) => (Math.sin(x * 0.4) > 0.8 ? 0.12 : 0) });
}
export function paintSpire(seed = 1) {
  return paintProp({ w: 200, h: 420, seed, palette: IRON, strokes: 700, size: 12, rim: '#ff7a2a', inkAmt: 0.9,
    shape(c, w, h) { c.beginPath(); c.moveTo(60, h - 10); c.lineTo(78, 140); c.lineTo(96, 20); c.lineTo(112, 120); c.lineTo(140, h - 10); c.closePath(); c.fill(); },
    flow: () => -Math.PI / 2, texture: (x, y) => (Math.sin(y * 0.2) > 0.7 ? 0.2 : 0) });
}

/** Chão pintado: pinceladas largas em rampa de cor + rachaduras + seixos; retorna {albedo, normal}. Ladrilhável. */
export function paintGround(size = 1024, seed = 3, palette = ['#1e1412', '#4a2e22', '#7a4a30', '#a8683e']) {
  const rnd = mulberry32(seed), col = ramp(palette), c = cv(size), x = c.getContext('2d'), hb = cv(size), hx = hb.getContext('2d');
  x.fillStyle = css(col(0.38)); x.fillRect(0, 0, size, size); hx.fillStyle = '#808080'; hx.fillRect(0, 0, size, size);
  const noise = (px, py) => Math.sin(px * 0.012 + Math.sin(py * 0.009) * 2.4) * 0.5 + Math.sin(py * 0.017 - px * 0.006) * 0.5;
  const wrapDraw = (fn) => { for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { x.save(); x.translate(ox, oy); fn(); x.restore(); } };
  for (let i = 0; i < 5200; i++) {
    const px = rnd() * size, py = rnd() * size, a = noise(px, py) * 1.2 + (rnd() - 0.5) * 0.5, len = 26 + rnd() * 70, wd = 6 + rnd() * 16, v = 0.38 + noise(px * 1.7, py * 1.3) * 0.22 + (rnd() - 0.5) * 0.3, nb = 6;
    const edge = px < 100 || py < 100 || px > size - 100 || py > size - 100;
    const draw = () => { for (let b = 0; b < nb; b++) { const off = (b / (nb - 1) - 0.5) * wd, ca = Math.cos(a), sa = Math.sin(a); x.strokeStyle = css(col(v + (rnd() - 0.5) * 0.14), 0.3 + rnd() * 0.4); x.lineWidth = wd / nb * (1.2 + rnd()); x.lineCap = 'round'; x.beginPath(); x.moveTo(px - sa * off, py + ca * off); x.lineTo(px - sa * off + ca * len, py + ca * off * 0 + sa * len + ca * off); x.stroke(); } };
    if (edge) wrapDraw(draw); else draw();
    hx.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'; hx.lineWidth = 2 + rnd() * 3; hx.beginPath(); hx.moveTo(px, py); hx.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); hx.stroke();
  }
  // seixos pintados (luz em cima-esquerda, sombra embaixo-direita)
  for (let i = 0; i < 320; i++) { const px = rnd() * size, py = rnd() * size, r = 2 + rnd() * 5; x.fillStyle = 'rgba(8,5,5,.45)'; x.beginPath(); x.ellipse(px + r * 0.35, py + r * 0.45, r, r * 0.7, 0, 0, TAU); x.fill(); const g = x.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r); g.addColorStop(0, css(col(0.75))); g.addColorStop(1, css(col(0.25))); x.fillStyle = g; x.beginPath(); x.ellipse(px, py, r, r * 0.75, 0, 0, TAU); x.fill();
    hx.fillStyle = 'rgba(255,255,255,.12)'; hx.beginPath(); hx.ellipse(px, py, r, r * 0.75, 0, 0, TAU); hx.fill(); }
  // rachaduras
  x.strokeStyle = 'rgba(10,6,6,.8)'; x.lineCap = 'round'; hx.strokeStyle = 'rgba(0,0,0,.7)';
  for (let i = 0; i < 46; i++) { let px = rnd() * size, py = rnd() * size; const lw = 1 + rnd() * 2.2; x.lineWidth = lw; hx.lineWidth = lw + 2; x.beginPath(); hx.beginPath(); x.moveTo(px, py); hx.moveTo(px, py); for (let k = 0; k < 9; k++) { px += (rnd() - 0.5) * 50; py += (rnd() - 0.2) * 40; x.lineTo(px, py); hx.lineTo(px, py); } x.stroke(); hx.stroke(); }
  // normal map do relevo
  const hd = hx.getImageData(0, 0, size, size).data, nm = cv(size), nx = nm.getContext('2d'), no = nx.createImageData(size, size), at = (i, j) => hd[(((j + size) % size) * size + ((i + size) % size)) * 4];
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) { const dx = (at(i + 1, j) - at(i - 1, j)) / 255 * 3.2, dy = (at(i, j + 1) - at(i, j - 1)) / 255 * 3.2, l = Math.hypot(dx, dy, 1), k = (j * size + i) * 4; no.data[k] = (-dx / l * 0.5 + 0.5) * 255; no.data[k + 1] = (dy / l * 0.5 + 0.5) * 255; no.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; no.data[k + 3] = 255; }
  nx.putImageData(no, 0, 0);
  return { albedo: c, normal: nm };
}

/** Camada macro do chão (não ladrilha): manchas de cor por região, queimados, trilha de terra batida com pegadas e seixos nas bordas. Mundo de -half..half. */
export function paintGroundMacro(size = 2048, seed = 5, half = 20, paths = []) {
  const rnd = mulberry32(seed), c = cv(size), x = c.getContext('2d'), S = size / (half * 2), P = ([wx, wz]) => [(wx + half) * S, (wz + half) * S];
  // regiões: poeira clara, cinza de cinza, queimado escuro, vermelho de ferrugem
  const blots = [['rgba(214,170,120,.20)', 160, 380], ['rgba(120,110,108,.22)', 140, 340], ['rgba(10,6,6,.34)', 120, 300], ['rgba(170,60,24,.16)', 120, 280]];
  for (const [colr, n, rmax] of blots) for (let i = 0; i < n / 6; i++) { const px = rnd() * size, py = rnd() * size, r = rmax * (0.4 + rnd() * 0.6); x.save(); x.translate(px, py); x.rotate(rnd() * 3); x.scale(1, 0.55 + rnd() * 0.3); const g = x.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, colr); g.addColorStop(1, colr.replace(/[\d.]+\)$/, '0)')); x.fillStyle = g; x.fillRect(-r, -r, r * 2, r * 2); x.restore(); }
  // trilhas: curva por pontos, pinceladas largas ao longo, com cerdas
  for (const pts of paths) {
    const q = pts.map(P), at = (t) => { const f = t * (q.length - 1), i = Math.min(q.length - 2, Math.floor(f)), u = f - i, p0 = q[Math.max(0, i - 1)], p1 = q[i], p2 = q[i + 1], p3 = q[Math.min(q.length - 1, i + 2)]; const cr = (a, b, c2, d) => 0.5 * ((2 * b) + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u * u + (-a + 3 * b - 3 * c2 + d) * u * u * u); return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]; };
    const N = 1100, wid = 2.3 * S;
    for (let pass = 0; pass < 3; pass++) for (let i = 0; i < N; i++) {
      const t = i / N, a = at(t), b = at(Math.min(1, t + 0.012)), ang = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = -Math.sin(ang), ny = Math.cos(ang);
      const off = (rnd() - 0.5) * wid * (pass === 0 ? 1.5 : pass === 1 ? 1.0 : 0.5), v = pass === 0 ? 0.4 : 0.5 + rnd() * 0.22;
      x.strokeStyle = `rgba(${Math.round(150 + v * 70)},${Math.round(100 + v * 55)},${Math.round(62 + v * 36)},${pass === 0 ? 0.16 : 0.2})`; x.lineWidth = (6 + rnd() * 16) * (pass === 0 ? 1.4 : 1); x.lineCap = 'round';
      x.beginPath(); x.moveTo(a[0] + nx * off, a[1] + ny * off); x.lineTo(b[0] + nx * off + Math.cos(ang) * 30, b[1] + ny * off + Math.sin(ang) * 30); x.stroke();
    }
    // sulcos escuros nas bordas, pegadas e seixos
    for (const side of [-1, 1]) { x.strokeStyle = 'rgba(14,8,8,.32)'; x.lineWidth = 5; x.beginPath(); for (let i = 0; i <= 160; i++) { const t = i / 160, a = at(t), b = at(Math.min(1, t + 0.01)), ang = Math.atan2(b[1] - a[1], b[0] - a[0]); const px = a[0] - Math.sin(ang) * side * wid * 0.62 + Math.sin(i * 0.7) * 2, py = a[1] + Math.cos(ang) * side * wid * 0.62; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
    for (let i = 0; i < 230; i++) { const t = rnd(), a = at(t), off = (rnd() - 0.5) * wid * 1.9, rr = 2 + rnd() * 6; const px = a[0] + off, py = a[1] + (rnd() - 0.5) * 20;
      x.fillStyle = 'rgba(8,5,5,.5)'; x.beginPath(); x.ellipse(px + rr * 0.4, py + rr * 0.5, rr, rr * 0.7, 0, 0, TAU); x.fill();
      const g = x.createRadialGradient(px - rr * 0.3, py - rr * 0.3, 0, px, py, rr); g.addColorStop(0, '#c9a27a'); g.addColorStop(1, '#5a3c2a'); x.fillStyle = g; x.beginPath(); x.ellipse(px, py, rr, rr * 0.75, 0, 0, TAU); x.fill(); }
    for (let i = 0; i < 70; i++) { const t = rnd(), a = at(t); x.fillStyle = 'rgba(20,12,10,.35)'; x.beginPath(); x.ellipse(a[0] + (rnd() - 0.5) * wid * 0.6, a[1], 5, 9, rnd() * 3, 0, TAU); x.fill(); }
  }
  return c;
}

/** Placa de aviso torta, de ferro enferrujado, com X de brasa e furos de bala. */
export function paintSign(seed = 1) {
  const rnd = mulberry32(seed * 31);
  return paintProp({ w: 180, h: 340, seed, palette: RUST, strokes: 420, size: 8, rim: '#ff7a2a', inkAmt: 0.95,
    shape(c, w, h) { c.fillRect(82, 120, 13, h - 126); c.save(); c.translate(92, 82); c.rotate(-0.12); c.beginPath(); c.moveTo(0, -70); c.lineTo(70, 0); c.lineTo(52, 22); c.lineTo(70, 40); c.lineTo(0, 70); c.lineTo(-70, 0); c.closePath(); c.fill(); c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc((rnd() - 0.5) * 80, (rnd() - 0.5) * 80, 2.5 + rnd() * 3, 0, TAU); c.fill(); } c.globalCompositeOperation = 'source-over'; c.restore(); },
    details(c, w, h, r) {
      c.save(); c.translate(92, 82); c.rotate(-0.12);
      c.strokeStyle = 'rgba(150,40,24,.75)'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -56); c.lineTo(56, 0); c.lineTo(0, 56); c.lineTo(-56, 0); c.closePath(); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,120,40,.55)'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(-26, -26); c.lineTo(26, 26); c.moveTo(26, -26); c.lineTo(-26, 26); c.stroke(); c.globalCompositeOperation = 'source-atop'; c.restore();
      for (let i = 0; i < 18; i++) { const x = 20 + r() * 140, y = 30 + r() * 100, L = 20 + r() * 70, g = c.createLinearGradient(0, y, 0, y + L); g.addColorStop(0, 'rgba(130,50,20,.55)'); g.addColorStop(1, 'rgba(90,30,10,0)'); c.fillStyle = g; c.fillRect(x, y, 2 + r() * 4, L); }
      const g2 = c.createLinearGradient(0, h - 90, 0, h); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = g2; c.fillRect(0, h - 90, w, 90);
    }, flow: () => -Math.PI / 2, texture: (x, y, r) => (r() < 0.05 ? 0.2 : 0) });
}

/** Face de penhasco: estratos de rocha em pinceladas horizontais, rachaduras com brasa, ferrugem escorrida, lábio claro no topo. Retorna canvas. */
export function paintCliffFace(w = 1400, h = 240, seed = 4) {
  const rnd = mulberry32(seed), col = ramp(['#14100f', '#3a2a24', '#6a4a38', '#a87a54']), c = cv(w, h), x = c.getContext('2d');
  x.fillStyle = css(col(0.35)); x.fillRect(0, 0, w, h);
  const bands = []; for (let y = 0; y < h; y += 14 + rnd() * 26) bands.push([y, 0.2 + rnd() * 0.5]);
  for (const [y, v] of bands) for (let i = 0; i < 70; i++) { const px = rnd() * w, len = 40 + rnd() * 160, wd = 6 + rnd() * 14; x.strokeStyle = css(col(v + (rnd() - 0.5) * 0.2), 0.35 + rnd() * 0.4); x.lineWidth = wd; x.lineCap = 'round'; x.beginPath(); x.moveTo(px, y + rnd() * 14); x.lineTo(px + len, y + rnd() * 14 + (rnd() - 0.5) * 4); x.stroke(); }
  x.strokeStyle = 'rgba(10,6,6,.55)'; for (const [y] of bands) { x.lineWidth = 2; x.beginPath(); x.moveTo(0, y); for (let px = 0; px < w; px += 30) x.lineTo(px, y + (rnd() - 0.5) * 5); x.stroke(); }
  for (let i = 0; i < 16; i++) { let px = rnd() * w, py = rnd() * h * 0.3; x.lineWidth = 2 + rnd() * 2; x.strokeStyle = 'rgba(8,5,5,.9)'; x.beginPath(); x.moveTo(px, py); const pts = [[px, py]]; for (let k = 0; k < 8; k++) { px += (rnd() - 0.5) * 26; py += 10 + rnd() * 22; x.lineTo(px, py); pts.push([px, py]); } x.stroke();
    if (rnd() < 0.5) { x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(255,110,34,.55)'; x.lineWidth = 1.6; x.beginPath(); pts.forEach(([a, b], j) => (j ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke(); x.globalCompositeOperation = 'source-over'; } }
  for (let i = 0; i < 40; i++) { const px = rnd() * w, py = rnd() * h * 0.5, L = 30 + rnd() * 120, g = x.createLinearGradient(0, py, 0, py + L); g.addColorStop(0, `rgba(${140 + rnd() * 40},${56 + rnd() * 20},22,.5)`); g.addColorStop(1, 'rgba(90,30,10,0)'); x.fillStyle = g; x.fillRect(px, py, 3 + rnd() * 8, L); }
  const lip = x.createLinearGradient(0, 0, 0, 26); lip.addColorStop(0, 'rgba(255,200,150,.5)'); lip.addColorStop(1, 'rgba(255,200,150,0)'); x.fillStyle = lip; x.fillRect(0, 0, w, 26);
  const ao = x.createLinearGradient(0, h - 70, 0, h); ao.addColorStop(0, 'rgba(0,0,0,0)'); ao.addColorStop(1, 'rgba(0,0,0,.7)'); x.fillStyle = ao; x.fillRect(0, h - 70, w, 70);
  return c;
}

const PLASTER = ['#1a1412', '#5a4a40', '#9a8070', '#d9c0a0'];
/** Casa de bairro destruída: telhado de duas águas quebrado, janelas vazadas, porta arrombada, reboco soltando. */
export function paintHouse(seed = 1) {
  const rnd = mulberry32(seed * 17);
  return paintProp({ w: 380, h: 300, seed, palette: PLASTER, strokes: 1300, size: 14, rim: '#ff7a2a', inkAmt: 0.9,
    shape(c, w, h) { const bx = 36, by = 118, bw = 308, bh = h - by - 14;
      c.fillRect(bx, by, bw, bh);
      c.beginPath(); c.moveTo(bx - 14, by + 6); c.lineTo(120, 40); c.lineTo(168, 22); c.lineTo(214, 52); c.lineTo(250, 38); c.lineTo(bx + bw + 14, by + 6); c.lineTo(bx + bw - 30, by + 10); c.lineTo(bx + 30, by + 10); c.closePath(); c.fill();
      c.globalCompositeOperation = 'destination-out';
      const win = (x, y, ww, hh) => { c.fillRect(x, y, ww, hh); }; win(64, 160, 50, 56); win(160, 150, 44, 64); win(262, 162, 52, 54);
      c.beginPath(); c.moveTo(214, h - 14); c.lineTo(214, 196); c.lineTo(250, 190); c.lineTo(250, h - 14); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(bx + bw - 6, by - 4); c.lineTo(bx + bw - 60, by + 4); c.lineTo(bx + bw - 20, by + 30); c.closePath(); c.fill();
      c.globalCompositeOperation = 'source-over'; },
    details(c, w, h, r) {
      // telhas
      c.strokeStyle = 'rgba(20,10,10,.5)'; c.lineWidth = 2; for (let y = 28; y < 116; y += 11) { c.beginPath(); c.moveTo(30, y); c.lineTo(w - 30, y); c.stroke(); for (let x = 40 + (y % 22); x < w - 30; x += 24) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 11); c.stroke(); } }
      c.fillStyle = 'rgba(70,24,16,.38)'; c.fillRect(24, 22, w - 48, 98);
      // tábuas cruzadas e reboco solto
      c.fillStyle = 'rgba(30,18,12,.9)'; c.save(); c.translate(90, 188); c.rotate(0.5); c.fillRect(-34, -4, 68, 8); c.rotate(-1); c.fillRect(-34, -4, 68, 8); c.restore();
      for (let i = 0; i < 26; i++) { c.fillStyle = r() < 0.5 ? 'rgba(20,12,10,.3)' : 'rgba(255,225,190,.14)'; c.beginPath(); c.ellipse(40 + r() * 300, 125 + r() * 150, 6 + r() * 16, 4 + r() * 9, r() * 3, 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(10,6,8,.85)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { let x = 50 + r() * 280, y = 130 + r() * 40; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 14; y += 8 + r() * 12; c.lineTo(x, y); } c.stroke(); }
      const g = c.createLinearGradient(0, h - 90, 0, h); g.addColorStop(0, 'rgba(10,6,6,0)'); g.addColorStop(1, 'rgba(10,6,6,.6)'); c.fillStyle = g; c.fillRect(0, h - 90, w, 90);
      c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(255,110,36,.5)'; c.fillRect(70 + r() * 240, 200 + r() * 70, 3 + r() * 8, 2); } c.globalCompositeOperation = 'source-atop';
    }, flow: () => 0.02, texture: (x, y, r) => (r() < 0.04 ? 0.22 : 0) });
}

/** Torre de cidade perdida: esqueleto de arranha-céu com andares vazados, topo quebrado e vergalhões. */
export function paintTower(seed = 1) {
  const rnd = mulberry32(seed * 23);
  return paintProp({ w: 260, h: 640, seed, palette: ['#120e10', '#3a3236', '#6a5e5e', '#a89488'], strokes: 1400, size: 18, rim: '#ff7a2a', inkAmt: 0.9, ao: false,
    shape(c, w, h) { const j = (x, y) => c.lineTo(x, y);
      c.beginPath(); c.moveTo(30, h - 6); j(26, 96); j(52, 80); j(70, 120); j(98, 58); j(128, 98); j(150, 30); j(176, 84); j(206, 64); j(232, 110); j(228, h - 6); c.closePath(); c.fill();
      c.globalCompositeOperation = 'destination-out';
      for (let row = 0; row < 15; row++) for (let col = 0; col < 5; col++) { if (rnd() < 0.18) continue; const x = 40 + col * 38, y = 130 + row * 34; if (y < 70 + Math.abs(col - 2) * 14) continue; c.fillRect(x, y, 24, 22); }
      for (let k = 0; k < 3; k++) c.fillRect(34 + rnd() * 160, 150 + rnd() * 340, 70 + rnd() * 40, 34 + rnd() * 30);
      c.globalCompositeOperation = 'source-over'; },
    details(c, w, h, r) {
      c.strokeStyle = 'rgba(8,6,8,.7)'; c.lineWidth = 3; for (let row = 0; row < 16; row++) { const y = 124 + row * 34; c.beginPath(); c.moveTo(24, y); c.lineTo(w - 24, y); c.stroke(); }
      for (let col = 0; col <= 5; col++) { c.beginPath(); c.moveTo(34 + col * 38, 100); c.lineTo(34 + col * 38, h - 10); c.stroke(); }
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,170,110,.18)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,6,8,.6)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 14; i++) { const x = 30 + r() * 200, y = 90 + r() * 300, L = 40 + r() * 140, gr = c.createLinearGradient(0, y, 0, y + L); gr.addColorStop(0, 'rgba(120,50,24,.45)'); gr.addColorStop(1, 'rgba(90,30,10,0)'); c.fillStyle = gr; c.fillRect(x, y, 3 + r() * 6, L); }
      c.strokeStyle = 'rgba(30,20,20,.95)'; c.lineWidth = 2; c.lineCap = 'round'; for (let i = 0; i < 9; i++) { const x = 50 + r() * 150, y = 56 + r() * 40; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 16, y - 18 - r() * 22); c.stroke(); }
      c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(255,120,40,.5)'; c.fillRect(44 + r() * 160, 140 + r() * 380, 18, 9); } c.globalCompositeOperation = 'source-atop';
    }, flow: () => -Math.PI / 2, texture: (x, y, r) => (r() < 0.03 ? 0.2 : 0) });
}
