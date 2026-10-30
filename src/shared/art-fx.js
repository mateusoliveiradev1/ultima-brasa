// Texturas padrão dos efeitos (256×256) — pintadas por código, editáveis na Forja.
// Convenção: o "para frente" do efeito é o eixo +X da textura.
import { TAU, cv, mulberry32 } from './util.js';
import { rad, lin } from './art-chars.js';

const S = 256;
function base() { const c = cv(S); return [c, c.getContext('2d')]; }
const add = (ctx) => (ctx.globalCompositeOperation = 'lighter');

export function texSlash() {
  const [c, ctx] = base();
  // crescente apontando para +X: círculo externo à direita menos círculo interno
  ctx.save();
  ctx.beginPath(); ctx.arc(96, 128, 118, 0, TAU); ctx.clip();
  ctx.restore();
  const m = cv(S); const mx = m.getContext('2d');
  mx.fillStyle = '#fff'; mx.beginPath(); mx.arc(100, 128, 120, 0, TAU); mx.fill();
  mx.globalCompositeOperation = 'destination-out';
  mx.beginPath(); mx.arc(70, 128, 112, 0, TAU); mx.fill();
  // cor: núcleo claro na borda externa → laranja → vermelho nas pontas
  ctx.drawImage(m, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = rad(ctx, 70, 128, 80, 150, [[0, '#7a1c08'], [0.55, '#ff7a2a'], [0.9, '#ffe2a8'], [1, '#ffffff']]);
  ctx.fillRect(0, 0, S, S);
  // brilho + rastros
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = 'blur(6px)'; ctx.globalAlpha = 0.9; ctx.drawImage(c, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,245,210,.85)'; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const a = -0.9 + i * 0.3, r = 112 + (i % 2) * 4;
    ctx.lineWidth = 1.2 + (i % 3) * 0.6;
    ctx.beginPath(); ctx.arc(100, 128, r, a - 0.12, a + 0.12); ctx.stroke();
  }
  return c;
}

export function texFlame() {
  const [c, ctx] = base();
  add(ctx);
  const rnd = mulberry32(7);
  // gota de chama apontando para cima
  for (let i = 0; i < 5; i++) {
    const w = 62 - i * 9, h = 108 - i * 12, cy = 150 - i * 6;
    ctx.fillStyle = rad(ctx, 128, cy, 0, h, [[0, ['#ffffff', '#fff2c8', '#ffd98a', '#ffb347', '#ff7a2a'][i] ], [0.6, ['rgba(255,170,70,.5)', 'rgba(255,140,50,.45)', 'rgba(255,110,30,.4)', 'rgba(255,90,20,.35)', 'rgba(200,50,10,.3)'][i]], [1, 'rgba(120,20,5,0)']]);
    ctx.beginPath();
    ctx.moveTo(128, cy - h);
    ctx.bezierCurveTo(128 + w * 1.1, cy - h * 0.2, 128 + w, cy + h * 0.6, 128, cy + h * 0.55);
    ctx.bezierCurveTo(128 - w, cy + h * 0.6, 128 - w * 1.1, cy - h * 0.2, 128, cy - h);
    ctx.fill();
  }
  for (let i = 0; i < 6; i++) { // línguas
    const x = 128 + (rnd() - 0.5) * 60, y = 120 + rnd() * 30;
    ctx.fillStyle = rad(ctx, x, y, 0, 26, [[0, 'rgba(255,230,160,.55)'], [1, 'rgba(255,120,30,0)']]);
    ctx.beginPath(); ctx.ellipse(x, y - 12, 10, 28, (rnd() - 0.5) * 0.5, 0, TAU); ctx.fill();
  }
  return c;
}

export function texSpark() {
  const [c, ctx] = base();
  add(ctx);
  ctx.fillStyle = rad(ctx, 128, 128, 0, 60, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,230,170,.7)'], [1, 'rgba(255,140,40,0)']]);
  ctx.beginPath(); ctx.arc(128, 128, 60, 0, TAU); ctx.fill();
  // 4 pontas
  const spike = (len, th) => {
    ctx.fillStyle = lin(ctx, 128 - len, 128, 128 + len, 128, [[0, 'rgba(255,200,120,0)'], [0.5, 'rgba(255,255,255,1)'], [1, 'rgba(255,200,120,0)']]);
    ctx.beginPath(); ctx.moveTo(128 - len, 128); ctx.quadraticCurveTo(128, 128 - th, 128 + len, 128); ctx.quadraticCurveTo(128, 128 + th, 128 - len, 128); ctx.fill();
  };
  spike(120, 7);
  ctx.save(); ctx.translate(128, 128); ctx.rotate(Math.PI / 2); ctx.translate(-128, -128); spike(70, 5); ctx.restore();
  return c;
}

