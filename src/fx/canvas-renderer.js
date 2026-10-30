// Renderizador Canvas2D dos efeitos (preview da Forja), com glow aditivo.
import { getTex } from './core.js';
import { cv } from '../shared/util.js';

let uid = 1;
const tintCache = new Map();
export function touchTex(c) { c.__ver = (c.__ver || 0) + 1; }

function tinted(tex, r, g, b, big) {
  if (r > 0.94 && g > 0.94 && b > 0.94) return tex;
  tex.__id ||= uid++;
  const key = `${tex.__id}:${tex.__ver || 0}:${(r * 15) | 0},${(g * 15) | 0},${(b * 15) | 0}:${big ? 1 : 0}`;
  let c = tintCache.get(key);
  if (c) return c;
  if (tintCache.size > 1500) tintCache.clear();
  const sz = Math.min(big ? 512 : 128, tex.width);
  c = cv(sz);
  const x = c.getContext('2d');
  x.drawImage(tex, 0, 0, sz, sz);
  x.globalCompositeOperation = 'multiply';
  x.fillStyle = `rgb(${(r * 255) | 0},${(g * 255) | 0},${(b * 255) | 0})`;
  x.fillRect(0, 0, sz, sz);
  x.globalCompositeOperation = 'destination-in';
  x.drawImage(tex, 0, 0, sz, sz);
  tintCache.set(key, c);
  return c;
}

let layer = null;
// proj(x,y,z) -> [sx, sy] em pixels do canvas
export function drawFx(ctx, items, proj, ppu, sinTilt, bloom = true) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  if (!layer || layer.width !== W || layer.height !== H) layer = cv(W, H);
  const lx = layer.getContext('2d');
  lx.setTransform(1, 0, 0, 1, 0, 0);
  lx.clearRect(0, 0, W, H);
  const put = (t, it) => {
    const tex0 = getTex(it.def.tex[it.layer]);
    if (!tex0) return;
    const mx = Math.max(it.r, it.g, it.b, 0.0001), k = Math.max(1, mx);
    const meta = it.def.texMeta?.[it.layer], tex = tinted(tex0, Math.min(1, it.r / k), Math.min(1, it.g / k), Math.min(1, it.b / k), !!meta);
    const [sx, sy] = proj(it.x, it.y, it.z);
    t.globalCompositeOperation = it.add ? 'lighter' : 'source-over';
    t.globalAlpha = Math.min(1, it.a * Math.min(1.7, k));
    t.setTransform(1, 0, 0, 1, sx, sy);
    if (it.flat) t.scale(1, sinTilt);
    t.rotate(-it.rot);
    const w = it.sx * ppu, h = it.sy * ppu;
    if (meta) { // folha de quadros: mistura o quadro atual com o próximo
      const n = meta.n, f0 = Math.floor(it.fr), fr = it.fr - f0, kx = tex.width / meta.cols, ky = tex.height / meta.rows, a0 = t.globalAlpha;
      const draw = (fi, al) => { fi = ((fi % n) + n) % n; t.globalAlpha = a0 * al; t.drawImage(tex, (fi % meta.cols) * kx, Math.floor(fi / meta.cols) * ky, kx, ky, -w / 2, -h / 2, w, h); };
      if (it.add) { draw(f0, 1 - fr * 0.7); if (fr > 0.02) draw(f0 + 1, fr); } else { draw(f0, 1 - fr); if (fr > 0.02) draw(f0 + 1, fr); }
    } else t.drawImage(tex, -w / 2, -h / 2, w, h);
  };
  let hasSmoke = false;
  for (const it of items) { if (it.layer === 'smoke') hasSmoke = true; else put(lx, it); }
  lx.setTransform(1, 0, 0, 1, 0, 0);
  lx.globalAlpha = 1; lx.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  if (hasSmoke) { ctx.save(); for (const it of items) if (it.layer === 'smoke') put(ctx, it); ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  ctx.drawImage(layer, 0, 0);
  if (bloom) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = `blur(${Math.round(W / 90)}px)`; ctx.globalAlpha = 0.85;
    ctx.drawImage(layer, 0, 0);
    ctx.filter = `blur(${Math.round(W / 35)}px)`; ctx.globalAlpha = 0.55;
    ctx.drawImage(layer, 0, 0);
  }
  ctx.restore();
}

/** Desenha o quadro `fr` de uma textura (folha ou simples) em (x,y,w,h). */
export function drawTexFrame(ctx, tex, meta, fr, x, y, w, h) {
  if (!meta) { ctx.drawImage(tex, x, y, w, h); return; }
  const n = meta.n, fi = ((Math.floor(fr) % n) + n) % n, kx = tex.width / meta.cols, ky = tex.height / meta.rows;
  ctx.drawImage(tex, (fi % meta.cols) * kx, Math.floor(fi / meta.cols) * ky, kx, ky, x, y, w, h);
}
