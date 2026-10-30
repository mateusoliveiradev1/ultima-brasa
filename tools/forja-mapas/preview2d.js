// Prévia 2D rápida do mapa (projeção oblíqua ~38°): para iterar composição em segundos antes do render WebGL.
import { CATALOG } from '../../src/shared/paint-props.js';
import { paintGround, paintGroundMacro } from '../../src/shared/paint.js';
import { cv } from '../../src/shared/util.js';

const E = 0.66, SIN = Math.sin(E), COS = Math.cos(E);
export function renderPreview(spec, { W = 1280, H = 720 } = {}) {
  const c = cv(W, H), x = c.getContext('2d'), S = spec.camera.scale, [tx, tz] = spec.camera.target;
  const sx = (wx) => W / 2 + (wx - tx) * S, sy = (wz, wy = 0) => H / 2 + (wz - tz) * S * SIN - wy * S * COS;
  // chão: tile pintado + camada macro (trilhas/manchas)
  const g = paintGround(1024, 3), pat = x.createPattern(g.albedo, 'repeat'), half = spec.ground.half;
  x.fillStyle = '#2a1812'; x.fillRect(0, 0, W, H);
  x.save(); x.beginPath(); x.rect(0, 0, W, H); x.clip(); x.setTransform(S / 640 * 1.6 * 4, 0, 0, S / 640 * 1.6 * 4 * SIN, sx(-half), sy(-half)); x.fillStyle = pat; x.fillRect(0, 0, 2 * half * 640 / (S / 640 * 1.6 * 4) / 640 * 640, 2 * half * 640 / (S / 640 * 1.6 * 4)); x.restore();
  const macro = paintGroundMacro(2048, spec.ground.macroSeed, half, spec.ground.paths);
  x.drawImage(macro, sx(-half), sy(-half), 2 * half * S, 2 * half * S * SIN);
  // sprites usados
  const cat = Object.fromEntries(CATALOG.map((e) => [e.id, e])), cache = {};
  const sprite = (id, v) => { const e = cat[id], k = id + ':' + (v % e.n); if (!cache[k]) { const a = e.paint((v % e.n) + 1).albedo, b = cv(a.width, a.height), bx = b.getContext('2d'); bx.drawImage(a, 0, 0); bx.globalCompositeOperation = 'source-in'; bx.fillStyle = '#000'; bx.fillRect(0, 0, a.width, a.height); cache[k] = { a, shadow: b }; } return cache[k]; };
  const items = spec.props.map((p) => ({ ...p, e: cat[p.id] })).sort((a, b) => (a.z + (a.y || 0) * 0.01) - (b.z + (b.y || 0) * 0.01));
  // decalques primeiro
  for (const p of items) if (p.e.kind === 'decal') { const s = sprite(p.id, p.v), w = p.e.h * (s.a.width / s.a.height) * S * 0.9; x.globalAlpha = 0.95; x.drawImage(s.a, sx(p.x) - w / 2, sy(p.z) - w * (s.a.height / s.a.width) * SIN / 2, w, w * (s.a.height / s.a.width) * SIN); x.globalAlpha = 1; }
  // sombras (silhueta preta achatada e inclinada para a direita)
  for (const p of items) { if (p.e.kind === 'decal') continue; const s = sprite(p.id, p.v), hpx = p.e.h * (p.s || 1) * S * 0.95, wpx = hpx * (s.a.width / s.a.height); x.save(); x.globalAlpha = 0.5; x.setTransform(1, 0, -0.75, -0.3, sx(p.x), sy(p.z, p.y || 0)); x.drawImage(s.shadow, -wpx / 2, -hpx, wpx, hpx); x.restore(); }
  // sprites com espessura (fatias de trás pra frente)
  for (const p of items) { if (p.e.kind === 'decal') continue; const s = sprite(p.id, p.v), hpx = p.e.h * (p.s || 1) * S * 0.95, wpx = hpx * (s.a.width / s.a.height), [th, n] = p.e.thick || [0.2, 2];
    const off = th * S * SIN; if (off > 3) { x.globalAlpha = 0.55; x.drawImage(s.shadow, sx(p.x) - wpx / 2, sy(p.z, p.y || 0) - hpx - off, wpx, hpx); x.globalAlpha = 1; x.drawImage(s.a, sx(p.x) - wpx / 2, sy(p.z, p.y || 0) - hpx - off * 0.5, wpx, hpx); }
    x.drawImage(s.a, sx(p.x) - wpx / 2, sy(p.z, p.y || 0) - hpx, wpx, hpx); }
  // fumaça simples
  for (const [fx, fz, fy] of spec.smoke) for (let i = 0; i < 10; i++) { const r = (30 + i * 12), gg = x.createRadialGradient(sx(fx) + i * 6, sy(fz, fy + i * 1.1), 0, sx(fx) + i * 6, sy(fz, fy + i * 1.1), r); gg.addColorStop(0, `rgba(40,32,30,${0.32 - i * 0.025})`); gg.addColorStop(1, 'rgba(40,32,30,0)'); x.fillStyle = gg; x.fillRect(0, 0, W, H); }
  // luz: escurece o ambiente e abre halos quentes
  x.globalCompositeOperation = 'multiply'; const amb = x.createLinearGradient(0, 0, 0, H); amb.addColorStop(0, 'rgb(150,120,110)'); amb.addColorStop(1, 'rgb(215,185,170)'); x.fillStyle = amb; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'lighter'; for (const L of spec.lights) { const r = L.r * S, gg = x.createRadialGradient(sx(L.x), sy(L.z, 1), 0, sx(L.x), sy(L.z, 1), r); gg.addColorStop(0, hexA(L.color, 0.5 * L.i)); gg.addColorStop(0.35, hexA(L.color, 0.18 * L.i)); gg.addColorStop(1, hexA(L.color, 0)); x.fillStyle = gg; x.fillRect(0, 0, W, H); }
  x.globalCompositeOperation = 'source-over';
  // vinheta
  const vg = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(8,4,4,.6)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  return c;
}
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
