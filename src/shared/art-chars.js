// Arte dos personagens, pintada por código. Cada sheet = N frames lado a lado.
// A luz de contorno (rim light) é feita no shader, então aqui só pintamos silhueta + volume.
import { TAU, cv, mulberry32, rgba } from './util.js';
import { PAL } from './theme.js';

// ───────────── helpers de pintura ─────────────
function smooth(ctx, pts, close = true) {
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  ctx.beginPath();
  if (close) {
    const s = mid(pts[n - 1], pts[0]);
    ctx.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n], m = mid(p, q);
      ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) {
      const m = mid(pts[i], pts[i + 1]);
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
    }
    ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
  }
}
function poly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}
function lin(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}
function rad(ctx, x, y, r0, r1, stops) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}
function glow(ctx, x, y, r, color, a = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, rgba(color, a)], [0.4, rgba(color, a * 0.35)], [1, rgba(color, 0)]]);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.restore();
}
// membro cônico com pontas arredondadas
function limb(ctx, x0, y0, x1, y1, w0, w1, fill) {
  const a = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
  const c = Math.cos(a), s = Math.sin(a);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x0 + c * w0 / 2, y0 + s * w0 / 2);
  ctx.lineTo(x1 + c * w1 / 2, y1 + s * w1 / 2);
  ctx.arc(x1, y1, w1 / 2, a, a + Math.PI, false);
  ctx.lineTo(x0 - c * w0 / 2, y0 - s * w0 / 2);
  ctx.arc(x0, y0, w0 / 2, a + Math.PI, a + TAU, false);
  ctx.closePath();
  ctx.fill();
}
function patches(ctx, rnd, n, x0, y0, x1, y1, colors, rmin, rmax, alpha) {
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0), r = rmin + rnd() * (rmax - rmin);
    const col = colors[(rnd() * colors.length) | 0];
    ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, rgba(col, alpha)], [1, rgba(col, 0)]]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
}
function rivets(ctx, pts, r, col = '#2a1e19', hi = 'rgba(255,170,100,.35)') {
  pts.forEach(([x, y]) => {
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = hi; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, TAU); ctx.fill();
  });
}
// leve ruído de superfície dentro da forma atual (usa clip já aplicado)
function grime(ctx, rnd, x0, y0, x1, y1, n = 26) {
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0);
    ctx.strokeStyle = `rgba(0,0,0,${0.1 + rnd() * 0.18})`;
    ctx.lineWidth = 1 + rnd() * 1.6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rnd() - 0.5) * 10, y + 4 + rnd() * 16); ctx.stroke();
  }
}

