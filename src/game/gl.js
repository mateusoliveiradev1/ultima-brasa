// Renderer WebGL2 (Fase 1, opt-in com ?gl=1). O Canvas2D continua sendo o padrão e o fallback.
// Arquitetura híbrida: a GPU desenha o CHÃO (relevo por pixel iluminado pelas luzes do jogo) e os SPRITES do mundo
// (props, inimigos, herói, itens) em lote; o resultado é composto no canvas 2D, que segue cuidando de luz (multiplicação),
// efeitos, números e HUD. Assim a mistura aditiva e o resto do pipeline continuam idênticos.
import { clamp } from '../shared/util.js';

const MAXQ = 3000, SIN = 0.82, NL = 24;
const hex = (c) => { c = String(c || '#fff'); if (c[0] === '#') { if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; const n = parseInt(c.slice(1, 7), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; } const m = c.match(/[\d.]+/g); return m ? [m[0] / 255, m[1] / 255, m[2] / 255] : [1, 1, 1]; };

const VS_FULL = `#version 300 es
void main(){ vec2 p = vec2((gl_VertexID<<1)&2, gl_VertexID&2); gl_Position = vec4(p*2.0-1.0, 0.0, 1.0); }`;
const FS_GROUND = `#version 300 es
precision highp float;
uniform sampler2D uTex; uniform vec2 uRes, uCam, uOff; uniform float uPpu, uTexSz, uH0, uK; uniform int uN; uniform vec4 uL[${NL}]; uniform vec3 uC[${NL}];
out vec4 o;
float lum(vec2 uv){ vec3 c = texture(uTex, uv).rgb; return dot(c, vec3(.3,.5,.2)); }
void main(){
  float px = gl_FragCoord.x, py = uRes.y - gl_FragCoord.y;
  vec2 w = vec2(uCam.x + (px - uRes.x*.5 - uOff.x)/uPpu, uCam.y + (py - uH0 - uOff.y)/(${SIN.toFixed(2)}*uPpu));
  vec2 uv = w*38.0/uTexSz; vec3 alb = texture(uTex, uv).rgb;
  float e = 1.6/uTexSz, hx = lum(uv+vec2(e,0.)) - lum(uv-vec2(e,0.)), hz = lum(uv+vec2(0.,e)) - lum(uv-vec2(0.,e));
  vec3 N = normalize(vec3(-hx*uK, 1.0, -hz*uK)); vec3 acc = vec3(0.0);
  for (int i=0;i<${NL};i++){ if (i>=uN) break; vec4 l = uL[i]; vec3 d = vec3(l.x-w.x, l.z, l.y-w.y); float dist = length(d.xz); float att = clamp(1.0-dist/l.w,0.,1.); att*=att;
    vec3 L = normalize(d); float diff = max(dot(N,L),0.) - L.y; acc += uC[i]*att*diff; }
  o = vec4(clamp(alb*(1.0+acc*1.7), 0.0, 1.0), 1.0);
}`;
const VS_SPR = `#version 300 es
layout(location=0) in vec2 aP; layout(location=1) in vec2 aT; layout(location=2) in float aA; uniform vec2 uRes; out vec2 vT; out float vA;
void main(){ vT = aT; vA = aA; gl_Position = vec4(aP.x/uRes.x*2.0-1.0, 1.0-aP.y/uRes.y*2.0, 0.0, 1.0); }`;
const FS_SPR = `#version 300 es
precision mediump float; uniform sampler2D uTex; in vec2 vT; in float vA; out vec4 o;
void main(){ o = texture(uTex, vT) * vA; }`;

function prog(gl, vs, fs) {
  const mk = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p;
}

// Ponte com a API do Canvas2D: transformações viram matriz própria, drawImage vai para a GPU e todo o resto
// (barras de vida, textos, gradientes) é gravado e reexecutado no canvas 2D depois, para ficar por cima dos sprites.
class GLCtx {
  constructor(r, real) { this.r = r; this.real = real; this.m = [1, 0, 0, 1, 0, 0]; this.stack = []; this.alpha = 1; this.op = 'source-over'; this.q = []; }
  reset() { this.m = [1, 0, 0, 1, 0, 0]; this.stack.length = 0; this.alpha = 1; this.op = 'source-over'; this.q.length = 0; }
  save() { this.stack.push(this.m.slice()); this.q.push([0, 'save', []]); }
  restore() { if (this.stack.length) this.m = this.stack.pop(); this.q.push([0, 'restore', []]); }
  translate(x, y) { const m = this.m; m[4] += m[0] * x + m[2] * y; m[5] += m[1] * x + m[3] * y; this.q.push([0, 'translate', [x, y]]); }
  scale(x, y) { const m = this.m; m[0] *= x; m[1] *= x; m[2] *= y; m[3] *= y; this.q.push([0, 'scale', [x, y]]); }
  rotate(a) { const m = this.m, c = Math.cos(a), s = Math.sin(a), a0 = m[0], b0 = m[1], c0 = m[2], d0 = m[3]; m[0] = a0 * c + c0 * s; m[1] = b0 * c + d0 * s; m[2] = -a0 * s + c0 * c; m[3] = -b0 * s + d0 * c; this.q.push([0, 'rotate', [a]]); }
  setTransform(a, b, c, d, e, f) { this.m = [a, b, c, d, e, f]; this.q.push([0, 'setTransform', [a, b, c, d, e, f]]); }
  drawImage(img, ...a) {
    let sx = 0, sy = 0, sw, sh, dx, dy, dw, dh; const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (a.length === 8) { [sx, sy, sw, sh, dx, dy, dw, dh] = a; } else { sw = iw; sh = ih; dx = a[0]; dy = a[1]; dw = a.length >= 4 ? a[2] : iw; dh = a.length >= 4 ? a[3] : ih; }
    this.r.quad(img, sx, sy, sw, sh, dx, dy, dw, dh, this.m, this.alpha, this.op === 'lighter', a.length === 8);
  }
}
const RET = new Set(['createRadialGradient', 'createLinearGradient', 'createPattern', 'measureText', 'getTransform']);
function bridge(target) {
  return new Proxy(target, {
    get(t, p) {
      if (p in t) { const v = t[p]; return typeof v === 'function' ? v.bind(t) : v; }
      const rv = t.real[p];
      if (typeof rv === 'function') return RET.has(p) ? (...a) => rv.apply(t.real, a) : (...a) => { t.q.push([0, p, a]); };
      return rv;
    },
    set(t, p, v) { if (p === 'globalAlpha') t.alpha = v; else if (p === 'globalCompositeOperation') t.op = v; t.q.push([1, p, v]); return true; },
  });
}

export class GLRenderer {
  static enabled() { try { return new URLSearchParams(location.search).get('gl') === '1'; } catch { return false; } }
  static create(game) { if (!GLRenderer.enabled()) return null; try { return new GLRenderer(game); } catch (e) { console.warn('[gl] indisponível, usando Canvas2D:', e.message); return null; } }

  constructor(game) {
    this.game = game; this.canvas = document.createElement('canvas'); this.dead = false;
    const gl = this.gl = this.canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL2 não suportado');
    this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.dead = true; if (game.gl === this) game.gl = null; });
    this.pG = prog(gl, VS_FULL, FS_GROUND); this.pS = prog(gl, VS_SPR, FS_SPR);
    this.uG = {}; for (const n of ['uTex', 'uRes', 'uCam', 'uOff', 'uPpu', 'uTexSz', 'uH0', 'uK', 'uN', 'uL', 'uC']) this.uG[n] = gl.getUniformLocation(this.pG, n);
    this.uS = { uRes: gl.getUniformLocation(this.pS, 'uRes'), uTex: gl.getUniformLocation(this.pS, 'uTex') };
    this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao); this.vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    this.buf = new Float32Array(MAXQ * 6 * 5); gl.bufferData(gl.ARRAY_BUFFER, this.buf.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 8); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 20, 16);
    this.tex = new WeakMap(); this.n = 0; this.cur = null; this.curAdd = false;
    this.ctxB = new GLCtx(this, null); this.proxy = null;
    this.stats = { ms: 0, calls: 0, quads: 0, tex: 0 }; this.debug = /[?&]debug=1/.test(location.search);
    this.lt = new Float32Array(NL * 4); this.lc = new Float32Array(NL * 3);
    this.resize();
  }
  resize() { const g = this.game; if (this.canvas.width !== g.W || this.canvas.height !== g.H) { this.canvas.width = g.W; this.canvas.height = g.H; } }

  texFor(img, repeat) {
    const gl = this.gl; let t = this.tex.get(img);
    if (t) return t;
    t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); } catch { return null; }
    gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const w = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE; gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, w); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, w);
    this.tex.set(img, t); this.stats.tex++; return t;
  }

  // ── chão ──
  ground(g) {
    if (this.dead) return false; const t0 = performance.now(), gl = this.gl; this.resize(); this.stats.calls = 0; this.stats.quads = 0;
    const img = g.bart.ground, tx = this.texFor(img, true); if (!tx) return false;
    // luzes: herói, fogueiras/barris (quadro anterior), brilhos, efeitos pontuais
    const L = []; const add = (x, z, h, r, col, a) => L.push({ x, z, h, r, c: hex(col), a });
    const T = performance.now() / 1000, fl = 0.9 + 0.1 * Math.sin(T * 17);
    add(g.hero.x, g.hero.z, 0.9, 8.2, '#ffa95a', 0.95 * fl);
    for (const p of g._fires || []) add(p.x, p.z, 0.9, 7, g.biome.fire, 0.85);
    for (const p of g.glowersNow || []) add(p.x, p.z, 0.9, 5, p.glow, 0.7);
    for (const l of g.lights) add(l.x, l.z, l.y || 0.8, l.r * 1.2, l.col, l.a * clamp(l.t / l.life * 1.4, 0, 1));
    for (const b of g.ebolts) add(b.x, b.z, b.y || 0.8, 3, b.col || '#ff7a2a', 0.8);
    L.sort((a, b) => Math.hypot(a.x - g.cam.x, a.z - g.cam.z) - Math.hypot(b.x - g.cam.x, b.z - g.cam.z));
    const n = Math.min(NL, L.length); for (let i = 0; i < n; i++) { const l = L[i]; this.lt.set([l.x, l.z, l.h, l.r], i * 4); this.lc.set([l.c[0] * l.a, l.c[1] * l.a, l.c[2] * l.a], i * 3); }
    gl.viewport(0, 0, g.W, g.H); gl.disable(gl.BLEND); gl.useProgram(this.pG); const u = this.uG;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tx); gl.uniform1i(u.uTex, 0);
    gl.uniform2f(u.uRes, g.W, g.H); gl.uniform2f(u.uCam, g.cam.x, g.cam.z); gl.uniform2f(u.uOff, g.cam.sx, g.cam.sz); gl.uniform1f(u.uPpu, g.ppu); gl.uniform1f(u.uTexSz, img.width); gl.uniform1f(u.uH0, g.H * 0.56); gl.uniform1f(u.uK, 5.5);
    gl.uniform1i(u.uN, n); gl.uniform4fv(u.uL, this.lt); gl.uniform3fv(u.uC, this.lc);
    gl.bindVertexArray(this.vao); gl.drawArrays(gl.TRIANGLES, 0, 3); this.stats.calls++; this.t0 = t0; return true;
  }

  // ── sprites ──
  begin(realCtx) {
    const gl = this.gl; this.ctxB.real = realCtx; this.ctxB.reset(); this.proxy = this.proxy || bridge(this.ctxB);
    gl.viewport(0, 0, this.game.W, this.game.H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.BLEND);
    gl.useProgram(this.pS); gl.uniform2f(this.uS.uRes, this.game.W, this.game.H); gl.uniform1i(this.uS.uTex, 0); gl.bindVertexArray(this.vao); this.n = 0; this.cur = null; return this.proxy;
  }
  quad(img, sx, sy, sw, sh, dx, dy, dw, dh, m, alpha, add, atlas) {
    if (alpha <= 0.003 || !(img.width || img.naturalWidth)) return; if (img.complete === false) return;
    const tx = this.texFor(img, false); if (!tx) return;
    if (tx !== this.cur || add !== this.curAdd || this.n >= MAXQ) { this.flush(); this.cur = tx; this.curAdd = add; }
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, e = atlas ? 0.5 : 0;
    const u0 = (sx + e) / iw, v0 = (sy + e) / ih, u1 = (sx + sw - e) / iw, v1 = (sy + sh - e) / ih;
    const [a, b, c, d, ex, fy] = m, X = (x, y) => a * x + c * y + ex, Y = (x, y) => b * x + d * y + fy;
    const x0 = X(dx, dy), y0 = Y(dx, dy), x1 = X(dx + dw, dy), y1 = Y(dx + dw, dy), x2 = X(dx + dw, dy + dh), y2 = Y(dx + dw, dy + dh), x3 = X(dx, dy + dh), y3 = Y(dx, dy + dh);
    const B = this.buf; let o = this.n * 30;
    B[o++] = x0; B[o++] = y0; B[o++] = u0; B[o++] = v0; B[o++] = alpha; B[o++] = x1; B[o++] = y1; B[o++] = u1; B[o++] = v0; B[o++] = alpha; B[o++] = x2; B[o++] = y2; B[o++] = u1; B[o++] = v1; B[o++] = alpha;
    B[o++] = x0; B[o++] = y0; B[o++] = u0; B[o++] = v0; B[o++] = alpha; B[o++] = x2; B[o++] = y2; B[o++] = u1; B[o++] = v1; B[o++] = alpha; B[o++] = x3; B[o++] = y3; B[o++] = u0; B[o++] = v1; B[o++] = alpha;
    this.n++; this.stats.quads++;
  }
  flush() {
    if (!this.n || !this.cur) { this.n = 0; return; } const gl = this.gl;
    if (this.curAdd) gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.cur); gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.buf, 0, this.n * 30); gl.drawArrays(gl.TRIANGLES, 0, this.n * 6);
    this.stats.calls++; this.n = 0;
  }
  // termina o lote de sprites: compõe no canvas 2D e reexecuta, por cima, o que não era imagem (barras, textos)
  end(ctx) {
    this.flush(); const g = this.game; ctx.drawImage(this.canvas, 0, 0, g.W, g.H);
    for (const [k, p, a] of this.ctxB.q) { if (k === 0) ctx[p](...a); else ctx[p] = a; }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; this.ctxB.q.length = 0;
    this.stats.ms = this.stats.ms * 0.9 + (performance.now() - this.t0) * 0.1; if (this.debug) window.__gl = this.stats;
  }
}
