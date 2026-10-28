// Editor de pintura de texturas (256×256) com pincéis de luz, simetria radial e desfazer.
import { TAU, cv, hexToRgb } from '../shared/util.js';
import { touchTex } from '../fx/canvas-renderer.js';

const SIZE = 256;

export class Painter {
  constructor(display) {
    this.display = display;            // <canvas> visível (512×512)
    this.dctx = display.getContext('2d');
    this.canvas = null;                // canvas 256 sendo editado (pertence ao efeito)
    this.ctx = null;
    this.tool = 'glow';                // glow | solid | erase
    this.color = '#ffb347';
    this.size = 22; this.opacity = 0.9; this.softness = 0.6; this.sym = 1; this.mirror = false;
    this.showGrid = true; this.bg = 'dark';
    this.undoS = []; this.redoS = [];
    this.onChange = null;
    this.drawing = false; this.last = null;
    this.tipCache = new Map();
    this._bind();
  }

  attach(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.undoS = []; this.redoS = [];
    this.render();
  }

  _bind() {
    const d = this.display;
    const pos = (e) => { const r = d.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * SIZE, ((e.clientY - r.top) / r.height) * SIZE]; };
    d.addEventListener('pointerdown', (e) => {
      if (!this.canvas || e.button !== 0) return;
      d.setPointerCapture(e.pointerId);
      this.pushUndo(); this.drawing = true;
      this.last = pos(e); this.stamp(this.last[0], this.last[1], e.pressure || 0.5, e.pointerType === 'pen');
      this.changed();
    });
    d.addEventListener('pointermove', (e) => {
      this.cursor = pos(e);
      if (this.drawing) {
        const p = pos(e), l = this.last, dist = Math.hypot(p[0] - l[0], p[1] - l[1]), step = Math.max(1, this.size * 0.16);
        const n = Math.max(1, Math.floor(dist / step));
        for (let i = 1; i <= n; i++) this.stamp(l[0] + ((p[0] - l[0]) * i) / n, l[1] + ((p[1] - l[1]) * i) / n, e.pressure || 0.5, e.pointerType === 'pen');
        this.last = p; this.changed();
      } else this.render();
    });
    const up = () => { this.drawing = false; };
    d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up);
    d.addEventListener('pointerleave', () => { this.cursor = null; this.render(); });
    d.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  tip() {
    const key = `${this.tool}|${this.color}|${Math.round(this.size)}|${this.softness.toFixed(2)}`;
    let t = this.tipCache.get(key);
    if (t) return t;
    if (this.tipCache.size > 60) this.tipCache.clear();
    const s = Math.max(2, Math.round(this.size * 2));
    t = cv(s);
    const x = t.getContext('2d');
    const [r, g, b] = hexToRgb(this.tool === 'erase' ? '#ffffff' : this.color).map((v) => Math.round(v * 255));
    const h = this.tool === 'solid' ? Math.max(0.55, this.softness * 0.6 + 0.35) : this.softness * 0.55;
    const gr = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
    gr.addColorStop(Math.min(0.98, h), `rgba(${r},${g},${b},${this.tool === 'solid' ? 1 : 0.55})`);
    gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, s, s);
    this.tipCache.set(key, t);
    return t;
  }

  stamp(px, py, pressure, pen) {
    const c = SIZE / 2, ctx = this.ctx, tip = this.tip();
    const dx = px - c, dy = py - c, n = Math.max(1, this.sym), ts = tip.width;
    ctx.save();
    ctx.globalCompositeOperation = this.tool === 'erase' ? 'destination-out' : this.tool === 'glow' ? 'lighter' : 'source-over';
    ctx.globalAlpha = Math.min(1, this.opacity * (this.tool === 'glow' ? 0.5 : 1) * (pen ? 0.4 + pressure : 1));
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const x = c + dx * ca - dy * sa, y = c + dx * sa + dy * ca;
      ctx.drawImage(tip, x - ts / 2, y - ts / 2);
      if (this.mirror) { const mx = c + dx * ca + dy * sa, my = c - dx * sa + dy * ca; ctx.drawImage(tip, mx - ts / 2, my - ts / 2); }
    }
    ctx.restore();
  }

  changed() { touchTex(this.canvas); this.render(); this.onChange && this.onChange(); }

  pushUndo() {
    if (!this.ctx) return;
    this.undoS.push(this.ctx.getImageData(0, 0, SIZE, SIZE)); if (this.undoS.length > 40) this.undoS.shift();
    this.redoS.length = 0;
  }
  undo() { if (!this.undoS.length) return; this.redoS.push(this.ctx.getImageData(0, 0, SIZE, SIZE)); this.ctx.putImageData(this.undoS.pop(), 0, 0); this.changed(); }
  redo() { if (!this.redoS.length) return; this.undoS.push(this.ctx.getImageData(0, 0, SIZE, SIZE)); this.ctx.putImageData(this.redoS.pop(), 0, 0); this.changed(); }

  clear() { this.pushUndo(); this.ctx.clearRect(0, 0, SIZE, SIZE); this.changed(); }
  replaceWith(src) { // src: canvas/imagem
    this.pushUndo(); this.ctx.clearRect(0, 0, SIZE, SIZE);
    const w = src.width || src.naturalWidth, h = src.height || src.naturalHeight, k = Math.min(SIZE / w, SIZE / h);
    this.ctx.drawImage(src, (SIZE - w * k) / 2, (SIZE - h * k) / 2, w * k, h * k); this.changed();
  }
  transform(kind) {
    this.pushUndo();
    const t = cv(SIZE); t.getContext('2d').drawImage(this.canvas, 0, 0);
    this.ctx.clearRect(0, 0, SIZE, SIZE); this.ctx.save(); this.ctx.translate(SIZE / 2, SIZE / 2);
    if (kind === 'flipH') this.ctx.scale(-1, 1); else if (kind === 'flipV') this.ctx.scale(1, -1); else if (kind === 'rot90') this.ctx.rotate(Math.PI / 2);
    this.ctx.drawImage(t, -SIZE / 2, -SIZE / 2); this.ctx.restore(); this.changed();
  }
  glowPass() { // intensifica o brilho (suavemente) — ótimo para "acender" o desenho
    this.pushUndo();
    const t = cv(SIZE); const x = t.getContext('2d');
    x.filter = 'blur(6px)'; x.drawImage(this.canvas, 0, 0);
    this.ctx.save(); this.ctx.globalCompositeOperation = 'lighter'; this.ctx.globalAlpha = 0.7; this.ctx.drawImage(t, 0, 0); this.ctx.restore();
    this.changed();
  }

  render() {
    const d = this.dctx, W = this.display.width;
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.clearRect(0, 0, W, W);
    const bg = { dark: '#0c0808', mid: '#3a2d29', light: '#8a7c72' }[this.bg] || '#0c0808';
    d.fillStyle = bg; d.fillRect(0, 0, W, W);
    if (this.bg !== 'dark') { /* xadrez sutil */ d.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < W; y += 32) for (let x = (y / 32) % 2 ? 0 : 32; x < W; x += 64) d.fillRect(x, y, 32, 32); }
    if (this.canvas) d.drawImage(this.canvas, 0, 0, W, W);
    const k = W / SIZE;
    if (this.showGrid) {
      d.strokeStyle = 'rgba(255,170,110,.14)'; d.lineWidth = 1; d.setLineDash([4, 6]);
      d.beginPath(); d.moveTo(W / 2, 0); d.lineTo(W / 2, W); d.moveTo(0, W / 2); d.lineTo(W, W / 2); d.stroke(); d.setLineDash([]);
      if (this.sym > 1) {
        d.strokeStyle = 'rgba(66,224,180,.22)';
        for (let i = 0; i < this.sym; i++) { const a = (i / this.sym) * TAU; d.beginPath(); d.moveTo(W / 2, W / 2); d.lineTo(W / 2 + Math.cos(a) * W, W / 2 + Math.sin(a) * W); d.stroke(); }
      }
      // seta de "frente" (+X)
      d.fillStyle = 'rgba(255,179,71,.5)'; d.font = '600 11px Rajdhani, sans-serif'; d.fillText('FRENTE →', W - 70, W / 2 - 6);
    }
    if (this.cursor) {
      const c = SIZE / 2, dx = this.cursor[0] - c, dy = this.cursor[1] - c, n = Math.max(1, this.sym);
      d.strokeStyle = 'rgba(255,255,255,.7)'; d.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU, x = c + dx * Math.cos(a) - dy * Math.sin(a), y = c + dx * Math.sin(a) + dy * Math.cos(a);
        d.beginPath(); d.arc(x * k, y * k, this.size * k, 0, TAU); d.stroke();
        if (this.mirror) { const mx = c + dx * Math.cos(a) + dy * Math.sin(a), my = c - dx * Math.sin(a) + dy * Math.cos(a); d.beginPath(); d.arc(mx * k, my * k, this.size * k, 0, TAU); d.stroke(); }
      }
    }
  }
}