// ───────────── GUARDIÃO (jogador) ─────────────
function drawGuardian(ctx, f) {
  const ph = (f / 4) * TAU, sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 3.5, by = -bob;
  const rnd = mulberry32(11);
  // perna de trás
  limb(ctx, 62 - sw * 6, 140 + by, 60 - sw * 12, 176, 13, 10, '#150f0d');
  limb(ctx, 60 - sw * 12, 172, 66 - sw * 12, 177, 11, 12, '#1d1411');
  // mochila + canos
  ctx.fillStyle = lin(ctx, 36, 96, 54, 132, [[0, '#3b2c25'], [1, '#18110f']]);
  ctx.beginPath(); ctx.roundRect(34, 96 + by, 18, 36, 5); ctx.fill();
  ctx.fillStyle = '#6e3a22'; ctx.fillRect(34, 108 + by, 18, 3); ctx.fillRect(34, 122 + by, 18, 3);
  limb(ctx, 38, 98 + by, 33, 80 + by, 5, 5, '#53311f');
  glow(ctx, 44, 117 + by, 7, PAL.toxic, 0.9); // medidor tóxico (acento raro)
  ctx.fillStyle = '#bfffee'; ctx.beginPath(); ctx.arc(44, 117 + by, 1.8, 0, TAU); ctx.fill();

  // manto
  const hemsw = -sw * 3.5;
  const cloak = [
    [44, 86], [58, 77], [76, 77], [90, 88], [93, 112], [97, 140], [90, 156 + hemsw * 0.3],
    [82, 149], [76, 162], [67, 152 + hemsw], [59, 165], [51, 154], [43, 163 + hemsw], [38, 148], [35, 120], [38, 98],
  ].map(([x, y]) => [x + (y > 110 ? hemsw * (y - 110) / 50 - 3 : 0), y + by * (y < 110 ? 1 : 0.35)]);
  smooth(ctx, cloak);
  ctx.fillStyle = lin(ctx, 40, 80, 92, 160, [[0, '#3a2c27'], [0.55, '#241a17'], [1, '#110b0a']]);
  ctx.fill();
  ctx.save(); ctx.clip();
  patches(ctx, rnd, 9, 34, 84, 96, 164, [PAL.rust, '#7a3216', '#53231a'], 6, 15, 0.55);
  grime(ctx, rnd, 36, 90, 94, 160, 30);
  // dobras
  ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(50 + i * 11, 96); ctx.quadraticCurveTo(48 + i * 11 + hemsw, 125, 46 + i * 12 + hemsw, 160); ctx.stroke(); }
  // luz quente vinda da lanterna (lado direito)
  ctx.fillStyle = rad(ctx, 104, 122 + by, 4, 60, [[0, 'rgba(255,150,70,.5)'], [1, 'rgba(255,150,70,0)']]);
  ctx.fillRect(30, 70, 80, 100);
  ctx.restore();
  // cinto
  ctx.fillStyle = '#5e3320'; ctx.fillRect(40, 119 + by * 0.6, 54, 4);
  ctx.fillStyle = '#c28a3a'; ctx.fillRect(64, 118 + by * 0.6, 6, 6);

  // perna da frente
  limb(ctx, 70, 140 + by, 70 + sw * 12, 176, 14, 11, '#241a15');
  limb(ctx, 70 + sw * 12, 172, 78 + sw * 12, 178, 12, 13, '#33231b');
  ctx.fillStyle = 'rgba(255,160,90,.28)'; ctx.fillRect(72 + sw * 12, 174, 8, 2);

  // cachecol (cauda balançando)
  const tail = [[56, 88 + by], [40 + sw * 3, 92 + by], [22 + sw * 6, 100 + by + 2], [10 + sw * 8, 112 + by - 3], [24 + sw * 6, 108 + by], [42 + sw * 3, 100 + by]];
  smooth(ctx, tail);
  ctx.fillStyle = lin(ctx, 10, 90, 56, 100, [[0, '#6a2512'], [1, '#b24a24']]); ctx.fill();
  ctx.fillStyle = lin(ctx, 52, 78, 90, 94, [[0, '#a8431f'], [1, '#d9622f']]);
  ctx.beginPath(); ctx.roundRect(52, 78 + by, 40, 14, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(60, 80 + by); ctx.lineTo(62, 91 + by); ctx.moveTo(74, 80 + by); ctx.lineTo(76, 91 + by); ctx.stroke();

  // capuz
  const hood = [[44, 66], [47, 48], [62, 38], [80, 42], [91, 58], [88, 76], [72, 82], [54, 80]].map(([x, y]) => [x, y + by]);
  smooth(ctx, hood);
  ctx.fillStyle = lin(ctx, 44, 38, 90, 80, [[0, '#46372f'], [1, '#1a1210']]); ctx.fill();
  ctx.save(); ctx.clip(); patches(ctx, rnd, 3, 44, 40, 90, 80, [PAL.rust], 5, 10, 0.5); ctx.restore();
  // rosto na sombra
  ctx.fillStyle = '#080504';
  ctx.beginPath(); ctx.ellipse(77, 63 + by, 12, 13, 0.1, 0, TAU); ctx.fill();
  // óculos
  ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(66, 61 + by); ctx.lineTo(92, 61 + by); ctx.stroke();
  [[73, 61], [84, 61]].forEach(([x, y]) => {
    ctx.fillStyle = '#2b1e17'; ctx.beginPath(); ctx.arc(x, y + by, 5.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd28a'; ctx.beginPath(); ctx.arc(x, y + by, 3.6, 0, TAU); ctx.fill();
    glow(ctx, x, y + by, 12, PAL.glow, 0.75);
  });

  // braço + lanterna
  limb(ctx, 82, 92 + by, 95, 104 + by + sw, 9, 7, '#2a1e19');
  limb(ctx, 95, 104 + by + sw, 103, 112 + by + sw, 7, 6, '#1b1311');
  const ly = 114 + by + sw;
  ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(103, 110 + by + sw); ctx.lineTo(103, ly + 2); ctx.stroke();
  glow(ctx, 103, ly + 14, 38, PAL.ember, 0.55);
  ctx.fillStyle = '#1b1311'; ctx.fillRect(97, ly, 13, 3); ctx.fillRect(97, ly + 24, 13, 3);
  ctx.fillStyle = rad(ctx, 103.5, ly + 14, 0, 12, [[0, '#fffbe8'], [0.35, '#ffd98a'], [1, '#ff7a2a']]);
  ctx.beginPath(); ctx.roundRect(98, ly + 2, 11, 22, 3); ctx.fill();
  ctx.strokeStyle = '#1b1311'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(101.5, ly + 3); ctx.lineTo(101.5, ly + 23); ctx.moveTo(106, ly + 3); ctx.lineTo(106, ly + 23); ctx.stroke();
  glow(ctx, 103.5, ly + 14, 20, PAL.flame, 0.9);
}

// ───────────── SAQUEADOR ─────────────
function drawRaider(ctx, f) {
  const ph = (f / 4) * TAU, sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 3, by = -bob;
  const rnd = mulberry32(23);
  // pernas
  limb(ctx, 62, 138 + by, 60 - sw * 11, 176, 12, 9, '#1b1c21');
  limb(ctx, 60 - sw * 11, 172, 66 - sw * 11, 177, 10, 11, '#101012');
  limb(ctx, 72, 138 + by, 72 + sw * 11, 176, 13, 10, '#2a2b32');
  limb(ctx, 72 + sw * 11, 172, 80 + sw * 11, 178, 11, 12, '#17171a');
  // tronco curvado para frente
  const torso = [[52, 88], [64, 82], [78, 88], [84, 104], [80, 128], [74, 142], [60, 142], [54, 124]].map(([x, y]) => [x + (y < 110 ? 5 : 0), y + by * (y < 120 ? 1 : 0.4)]);
  smooth(ctx, torso);
  ctx.fillStyle = lin(ctx, 46, 82, 88, 144, [[0, '#4b4044'], [1, '#231d20']]); ctx.fill();
  ctx.save(); ctx.clip();
  patches(ctx, rnd, 7, 44, 84, 90, 146, ['#6e3a22', '#2d2430', '#7a3216'], 5, 12, 0.5);
  grime(ctx, rnd, 44, 86, 90, 146, 22);
  // tiras de pneu (armadura)
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#121214'; ctx.save(); ctx.translate(66, 96 + i * 15 + by); ctx.rotate(-0.25);
    ctx.fillRect(-18, -4, 36, 9); ctx.fillStyle = 'rgba(255,170,110,.2)'; ctx.fillRect(-18, -4, 36, 2); ctx.restore();
  }
  ctx.restore();
  // ombreira com espinhos
  ctx.fillStyle = lin(ctx, 66, 80, 90, 98, [[0, '#7a7e82'], [1, '#2d3033']]);
  ctx.beginPath(); ctx.ellipse(80, 90 + by, 12, 8, -0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8b8f93';
  [[74, 83, 70, 70], [82, 82, 84, 69], [89, 87, 98, 78]].forEach(([x, y, tx, ty]) => {
    ctx.beginPath(); ctx.moveTo(x - 3, y + by + 2); ctx.lineTo(tx, ty + by); ctx.lineTo(x + 3, y + by + 2); ctx.closePath(); ctx.fill();
  });
  // cabeça: máscara de gás + capacete
  ctx.fillStyle = lin(ctx, 56, 52, 90, 88, [[0, '#51463f'], [1, '#231d1a']]);
  ctx.beginPath(); ctx.ellipse(72, 66 + by, 17, 18, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#18191d'; ctx.beginPath(); ctx.roundRect(70, 66 + by, 22, 17, 6); ctx.fill();
  ctx.fillStyle = '#34383d'; ctx.beginPath(); ctx.arc(84, 78 + by, 6, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#0d0e10'; ctx.lineWidth = 1.5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(80, 78 + by + i * 3); ctx.lineTo(88, 78 + by + i * 3); ctx.stroke(); }
  // olhos vermelhos
  ctx.fillStyle = '#ff6a50'; ctx.beginPath(); ctx.ellipse(78, 63 + by, 4.5, 3, 0.15, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(88, 63 + by, 3.2, 2.6, 0.15, 0, TAU); ctx.fill();
  glow(ctx, 83, 63 + by, 16, '#ff4a3a', 0.85);
  // bandana vermelha flamulante
  smooth(ctx, [[56, 56 + by], [46 + sw * 3, 60 + by], [30 + sw * 6, 66 + by + 3], [42 + sw * 3, 64 + by - 2]]);
  ctx.fillStyle = '#a02a22'; ctx.fill();
  ctx.fillStyle = '#b8332a'; ctx.beginPath(); ctx.roundRect(56, 52 + by, 30, 8, 4); ctx.fill();
  // arma: cano/pé-de-cabra erguido, balançando
  const a = -0.9 + sw * 0.18;
  ctx.save(); ctx.translate(88, 106 + by); ctx.rotate(a);
  ctx.fillStyle = lin(ctx, 0, -4, 0, 4, [[0, '#8d9296'], [1, '#3a3d40']]); ctx.fillRect(-4, -3, 48, 6);
  ctx.fillStyle = '#6e3a22'; ctx.fillRect(10, -3, 10, 6);
  ctx.fillStyle = '#9ea3a7'; ctx.beginPath(); ctx.moveTo(44, -3); ctx.lineTo(54, -9); ctx.lineTo(54, -3); ctx.closePath(); ctx.fill();
  ctx.restore();
  limb(ctx, 82, 96 + by, 90, 108 + by, 10, 8, '#33292d');
  ctx.fillStyle = '#1a1417'; ctx.beginPath(); ctx.arc(90, 108 + by, 5, 0, TAU); ctx.fill();
}

// ───────────── CARNIÇAL (mutante) ─────────────
function drawGhoul(ctx, f) {
  const ph = (f / 4) * TAU, sw = Math.sin(ph), lurch = Math.cos(ph) * 3;
  const rnd = mulberry32(37);
  // pernas curtas
  limb(ctx, 64, 140, 58 - sw * 9, 176, 15, 11, '#3f4742');
  limb(ctx, 74, 140, 78 + sw * 9, 176, 16, 12, '#505850');
  // corcunda
  const body = [[42, 118 + lurch], [40, 96], [52, 78], [70, 76], [84, 86], [92, 104], [90, 128], [78, 146], [58, 148], [46, 138]];
  smooth(ctx, body);
  ctx.fillStyle = lin(ctx, 40, 76, 92, 148, [[0, '#7b8578'], [0.5, '#56605a'], [1, '#2b322f']]); ctx.fill();
  ctx.save(); ctx.clip();
  patches(ctx, rnd, 8, 38, 78, 94, 148, ['#2c4d3f', '#8a6a5a', '#222a27'], 5, 13, 0.5);
  // veias
  ctx.strokeStyle = 'rgba(20,40,34,.65)'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); let x = 44 + rnd() * 44, y = 82 + rnd() * 20; ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 12; y += 8 + rnd() * 8; ctx.lineTo(x, y); } ctx.stroke(); }
  ctx.restore();
  // pústulas tóxicas
  [[52, 92, 7], [62, 108, 5.5], [46, 114, 6], [72, 90, 4.5], [58, 130, 5]].forEach(([x, y, r]) => {
    ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, '#d6fff1'], [0.5, '#42e0b4'], [1, '#127a66']]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    glow(ctx, x, y, r * 2.8, PAL.toxic, 0.55);
  });
  // trapo na cintura
  smooth(ctx, [[48, 132], [76, 130], [88, 140], [80, 156 + lurch * 0.4], [66, 150], [56, 160], [46, 148]]);
  ctx.fillStyle = '#3a2a22'; ctx.fill();
  // braços longos
  const arm = (sx, sy, ex, ey, col) => { limb(ctx, sx, sy, (sx + ex) / 2 + 6, (sy + ey) / 2, 12, 9, col); limb(ctx, (sx + ex) / 2 + 6, (sy + ey) / 2, ex, ey, 9, 7, col);
    ctx.strokeStyle = '#1a201d'; ctx.lineWidth = 2; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + 6, ey + 7 + i * 2); ctx.stroke(); } };
  arm(60, 92, 56 + sw * 10, 154, '#46504a');
  arm(86, 96, 100 - sw * 10, 150, '#5e685f');
  // cabeça pequena, baixa
  ctx.fillStyle = lin(ctx, 70, 70, 100, 100, [[0, '#8a9486'], [1, '#434b45']]);
  ctx.beginPath(); ctx.ellipse(88, 82 + lurch * 0.4, 12, 11, 0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0c1210'; ctx.beginPath(); ctx.ellipse(94, 88 + lurch * 0.4, 7, 4, 0.1, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d9fff4'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(89 + i * 3.4, 86 + lurch * 0.4); ctx.lineTo(90.5 + i * 3.4, 91 + lurch * 0.4); ctx.lineTo(92 + i * 3.4, 86 + lurch * 0.4); ctx.fill(); }
  [[84, 78], [93, 77]].forEach(([x, y]) => { ctx.fillStyle = '#eaffff'; ctx.beginPath(); ctx.arc(x, y + lurch * 0.4, 2.4, 0, TAU); ctx.fill(); glow(ctx, x, y + lurch * 0.4, 13, PAL.toxic, 0.95); });
}

