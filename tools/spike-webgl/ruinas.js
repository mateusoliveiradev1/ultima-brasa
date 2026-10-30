// SPIKE (Fase 0): bioma das Ruínas em WebGL. Não faz parte do jogo publicado.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { buildAllProps } from '../../src/shared/art-props.js';
import { paintRuinWall, paintDeadTree, paintBarrel, paintSpire, paintGround, paintGroundMacro, paintSign, paintCliffFace, paintHouse, paintTower } from '../../src/shared/paint.js';
import { mulberry32, cv } from '../../src/shared/util.js';

const W = 1280, H = 720;
const params = new URLSearchParams(location.search);
const rnd = mulberry32(7);

// ───── canvas de chão pintado (base + manchas + rachaduras) ─────
function groundCanvas(size = 1024) {
  const c = cv(size), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, size, size); g.addColorStop(0, '#5a3a2a'); g.addColorStop(1, '#3a2620'); x.fillStyle = g; x.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i++) { const px = rnd() * size, py = rnd() * size, r = 20 + rnd() * 90, col = ['#7a4a30', '#2c1d17', '#8a5a36', '#4a3026'][(rnd() * 4) | 0];
    const rg = x.createRadialGradient(px, py, 0, px, py, r); rg.addColorStop(0, col + 'aa'); rg.addColorStop(1, col + '00'); x.fillStyle = rg; x.fillRect(px - r, py - r, r * 2, r * 2); }
  x.strokeStyle = 'rgba(14,8,6,.75)'; x.lineCap = 'round';
  for (let i = 0; i < 70; i++) { let px = rnd() * size, py = rnd() * size; x.lineWidth = 1 + rnd() * 2.2; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 7; k++) { px += (rnd() - 0.5) * 60; py += (rnd() - 0.5) * 60; x.lineTo(px, py); } x.stroke(); }
  for (let i = 0; i < 900; i++) { const px = rnd() * size, py = rnd() * size; x.fillStyle = rnd() < 0.5 ? 'rgba(255,190,130,.16)' : 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(px, py, 1.5 + rnd() * 4, 1 + rnd() * 2.5, rnd() * 3, 0, Math.PI * 2); x.fill(); }
  return c;
}
// altura derivada da mesma imagem (luminância suavizada) → normal map
function normalFromCanvas(src) {
  const s = src.width, c = cv(s), x = c.getContext('2d'), d = src.getContext('2d').getImageData(0, 0, s, s).data, out = x.createImageData(s, s), h = new Float32Array(s * s);
  for (let i = 0; i < s * s; i++) h[i] = (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 765;
  const at = (xx, yy) => h[((yy + s) % s) * s + ((xx + s) % s)];
  for (let y = 0; y < s; y++) for (let xx = 0; xx < s; xx++) {
    const dx = (at(xx + 1, y) - at(xx - 1, y)) * 3.0, dy = (at(xx, y + 1) - at(xx, y - 1)) * 3.0; const l = Math.hypot(dx, dy, 1);
    const k = (y * s + xx) * 4; out.data[k] = ((-dx / l) * 0.5 + 0.5) * 255; out.data[k + 1] = ((-dy / l) * 0.5 + 0.5) * 255; out.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[k + 3] = 255;
  }
  x.putImageData(out, 0, 0); return c;
}

// ───── renderer ─────
const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; canvas.style.cssText = 'display:block;width:100vw;height:auto';
document.body.style.margin = '0'; document.body.style.background = '#0a0708'; document.body.append(canvas);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.4;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#2a1812');
scene.fog = new THREE.Fog('#4a2a1e', 52, 100);

// câmera ortográfica isométrica (mesmo ângulo do jogo: ~35° de inclinação)
const span = 11.5, aspect = W / H;
const cam = new THREE.OrthographicCamera(-span * aspect, span * aspect, span, -span, -100, 200);
const ang = Math.PI / 2 - 0.42, tilt = 0.66; // ~38° de elevação, olhando de frente com leve giro
cam.position.set(Math.cos(ang) * 30, 30 * Math.tan(tilt), Math.sin(ang) * 30 - 7); cam.lookAt(0, 0.4, -7);
const yaw = Math.atan2(Math.cos(ang), Math.sin(ang)), nDir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
const camBase = cam.position.clone();

// ───── chão ─────
const gp = paintGround(1024, 3);
const gTex = new THREE.CanvasTexture(gp.albedo); gTex.colorSpace = THREE.SRGBColorSpace; gTex.wrapS = gTex.wrapT = THREE.RepeatWrapping; gTex.repeat.set(1.6, 1.6);
const nTex = new THREE.CanvasTexture(gp.normal); nTex.wrapS = nTex.wrapT = THREE.RepeatWrapping; nTex.repeat.set(1.6, 1.6);
const groundMat = new THREE.MeshStandardMaterial({ map: gTex, normalMap: nTex, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 0.92, metalness: 0 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), groundMat);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
// camada macro: manchas, trilhas, pegadas (não repete)
const macro = paintGroundMacro(2560, 5, 32, [[[-32, -1.5], [-9, 0.8], [0, -0.6], [9, 0.6], [32, 4]], [[0, -0.6], [-1, -4], [0.4, -8], [0.2, -12], [1, -32]]]);
const mTex = new THREE.CanvasTexture(macro); mTex.colorSpace = THREE.SRGBColorSpace; mTex.anisotropy = 4;
const overlay = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), new THREE.MeshStandardMaterial({ map: mTex, transparent: true, depthWrite: false, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 }));
overlay.rotation.x = -Math.PI / 2; overlay.position.y = 0.01; overlay.receiveShadow = true; scene.add(overlay);

