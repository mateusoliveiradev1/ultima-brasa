// Biblioteca de texturas v2 (256×256): gelo, raio, vazio, sagrado, garras, rachaduras, runas, brilhos.
// Convenção: o "para frente" é +X. Tudo pintado em camadas (halo largo → corpo → núcleo branco) para brilhar bem em modo aditivo.
import { TAU, cv, mulberry32 } from './util.js';

const S = 256, C = 128;
const base = () => { const c = cv(S); return [c, c.getContext('2d')]; };
const add = (ctx) => (ctx.globalCompositeOperation = 'lighter');
const lin = (ctx, x0, y0, x1, y1, st) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
const rad = (ctx, x, y, r0, r1, st) => { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
// traço com halo: 3 passadas (largo e fraco → fino e branco)
function glowStroke(ctx, path, col, w, core = '#fff') {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [k, a, c] of [[3.4, 0.16, col], [2, 0.34, col], [1.1, 0.8, col], [0.42, 1, core]]) { ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = w * k; ctx.shadowColor = col; ctx.shadowBlur = w * k * 1.2; path(); ctx.stroke(); }
  ctx.restore();
}
const blurred = (c, px, a = 0.9) => { const o = cv(S), x = o.getContext('2d'); x.filter = `blur(${px}px)`; x.globalAlpha = a; x.drawImage(c, 0, 0); return o; };