export function texSmoke() {
  const [c, ctx] = base();
  const rnd = mulberry32(21);
  for (let i = 0; i < 16; i++) {
    const a = rnd() * TAU, d = rnd() * 54, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, r = 34 + rnd() * 30;
    ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, 'rgba(120,108,100,.45)'], [1, 'rgba(60,50,46,0)']]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  return c;
}

export function texBolt() {
  const [c, ctx] = base();
  // raio horizontal que atravessa a textura (esticado entre dois pontos no jogo)
  const pts = [[0, 128]];
  const rnd = mulberry32(5);
  for (let x = 20; x < S; x += 20) pts.push([x, 128 + (rnd() - 0.5) * 70 * Math.sin((x / S) * Math.PI)]);
  pts.push([S, 128]);
  const stroke = (w, col, blur) => {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.shadowColor = col; ctx.shadowBlur = blur;
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore();
  };
  add(ctx);
  stroke(16, 'rgba(66,224,180,.35)', 24);
  stroke(8, 'rgba(120,255,220,.7)', 12);
  stroke(3.2, '#ffffff', 4);
  // ramificações
  for (let i = 2; i < pts.length - 2; i += 2) {
    ctx.strokeStyle = 'rgba(160,255,230,.7)'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i][0] + 14, pts[i][1] + (rnd() - 0.5) * 60); ctx.stroke();
  }
  return c;
}

export function texRing() {
  const [c, ctx] = base();
  add(ctx);
  ctx.fillStyle = rad(ctx, 128, 128, 0, 124, [[0, 'rgba(255,200,120,0)'], [0.72, 'rgba(255,160,70,.08)'], [0.86, 'rgba(255,220,150,.95)'], [0.93, 'rgba(255,255,255,1)'], [0.97, 'rgba(255,170,80,.4)'], [1, 'rgba(255,120,30,0)']]);
  ctx.beginPath(); ctx.arc(128, 128, 124, 0, TAU); ctx.fill();
  // fragmentos de energia ao redor
  const rnd = mulberry32(9);
  for (let i = 0; i < 28; i++) {
    const a = rnd() * TAU, r = 108 + rnd() * 14;
    ctx.fillStyle = 'rgba(255,240,200,.65)'; ctx.save(); ctx.translate(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); ctx.rotate(a);
    ctx.fillRect(-9 - rnd() * 8, -1.2, 18 + rnd() * 10, 2.4); ctx.restore();
  }
  return c;
}

export function texLance() {
  const [c, ctx] = base();
  add(ctx);
  // cabeça de lança apontando +X, com cauda de brasa
  ctx.fillStyle = lin(ctx, 10, 128, 240, 128, [[0, 'rgba(255,90,20,0)'], [0.45, 'rgba(255,130,40,.8)'], [0.8, 'rgba(255,230,160,1)'], [1, 'rgba(255,255,255,1)']]);
  ctx.beginPath(); ctx.moveTo(250, 128); ctx.lineTo(186, 112); ctx.lineTo(10, 124); ctx.lineTo(10, 132); ctx.lineTo(186, 144); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rad(ctx, 200, 128, 0, 44, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,200,110,.6)'], [1, 'rgba(255,100,20,0)']]);
  ctx.beginPath(); ctx.arc(200, 128, 44, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.beginPath(); ctx.moveTo(250, 128); ctx.lineTo(196, 120); ctx.lineTo(196, 136); ctx.closePath(); ctx.fill();
  return c;
}

export function texMeteor() {
  const [c, ctx] = base();
  const rnd = mulberry32(13);
  // rocha/sucata incandescente apontando para baixo com rastro acima
  add(ctx);
  ctx.fillStyle = lin(ctx, 128, 0, 128, 170, [[0, 'rgba(255,90,20,0)'], [1, 'rgba(255,170,70,.75)']]);
  ctx.beginPath(); ctx.moveTo(128, 0); ctx.lineTo(160, 150); ctx.lineTo(96, 150); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath();
  const pts = []; for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU, r = 40 + rnd() * 16; pts.push([128 + Math.cos(a) * r, 176 + Math.sin(a) * r * 0.9]); }
  ctx.moveTo(pts[0][0], pts[0][1]); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath();
  ctx.fillStyle = lin(ctx, 88, 136, 168, 216, [[0, '#7a5a48'], [1, '#1c1310']]); ctx.fill();
  ctx.strokeStyle = '#ff9a40'; ctx.lineWidth = 3; ctx.shadowColor = '#ff7a2a'; ctx.shadowBlur = 14;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(110 + rnd() * 40, 150 + rnd() * 20); ctx.lineTo(110 + rnd() * 40, 180 + rnd() * 30); ctx.stroke(); }
  ctx.shadowBlur = 0;
  add(ctx); ctx.fillStyle = rad(ctx, 128, 176, 0, 70, [[0, 'rgba(255,200,120,.5)'], [1, 'rgba(255,100,20,0)']]); ctx.beginPath(); ctx.arc(128, 176, 70, 0, TAU); ctx.fill();
  return c;
}

