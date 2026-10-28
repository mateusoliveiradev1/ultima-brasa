// Motor de efeitos independente de renderizador. Usado pela Forja (Canvas2D) e pelo jogo (Three.js).
// Mundo: x (direita), z (para a câmera), y (altura). Projeção 2.5D: tela = (x, y*cos − z*sin).
import { TAU, clamp, lerp, easeOut, hexToRgb } from '../shared/util.js';

export const KINDS = {
  slash: 'Corte',
  projectile: 'Projétil',
  nova: 'Nova (onda)',
  chain: 'Raio em cadeia',
  orbit: 'Orbital',
  rain: 'Chuva de impactos',
};

export const DEFAULT_DEF = () => ({
  v: 1, id: 'novo', name: 'Novo efeito', kind: 'slash',
  life: 0.4, glow: 1.3, blend: 'add', tint: 0.6,
  colors: ['#fff2c8', '#ff7a2a', '#3a1208'],
  body: { on: true, size0: 2.4, size1: 3.2, stretch: 1, rot0: 0, sweep: 0, spin: 0, alpha: 'fade', ease: 'out', offset: 1.3, y: 0.9, flat: false },
  part: { on: true, burst: 10, rate: 0, life: 0.5, speed: 3.5, spread: 360, gravity: 0, drag: 1.5, size0: 0.5, size1: 0, spin: 2, lift: 0, stretch: 0, y: 0.9 },
  hit: { on: false, size0: 0.8, size1: 2.4, life: 0.25, flat: false, y: 0.8 },
  args: { arc: 100, speed: 14, radius: 4.5, count: 3, orbitRadius: 2.6, orbitSpeed: 190, chains: 4, thick: 1, fall: 0.35, spread: 3.5 },
  tex: { body: null, part: null, hit: null },
});

function fill(dst, src) {
  for (const k of Object.keys(src)) {
    if (dst[k] === undefined || dst[k] === null) {
      dst[k] = typeof src[k] === 'object' && src[k] && !Array.isArray(src[k]) && !(src[k] instanceof HTMLElement) ? fill({}, src[k]) : (Array.isArray(src[k]) ? src[k].slice() : src[k]);
    } else if (typeof src[k] === 'object' && src[k] && !Array.isArray(src[k]) && !(src[k] instanceof HTMLElement)) fill(dst[k], src[k]);
  }
  return dst;
}
export function normalizeDef(d) {
  fill(d, DEFAULT_DEF());
  d._rgb = d.colors.map(hexToRgb);
  return d;
}

// ── cache de texturas (aceita canvas ou dataURL) ──
const texCache = new Map();
export function getTex(src) {
  if (!src) return null;
  if (typeof src !== 'string') return src;
  let e = texCache.get(src);
  if (e) return e.canvas;
  e = { canvas: null };
  texCache.set(src, e);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0); e.canvas = c; texVersion++;
  };
  img.src = src;
  return null;
}
export let texVersion = 0;

const A = {
  fade: (u) => Math.min(1, u * 14) * Math.pow(1 - u, 1.25),
  flash: (u) => Math.pow(1 - u, 2.2),
  hold: (u) => Math.min(u / 0.08, 1) * Math.min((1 - u) / 0.3, 1),
  pulse: (u) => Math.sin(Math.PI * u),
};
export const ALPHA_CURVES = Object.keys(A);
const E = { out: easeOut, lin: (u) => u, in: (u) => u * u };

function gradient(def, u, out) {
  const c = def._rgb;
  let a, b, t;
  if (u < 0.5) { a = c[0]; b = c[1]; t = u * 2; } else { a = c[1]; b = c[2]; t = (u - 0.5) * 2; }
  const k = def.tint;
  out[0] = lerp(1, lerp(a[0], b[0], t), k);
  out[1] = lerp(1, lerp(a[1], b[1], t), k);
  out[2] = lerp(1, lerp(a[2], b[2], t), k);
}

