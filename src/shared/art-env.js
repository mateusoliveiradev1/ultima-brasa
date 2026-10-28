// Ambiente: chão rachado sem emendas, fachadas de prédios em ruínas.
import { TAU, cv, mulberry32, rgba } from './util.js';
import { rad, lin } from './art-chars.js';

function periodicNoise(size, cells, rnd) {
  const g = new Float32Array(cells * cells);
  for (let i = 0; i < g.length; i++) g[i] = rnd();
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = (x / size) * cells, fy = (y / size) * cells;
    const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = sm(fx - x0), ty = sm(fy - y0);
    const a = g[(y0 % cells) * cells + (x0 % cells)], b = g[(y0 % cells) * cells + ((x0 + 1) % cells)];
    const c = g[((y0 + 1) % cells) * cells + (x0 % cells)], d = g[((y0 + 1) % cells) * cells + ((x0 + 1) % cells)];
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}

// desenha duplicado nas bordas para ficar seamless
function wrapDraw(ctx, size, margin, fn) {
  for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
    ctx.save(); ctx.translate(ox * size, oy * size); fn(); ctx.restore();
  }
}

export function buildGround(size = 1024) {
  const c = cv(size);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(1234);
  const n1 = periodicNoise(size, 6, rnd), n2 = periodicNoise(size, 16, rnd), n3 = periodicNoise(size, 48, rnd), n4 = periodicNoise(size, 128, rnd);
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const v = n1(x, y) * 0.42 + n2(x, y) * 0.3 + n3(x, y) * 0.2 + n4(x, y) * 0.08;
    const rust = Math.max(0, n2(x + 311, y + 97) - 0.52) * 2.2;
    const ash = Math.max(0, n1(x + 500, y + 200) - 0.5) * 1.6;
    // base fuligem-terra
    let r = 34 + v * 46, g = 27 + v * 36, b = 24 + v * 32;
    r += rust * 44; g += rust * 12; b -= rust * 6;
    r += ash * 18; g += ash * 17; b += ash * 16;
    const i = (y * size + x) * 4;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  // placas de concreto/asfalto quebrado
  for (let k = 0; k < 7; k++) {
    const w = 130 + rnd() * 160, h = 90 + rnd() * 140, x = rnd() * size, y = rnd() * size, a = (rnd() - 0.5) * 0.4;
    wrapDraw(ctx, size, 0, () => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = 'rgba(64,56,52,.55)'; ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = 'rgba(8,6,6,.7)'; ctx.lineWidth = 3; ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = 'rgba(255,170,110,.07)'; ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
      ctx.restore();
    });
  }
  // manchas de ferrugem e óleo
  for (let k = 0; k < 34; k++) {
    const x = rnd() * size, y = rnd() * size, r = 20 + rnd() * 70, rustc = rnd() < 0.6;
    const col = rustc ? [120, 52, 24] : [8, 6, 8];
    wrapDraw(ctx, size, 0, () => {
      ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, `rgba(${col},${rustc ? 0.32 : 0.45})`], [1, `rgba(${col},0)`]]);
      ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.5 + rnd() * 0.5), rnd() * TAU, 0, TAU); ctx.fill();
    });
  }
  // rachaduras
  for (let k = 0; k < 18; k++) {
    let x = rnd() * size, y = rnd() * size, a = rnd() * TAU;
    const pts = [[x, y]];
    const len = 6 + (rnd() * 14) | 0;
    for (let s = 0; s < len; s++) { a += (rnd() - 0.5) * 1.1; x += Math.cos(a) * (14 + rnd() * 22); y += Math.sin(a) * (14 + rnd() * 22); pts.push([x, y]); }
    wrapDraw(ctx, size, 0, () => {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255,170,110,.06)'; ctx.lineWidth = 3;
      ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px + 1.5, py + 1.5) : ctx.moveTo(px + 1.5, py + 1.5))); ctx.stroke();
      ctx.strokeStyle = 'rgba(4,3,3,.55)'; ctx.lineWidth = 1.8;
      ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
    });
  }
  // pedriscos e cacos
  for (let k = 0; k < 360; k++) {
    const x = rnd() * size, y = rnd() * size, r = 1.5 + rnd() * 5.5, a = rnd() * TAU;
    wrapDraw(ctx, size, 0, () => {
      ctx.fillStyle = `rgba(0,0,0,.45)`; ctx.beginPath(); ctx.ellipse(x + 1.5, y + 2, r * 1.1, r * 0.7, a, 0, TAU); ctx.fill();
      const gv = 40 + rnd() * 26; ctx.fillStyle = `rgb(${gv + 6},${gv},${gv - 3})`;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.75, a, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,190,130,.18)'; ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.25, r * 0.5, r * 0.3, a, 0, TAU); ctx.fill();
    });
  }
  // ossos/cinzas claras esparsas
  for (let k = 0; k < 60; k++) {
    const x = rnd() * size, y = rnd() * size, r = 6 + rnd() * 16;
    wrapDraw(ctx, size, 0, () => {
      ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, 'rgba(180,168,155,.14)'], [1, 'rgba(180,168,155,0)']]);
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    });
  }
  return c;
}

