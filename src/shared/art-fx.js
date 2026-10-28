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