export class FxSystem {
  constructor(o = {}) {
    this.sinTilt = o.sinTilt ?? 0.82;
    this.insts = [];
    this.parts = [];
    this.items = [];
    this._pool = [];
    this._n = 0;
    this._c = [1, 1, 1];
    this.maxParts = 3000;
    this.onLight = null; // (x,z,r,g,b,intensity,radius) — luz dinâmica opcional
  }
  get cosTilt() { return Math.sqrt(1 - this.sinTilt * this.sinTilt); }
  screenAngle(dx, dz) { return Math.atan2(-dz * this.sinTilt, dx); }
  groundAngle(dx, dz) { return Math.atan2(-dz, dx); }

  clear() { this.insts.length = 0; this.parts.length = 0; }

  spawn(defIn, o = {}) {
    const def = normalizeDef(defIn);
    let dx = o.dx ?? 1, dz = o.dz ?? 0; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const inst = {
      def, t: 0, sc: o.scale ?? 1, x: o.x ?? 0, z: o.z ?? 0, dx, dz,
      follow: o.follow || null, targets: o.targets || null, loop: !!o.loop || (def.kind === 'orbit' && def.life <= 0),
      dead: false, acc: 0, count: o.count ?? def.args.count, radius: o.radius ?? def.args.radius,
      onLand: o.onLand || null, points: o.points || null, timers: [], seed: Math.random() * 100,
      px: o.x ?? 0, pz: o.z ?? 0, maxT: o.maxT ?? null, ended: false,
    };
    const sc = inst.sc;
    switch (def.kind) {
      case 'slash':
        if (def.part.on) this.emit(inst, inst.x + dx * def.body.offset * sc, def.part.y, inst.z + dz * def.body.offset * sc, def.part.burst, Math.atan2(dz, dx), def.part.spread);
        break;
      case 'nova':
        if (def.part.on) this.emit(inst, inst.x, def.part.y, inst.z, def.part.burst, null, 360, def.part.speed * inst.radius / (def.args.radius || 5));
        if (def.hit.on) this.hit(inst, inst.x, inst.z, 1);
        break;
      case 'chain': {
        const nodes = [{ x: inst.x, z: inst.z }, ...(inst.targets || [])];
        inst.nodes = nodes;
        nodes.forEach((n, i) => { if (i > 0) inst.timers.push({ t: (i - 1) * 0.03, fn: () => { if (def.part.on) this.emit(inst, n.x, def.part.y, n.z, def.part.burst, null, 360); if (def.hit.on) this.hit(inst, n.x, n.z, 1); } }); });
        break;
      }
      case 'projectile':
        inst.speed = o.speed ?? def.args.speed; inst.vx = dx * inst.speed; inst.vz = dz * inst.speed;
        break;
      case 'rain': {
        const n = inst.count; inst.drops = [];
        for (let i = 0; i < n; i++) {
          const p = inst.points?.[i];
          let x, z;
          if (p) { x = p.x; z = p.z; } else { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * def.args.spread * sc; x = inst.x + Math.cos(a) * r; z = inst.z + Math.sin(a) * r; }
          inst.drops.push({ x, z, d: (i / Math.max(1, n)) * def.life * 0.75 + Math.random() * 0.08, landed: false });
        }
        break;
      }
    }
    this.insts.push(inst);
    return inst;
  }

  kill(inst) { inst.dead = true; }