// ───── props (texturas do próprio jogo, em planos com alphaTest) ─────
const P = buildAllProps();
const propTex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const propMat = (c) => new THREE.MeshStandardMaterial({ map: propTex(c), transparent: false, alphaTest: 0.35, roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide });
const propKinds = [['ruin', 0.55], ['rubble', 1.0], ['tree', 1.1], ['wreck', 0.9], ['pillar', 0.7], ['barrel', 0.8]];
const propMats = {};
for (const [k] of propKinds) propMats[k] = P[k].map((p) => propMat(p.canvas));
const paintedKinds = { ruin: [1, 2, 3].map((i) => paintRuinWall(i)), tree: [1, 2, 3].map((i) => paintDeadTree(i)), barrel: [1, 2].map((i) => paintBarrel(i)), pillar: [paintSpire(1), paintSpire(2)], sign: [paintSign(1), paintSign(2)], house: [1, 2, 3].map((i) => paintHouse(i)), tower: [1, 2, 3].map((i) => paintTower(i)) };
const pMat = (r) => { const m = new THREE.MeshStandardMaterial({ map: propTex(r.albedo), normalMap: new THREE.CanvasTexture(r.normal), normalScale: new THREE.Vector2(1.2, 1.2), alphaTest: 0.4, roughness: 0.8, metalness: 0.02, side: THREE.DoubleSide }); return m; };
for (const k of Object.keys(paintedKinds)) propMats[k] = paintedKinds[k].map(pMat);
const T0 = performance.now(); window.__paintMs = 0;
const placed = [];
// composição em núcleos: cada grupo tem uma peça-âncora e detritos ao redor; entre eles ficam clareiras/caminho
const clusters = [
  { x: -9, z: -7, core: 'ruin', items: ['house', 'ruin', 'rubble', 'rubble', 'barrel', 'pillar'] },
  { x: 8, z: -9, core: 'ruin', items: ['house', 'ruin', 'rubble', 'wreck', 'barrel'] },
  { x: 10, z: 6, core: 'tree', items: ['tree', 'tree', 'tree', 'rubble', 'rubble'] },
  { x: -10, z: 8, core: 'wreck', items: ['house', 'wreck', 'barrel', 'barrel', 'rubble'] },
  { x: 0, z: -13, core: 'pillar', items: ['pillar', 'rubble', 'rubble', 'tree'] },
  { x: -1, z: 12, core: 'tree', items: ['tree', 'tree', 'rubble', 'barrel'] },
];
for (const c of clusters) for (const kind of c.items) {
  for (let k = 0; k < 40; k++) {
    const a = rnd() * Math.PI * 2, d = 0.8 * (kind === c.core && !placed.some((p) => p.cl === c) ? 0 : 1.2 + rnd() * 3.4);
    const x = c.x * 0.62 + Math.cos(a) * d, z = c.z * 0.62 + Math.sin(a) * d * 0.8;
    if (Math.hypot(x, z) < 3 || (z < -10.5 && x < -1.5)) continue; if (placed.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < 1.5)) continue;
    placed.push({ x, z, kind, cl: c }); break;
  }
}
const THICK = { ruin: [0.9, 9], pillar: [0.5, 6], barrel: [0.6, 6], wreck: [0.5, 4], tree: [0.3, 3], rubble: [0.4, 3], sign: [0.12, 2], house: [1.2, 10], tower: [1.3, 10] };
const HEIGHT = { ruin: 4.6, tree: 5.8, pillar: 3.8, barrel: 1.6, wreck: 1.7, rubble: 1.1, sign: 3.2, house: 3.8, tower: 12 };
function addProp(p) {
  const list = propMats[p.kind], ix = (rnd() * list.length) | 0, mat = list[ix], src = paintedKinds[p.kind] ? paintedKinds[p.kind][ix] : P[p.kind][0];
  const h = HEIGHT[p.kind] * 1.2, sc_ = src.albedo || src.canvas, w = h * (sc_.width / sc_.height) * (0.9 + rnd() * 0.2), [th, n] = THICK[p.kind] || [0.3, 3];
  const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0); const y0 = p.y || 0;
  for (let k = 0; k < n; k++) {
    const m = new THREE.Mesh(geo, k === 0 ? mat : mat); const off = (k / Math.max(1, n - 1)) * th;
    m.position.set(p.x - nDir.x * off, y0, p.z - nDir.z * off); m.rotation.y = yaw; m.castShadow = k % 2 === 0; m.receiveShadow = true; scene.add(m);
  }
}
for (const p of placed) addProp(p);

