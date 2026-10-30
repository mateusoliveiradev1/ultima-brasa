import * as T from '../../src/shared/art-fx.js';
document.body.style.cssText = 'margin:0;background:#120c0a;color:#e8c8a0;font:12px sans-serif;padding:10px;width:1500px';
const t0 = performance.now();
const rows = [['v1 alto', T.texFireSheetTall()], ['v2', T.texFireV2()], ['v2 grande', T.texFireV2Big()], ['v2 tóxico', T.texFireV2Toxic()], ['v2 violeta', T.texFireV2Violet()]];
for (const [name, s] of rows) { const m = s.__sheet, F = s.width / m.cols, d = document.createElement('div'); d.style.cssText = 'display:flex;gap:2px;align-items:flex-end;margin-bottom:6px'; const l = document.createElement('div'); l.textContent = name; l.style.width = '70px'; d.append(l);
  for (let i = 0; i < 8; i++) { const fi = Math.floor(i * m.n / 8), c = document.createElement('canvas'); c.width = c.height = 150; const x = c.getContext('2d'); x.fillStyle = '#0c0807'; x.fillRect(0, 0, 150, 150); x.drawImage(s, (fi % m.cols) * F, Math.floor(fi / m.cols) * F, F, F, 0, 0, 150, 150); d.append(c); } document.body.append(d); }
const e = document.createElement('div'); e.style.cssText = 'display:flex;gap:10px;align-items:flex-end'; for (const s of [T.texEmber(), T.texSmokeSheet()]) { const c = document.createElement('canvas'); c.width = c.height = 150; const x = c.getContext('2d'); x.fillStyle = '#0c0807'; x.fillRect(0, 0, 150, 150); if (s.__sheet) x.drawImage(s, 0, 0, s.width / s.__sheet.cols, s.height / s.__sheet.rows, 0, 0, 150, 150); else x.drawImage(s, 0, 0, 150, 150); e.append(c); } document.body.append(e);
window.__ms = performance.now() - t0; window.__ready = true;
