// Mundo infinito em "chunks": ruínas, carcaças, árvores mortas, barris em chamas. Determinístico por posição.
import { mulberry32, hash2 } from '../shared/util.js';

export const CS = 22; // tamanho do chunk (unidades de mundo)
const EMPTY = [];
const key = (cx, cz) => cx * 65536 + cz;
// caixa de colisão no chão por tipo: [meia-largura, z-atrás, z-frente]
const BOX = { ruin: [2.3, 1.4, 0.2], wreck: [1.7, 0.7, 0.1], pillar: [0.75, 0.6, 0.1], tree: [0.45, 0.4, 0.1], barrel: [0.5, 0.4, 0.15], spire: [1.0, 0.6, 0.1], crystal: [0.75, 0.4, 0.1] };

export class World {
  constructor(props, cfg) { this.P = props; this.cfg = cfg; this.chunks = new Map(); this.boxIdx = new Map(); }

  chunk(cx, cz) {
    const k = key(cx, cz); let c = this.chunks.get(k);
    if (!c) { c = this.gen(cx, cz); this.chunks.set(k, c); }
    return c;
  }
  addBox(b) {
    const c0x = Math.floor(b[0] / CS), c1x = Math.floor(b[1] / CS), c0z = Math.floor(b[2] / CS), c1z = Math.floor(b[3] / CS);
    for (let a = c0x; a <= c1x; a++) for (let z = c0z; z <= c1z; z++) { const k = key(a, z); let l = this.boxIdx.get(k); if (!l) this.boxIdx.set(k, (l = [])); l.push(b); }
  }
  gen(cx, cz) {
    const rnd = mulberry32(((hash2(cx, cz, 77) * 4294967296) ^ 0x9e3779b9) >>> 0), x0 = cx * CS, z0 = cz * CS, list = [], P = this.P;
    const free = (x, z, d) => Math.hypot(x, z) > 11 && list.every((p) => Math.hypot(p.x - x, p.z - z) > d);
    const add = (type, x, z) => {
      const arr = P[type], v = (rnd() * arr.length) | 0, def = arr[v], bx = BOX[type];
      const p = { type, v, x, z, def, a: 1, flip: rnd() < 0.5, fire: type === 'barrel' && rnd() < 0.75, glow: def.glow || null, box: null, ph: rnd() * 6.28 };
      if (bx) { p.box = [x - bx[0], x + bx[0], z - bx[1], z + bx[2]]; this.addBox(p.box); }
      list.push(p);
    };
    const nR = (rnd() < this.cfg.ruinP ? 1 : 0) + (rnd() < this.cfg.ruinP * 0.35 ? 1 : 0);
    for (let i = 0; i < nR; i++) for (let t = 0; t < 8; t++) { const x = x0 + 4 + rnd() * (CS - 8), z = z0 + 4 + rnd() * (CS - 8); if (free(x, z, 7)) { add('ruin', x, z); break; } }
    const n = 8 + ((rnd() * 6) | 0), W = this.cfg.props;
    for (let i = 0; i < n; i++) {
      let r = rnd(), type = 'rubble'; for (const [t, w] of W) { if (r < w) { type = t; break; } r -= w; }
      for (let t = 0; t < 6; t++) { const x = x0 + 1 + rnd() * (CS - 2), z = z0 + 1 + rnd() * (CS - 2); if (free(x, z, 3.2)) { add(type, x, z); break; } }
    }
    return { cx, cz, list };
  }
  // chunks que cobrem o retângulo
  each(minX, maxX, minZ, maxZ, fn) {
    for (let cx = Math.floor(minX / CS); cx <= Math.floor(maxX / CS); cx++) for (let cz = Math.floor(minZ / CS); cz <= Math.floor(maxZ / CS); cz++) fn(this.chunk(cx, cz));
  }
  boxesAt(x, z) { return this.boxIdx.get(key(Math.floor(x / CS), Math.floor(z / CS))) || EMPTY; }
  // empurra (e.x,e.z) para fora de qualquer caixa; retorna true se encostou
  pushOut(e, r) {
    let hit = false;
    for (const b of this.boxesAt(e.x, e.z)) {
      const cx = Math.max(b[0], Math.min(e.x, b[1])), cz = Math.max(b[2], Math.min(e.z, b[3]));
      let dx = e.x - cx, dz = e.z - cz, d = Math.hypot(dx, dz);
      if (d >= r) continue;
      hit = true;
      if (d < 1e-4) { // dentro da caixa: sai pelo eixo mais curto
        const l = e.x - b[0], rr = b[1] - e.x, t = e.z - b[2], f = b[3] - e.z, m = Math.min(l, rr, t, f);
        if (m === l) e.x = b[0] - r; else if (m === rr) e.x = b[1] + r; else if (m === t) e.z = b[2] - r; else e.z = b[3] + r;
      } else { e.x = cx + (dx / d) * r; e.z = cz + (dz / d) * r; }
    }
    return hit;
  }
}