  emit(inst, x, y, z, n, dirAngle, spread, speedOverride) {
    const p = inst.def.part, sc = inst.sc;
    for (let i = 0; i < n; i++) {
      if (this.parts.length >= this.maxParts) return;
      const a = dirAngle == null ? Math.random() * TAU : dirAngle + (Math.random() - 0.5) * (spread * Math.PI / 180);
      const sp = (speedOverride ?? p.speed) * (0.45 + Math.random() * 0.75) * (inst.def.kind === 'nova' && speedOverride ? 1 : sc);
      const life = p.life * (0.7 + Math.random() * 0.6);
      this.parts.push({
        def: inst.def, layer: 'part', x, y, z, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp,
        vy: p.lift + (spread >= 360 ? (Math.random() - 0.3) * sp * 0.35 : Math.random() * sp * 0.2),
        age: 0, life, s0: p.size0 * sc * (0.7 + Math.random() * 0.6), s1: p.size1 * sc,
        rot: Math.random() * TAU, spin: p.spin * (Math.random() * 2 - 1), fixed: false,
      });
    }
  }
  hit(inst, x, z, k = 1) {
    const h = inst.def.hit, sc = inst.sc;
    if (this.parts.length >= this.maxParts) return;
    this.parts.push({ def: inst.def, layer: 'hit', x, y: h.y, z, vx: 0, vy: 0, vz: 0, age: 0, life: h.life, s0: h.size0 * sc * k, s1: h.size1 * sc * k, rot: Math.random() * TAU, spin: 0, fixed: true, flat: h.flat });
    if (this.onLight) this.onLight(x, z, inst.def, h.life);
  }

  // posições dos corpos orbitais (para o jogo calcular colisão com a mesma fórmula)
  orbitPoints(inst, out = []) {
    const R = inst.def.args.orbitRadius * inst.sc, w = inst.def.args.orbitSpeed * Math.PI / 180;
    const cx = inst.follow ? inst.follow.x : inst.x, cz = inst.follow ? inst.follow.z : inst.z;
    out.length = 0;
    for (let i = 0; i < inst.count; i++) { const a = w * inst.t + (i * TAU) / inst.count; out.push({ x: cx + Math.cos(a) * R, z: cz + Math.sin(a) * R }); }
    return out;
  }

  step(dt) {
    dt = Math.min(dt, 0.05);
    const insts = this.insts;
    for (let i = insts.length - 1; i >= 0; i--) {
      const it = insts[i], def = it.def, p = def.part;
      it.t += dt;
      for (let k = it.timers.length - 1; k >= 0; k--) { it.timers[k].t -= dt; if (it.timers[k].t <= 0) { it.timers[k].fn(); it.timers.splice(k, 1); } }
      if (it.follow) { it.x = it.follow.x; it.z = it.follow.z; if (it.follow.dx !== undefined && def.kind === 'projectile') { it.dx = it.follow.dx; it.dz = it.follow.dz; } }
      switch (def.kind) {
        case 'projectile': {
          if (!it.follow) { it.x += it.vx * dt; it.z += it.vz * dt; }
          const maxT = it.maxT ?? def.life;
          const over = it.follow ? (it.follow.dead || it.dead) : it.t >= maxT;
          if (p.on && p.rate > 0 && !over) { it.acc += p.rate * dt; while (it.acc >= 1) { it.acc -= 1; this.emit(it, it.x - it.dx * 0.3, p.y, it.z - it.dz * 0.3, 1, null, 360, p.speed * 0.4); } }
          if (over) { if (p.on) this.emit(it, it.x, p.y, it.z, p.burst, null, 360); if (def.hit.on) this.hit(it, it.x, it.z, 1); it.ended = true; }
          break;
        }
        case 'orbit': {
          if (!it.loop && it.t >= def.life) { it.ended = true; break; }
          if (p.on && p.rate > 0) {
            it.acc += p.rate * dt * it.count;
            const pts = this.orbitPoints(it, (it._pts ||= []));
            while (it.acc >= 1) { it.acc -= 1; const q = pts[(Math.random() * pts.length) | 0]; if (q) this.emit(it, q.x, def.body.y, q.z, 1, null, 360, p.speed * 0.5); }
          }
          break;
        }
        case 'rain': {
          let all = true;
          for (const d of it.drops) {
            if (!d.landed && it.t >= d.d + def.args.fall) {
              d.landed = true;
              if (p.on) this.emit(it, d.x, p.y, d.z, p.burst, null, 360);
              if (def.hit.on) this.hit(it, d.x, d.z, 1);
              if (it.onLand) it.onLand(d);
            }
            if (!d.landed) all = false;
          }
          if (all) it.ended = true;
          break;
        }
        default: {
          if (def.kind === 'slash' && p.on && p.rate > 0 && it.t < def.life) {
            it.acc += p.rate * dt;
            while (it.acc >= 1) { it.acc -= 1; this.emit(it, it.x + it.dx * def.body.offset * it.sc * (0.5 + Math.random() * 0.9), p.y, it.z + it.dz * def.body.offset * it.sc * (0.5 + Math.random() * 0.9), 1, Math.atan2(it.dz, it.dx), p.spread); }
          }
          if (it.t >= def.life) it.ended = true;
        }
      }
      if (it.dead) it.ended = true;
      if (it.ended && it.timers.length === 0) insts.splice(i, 1);
    }
    // partículas
    const ps = this.parts;
    for (let i = ps.length - 1; i >= 0; i--) {
      const q = ps[i];
      q.age += dt;
      if (q.age >= q.life) { ps.splice(i, 1); continue; }
      if (q.fixed) continue;
      const p = q.def.part, k = Math.exp(-p.drag * dt);
      q.vx *= k; q.vz *= k; q.vy = q.vy * k - p.gravity * dt;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      if (q.y < 0.03) { q.y = 0.03; q.vy *= -0.25; }
      q.rot += q.spin * dt;
    }
    this.build();
  }

