// Tira de quadros do fogo animado: simula o FxSystem com passo fixo e mostra N instantes lado a lado (verifica movimento e leitura).
import { FxSystem } from '../../src/fx/core.js';
import { drawFx } from '../../src/fx/canvas-renderer.js';
import { defaultDefs } from '../../src/fx/defaults.js';
import { cv } from '../../src/shared/util.js';
const D = defaultDefs(), ids = (new URLSearchParams(location.search).get('ids') || 'fogueira,labareda,brasas,fogoToxico').split(','), FR = 8, cw = 300, ch = 360;
document.body.style.cssText = 'margin:0;background:#0c0807;color:#e8c8a0;font:12px sans-serif;padding:8px;width:' + (FR * cw + 90) + 'px';
const sin = 0.82, ppu = 56;
for (const id of ids) {
  const fx = new FxSystem({ sinTilt: sin }), d = D[id], row = document.createElement('div'); row.style.cssText = 'display:flex;gap:2px;margin-bottom:4px'; const lab = document.createElement('div'); lab.textContent = id; lab.style.cssText = 'width:80px;align-self:center'; row.append(lab);
  const o = id === 'labareda' ? { x: -3, z: 0, dx: 1, dz: 0, maxT: 9 } : { x: 0, z: 0, loop: true, dx: 1, dz: 0 };
  fx.spawn(d, o);
  for (let f = 0; f < FR; f++) {
    for (let s = 0; s < 18; s++) fx.step(1 / 60);
    const c = cv(cw, ch), x = c.getContext('2d'); const g = x.createRadialGradient(cw / 2, ch * 0.78, 6, cw / 2, ch * 0.78, 190); g.addColorStop(0, '#3a2418'); g.addColorStop(1, '#0c0807'); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
    const cx = id === 'labareda' ? cw * 0.5 + 0 : cw / 2; const proj = (wx, wy, wz) => [cx + (id === 'labareda' ? (wx - (-3 + 13 * (f + 1) * 0.3)) * ppu : wx * ppu), ch * 0.78 + wz * ppu * sin - wy * ppu * Math.sqrt(1 - sin * sin)];
    drawFx(x, fx.items, proj, ppu, sin, true); row.append(c);
  }
  document.body.append(row);
}
window.__ready = true;