export function texImpact() {
  const [c, ctx] = base();
  add(ctx);
  ctx.fillStyle = rad(ctx, 128, 128, 0, 120, [[0, 'rgba(255,255,255,1)'], [0.2, 'rgba(255,220,150,.9)'], [0.55, 'rgba(255,120,40,.35)'], [1, 'rgba(180,40,10,0)']]);
  ctx.beginPath(); ctx.arc(128, 128, 120, 0, TAU); ctx.fill();
  for (let i = 0; i < 10; i++) {
    ctx.save(); ctx.translate(128, 128); ctx.rotate((i / 10) * TAU + 0.2);
    ctx.fillStyle = lin(ctx, 10, 0, 124, 0, [[0, 'rgba(255,255,255,.9)'], [1, 'rgba(255,150,50,0)']]);
    ctx.beginPath(); ctx.moveTo(10, -4); ctx.lineTo(124, 0); ctx.lineTo(10, 4); ctx.fill(); ctx.restore();
  }
  return c;
}

export function texToxicSpark() {
  const [c, ctx] = base();
  add(ctx);
  ctx.fillStyle = rad(ctx, 128, 128, 0, 60, [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(120,255,220,.8)'], [1, 'rgba(20,160,130,0)']]);
  ctx.beginPath(); ctx.arc(128, 128, 60, 0, TAU); ctx.fill();
  ctx.fillStyle = lin(ctx, 8, 128, 248, 128, [[0, 'rgba(120,255,220,0)'], [0.5, 'rgba(255,255,255,1)'], [1, 'rgba(120,255,220,0)']]);
  ctx.beginPath(); ctx.moveTo(8, 128); ctx.quadraticCurveTo(128, 120, 248, 128); ctx.quadraticCurveTo(128, 136, 8, 128); ctx.fill();
  return c;
}

// ───── fogo animado (flipbook procedural, laço perfeito) ─────
// Folha 4×4 de quadros 128×128. Ruído de valor periódico em y; o campo sobe exatamente um período por ciclo.
function vnoise(x, y, P) {
  const hash = (ix, iy) => { let h = (ix * 374761393 + (((iy % P) + P) % P) * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
const FIRE_PAL = {
  fire: [[0, 0, 0, 0], [0.12, 120, 14, 4], [0.3, 214, 52, 10], [0.5, 255, 120, 24], [0.7, 255, 196, 78], [0.9, 255, 240, 190], [1, 255, 255, 240]],
  toxic: [[0, 0, 0, 0], [0.12, 6, 70, 52], [0.3, 14, 150, 110], [0.5, 40, 214, 160], [0.7, 130, 255, 210], [0.9, 215, 255, 240], [1, 255, 255, 255]],
  violet: [[0, 0, 0, 0], [0.12, 50, 10, 90], [0.3, 110, 30, 170], [0.5, 190, 70, 230], [0.7, 240, 150, 255], [0.9, 255, 220, 255], [1, 255, 255, 255]],
};
function palAt(p, v, o) { v = Math.max(0, Math.min(1, v)); let i = 1; while (i < p.length - 1 && p[i][0] < v) i++; const a = p[i - 1], b = p[i], t = (v - a[0]) / (b[0] - a[0] || 1); for (let k = 0; k < 4; k++) o[k] = a[k + 1] + (b[k + 1] - a[k + 1]) * t; }
/** opts: palette 'fire'|'toxic'|'violet', seed, tall (altura), wide (largura), turb (turbulência), tongues (línguas laterais) */
export function texFireSheet(opts = {}) {
  const { palette = 'fire', seed = 3, tall = 1, wide = 1, turb = 1 } = opts, F = 128, N = 16, cols = 4, P = 8, pal = FIRE_PAL[palette] || FIRE_PAL.fire, sh = seed * 17.3;
  const sheet = cv(F * cols), sx = sheet.getContext('2d'), col = [0, 0, 0, 0];
  const fbm = (x, y, ph) => 0.55 * vnoise(x, y - ph * P, P) + 0.3 * vnoise(x * 2.1 + 7, (y - ph * P * 2) * 2.1, P * 2) + 0.15 * vnoise(x * 4.3 + 3, (y - ph * P * 4) * 4.3, P * 4);
  for (let f = 0; f < N; f++) {
    const ph = f / N, img = sx.createImageData(F, F), d = img.data;
    for (let py = 0; py < F; py++) for (let px = 0; px < F; px++) {
      const u = (px / (F - 1)) * 2 - 1, v = 1 - py / (F - 1); // v: 0 base → 1 topo
      const vv = (v - 0.04) / (0.92 * tall); if (vv < 0 || vv > 1.1) continue;
      const n1 = fbm(u * 1.6 * turb + sh, vv * 2.6, ph), warp = (n1 - 0.5) * 0.9 * (0.25 + vv) * turb;
      const n2 = fbm((u + warp) * 3.4 + sh * 2, vv * 2.1, ph);
      const wEnv = (0.46 * wide) * Math.pow(Math.max(0, 1 - Math.pow(vv, 1.55)), 0.85) + 0.05 * wide;
      const dd = Math.abs(u + warp * 0.8) / wEnv, body = Math.max(0, 1 - dd * dd);
      let val = body * (0.3 + 1.05 * n2) - vv * 0.5 + 0.06;
      val += Math.max(0, 0.45 - dd) * 0.36 * (1 - vv); // núcleo mais quente perto da base
      if (val <= 0.02) continue;
      palAt(pal, val * 0.92, col); const sstep = (a0, b0, x0) => { const q = Math.min(1, Math.max(0, (x0 - a0) / (b0 - a0))); return q * q * (3 - 2 * q); }; const a = Math.min(1, Math.max(0, (val - 0.03) * 3.0)) * (col[3] / 255 || 1) * (val < 0.12 ? val / 0.12 : 1) * sstep(0.0, 0.16, v) * sstep(1.0, 0.8, Math.abs(u)), k = (py * F + px) * 4;
      d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = Math.min(255, 255 * Math.min(1, a * 1.15));
    }
    const fc = cv(F), fx = fc.getContext('2d'); fx.putImageData(img, 0, 0);
    // suavização leve + halo
    sx.drawImage(fc, (f % cols) * F, Math.floor(f / cols) * F);
  }
  // halo de brilho atrás de cada quadro
  const out = cv(F * cols), ox = out.getContext('2d');
  for (let f = 0; f < N; f++) {
    const cx = (f % cols) * F, cy = Math.floor(f / cols) * F, fr = cv(F), fxx = fr.getContext('2d'); fxx.drawImage(sheet, cx, cy, F, F, 0, 0, F, F);
    ox.save(); ox.beginPath(); ox.rect(cx, cy, F, F); ox.clip(); ox.globalCompositeOperation = 'lighter';
    ox.filter = 'blur(5px)'; ox.globalAlpha = 0.55; ox.drawImage(fr, cx, cy); ox.filter = 'none'; ox.globalAlpha = 1; ox.drawImage(fr, cx, cy); ox.restore();
  }
  out.__sheet = { cols, rows: cols, n: N };
  return out;
}
export const texFireSheetToxic = () => texFireSheet({ palette: 'toxic', seed: 5 });
export const texFireSheetBig = () => texFireSheet({ seed: 8, wide: 0.92, tall: 1, turb: 1.2 });
export const texFireSheetTall = () => texFireSheet({ seed: 11, wide: 0.72, tall: 1.05, turb: 1.25 });

// ───── Fogo animado v2: línguas definidas, núcleo quente, pontas que soltam fumaça de brasa; 24 quadros em laço perfeito ─────
const sstep = (a, b, x) => { const q = Math.min(1, Math.max(0, (x - a) / (b - a))); return q * q * (3 - 2 * q); };
/** opts: palette 'fire'|'toxic'|'violet', seed, tall, wide, turb, tongues (nº de línguas visíveis, 2–6), F (tamanho do quadro) */
export function texFireSheetV2(opts = {}) {
  const { palette = 'fire', seed = 3, tall = 1, wide = 1, turb = 1, tongues = 4, F = 160 } = opts, N = 24, cols = 6, rows = 4, P = 8, pal = FIRE_PAL[palette] || FIRE_PAL.fire, sh = seed * 13.7, col = [0, 0, 0, 0];
  const sheet = cv(F * cols, F * rows), sx = sheet.getContext('2d');
  const fbm = (x, y, ph) => 0.5 * vnoise(x, y - ph * P, P) + 0.3 * vnoise(x * 2.1 + 7, (y - ph * P * 2) * 2.1, P * 2) + 0.2 * vnoise(x * 4.3 + 3, (y - ph * P * 4) * 4.3, P * 4);
  for (let f = 0; f < N; f++) {
    const ph = f / N, img = sx.createImageData(F, F), d = img.data;
    for (let py = 0; py < F; py++) for (let px = 0; px < F; px++) {
      const u = (px / (F - 1)) * 2 - 1, v = 1 - py / (F - 1), vv = (v - 0.03) / (0.94 * tall); if (vv < 0 || vv > 1.15) continue;
      // deformação de domínio: o fogo "respira" e ondula mais perto da ponta
      const w1 = (fbm(u * 1.5 * turb + sh, vv * 2.4, ph) - 0.5) * 1.15 * (0.12 + vv) * turb, w2 = (fbm(u * 2.8 + sh * 1.7 + 11, vv * 3.1, ph) - 0.5) * 0.5 * vv;
      const uu = u + w1 + w2;
      // envoltório: largo na base, afinando em ponta; várias línguas modulam a altura local
      const env = 0.5 * wide * Math.pow(Math.max(0, 1 - Math.pow(vv, 1.35)), 0.8) + 0.04 * wide;
      const lick = vnoise(uu * tongues * 0.9 + sh, vv * 3.2 - ph * P * 1.0, P), tip = 1 - vv * (0.55 + 0.75 * lick);
      const dd = Math.abs(uu) / env, body = Math.max(0, 1 - dd * dd) * Math.max(0, tip);
      const n2 = fbm(uu * 3.6 + sh * 2, vv * 2.2, ph), dens = body * (0.28 + 1.1 * n2) - vv * 0.34 + 0.04 + Math.max(0, 0.5 - dd) * 0.42 * (1 - vv);
      if (dens <= 0.01) continue;
      const val = sstep(0.04, 0.72, dens) * 0.92 + 0.08 * Math.min(1, dens), core = sstep(0.42, 1.0, dens) * Math.pow(Math.max(0, 1 - vv), 0.7);
      palAt(pal, Math.min(0.88, val * 0.72 + core * 0.24), col);
      const a = sstep(0.012, 0.2, dens) * sstep(0.0, 0.2, v) * sstep(1.0, 0.82, Math.abs(u)), k = (py * F + px) * 4;
      d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = Math.min(255, 255 * a);
    }
    const fc = cv(F), fx = fc.getContext('2d'); fx.putImageData(img, 0, 0);
    const ox = (f % cols) * F, oy = Math.floor(f / cols) * F;
    sx.save(); sx.beginPath(); sx.rect(ox, oy, F, F); sx.clip(); sx.drawImage(fc, ox, oy);
    sx.globalCompositeOperation = 'lighter'; sx.filter = `blur(${Math.round(F / 22)}px)`; sx.globalAlpha = 0.6; sx.drawImage(fc, ox, oy); // halo
    sx.filter = `blur(${Math.round(F / 9)}px)`; sx.globalAlpha = 0.3; sx.drawImage(fc, ox, oy); sx.filter = 'none'; sx.globalAlpha = 1;
    // máscara radial: o halo se dissolve antes da borda do quadro (sem cortes retos)
    sx.globalCompositeOperation = 'destination-in'; const mk = sx.createRadialGradient(ox + F / 2, oy + F * 0.56, F * 0.3, ox + F / 2, oy + F * 0.56, F * 0.5); mk.addColorStop(0, '#fff'); mk.addColorStop(1, 'rgba(255,255,255,0)'); sx.fillStyle = mk; sx.fillRect(ox, oy, F, F); sx.restore();
  }
  sheet.__sheet = { cols, rows, n: N };
  return sheet;
}
export const texFireV2 = () => texFireSheetV2({ seed: 11, wide: 0.78, tall: 1.05, turb: 1.2, tongues: 4 });
export const texFireV2Big = () => texFireSheetV2({ seed: 8, wide: 1.0, tall: 1, turb: 1.3, tongues: 5 });
export const texFireV2Toxic = () => texFireSheetV2({ palette: 'toxic', seed: 5, wide: 0.8, turb: 1.2, tongues: 4 });
export const texFireV2Violet = () => texFireSheetV2({ palette: 'violet', seed: 17, wide: 0.8, turb: 1.2, tongues: 4 });

/** Brasa voadora: núcleo incandescente com rastro afilado (aponta para +X; o motor estica pela velocidade). */
export function texEmber() {
  const [c, ctx] = base(); add(ctx);
  ctx.fillStyle = lin(ctx, 10, 128, 150, 128, [[0, 'rgba(255,90,20,0)'], [0.55, 'rgba(255,150,50,.55)'], [1, 'rgba(255,250,220,1)']]);
  ctx.beginPath(); ctx.moveTo(10, 128); ctx.quadraticCurveTo(90, 118, 150, 120); ctx.lineTo(150, 136); ctx.quadraticCurveTo(90, 138, 10, 128); ctx.fill();
  ctx.fillStyle = rad(ctx, 150, 128, 0, 46, [[0, 'rgba(255,255,240,1)'], [0.3, 'rgba(255,200,110,.9)'], [0.7, 'rgba(255,110,30,.35)'], [1, 'rgba(255,60,10,0)']]);
  ctx.beginPath(); ctx.arc(150, 128, 46, 0, TAU); ctx.fill();
  return c;
}

/** Fumaça de brasa animada: 16 quadros de baforadas que sobem, escurecem e se desfazem (laço). Mistura normal (não aditiva). */
export function texSmokeSheet(opts = {}) {
  const { seed = 4, F = 128 } = opts, N = 16, cols = 4, P = 8, sh = seed * 9.1, sheet = cv(F * cols), sx = sheet.getContext('2d');
  const fbm = (x, y, ph) => 0.55 * vnoise(x, y - ph * P, P) + 0.3 * vnoise(x * 2.1 + 5, (y - ph * P * 2) * 2.1, P * 2) + 0.15 * vnoise(x * 4.3, (y - ph * P * 4) * 4.3, P * 4);
  for (let f = 0; f < N; f++) {
    const ph = f / N, img = sx.createImageData(F, F), d = img.data;
    for (let py = 0; py < F; py++) for (let px = 0; px < F; px++) {
      const u = (px / (F - 1)) * 2 - 1, v = 1 - py / (F - 1), r = Math.hypot(u * 1.0, (v - 0.5) * 2.0), n = fbm(u * 2 + sh, v * 2.4, ph), dens = (1 - r * 1.2) * (0.4 + n * 1.0) - 0.14; if (dens <= 0) continue;
      const a = sstep(0, 0.5, dens) * 0.8, lit = 0.2 + 0.5 * n + 0.2 * (v - 0.5), k = (py * F + px) * 4;
      d[k] = 60 + lit * 70; d[k + 1] = 46 + lit * 52; d[k + 2] = 42 + lit * 46; d[k + 3] = 255 * a;
    }
    const fc = cv(F); fc.getContext('2d').putImageData(img, 0, 0); sx.drawImage(fc, (f % cols) * F, Math.floor(f / cols) * F);
  }
  sheet.__sheet = { cols, rows: cols, n: N }; return sheet;
}