/** cristal de gelo apontando +X: faces facetadas, brilho interno, cauda de geada */
export function texIceShard() {
  const [c, ctx] = base();
  const halo = rad(ctx, 150, C, 0, 120, [[0, 'rgba(160,230,255,.45)'], [1, 'rgba(60,140,255,0)']]); ctx.fillStyle = halo; ctx.fillRect(0, 0, S, S);
  // geada na cauda
  ctx.fillStyle = lin(ctx, 6, C, 150, C, [[0, 'rgba(120,200,255,0)'], [1, 'rgba(190,235,255,.55)']]); ctx.beginPath(); ctx.moveTo(6, C); ctx.lineTo(150, C - 22); ctx.lineTo(150, C + 22); ctx.closePath(); ctx.fill();
  const P = [[252, C], [176, C - 36], [88, C - 22], [60, C], [88, C + 22], [176, C + 36]];
  const poly = (pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
  // faces: superior clara, inferior escura, quebra no meio
  poly([P[0], P[1], P[2], P[3], [150, C]]); ctx.fillStyle = lin(ctx, 60, C - 36, 252, C, [[0, '#7fb8ff'], [0.6, '#d8f3ff'], [1, '#ffffff']]); ctx.fill();
  poly([P[0], [150, C], P[3], P[4], P[5]]); ctx.fillStyle = lin(ctx, 60, C + 36, 252, C, [[0, '#2f6fd0'], [0.6, '#6fb4f0'], [1, '#c6ecff']]); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; poly(P); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(150, C); ctx.lineTo(P[3][0], P[3][1]); ctx.moveTo(176, C - 36); ctx.lineTo(150, C); ctx.lineTo(176, C + 36); ctx.stroke();
  add(ctx); ctx.drawImage(blurred(c, 7, 0.8), 0, 0);
  ctx.fillStyle = rad(ctx, 236, C, 0, 26, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(160,230,255,0)']]); ctx.beginPath(); ctx.arc(236, C, 26, 0, TAU); ctx.fill();
  return c;
}

/** raio ramificado (esticável): corpo claro + ramos finos, tom azul-elétrico */
export function texLightning() {
  const [c, ctx] = base(); const rnd = mulberry32(21);
  const main = [[0, C]]; for (let x = 18; x < S; x += 18) main.push([x, C + (rnd() - 0.5) * 64 * Math.sin((x / S) * Math.PI)]); main.push([S, C]);
  const path = (pts) => () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
  add(ctx);
  for (let i = 3; i < main.length - 3; i += 2) { const [bx, by] = main[i], dir = rnd() < 0.5 ? -1 : 1, br = [[bx, by]]; let x = bx, y = by; for (let k = 0; k < 4; k++) { x += 12 + rnd() * 8; y += dir * (8 + rnd() * 14); br.push([x, y]); } glowStroke(ctx, path(br), '#7ab8ff', 1.8, '#dff0ff'); }
  glowStroke(ctx, path(main), '#5a9cff', 4.2, '#ffffff');
  ctx.fillStyle = rad(ctx, 10, C, 0, 22, [[0, 'rgba(255,255,255,.9)'], [1, 'rgba(120,180,255,0)']]); ctx.beginPath(); ctx.arc(10, C, 22, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(246, C, 22, 0, TAU); ctx.fill();
  return c;
}

/** redemoinho de vazio: braços em espiral, núcleo escuro e borda luminosa (deitado/girando) */
export function texVoid() {
  const [c, ctx] = base();
  ctx.fillStyle = rad(ctx, C, C, 10, 124, [[0, 'rgba(10,0,24,.95)'], [0.4, 'rgba(70,20,130,.5)'], [0.85, 'rgba(150,80,255,.18)'], [1, 'rgba(150,80,255,0)']]); ctx.beginPath(); ctx.arc(C, C, 124, 0, TAU); ctx.fill();
  add(ctx);
  for (let arm = 0; arm < 4; arm++) {
    const a0 = (arm / 4) * TAU, path = () => { ctx.beginPath(); for (let t = 0; t <= 1.001; t += 0.02) { const r = 14 + t * 106, a = a0 + t * 3.1; const x = C + Math.cos(a) * r, y = C + Math.sin(a) * r; t ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } };
    glowStroke(ctx, path, '#a05cff', 5, '#f0e0ff');
  }
  ctx.fillStyle = rad(ctx, C, C, 0, 34, [[0, 'rgba(0,0,0,1)'], [0.7, 'rgba(0,0,0,.9)'], [1, 'rgba(40,0,80,0)']]); ctx.globalCompositeOperation = 'source-over'; ctx.beginPath(); ctx.arc(C, C, 34, 0, TAU); ctx.fill();
  add(ctx); ctx.strokeStyle = 'rgba(230,200,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(C, C, 30, 0, TAU); ctx.stroke();
  return c;
}

/** estrela sagrada: raios finos + halo + anel */
export function texHoly() {
  const [c, ctx] = base(); add(ctx);
  ctx.fillStyle = rad(ctx, C, C, 0, 120, [[0, 'rgba(255,248,210,.9)'], [0.25, 'rgba(255,220,130,.35)'], [1, 'rgba(255,180,60,0)']]); ctx.beginPath(); ctx.arc(C, C, 120, 0, TAU); ctx.fill();
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU + 0.1, L = i % 2 ? 78 : 122, w = i % 2 ? 4 : 7; ctx.save(); ctx.translate(C, C); ctx.rotate(a); ctx.fillStyle = lin(ctx, 0, 0, L, 0, [[0, 'rgba(255,255,235,.95)'], [1, 'rgba(255,200,90,0)']]); ctx.beginPath(); ctx.moveTo(0, -w); ctx.lineTo(L, 0); ctx.lineTo(0, w); ctx.closePath(); ctx.fill(); ctx.restore(); }
  glowStroke(ctx, () => { ctx.beginPath(); ctx.arc(C, C, 62, 0, TAU); }, '#ffcf6a', 2.4, '#fff8d8');
  return c;
}

/** garras: três cortes paralelos curvos apontando +X */
export function texClaw() {
  const [c, ctx] = base(); add(ctx);
  [-1, 0, 1].forEach((k) => {
    const oy = k * 44, len = k === 0 ? 1 : 0.86;
    ctx.save(); ctx.translate(0, oy * 0.55);
    ctx.beginPath(); ctx.moveTo(18, C + 40 + oy * 0.1); ctx.quadraticCurveTo(C * 0.9, C - 20 * len + oy * 0.2, 236 * len + 10, C - 8 + oy * 0.15); ctx.quadraticCurveTo(C * 0.9, C + 12 + oy * 0.2, 18, C + 40 + oy * 0.1); ctx.closePath();
    ctx.fillStyle = lin(ctx, 18, 0, 246, 0, [[0, 'rgba(255,60,30,0)'], [0.4, 'rgba(255,120,60,.85)'], [0.85, 'rgba(255,236,200,1)'], [1, 'rgba(255,255,255,1)']]); ctx.fill();
    ctx.restore();
  });
  ctx.drawImage(blurred(c, 6, 0.9), 0, 0);
  return c;
}

/** rachaduras no chão: anel irregular com fendas radiais e brasa por dentro (deitado) */
export function texCracks() {
  const [c, ctx] = base(); const rnd = mulberry32(33); add(ctx);
  ctx.fillStyle = rad(ctx, C, C, 40, 124, [[0, 'rgba(255,120,40,0)'], [0.8, 'rgba(255,150,60,.18)'], [1, 'rgba(255,100,20,0)']]); ctx.beginPath(); ctx.arc(C, C, 124, 0, TAU); ctx.fill();
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU + rnd() * 0.2, pts = [[C + Math.cos(a) * 20, C + Math.sin(a) * 20]]; let r = 20, ang = a;
    while (r < 96 + rnd() * 26) { r += 12 + rnd() * 14; ang += (rnd() - 0.5) * 0.35; pts.push([C + Math.cos(ang) * r, C + Math.sin(ang) * r]); }
    glowStroke(ctx, () => { ctx.beginPath(); pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); }, '#ff8a2e', 2.6, '#fff0c0');
  }
  glowStroke(ctx, () => { ctx.beginPath(); ctx.arc(C, C, 100, 0, TAU); }, '#ff9a40', 2, '#ffe9b0');
  return c;
}