// ───── desnível: planalto de rocha com face pintada, props no topo ─────
const PL = { x: -9.5, z: -15, w: 15, d: 7, h: 2.4 };
const cliffTex = new THREE.CanvasTexture(paintCliffFace(1400, 240, 4)); cliffTex.colorSpace = THREE.SRGBColorSpace; cliffTex.anisotropy = 4;
const sideTex = cliffTex.clone(); sideTex.needsUpdate = true;
const topTex = gTex.clone(); topTex.needsUpdate = true; topTex.repeat.set(1.1, 0.6);
const cliffMat = new THREE.MeshStandardMaterial({ map: cliffTex, emissiveMap: cliffTex, emissive: '#ffffff', emissiveIntensity: 0.55, roughness: 0.95 }), sideMat = new THREE.MeshStandardMaterial({ map: sideTex, emissiveMap: sideTex, emissive: '#ffffff', emissiveIntensity: 0.4, roughness: 0.95 });
const plateau = new THREE.Mesh(new THREE.BoxGeometry(PL.w, PL.h, PL.d), [sideMat, sideMat, new THREE.MeshStandardMaterial({ map: topTex, normalMap: nTex, roughness: 0.95 }), cliffMat, cliffMat, cliffMat]);
plateau.position.set(PL.x, PL.h / 2, PL.z); plateau.castShadow = true; plateau.receiveShadow = true; scene.add(plateau);
for (const [dx, dz, kind] of [[-4.5, 0.2, 'ruin'], [-1.2, -0.6, 'tree'], [1.6, 0.5, 'tree'], [4.6, -0.3, 'ruin'], [2.8, 2.1, 'barrel'], [-3, 2.2, 'sign'], [0.2, 2.4, 'rubble']]) addProp({ x: PL.x + dx, z: PL.z + dz, y: PL.h, kind });
// placas de aviso e entulho junto à trilha
for (const [x, z, kind] of [[-3.2, 1.8, 'sign'], [4.8, -1.6, 'sign'], [-7.4, -1.4, 'rubble'], [7.2, 2.4, 'rubble']]) addProp({ x, z, kind });

