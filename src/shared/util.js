// Utilidades compartilhadas (jogo + Forja)
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t) => t * t * t;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash2(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
export function rgbToHex(r, g, b) {
  const c = (v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
export function rgba(hex, a = 1) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
}

export function cv(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
export function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (Math.abs(n) < 1000) return n < 10 && n % 1 ? n.toFixed(1) : Math.floor(n).toString();
  const e = Math.min(SUF.length - 1, Math.floor(Math.log10(Math.abs(n)) / 3));
  const v = n / Math.pow(10, e * 3);
  return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + SUF[e];
}
export function fmtTime(s) {
  s = Math.max(0, Math.floor(s));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}