/** círculo mágico com runas (deitado): dois anéis, hexagrama e glifos */
export function texRune() {
  const [c, ctx] = base(); const rnd = mulberry32(8); add(ctx);
  ctx.fillStyle = rad(ctx, C, C, 20, 124, [[0, 'rgba(255,255,255,.08)'], [0.7, 'rgba(255,200,120,.07)'], [1, 'rgba(255,200,120,0)']]); ctx.beginPath(); ctx.arc(C, C, 124, 0, TAU); ctx.fill();
  const ring = (r) => () => { ctx.beginPath(); ctx.arc(C, C, r, 0, TAU); };
  glowStroke(ctx, ring(116), '#ffb347', 2.6, '#fff0cc'); glowStroke(ctx, ring(92), '#ffb347', 1.6, '#fff0cc');
  glowStroke(ctx, () => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU - Math.PI / 2, x = C + Math.cos(a) * 90, y = C + Math.sin(a) * 90; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); }, '#ffb347', 1.6, '#fff0cc');
  glowStroke(ctx, () => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + Math.PI / 6, x = C + Math.cos(a) * 90, y = C + Math.sin(a) * 90; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); }, '#ffb347', 1.6, '#fff0cc');
  for (let i = 0; i < 24; i++) { // glifos entre os anéis
    const a = (i / 24) * TAU, r = 104; ctx.save(); ctx.translate(C + Math.cos(a) * r, C + Math.sin(a) * r); ctx.rotate(a + Math.PI / 2);
    glowStroke(ctx, () => { ctx.beginPath(); const k = (rnd() * 3) | 0; if (k === 0) { ctx.moveTo(-3, -5); ctx.lineTo(3, 5); ctx.moveTo(3, -5); ctx.lineTo(-3, 5); } else if (k === 1) { ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); } else { ctx.moveTo(-4, 5); ctx.lineTo(0, -6); ctx.lineTo(4, 5); } }, '#ffd98a', 1.2, '#fff');
    ctx.restore();
  }
  ctx.fillStyle = rad(ctx, C, C, 0, 22, [[0, 'rgba(255,240,200,.9)'], [1, 'rgba(255,180,60,0)']]); ctx.beginPath(); ctx.arc(C, C, 22, 0, TAU); ctx.fill();
  return c;
}

/** brilho de quatro pontas (estrela) */
export function texStar() {
  const [c, ctx] = base(); add(ctx);
  ctx.fillStyle = rad(ctx, C, C, 0, 70, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,235,190,.5)'], [1, 'rgba(255,160,60,0)']]); ctx.beginPath(); ctx.arc(C, C, 70, 0, TAU); ctx.fill();
  for (const [L, w, rot] of [[124, 7, 0], [124, 7, Math.PI / 2], [64, 5, Math.PI / 4], [64, 5, -Math.PI / 4]]) { ctx.save(); ctx.translate(C, C); ctx.rotate(rot); ctx.fillStyle = lin(ctx, -L, 0, L, 0, [[0, 'rgba(255,220,150,0)'], [0.5, 'rgba(255,255,255,1)'], [1, 'rgba(255,220,150,0)']]); ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, -w); ctx.lineTo(L, 0); ctx.lineTo(0, w); ctx.closePath(); ctx.fill(); ctx.restore(); }
  return c;
}