// ───────────── DRONE ─────────────
function drawDrone(ctx, f) {
  const ph = (f / 4) * TAU, hov = Math.sin(ph) * 2;
  const rnd = mulberry32(51);
  const cx = 64, cy = 104 + hov;
  // jato inferior
  glow(ctx, cx, cy + 34, 26, PAL.ember, 0.55 + 0.2 * Math.sin(ph * 2));
  ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.roundRect(cx - 9, cy + 24, 18, 10, 3); ctx.fill();
  ctx.fillStyle = '#ffd28a'; ctx.beginPath(); ctx.ellipse(cx, cy + 35, 6, 3 + Math.sin(ph * 2) * 1, 0, 0, TAU); ctx.fill();
  // corpo esférico enferrujado
  ctx.fillStyle = rad(ctx, cx - 10, cy - 12, 3, 40, [[0, '#a8826c'], [0.35, '#6c4a39'], [1, '#1c1310']]);
  ctx.beginPath(); ctx.arc(cx, cy, 30, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, 30, 0, TAU); ctx.clip();
  patches(ctx, rnd, 10, cx - 30, cy - 30, cx + 30, cy + 30, [PAL.rust, '#2a1c15', '#7a3216'], 4, 10, 0.55);
  ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(cx, cy, 30, 10, 0, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, cy, 11, 30, 0, 0, TAU); ctx.stroke();
  grime(ctx, rnd, cx - 30, cy - 20, cx + 30, cy + 30, 14);
  ctx.restore();
  rivets(ctx, [[cx - 22, cy - 8], [cx + 22, cy - 6], [cx - 17, cy + 15], [cx + 18, cy + 17], [cx - 3, cy - 27]], 1.8);
  // lente
  ctx.fillStyle = '#120b09'; ctx.beginPath(); ctx.arc(cx + 8, cy + 2, 13, 0, TAU); ctx.fill();
  ctx.fillStyle = rad(ctx, cx + 8, cy + 2, 0, 10, [[0, '#fff0e0'], [0.3, '#ff6a50'], [1, '#7a120c']]);
  ctx.beginPath(); ctx.arc(cx + 8, cy + 2, 9.5, 0, TAU); ctx.fill();
  glow(ctx, cx + 8, cy + 2, 28, '#ff4a3a', 0.85);
  // antena
  ctx.strokeStyle = '#2a1c15'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 14, cy - 28); ctx.lineTo(cx - 22, cy - 46); ctx.stroke();
  ctx.fillStyle = '#ff6a50'; ctx.beginPath(); ctx.arc(cx - 22, cy - 46, 2.4, 0, TAU); ctx.fill(); glow(ctx, cx - 22, cy - 46, 9, '#ff4a3a', 0.8);
  // rotor (borrão rotativo)
  const ry = cy - 34;
  ctx.fillStyle = '#1a1210'; ctx.fillRect(cx - 3, ry, 6, 8);
  ctx.save(); ctx.translate(cx, ry);
  ctx.fillStyle = 'rgba(90,70,60,.5)'; ctx.beginPath(); ctx.ellipse(0, 0, 54, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(30,20,16,.8)'; ctx.beginPath(); ctx.ellipse(0, 0, 50, 5, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 2; i++) { const a = ph + i * Math.PI; ctx.fillStyle = '#6a625c'; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 34, Math.sin(a) * 4, 15, 2.2, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ───────────── BRUTO ─────────────
function drawBrute(ctx, f, ox = 0) {
  const ph = (f / 4) * TAU, sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 4, by = -bob;
  const rnd = mulberry32(67);
  // pernas pesadas
  limb(ctx, 82, 168 + by, 78 - sw * 10, 212, 26, 20, '#2b2220');
  limb(ctx, 78 - sw * 10, 206, 88 - sw * 10, 214, 22, 24, '#1a1311');
  limb(ctx, 112, 168 + by, 116 + sw * 10, 212, 28, 22, '#3a2d29');
  limb(ctx, 116 + sw * 10, 206, 128 + sw * 10, 215, 24, 26, '#241a17');
  // tronco
  const t = [[62, 112], [88, 92], [124, 94], [146, 112], [150, 148], [138, 178], [100, 184], [70, 174], [58, 144]].map(([x, y]) => [x, y + by * (y < 150 ? 1 : 0.4)]);
  smooth(ctx, t);
  ctx.fillStyle = lin(ctx, 58, 92, 150, 184, [[0, '#6a5348'], [0.5, '#3b2c27'], [1, '#150f0d']]); ctx.fill();
  ctx.save(); ctx.clip();
  patches(ctx, rnd, 14, 56, 92, 152, 186, [PAL.rust, '#8a4a2a', '#2a1a14'], 8, 20, 0.6);
  grime(ctx, rnd, 58, 94, 150, 184, 40);
  // placas parafusadas
  const plates = [[70, 112, 36, 30], [108, 108, 34, 34], [76, 146, 28, 28], [112, 150, 30, 26]];
  plates.forEach(([x, y, w, h]) => {
    ctx.fillStyle = lin(ctx, x, y + by, x + w, y + h + by, [[0, '#7c6a5e'], [1, '#33261f']]);
    ctx.beginPath(); ctx.roundRect(x, y + by, w, h, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    rivets(ctx, [[x + 4, y + by + 4], [x + w - 4, y + by + 4], [x + 4, y + h + by - 4], [x + w - 4, y + h + by - 4]], 1.8);
  });
  ctx.restore();
  // brasa nas frestas da barriga
  glow(ctx, 104, 140 + by, 22, PAL.ember, 0.5);
  ctx.fillStyle = '#ff9a40'; for (let i = 0; i < 4; i++) ctx.fillRect(94 + i * 5, 136 + by, 3, 12);
  // cabeça minúscula com viseira
  ctx.fillStyle = lin(ctx, 90, 56, 130, 100, [[0, '#5a4a42'], [1, '#1f1713']]);
  ctx.beginPath(); ctx.roundRect(92, 62 + by, 38, 36, 10); ctx.fill();
  ctx.fillStyle = '#0a0605'; ctx.fillRect(98, 76 + by, 30, 8);
  ctx.fillStyle = '#ff6a50'; ctx.fillRect(110, 78 + by, 16, 4);
  glow(ctx, 118, 80 + by, 24, '#ff4a3a', 0.85);
  // braço esquerdo (de trás)
  limb(ctx, 66, 112 + by, 48, 150 + by, 24, 20, '#2b211e');
  limb(ctx, 48, 150 + by, 52, 184 + by + sw * 4, 20, 22, '#201815');
  // braço direito com marreta de viga
  limb(ctx, 146, 112 + by, 166, 140 + by, 26, 22, '#3f302b');
  limb(ctx, 166, 140 + by, 160, 164 + by - sw * 4, 22, 20, '#2b211e');
  ctx.save(); ctx.translate(160, 164 + by - sw * 4); ctx.rotate(-0.15 + sw * 0.05);
  ctx.fillStyle = '#4a3a32'; ctx.fillRect(-4, -70, 8, 76);
  ctx.fillStyle = lin(ctx, -26, -90, 26, -62, [[0, '#8a8480'], [1, '#3c3835']]);
  ctx.beginPath(); ctx.roundRect(-26, -92, 52, 30, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(194,86,42,.5)'; ctx.fillRect(-24, -80, 48, 7);
  ctx.restore();
  // ombreira
  ctx.fillStyle = lin(ctx, 56, 92, 90, 120, [[0, '#8a7a6e'], [1, '#3a2c27']]);
  ctx.beginPath(); ctx.ellipse(72, 106 + by, 22, 14, -0.3, 0, TAU); ctx.fill();
  rivets(ctx, [[64, 104 + by], [74, 100 + by], [82, 108 + by]], 2);
}

// ───────────── COLOSSO DE SUCATA (chefe) ─────────────
function drawColossus(ctx, f) {
  const ph = (f / 4) * TAU, sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 5, by = -bob;
  const rnd = mulberry32(89);
  // pernas = pilares de pneus
  const pillar = (x, sw2, shade) => {
    for (let i = 0; i < 5; i++) {
      const y = 232 - i * 22, w = 40 - i * 1.5;
      ctx.fillStyle = lin(ctx, x - w / 2, y, x + w / 2, y + 22, [[0, shade[0]], [1, shade[1]]]);
      ctx.beginPath(); ctx.ellipse(x + sw2 * (i * 0.6), y, w / 2, 12, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(x + sw2 * (i * 0.6), y, w / 3.2, 6, 0, 0, TAU); ctx.fill();
    }
  };
  pillar(90 - sw * 3, -sw * 4, ['#3a302c', '#14100e']);
  pillar(172 + sw * 3, sw * 4, ['#4a3e38', '#1c1512']);
  // caldeira (torso)
  const body = [[56, 150], [74, 100], [128, 82], [186, 98], [204, 150], [196, 206], [128, 222], [64, 206]].map(([x, y]) => [x, y + by * (y < 170 ? 1 : 0.4)]);
  smooth(ctx, body);
  ctx.fillStyle = lin(ctx, 56, 82, 204, 222, [[0, '#7a5e50'], [0.5, '#46342d'], [1, '#150f0d']]); ctx.fill();
  ctx.save(); ctx.clip();
  patches(ctx, rnd, 26, 50, 82, 210, 224, [PAL.rust, '#9a4d2a', '#2a1a14', '#6e3a22'], 10, 28, 0.6);
  grime(ctx, rnd, 56, 84, 204, 224, 70);
  ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 2.5;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(60, 110 + i * 28 + by); ctx.quadraticCurveTo(130, 120 + i * 28 + by, 200, 110 + i * 28 + by); ctx.stroke(); }
  ctx.restore();
  // fornalha (boca de brasa)
  const fx = 128, fy = 160 + by;
  glow(ctx, fx, fy, 70, PAL.ember, 0.55);
  ctx.fillStyle = '#0a0605'; ctx.beginPath(); ctx.roundRect(fx - 34, fy - 26, 68, 52, 10); ctx.fill();
  ctx.fillStyle = rad(ctx, fx, fy + 6, 0, 36, [[0, '#fff6d8'], [0.3, '#ffc860'], [0.7, '#ff6a20'], [1, '#7a1c08']]);
  ctx.beginPath(); ctx.roundRect(fx - 30, fy - 22, 60, 44, 8); ctx.fill();
  ctx.fillStyle = '#120b09'; for (let i = 0; i < 6; i++) ctx.fillRect(fx - 30 + i * 11, fy - 22, 4, 44);
  glow(ctx, fx, fy, 44, PAL.flame, 0.8);
  rivets(ctx, [[fx - 40, fy - 30], [fx + 40, fy - 30], [fx - 40, fy + 30], [fx + 40, fy + 30]], 3);
  // chaminés
  [[88, 62], [170, 56]].forEach(([x, y], i) => {
    ctx.fillStyle = lin(ctx, x - 10, y, x + 10, y + 50, [[0, '#6a5448'], [1, '#2a1e19']]);
    ctx.fillRect(x - 11, y + by, 22, 56);
    ctx.fillStyle = '#120b09'; ctx.beginPath(); ctx.ellipse(x, y + by, 11, 4, 0, 0, TAU); ctx.fill();
    glow(ctx, x, y + by - 2, 16, PAL.ember, 0.4 + 0.3 * Math.sin(ph + i));
    ctx.fillStyle = 'rgba(70,55,50,.35)'; ctx.beginPath(); ctx.ellipse(x + sw * 3, y + by - 14, 10, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(70,55,50,.22)'; ctx.beginPath(); ctx.ellipse(x - sw * 4, y + by - 28, 15, 10, 0, 0, TAU); ctx.fill();
  });
  // cabeça: poste de luz com olho único
  limb(ctx, 128, 96 + by, 128, 70 + by, 18, 14, '#33271f');
  ctx.fillStyle = lin(ctx, 108, 38, 148, 74, [[0, '#7a6a5e'], [1, '#2a2019']]);
  ctx.beginPath(); ctx.roundRect(106, 40 + by, 44, 34, 10); ctx.fill();
  ctx.fillStyle = '#0a0605'; ctx.beginPath(); ctx.arc(130, 57 + by, 13, 0, TAU); ctx.fill();
  ctx.fillStyle = rad(ctx, 130, 57 + by, 0, 11, [[0, '#fff'], [0.35, '#ff6a50'], [1, '#8a120c']]);
  ctx.beginPath(); ctx.arc(130, 57 + by, 10, 0, TAU); ctx.fill();
  glow(ctx, 130, 57 + by, 44, '#ff3a2a', 0.9);
  // braços: guindaste (esq) + garra (dir)
  limb(ctx, 62, 112 + by, 30, 170 + by, 26, 20, '#5a463c');
  limb(ctx, 30, 170 + by, 40, 214 + by + sw * 6, 20, 24, '#47352c');
  ctx.fillStyle = '#6a5a50';
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(40 + i * 8, 222 + by + sw * 6); ctx.lineTo(36 + i * 10, 242 + by + sw * 6); ctx.lineTo(46 + i * 8, 224 + by + sw * 6); ctx.fill(); }
  limb(ctx, 198, 112 + by, 232, 160 + by, 28, 22, '#65503f');
  limb(ctx, 232, 160 + by, 226, 204 + by - sw * 6, 22, 30, '#4a382d');
  ctx.fillStyle = lin(ctx, 200, 196, 250, 240, [[0, '#8a7a6e'], [1, '#2a1e19']]);
  ctx.beginPath(); ctx.roundRect(206, 196 + by - sw * 6, 44, 38, 8); ctx.fill();
  rivets(ctx, [[214, 206 + by - sw * 6], [242, 206 + by - sw * 6], [214, 226 + by - sw * 6], [242, 226 + by - sw * 6]], 2.4);
}

// ───────────── PICKUPS ─────────────
// ───────────── CÃO DE SUCATA ─────────────
function drawHound(ctx, f) {
  const ph = (f / 4) * TAU, rnd = mulberry32(91), bob = Math.abs(Math.sin(ph * 2)) * 3.5, by = -bob;
  const leg = (hx, hy, off, col, w) => {
    const a = ph + off, fx = hx + Math.sin(a) * 17, lift = Math.max(0, Math.cos(a)) * 10, fy = 119 - lift;
    const kx = (hx + fx) / 2 + 8, ky = (hy + fy) / 2 - 1;
    limb(ctx, hx, hy, kx, ky, w, w * 0.78, col); limb(ctx, kx, ky, fx, fy, w * 0.78, w * 0.5, col);
    ctx.fillStyle = '#0d0c0c'; ctx.beginPath(); ctx.ellipse(fx + 3, fy + 1, 6.5, 3.2, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#d8d0c4'; ctx.lineWidth = 1.6; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(fx + 7, fy + 1); ctx.lineTo(fx + 11, fy + 2 + i * 1.5 - 1.5); ctx.stroke(); }
  };
  // rabo de arame
  ctx.strokeStyle = '#2a2523'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(40, 68 + by); ctx.quadraticCurveTo(22, 58 + by + Math.sin(ph) * 4, 18, 74 + by + Math.sin(ph) * 5); ctx.stroke();
  leg(122, 84 + by, 0.7, '#1b1a1c', 11); leg(64, 84 + by, 3.9, '#1b1a1c', 12);
  // tronco magro
  const body = [[32, 72], [44, 56], [76, 50], [110, 52], [136, 58], [144, 74], [130, 92], [94, 98], [56, 96], [38, 88]].map(([x, y]) => [x, y + by]);
  smooth(ctx, body);
  ctx.fillStyle = lin(ctx, 40, 50, 140, 100, [[0, '#6a6663'], [0.55, '#3b3836'], [1, '#1c1a1b']]); ctx.fill();
  ctx.save(); ctx.clip();
  patches(ctx, rnd, 9, 30, 50, 146, 100, ['#7a3a1e', '#2a2222', '#a2542a'], 5, 13, 0.5);
  grime(ctx, rnd, 30, 52, 146, 100, 24);
  // costelas à mostra
  ctx.strokeStyle = 'rgba(14,10,10,.8)'; ctx.lineWidth = 2.2;
  for (let i = 0; i < 5; i++) { const x = 66 + i * 12; ctx.beginPath(); ctx.moveTo(x, 70 + by); ctx.quadraticCurveTo(x + 6, 84 + by, x + 2, 96 + by); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(230,214,190,.35)'; ctx.lineWidth = 1; for (let i = 0; i < 5; i++) { const x = 66 + i * 12; ctx.beginPath(); ctx.moveTo(x - 1, 70 + by); ctx.quadraticCurveTo(x + 5, 84 + by, x + 1, 96 + by); ctx.stroke(); }
  ctx.restore();
  // placas de sucata e vergalhões nas costas
  for (let i = 0; i < 4; i++) {
    const x = 56 + i * 20, y = 52 + (i % 2) * 2 + by; ctx.save(); ctx.translate(x, y); ctx.rotate(-0.4 + i * 0.1);
    ctx.fillStyle = lin(ctx, 0, -10, 0, 6, [[0, '#a6623a'], [1, '#4a2a1a']]); poly(ctx, [[-9, 6], [-6, -9], [8, -9], [10, 6]]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,190,130,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(8, -8); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = '#6f4a30'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 3 - i, y - 17 - (i % 2) * 4); ctx.stroke();
  }
  rivets(ctx, [[60, 54 + by], [80, 54 + by], [100, 54 + by]], 1.8);
  // brilho do motor no peito
  glow(ctx, 112, 80 + by, 15, '#ff7a2a', 0.6);
  ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(112, 80 + by, 3.2, 0, TAU); ctx.fill();
  leg(132, 86 + by, 3.1, '#3a3836', 12); leg(74, 86 + by, 2.3, '#403d3b', 13);
  // pescoço e cabeça
  limb(ctx, 130, 68 + by, 150, 58 + by, 20, 15, '#4b4745');
  smooth(ctx, [[140, 48], [156, 42], [174, 52], [182, 60], [176, 68], [156, 70], [142, 64]].map(([x, y]) => [x, y + by]));
  ctx.fillStyle = lin(ctx, 140, 42, 180, 70, [[0, '#7a7570'], [1, '#2b2827']]); ctx.fill();
  // mandíbula aberta
  const jw = 4 + Math.abs(Math.sin(ph)) * 3;
  smooth(ctx, [[150, 66], [172, 66], [180, 70 + jw], [160, 76 + jw], [148, 72]].map(([x, y]) => [x, y + by]));
  ctx.fillStyle = '#2a1e1c'; ctx.fill();
  ctx.fillStyle = '#e8dfcf';
  for (let i = 0; i < 4; i++) { const x = 156 + i * 6; ctx.beginPath(); ctx.moveTo(x, 66 + by); ctx.lineTo(x + 2, 66 + by + 5); ctx.lineTo(x + 4, 66 + by); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 1, 70 + by + jw); ctx.lineTo(x + 3, 70 + by + jw - 4); ctx.lineTo(x + 5, 70 + by + jw); ctx.fill(); }
  ctx.fillStyle = '#6a3a22'; poly(ctx, [[142, 46 + by], [136, 32 + by], [150, 44 + by]]); ctx.fill(); poly(ctx, [[150, 42 + by], [150, 28 + by], [158, 41 + by]]); ctx.fill();
  ctx.fillStyle = '#fff2c8'; ctx.beginPath(); ctx.ellipse(160, 52 + by, 3.4, 2.4, -0.2, 0, TAU); ctx.fill(); glow(ctx, 160, 52 + by, 15, '#ff7a2a', 0.95);
}

// ───────────── XAMÃ DAS CINZAS ─────────────
function drawShaman(ctx, f) {
  const ph = (f / 4) * TAU, sway = Math.sin(ph) * 3, bob = Math.abs(Math.cos(ph)) * 2.5, rnd = mulberry32(57);
  // cajado
  const sx = 98 + sway * 0.5;
  limb(ctx, sx, 178, sx + 1, 52 - bob, 6, 5, '#4a3424');
  ctx.strokeStyle = '#8a6a48'; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(sx - 3, 70 + i * 17); ctx.lineTo(sx + 3, 74 + i * 17); ctx.stroke(); }
  // manto esfarrapado
  const robe = [[56, 86 - bob], [66, 76 - bob], [82, 78 - bob], [90, 90 - bob], [96, 130], [102, 176], [90, 181 + sway * 0.4], [80, 174], [70, 182], [58, 175], [48, 181 - sway * 0.4], [44, 150], [48, 112]];
  smooth(ctx, robe);
  ctx.fillStyle = lin(ctx, 44, 76, 100, 182, [[0, '#4a3a42'], [0.5, '#2c2430'], [1, '#14101a']]); ctx.fill();
  ctx.save(); ctx.clip();
  patches(ctx, rnd, 9, 42, 78, 102, 182, ['#6a2c3a', '#1a1220', '#8a4a30'], 6, 14, 0.5);
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(52 + i * 8, 100); ctx.quadraticCurveTo(50 + i * 8 + sway, 140, 50 + i * 8, 178); ctx.stroke(); }
  ctx.restore();
  // faixa com trecos (latas, ossos)
  ctx.fillStyle = '#6a4a2a'; ctx.save(); ctx.translate(70, 124 - bob * 0.5); ctx.rotate(0.08); ctx.fillRect(-26, -4, 52, 7); ctx.restore();
  [[52, 134], [62, 137], [76, 136], [86, 133]].forEach(([x, y], i) => { ctx.fillStyle = i % 2 ? '#d9d0c0' : '#8a8f94'; ctx.beginPath(); ctx.ellipse(x, y - bob * 0.5, 3, 5, 0.2, 0, TAU); ctx.fill(); });
  // braço com mão no cajado
  limb(ctx, 82, 92 - bob, 94 + sway * 0.4, 112, 10, 8, '#3a2c36'); ctx.fillStyle = '#7a6a5e'; ctx.beginPath(); ctx.arc(sx, 112, 4.5, 0, TAU); ctx.fill();
  // capuz
  const hood = [[54, 80 - bob], [58, 56 - bob], [72, 40 - bob], [90, 52 - bob], [92, 72 - bob], [84, 86 - bob], [68, 86 - bob]];
  smooth(ctx, hood); ctx.fillStyle = lin(ctx, 54, 40, 92, 86, [[0, '#5a4a52'], [1, '#1c1622']]); ctx.fill();
  // rosto: vazio + máscara de crânio
  ctx.fillStyle = '#0a0709'; ctx.beginPath(); ctx.ellipse(77, 64 - bob, 12, 14, 0.1, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d8cfbf'; smooth(ctx, [[70, 56 - bob], [82, 54 - bob], [86, 68 - bob], [80, 80 - bob], [72, 78 - bob], [68, 66 - bob]]); ctx.fill();
  ctx.fillStyle = '#0a0709'; ctx.beginPath(); ctx.ellipse(74, 64 - bob, 3.2, 4, 0, 0, TAU); ctx.ellipse(82, 64 - bob, 3.2, 4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0a0709'; for (let i = 0; i < 4; i++) ctx.fillRect(72 + i * 3.2, 74 - bob, 1.4, 5);
  [[74, 64], [82, 64]].forEach(([x, y]) => { ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.arc(x, y - bob, 1.9, 0, TAU); ctx.fill(); glow(ctx, x, y - bob, 12, '#ff9a40', 0.9); });
  ctx.fillStyle = '#6a4a2a'; poly(ctx, [[62, 48 - bob], [56, 30 - bob], [68, 44 - bob]]); ctx.fill(); poly(ctx, [[86, 48 - bob], [96, 32 - bob], [90, 52 - bob]]); ctx.fill();
  // orbe no topo do cajado
  const oy = 46 - bob; ctx.strokeStyle = '#8a6a48'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx + 1, oy, 9, Math.PI * 0.9, Math.PI * 2.1); ctx.stroke();
  const pulse = 0.75 + 0.25 * Math.sin(ph);
  ctx.fillStyle = rad(ctx, sx + 1, oy, 0, 8, [[0, '#fff2c8'], [0.45, '#ffb347'], [1, '#c2562a']]); ctx.beginPath(); ctx.arc(sx + 1, oy, 7 * pulse + 1.5, 0, TAU); ctx.fill();
  glow(ctx, sx + 1, oy, 30, '#ff7a2a', 0.9 * pulse);
  // brasas orbitando
  for (let i = 0; i < 4; i++) { const a = ph + i * 1.57, ex = sx + 1 + Math.cos(a) * 17, ey = oy + Math.sin(a) * 7; ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.arc(ex, ey, 1.8, 0, TAU); ctx.fill(); glow(ctx, ex, ey, 7, '#ff9a40', 0.8); }
}

// ───────────── ESCORPIÃO DE SUCATA ─────────────
function drawScorpion(ctx, f) {
  const ph = (f / 4) * TAU, rnd = mulberry32(73), bob = Math.abs(Math.sin(ph * 2)) * 2, by = -bob, snap = Math.sin(ph) * 0.18;
  const legs = (col, dx, off) => {
    for (let i = 0; i < 4; i++) {
      const hx = 70 + i * 17 + dx, hy = 112 + by, a = ph + off + i * 1.1, fx = hx - 8 - i * 1 + Math.sin(a) * 9, lift = Math.max(0, Math.cos(a)) * 7, fy = 142 - lift;
      const kx = hx - 16, ky = hy - 6; limb(ctx, hx, hy, kx, ky, 6, 5, col); limb(ctx, kx, ky, fx, fy, 5, 3, col);
    }
  };
  legs('#2a1c16', 4, 0.8);
  // cauda segmentada em arco sobre o corpo
  const tail = [[56, 112], [38, 100], [30, 78], [38, 54], [60, 36], [88, 34], [108, 46]];
  const sway = Math.sin(ph) * 2;
  tail.forEach(([x, y], i) => { const r = 11 - i * 0.9, tx = x + (i > 2 ? sway : 0), ty = y + by * 0.5; limb(ctx, tx, ty, tail[Math.min(i + 1, 6)][0] + (i + 1 > 2 ? sway : 0), tail[Math.min(i + 1, 6)][1] + by * 0.5, r * 2, (r - 0.9) * 2, i % 2 ? '#8a4a28' : '#a2602f'); });
  tail.forEach(([x, y], i) => { const r = 11 - i * 0.9; ctx.fillStyle = 'rgba(255,190,130,.28)'; ctx.beginPath(); ctx.arc(x + (i > 2 ? sway : 0) - r * 0.25, y + by * 0.5 - r * 0.3, r * 0.45, 0, TAU); ctx.fill(); });
  // ferrão
  const sxp = 112 + sway, syp = 54 + by * 0.5; ctx.fillStyle = '#d8c8a8'; poly(ctx, [[sxp - 6, syp - 8], [sxp + 14, syp + 6], [sxp - 5, syp + 6]]); ctx.fill();
  glow(ctx, sxp + 10, syp + 5, 17, '#ffb347', 0.95); ctx.fillStyle = '#fff2c8'; ctx.beginPath(); ctx.arc(sxp + 10, syp + 5, 2.4, 0, TAU); ctx.fill();
  // corpo-couraça
  const body = [[44, 116], [52, 98], [80, 90], [114, 94], [134, 106], [130, 124], [100, 132], [64, 132]].map(([x, y]) => [x, y + by]);
  smooth(ctx, body); ctx.fillStyle = lin(ctx, 44, 90, 134, 132, [[0, '#b0683a'], [0.5, '#7a3e22'], [1, '#2e1a12']]); ctx.fill();
  ctx.save(); ctx.clip(); patches(ctx, rnd, 8, 44, 90, 134, 132, ['#5a2a16', '#d08a4a', '#2a1a14'], 5, 12, 0.5); grime(ctx, rnd, 44, 92, 134, 132, 18);
  ctx.strokeStyle = 'rgba(20,10,8,.7)'; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(62 + i * 14, 92 + by); ctx.quadraticCurveTo(66 + i * 14, 112 + by, 62 + i * 14, 132 + by); ctx.stroke(); }
  ctx.restore();
  rivets(ctx, [[70, 100 + by], [90, 98 + by], [110, 102 + by], [76, 122 + by]], 2);
  glow(ctx, 96, 112 + by, 14, '#ff7a2a', 0.5);
  legs('#4a2e22', -2, 0);
  // pinças
  const claw = (cy, side, col) => {
    const open = (0.35 + snap) * side; ctx.save(); ctx.translate(134, cy + by);
    limb(ctx, 0, 0, 20, side * -4, 12, 10, col); ctx.translate(20, side * -4);
    ctx.save(); ctx.rotate(-open); ctx.fillStyle = lin(ctx, 0, -6, 28, 6, [[0, '#b0683a'], [1, '#5a301c']]); smooth(ctx, [[-4, -7], [14, -11], [30, -2], [28, 4], [10, 2], [-4, 6]]); ctx.fill(); ctx.restore();
    ctx.save(); ctx.rotate(open * 0.7); ctx.fillStyle = lin(ctx, 0, -2, 26, 8, [[0, '#8a4a28'], [1, '#3a2016']]); smooth(ctx, [[-4, -4], [14, -1], [28, 3], [24, 9], [8, 8], [-4, 6]]); ctx.fill(); ctx.restore();
    ctx.restore();
  };
  claw(104, -1, '#6a3a22'); claw(120, 1, '#8a4a28');
  // cabeça/olhos
  ctx.fillStyle = '#2a1812'; ctx.beginPath(); ctx.ellipse(130, 112 + by, 8, 8, 0, 0, TAU); ctx.fill();
  [[134, 108], [134, 116]].forEach(([x, y]) => { ctx.fillStyle = '#ffe2a0'; ctx.beginPath(); ctx.arc(x, y + by, 2, 0, TAU); ctx.fill(); glow(ctx, x, y + by, 11, '#ffb347', 0.9); });
}

function drawGem(ctx, ox, tier) {
  const cols = [
    ['#fff2c8', '#ffb347', '#c2562a'], // fagulha (pequena)
    ['#e8fff8', '#42e0b4', '#127a66'], // cristal tóxico (média)
    ['#ffffff', '#ffd98a', '#ff7a2a'], // brasa-mãe (grande)
  ][tier];
  const cx = ox + 32, cy = 34, r = [11, 14, 18][tier];
  glow(ctx, cx, cy, r * 3, cols[1], 0.7);
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 1.25); ctx.lineTo(cx + r * 0.9, cy - r * 0.2); ctx.lineTo(cx + r * 0.55, cy + r); ctx.lineTo(cx - r * 0.55, cy + r); ctx.lineTo(cx - r * 0.9, cy - r * 0.2); ctx.closePath();
  ctx.fillStyle = lin(ctx, cx - r, cy - r, cx + r, cy + r, [[0, cols[0]], [0.5, cols[1]], [1, cols[2]]]); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.beginPath(); ctx.moveTo(cx - r * 0.1, cy - r * 1.05); ctx.lineTo(cx - r * 0.55, cy - r * 0.2); ctx.lineTo(cx - r * 0.1, cy - r * 0.1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.moveTo(cx - r * 0.9, cy - r * 0.2); ctx.lineTo(cx + r * 0.9, cy - r * 0.2); ctx.moveTo(cx, cy - r * 1.25); ctx.lineTo(cx, cy + r); ctx.stroke();
}
function drawHeart(ctx, ox) {
  const cx = ox + 32, cy = 36;
  glow(ctx, cx, cy, 34, PAL.ember, 0.75);
  // chama-coração
  ctx.fillStyle = lin(ctx, cx, cy - 22, cx, cy + 20, [[0, '#fff6d8'], [0.4, '#ffb347'], [1, '#c2562a']]);
  ctx.beginPath(); ctx.moveTo(cx, cy - 22); ctx.bezierCurveTo(cx + 18, cy - 4, cx + 20, cy + 10, cx, cy + 20); ctx.bezierCurveTo(cx - 20, cy + 10, cx - 18, cy - 4, cx, cy - 22); ctx.fill();
  ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.ellipse(cx, cy + 4, 5, 9, 0, 0, TAU); ctx.fill();
}

// ───────────── API ─────────────
export const SHEETS = {
  player: { fw: 128, fh: 192, frames: 4, h: 2.0, draw: drawGuardian },
  raider: { fw: 128, fh: 192, frames: 4, h: 1.85, draw: drawRaider },
  ghoul: { fw: 128, fh: 192, frames: 4, h: 1.75, draw: drawGhoul },
  drone: { fw: 128, fh: 192, frames: 4, h: 1.7, draw: drawDrone },
  brute: { fw: 192, fh: 224, frames: 4, h: 3.1, draw: drawBrute },
  boss: { fw: 256, fh: 256, frames: 4, h: 6.2, draw: drawColossus },
  hound: { fw: 192, fh: 128, frames: 4, h: 1.15, draw: drawHound },
  shaman: { fw: 128, fh: 192, frames: 4, h: 2.0, draw: drawShaman },
  scorpion: { fw: 192, fh: 160, frames: 4, h: 1.7, draw: drawScorpion },
};

export function buildSheet(name) {
  const s = SHEETS[name];
  const c = cv(s.fw * s.frames, s.fh);
  const ctx = c.getContext('2d');
  for (let f = 0; f < s.frames; f++) {
    ctx.save();
    ctx.beginPath(); ctx.rect(f * s.fw, 0, s.fw, s.fh); ctx.clip();
    ctx.translate(f * s.fw, 0);
    // boss usa um sistema de coordenadas um pouco maior; reduz p/ caber
    s.draw(ctx, f);
    ctx.restore();
  }
  return { canvas: c, ...s };
}

export function buildPickups() {
  const c = cv(64 * 4, 64);
  const ctx = c.getContext('2d');
  drawGem(ctx, 0, 0); drawGem(ctx, 64, 1); drawGem(ctx, 128, 2); drawHeart(ctx, 192);
  return { canvas: c, fw: 64, fh: 64, frames: 4 };
}

// textura de sombra suave (blob) e pontos de luz
export function buildSoft() {
  const c = cv(128);
  const ctx = c.getContext('2d');
  ctx.fillStyle = rad(ctx, 64, 64, 0, 64, [[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(0, 0, 128, 128);
  return c;
}
export { rad, lin, glow, smooth, poly, limb, patches, rivets, grime };