  _item() {
    let o = this._pool[this._n];
    if (!o) { o = { def: null, layer: '', x: 0, y: 0, z: 0, sx: 1, sy: 1, rot: 0, flat: false, r: 1, g: 1, b: 1, a: 1, add: true }; this._pool[this._n] = o; }
    this._n++;
    return o;
  }
  _push(def, layer, x, y, z, sx, sy, rot, flat, u, alpha) {
    if (alpha <= 0.002) return;
    const o = this._item(), c = this._c;
    gradient(def, clamp(u, 0, 1), c);
    const g = def.glow;
    o.def = def; o.layer = layer; o.x = x; o.y = y; o.z = z; o.sx = sx; o.sy = sy; o.rot = rot; o.flat = flat;
    o.r = c[0] * g; o.g = c[1] * g; o.b = c[2] * g; o.a = clamp(alpha, 0, 1); o.add = def.blend === 'add';
  }

  build() {
    this._n = 0;
    for (const it of this.insts) {
      const def = it.def, b = def.body, sc = it.sc;
      if (!b.on) continue;
      const curve = A[b.alpha] || A.fade, ease = E[b.ease] || E.out;
      switch (def.kind) {
        case 'slash': {
          const u = clamp(it.t / def.life, 0, 1), s = lerp(b.size0, b.size1, ease(u)) * sc;
          const base = b.flat ? this.groundAngle(it.dx, it.dz) : this.screenAngle(it.dx, it.dz);
          const rot = base + ((b.rot0 + b.sweep * (u - 0.5)) * Math.PI) / 180 * (b.flat ? 1 : 1);
          this._push(def, 'body', it.x + it.dx * b.offset * sc, b.y, it.z + it.dz * b.offset * sc, s * b.stretch, s, rot, b.flat, u, curve(u));
          break;
        }
        case 'nova': {
          const u = clamp(it.t / def.life, 0, 1);
          const s1 = def.args.useRadius === false ? b.size1 * sc : it.radius * 2;
          const s = lerp(b.size0 * sc, s1, ease(u));
          this._push(def, 'body', it.x, b.flat ? 0.04 : b.y, it.z, s * b.stretch, s, (b.rot0 * Math.PI) / 180 + (b.spin * it.t), b.flat, u, curve(u));
          break;
        }
        case 'projectile': {
          const u = it.follow ? clamp((it.t % 1) , 0, 1) : clamp(it.t / (it.maxT ?? def.life), 0, 1);
          const s = (it.follow ? b.size0 : lerp(b.size0, b.size1, u)) * sc;
          const rot = this.screenAngle(it.dx, it.dz) + (b.rot0 * Math.PI) / 180 + b.spin * it.t;
          this._push(def, 'body', it.x, b.y, it.z, s * b.stretch, s, b.flat ? this.groundAngle(it.dx, it.dz) : rot, b.flat, 0.25, Math.min(1, it.t * 14));
          break;
        }
        case 'chain': {
          const u = clamp(it.t / def.life, 0, 1), n = it.nodes;
          for (let i = 1; i < n.length; i++) {
            const a = n[i - 1], c = n[i];
            if (it.t < (i - 1) * 0.03) continue;
            const ddx = c.x - a.x, ddz = c.z - a.z, sy = -ddz * this.sinTilt;
            const len = Math.hypot(ddx, sy), th = b.size0 * sc * def.args.thick * (0.75 + Math.random() * 0.5);
            this._push(def, 'body', (a.x + c.x) / 2, b.y, (a.z + c.z) / 2, len * b.stretch, th, Math.atan2(sy, ddx), false, u, curve(u) * (0.7 + Math.random() * 0.3));
          }
          break;
        }
        case 'orbit': {
          const pts = this.orbitPoints(it, (it._pts ||= []));
          const fadeIn = Math.min(1, it.t / 0.25), fadeOut = it.loop ? 1 : Math.min(1, (def.life - it.t) / 0.25);
          pts.forEach((q, i) => {
            const bob = 1 + 0.08 * Math.sin(it.t * 9 + i * 2);
            this._push(def, 'body', q.x, b.y, q.z, b.size0 * sc * bob * b.stretch, b.size0 * sc * bob, (b.rot0 * Math.PI) / 180 + b.spin * it.t, b.flat, 0.3 + 0.2 * Math.sin(it.t * 5 + i), Math.min(fadeIn, fadeOut));
          });
          break;
        }
        case 'rain': {
          for (const d of it.drops) {
            if (d.landed) continue;
            const u = clamp((it.t - d.d) / def.args.fall, 0, 1);
            if (it.t < d.d) continue;
            const y = lerp(9, 0.7, u * u), s = lerp(b.size0, b.size1, u) * sc;
            this._push(def, 'body', d.x + (1 - u) * 1.8, y, d.z, s * b.stretch, s, (b.rot0 * Math.PI) / 180 + 0.2, false, u, Math.min(1, u * 6));
          }
          break;
        }
      }
    }
    // partículas
    for (const q of this.parts) {
      const def = q.def, u = q.age / q.life;
      if (q.layer === 'hit') {
        const s = lerp(q.s0, q.s1, easeOut(u));
        this._push(def, 'hit', q.x, q.flat ? 0.05 : q.y, q.z, s, s, q.rot, q.flat, u, A.flash(u));
        continue;
      }
      const p = def.part;
      const s = lerp(q.s0, q.s1, u);
      let sx = s, rot = q.rot;
      if (p.stretch > 0) {
        const vsx = q.vx, vsy = q.vy * this.cosTilt - q.vz * this.sinTilt;
        rot = Math.atan2(vsy, vsx); sx = s * (1 + p.stretch * Math.hypot(vsx, vsy) * 0.6);
      }
      this._push(def, 'part', q.x, q.y, q.z, sx, s, rot, false, u, A.fade(u));
    }
    this.items.length = this._n;
    for (let i = 0; i < this._n; i++) this.items[i] = this._pool[i];
  }
}

// serialização (JSON com texturas como dataURL)
const urlCache = new WeakMap();
function texUrl(t) {
  if (!t) return null;
  if (typeof t === 'string') return t;
  let u = urlCache.get(t);
  if (!u) { u = t.toDataURL('image/png'); urlCache.set(t, u); }
  return u;
}
export function serializeDef(def) {
  const o = JSON.parse(JSON.stringify(def, (k, v) => (k.startsWith('_') || k === 'tex' ? undefined : v)));
  o.tex = { body: texUrl(def.tex?.body), part: texUrl(def.tex?.part), hit: texUrl(def.tex?.hit) };
  return o;
}
export function cloneDef(def) {
  const o = serializeDef(def);
  // mantém canvases vivos para evitar re-decodificar
  return normalizeDef(o);
}