/** orbe de energia: núcleo branco, casca colorida, anel fino e centelhas */
export function texOrb() {
  const [c, ctx] = base(); const rnd = mulberry32(4); add(ctx);
  ctx.fillStyle = rad(ctx, C, C, 0, 120, [[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,230,180,.95)'], [0.4, 'rgba(255,150,60,.55)'], [0.75, 'rgba(255,90,20,.14)'], [1, 'rgba(255,60,0,0)']]); ctx.beginPath(); ctx.arc(C, C, 120, 0, TAU); ctx.fill();
  glowStroke(ctx, () => { ctx.beginPath(); ctx.arc(C, C, 52, 0, TAU); }, '#ffb060', 1.6, '#fff4dc');
  for (let i = 0; i < 18; i++) { const a = rnd() * TAU, r = 60 + rnd() * 50; ctx.fillStyle = `rgba(255,${200 + ((rnd() * 55) | 0)},140,${0.5 + rnd() * 0.5})`; ctx.beginPath(); ctx.arc(C + Math.cos(a) * r, C + Math.sin(a) * r, 1.4 + rnd() * 2.4, 0, TAU); ctx.fill(); }
  return c;
}

/** nuvem de bolhas/esporos (tóxico) */
export function texSpores() {
  const [c, ctx] = base(); const rnd = mulberry32(12);
  ctx.fillStyle = rad(ctx, C, C, 0, 122, [[0, 'rgba(120,255,200,.35)'], [0.6, 'rgba(40,180,130,.18)'], [1, 'rgba(20,120,90,0)']]); ctx.beginPath(); ctx.arc(C, C, 122, 0, TAU); ctx.fill();
  add(ctx);
  for (let i = 0; i < 34; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * 100, R = 5 + rnd() * 16, x = C + Math.cos(a) * r, y = C + Math.sin(a) * r;
    ctx.fillStyle = rad(ctx, x - R * 0.3, y - R * 0.3, 0, R, [[0, 'rgba(240,255,250,.9)'], [0.5, 'rgba(66,224,180,.35)'], [1, 'rgba(10,90,70,.0)']]); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(180,255,230,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, R * 0.92, 0, TAU); ctx.stroke(); }
  return c;
}

/** meia-lua dupla (corte em X / estrela de lâminas) para golpes giratórios */
export function texSlashX() {
  const [c, ctx] = base(); add(ctx);
  for (const rot of [0.55, -0.55]) {
    ctx.save(); ctx.translate(C, C); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(-118, 0); ctx.quadraticCurveTo(0, -34, 118, 0); ctx.quadraticCurveTo(0, -8, -118, 0); ctx.closePath();
    ctx.fillStyle = lin(ctx, -118, 0, 118, 0, [[0, 'rgba(255,90,40,0)'], [0.5, 'rgba(255,245,220,1)'], [1, 'rgba(255,90,40,0)']]); ctx.fill(); ctx.restore();
  }
  ctx.drawImage(blurred(c, 6, 0.9), 0, 0);
  return c;
}

/** fumaça-anel: onda de fumaça com bordas macias (deitada) */
export function texSmokeRing() {
  const [c, ctx] = base(); const rnd = mulberry32(2);
  for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU, r = 96 + (rnd() - 0.5) * 14, R = 14 + rnd() * 14, x = C + Math.cos(a) * r, y = C + Math.sin(a) * r;
    ctx.fillStyle = rad(ctx, x, y, 0, R, [[0, 'rgba(230,220,210,.55)'], [0.6, 'rgba(160,150,140,.28)'], [1, 'rgba(110,100,95,0)']]); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); }
  return c;
}

/** gota/lasca de sangue de ferrugem: respingo para impactos */
export function texSplat() {
  const [c, ctx] = base(); const rnd = mulberry32(17); add(ctx);
  ctx.fillStyle = rad(ctx, C, C, 0, 60, [[0, 'rgba(255,245,220,1)'], [0.35, 'rgba(255,150,70,.8)'], [1, 'rgba(255,60,20,0)']]); ctx.beginPath(); ctx.arc(C, C, 60, 0, TAU); ctx.fill();
  for (let i = 0; i < 14; i++) { const a = rnd() * TAU, L = 50 + rnd() * 70, w = 4 + rnd() * 7; ctx.save(); ctx.translate(C, C); ctx.rotate(a); ctx.fillStyle = lin(ctx, 10, 0, L, 0, [[0, 'rgba(255,220,160,.95)'], [1, 'rgba(255,80,30,0)']]); ctx.beginPath(); ctx.moveTo(10, -w); ctx.quadraticCurveTo(L * 0.6, -w * 0.6, L, 0); ctx.quadraticCurveTo(L * 0.6, w * 0.6, 10, w); ctx.closePath(); ctx.fill(); ctx.restore(); }
  return c;
}