export function buildFacade(seed = 1, w = 256, h = 512) {
  const c = cv(w, h);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed * 977 + 5);
  const base = [[44, 36, 34], [36, 32, 34], [48, 38, 32], [32, 30, 33]][seed % 4];
  ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, `rgb(${base.map((v) => v * 0.8)})`], [1, `rgb(${base.map((v) => v * 1.25)})`]]);
  ctx.fillRect(0, 0, w, h);
  // painéis
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
  for (let y = 0; y < h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  // janelas
  const cols = 6, rows = 14, cw = w / cols, rh = h / rows;
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    const x = q * cw + cw * 0.2, y = r * rh + rh * 0.2, ww = cw * 0.6, hh = rh * 0.58;
    const roll = rnd();
    if (roll < 0.1) continue; // parede desabada (sem janela)
    ctx.fillStyle = '#0b0807'; ctx.fillRect(x, y, ww, hh);
    if (roll > 0.94) { // luz quente ao longe
      ctx.fillStyle = rad(ctx, x + ww / 2, y + hh / 2, 0, ww, [[0, 'rgba(255,200,120,.95)'], [1, 'rgba(255,120,40,.0)']]); ctx.fillRect(x - ww / 2, y - hh / 2, ww * 2, hh * 2);
      ctx.fillStyle = '#ffc470'; ctx.fillRect(x + 2, y + 2, ww - 4, hh - 4);
    } else if (roll > 0.9) {
      ctx.fillStyle = 'rgba(66,224,180,.55)'; ctx.fillRect(x + 2, y + 2, ww - 4, hh - 4);
    } else if (roll > 0.5) {
      ctx.fillStyle = 'rgba(255,170,110,.05)'; ctx.fillRect(x, y, ww, hh * 0.4); // reflexo
    }
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2; ctx.strokeRect(x, y, ww, hh);
    // marca de fuligem acima
    ctx.fillStyle = rad(ctx, x + ww / 2, y, 0, ww, [[0, 'rgba(0,0,0,.4)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(x - 4, y - rh * 0.5, ww + 8, rh * 0.5);
  }
  // manchas de ferrugem e escorridos
  for (let i = 0; i < 18; i++) {
    const x = rnd() * w, len = 60 + rnd() * 240;
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']]);
    const g = ctx.createLinearGradient(0, rnd() * h, 0, rnd() * h + len);
    g.addColorStop(0, 'rgba(120,52,24,0)'); g.addColorStop(0.3, 'rgba(120,52,24,.3)'); g.addColorStop(1, 'rgba(120,52,24,0)');
    ctx.fillStyle = g; ctx.fillRect(x, 0, 3 + rnd() * 9, h);
  }
  // sujeira geral na base
  ctx.fillStyle = lin(ctx, 0, h * 0.7, 0, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.6)']]); ctx.fillRect(0, h * 0.7, w, h * 0.3);
  return c;
}