for (let i = 0; i < 9; i++) addProp({ x: -24 + i * 6 + (rnd() - 0.5) * 2.5, z: -21.5 - rnd() * 2, kind: 'tower' });

// ───── luz ─────
scene.add(new THREE.HemisphereLight('#c0a898', '#4a2a1a', 2.3));
const sun = new THREE.DirectionalLight('#e8c8a8', 2.2); sun.position.set(-18, 30, 10); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 90; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04; scene.add(sun);
const fires = [[-6, -3], [4, 5], [7, -6], [-2, 8]].map(([x, z], i) => {
  const L = new THREE.PointLight('#ff8a3a', 9, 12, 1.6); L.position.set(x, 1.4, z); L.castShadow = i < 2; if (L.castShadow) { L.shadow.mapSize.set(512, 512); L.shadow.bias = -0.002; } scene.add(L);
  // núcleo de brasa visível
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(), color: '#ffb060', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.scale.set(1.9, 1.9, 1); glow.position.set(x, 1.1, z); scene.add(glow); return L;
});
const player = new THREE.PointLight('#ffb060', 5, 7, 1.8); player.position.set(0, 1.6, 0); scene.add(player);
function radialTex() { const c = cv(128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,220,160,1)'); g.addColorStop(0.35, 'rgba(255,120,40,.5)'); g.addColorStop(1, 'rgba(255,80,20,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }


// ───── atmosfera pós-apocalíptica: colunas de fumaça, bruma baixa, cinza e brasas no ar ─────
function softTex(rgb, a) { const c = cv(128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.5, `rgba(${rgb},${a * 0.45})`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }
const smokeTex = softTex('38,30,28', 0.8), hazeTex = softTex('150,80,56', 0.5);
const smokes = [];
for (const [sx, sz, sy] of [[PL.x - 4.5, PL.z + 0.4, PL.h + 3.2], [6.2, -5.2, 3.0], [-6.0, -3.8, 2.6]]) for (let i = 0; i < 12; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0.5 - i * 0.025, fog: false }));
  s.userData = { sx, sz, base: sy + i * 1.15, i }; s.scale.set(2.2 + i * 0.55, 2.2 + i * 0.55, 1); s.position.set(sx + i * 0.25, s.userData.base, sz); scene.add(s); smokes.push(s);
}
for (let i = 0; i < 9; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: hazeTex, transparent: true, depthWrite: false, opacity: 0.08, fog: false })); s.scale.set(11, 4.2, 1); s.position.set((rnd() - 0.5) * 30, 0.6 + rnd() * 0.8, (rnd() - 0.5) * 24); s.userData.drift = 0.15 + rnd() * 0.2; scene.add(s); smokes.push(s); }
const NP = 520, pPos = new Float32Array(NP * 3), pSeed = new Float32Array(NP);
for (let i = 0; i < NP; i++) { pPos[i * 3] = (rnd() - 0.5) * 34; pPos[i * 3 + 1] = rnd() * 9; pPos[i * 3 + 2] = (rnd() - 0.5) * 30; pSeed[i] = rnd(); }
const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const ash = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: '#d8c0a8', size: 0.07, transparent: true, opacity: 0.55, depthWrite: false, fog: false })); scene.add(ash);
const embers = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: '#ff8a3a', size: 0.11, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); embers.scale.set(0.9, 1, 0.9); scene.add(embers);

// ───── pós-processamento: pintura (Kuwahara 4 quadrantes) + grão de papel + vinheta ─────
const composer = new EffectComposer(renderer); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, cam));
const PaintShader = {
  uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(W, H) }, time: { value: 0 }, paint: { value: params.has('nopaint') ? 0 : 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 res; uniform float time; uniform float paint; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 px = 1.0 / res; vec3 base = texture2D(tDiffuse, vUv).rgb; vec3 col = base;
      if (paint > 0.5) {
        // Kuwahara: média e variância nos 4 quadrantes, escolhe o de menor variância
        const int R = 2; vec3 m[4]; vec3 s[4];
        for (int k=0;k<4;k++){ m[k]=vec3(0.0); s[k]=vec3(0.0); }
        float n[4]; for (int k=0;k<4;k++) n[k]=0.0;
        for (int j=-R;j<=R;j++) for (int i=-R;i<=R;i++) {
          vec3 c = texture2D(tDiffuse, vUv + vec2(float(i),float(j))*px).rgb;
          int q = 0; if (i>=0) q += 1; if (j>=0) q += 2;
          m[q] += c; s[q] += c*c; n[q] += 1.0;
        }
        float best = 1e9; vec3 outc = base;
        for (int k=0;k<4;k++){ vec3 mm = m[k]/n[k]; vec3 v = abs(s[k]/n[k] - mm*mm); float var = v.r+v.g+v.b; if (var < best){ best = var; outc = mm; } }
        col = mix(base, outc, 0.55);
      }
      float lum = dot(col, vec3(0.299,0.587,0.114));
      col = mix(vec3(lum), col, 0.86);
      col = mix(col * vec3(0.86,0.96,1.02), col * vec3(1.06,1.0,0.94), smoothstep(0.08, 0.5, lum));
      // grão de papel e vinheta
      float g = hash(gl_FragCoord.xy + fract(time)*100.0) - 0.5;
      col += g * 0.018;
      vec2 d = vUv - 0.5; col *= 1.0 - dot(d,d) * 0.55;
      gl_FragColor = vec4(col, 1.0);
    }`,
};
const paintPass = new ShaderPass(PaintShader); composer.addPass(paintPass);
composer.addPass(new OutputPass());

// ───── cena de demonstração: herói = luz quente, brasa na mão ─────
window.__paintMs = Math.round(performance.now() - T0);
const clock = new THREE.Clock();
function frame() {
  const t = clock.getElapsedTime();
  fires.forEach((L, i) => { L.intensity = 8 + Math.sin(t * 9 + i * 1.7) * 1.2 + Math.sin(t * 23 + i) * 0.4; });
  player.intensity = 4.5 + Math.sin(t * 7) * 0.5;
  paintPass.uniforms.time.value = t;
  for (const s of smokes) { const u = s.userData; if (u.drift !== undefined) s.position.x += Math.sin(t * 0.3 + s.position.z) * 0.002; else s.position.set(u.sx + u.i * 0.25 + Math.sin(t * 0.4 + u.i) * 0.3, u.base + ((t * 0.25) % 1.15), u.sz); }
  const pa = pGeo.attributes.position; for (let i = 0; i < NP; i++) { pa.array[i * 3 + 1] += 0.004 + pSeed[i] * 0.01; pa.array[i * 3] += Math.sin(t + i) * 0.003; if (pa.array[i * 3 + 1] > 9) pa.array[i * 3 + 1] = 0; } pa.needsUpdate = true;
  if (params.has('direct')) renderer.render(scene, cam); else composer.render();
  requestAnimationFrame(frame);
}
window.__spike = { renderer, scene, cam, composer, setFrameOnce: () => (params.has('direct') ? renderer.render(scene, cam) : composer.render()) };
if (params.has('still')) { window.__spike.setFrameOnce(); window.__ready = true; } else { frame(); window.__ready = true; }
