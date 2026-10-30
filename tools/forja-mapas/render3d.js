// Render WebGL final de um mapa da Forja: mesmo arquivo de mapa da prévia 2D, agora com luz, sombra, névoa e filtro de pintura.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CATALOG } from '../../src/shared/paint-props.js';
import { paintGround, paintGroundMacro, paintCliffFace } from '../../src/shared/paint.js';
import { mulberry32, cv } from '../../src/shared/util.js';

const E = 0.66;
export function buildMap3D(spec, { W = 1280, H = 720, paint = true } = {}) {
  const rnd = mulberry32(spec.seed + 99), cat = Object.fromEntries(CATALOG.map((e) => [e.id, e])), S = spec.camera.scale, [tx, tz] = spec.camera.target;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; canvas.style.cssText = 'display:block'; document.body.style.margin = '0'; document.body.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.4;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2a1812'); scene.fog = new THREE.Fog('#4a2a1e', 52, 100);
  const span = H / (2 * S), cam = new THREE.OrthographicCamera(-span * W / H, span * W / H, span, -span, -100, 250);
  cam.position.set(tx, 40 * Math.sin(E), tz + 40 * Math.cos(E)); cam.lookAt(tx, 0, tz);
  const tex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

  // chão: tile pintado + camada macro (trilhas, manchas)
  const half = spec.ground.half, gp = paintGround(1024, 3), gT = tex(gp.albedo), nT = tex(gp.normal, false); for (const t of [gT, nT]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.2, 2.2); }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, half * 2), new THREE.MeshStandardMaterial({ map: gT, normalMap: nT, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 0.92 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const ov = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, half * 2), new THREE.MeshStandardMaterial({ map: tex(paintGroundMacro(2560, spec.ground.macroSeed, half, spec.ground.paths)), transparent: true, depthWrite: false, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 })); ov.rotation.x = -Math.PI / 2; ov.position.y = 0.01; ov.receiveShadow = true; scene.add(ov);

  // plataformas (desnível): topo de terra + face de rocha pintada
  const cliffT = tex(paintCliffFace(1400, 240, 4)), cliffM = new THREE.MeshStandardMaterial({ map: cliffT, emissiveMap: cliffT, emissive: '#ffffff', emissiveIntensity: 0.5, roughness: 0.95 });
  for (const pl of spec.platforms || []) { const top = gT.clone(); top.needsUpdate = true; top.repeat.set(pl.w / 14, pl.d / 14);
    const m = new THREE.Mesh(new THREE.BoxGeometry(pl.w, pl.h, pl.d), [cliffM, cliffM, new THREE.MeshStandardMaterial({ map: top, roughness: 0.95 }), cliffM, cliffM, cliffM]); m.position.set(pl.x, pl.h / 2, pl.z); m.castShadow = m.receiveShadow = true; scene.add(m); }

  // props
  const matCache = {}, mat = (id, v) => { const e = cat[id], k = id + ':' + (v % e.n); if (!matCache[k]) { const r = e.paint((v % e.n) + 1); matCache[k] = { r, m: new THREE.MeshStandardMaterial({ map: tex(r.albedo), normalMap: tex(r.normal, false), normalScale: new THREE.Vector2(1.2, 1.2), alphaTest: 0.4, roughness: 0.8, metalness: 0.02, side: THREE.DoubleSide }) }; if (id === 'tower') Object.assign(matCache[k].m, { emissiveMap: matCache[k].m.map, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.5, color: new THREE.Color('#d8c0b0') }); } return matCache[k]; };
  const autoLights = [];
  const add = (p) => { const e = cat[p.id], { r, m } = mat(p.id, p.v || 0), ar = r.albedo.width / r.albedo.height, y0 = p.y || 0;
    if (e.kind === 'decal') { const w = e.h * ar * 0.9, g = new THREE.PlaneGeometry(w, w / ar), mesh = new THREE.Mesh(g, m); mesh.rotation.x = -Math.PI / 2; mesh.position.set(p.x, y0 + 0.03, p.z); mesh.receiveShadow = true; scene.add(mesh); }
    else { const h = e.h * (p.s || 1) * 1.2, w = h * ar, [th, n] = e.thick || [0.3, 3], g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
      for (let k = 0; k < n; k++) { const mesh = new THREE.Mesh(g, m), off = (k / Math.max(1, n - 1)) * th; mesh.position.set(p.x, y0, p.z - off); mesh.castShadow = k % 2 === 0; mesh.receiveShadow = true; scene.add(mesh); } }
    if (e.light) autoLights.push({ x: p.x, z: p.z, color: e.light, i: 1, r: 6, y: y0 }); };
  for (const p of spec.props) add(p); for (const p of spec.backdrop || []) add(p);

  // luz
  scene.add(new THREE.HemisphereLight('#c0a898', '#4a2a1a', 2.3));
  const sun = new THREE.DirectionalLight('#e8c8a8', 2.2); sun.position.set(-18, 30, 10); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = sc.bottom = -30; sc.right = sc.top = 30; sc.near = 1; sc.far = 100; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04; scene.add(sun);
  const glowT = (() => { const c = cv(128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,220,160,1)'); g.addColorStop(0.35, 'rgba(255,120,40,.5)'); g.addColorStop(1, 'rgba(255,80,20,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const lights = [...spec.lights, ...autoLights].map((L, i) => { const P = new THREE.PointLight(L.color, 9 * (L.i || 1), (L.r || 6) * 1.8, 1.6); P.position.set(L.x, (L.y || 0) + 1.4, L.z); P.castShadow = i === 0; if (P.castShadow) { P.shadow.mapSize.set(512, 512); P.shadow.bias = -0.002; } scene.add(P);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: L.color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); gl.scale.set(1.9, 1.9, 1); gl.position.set(L.x, (L.y || 0) + 1.1, L.z); scene.add(gl); return P; });

  // atmosfera
  const soft = (rgb, a) => { const c = cv(128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.5, `rgba(${rgb},${a * 0.45})`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); };
  const smokeT = soft('38,30,28', 0.8), hazeT = soft('150,80,56', 0.5), smokes = [];
  for (const [sx, sz, sy] of spec.smoke) for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeT, transparent: true, depthWrite: false, opacity: 0.5 - i * 0.025, fog: false })); s.userData = { sx, sz, base: sy + i * 1.15, i }; s.scale.set(2.2 + i * 0.55, 2.2 + i * 0.55, 1); s.position.set(sx + i * 0.25, s.userData.base, sz); scene.add(s); smokes.push(s); }
  const [bx0, bx1] = spec.bounds.x, [bz0, bz1] = spec.bounds.z; for (let i = 0; i < 9; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: hazeT, transparent: true, depthWrite: false, opacity: 0.08, fog: false })); s.scale.set(11, 4.2, 1); s.position.set(bx0 + rnd() * (bx1 - bx0), 0.6 + rnd() * 0.8, bz0 + rnd() * (bz1 - bz0)); scene.add(s); }
  const NP = 520, pPos = new Float32Array(NP * 3); for (let i = 0; i < NP; i++) { pPos[i * 3] = bx0 + rnd() * (bx1 - bx0); pPos[i * 3 + 1] = rnd() * 9; pPos[i * 3 + 2] = bz0 + rnd() * (bz1 - bz0); }
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: '#d8c0a8', size: 0.07, transparent: true, opacity: 0.55, depthWrite: false, fog: false })), new THREE.Points(pGeo, new THREE.PointsMaterial({ color: '#ff8a3a', size: 0.11, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })));

  // pós: pintura (Kuwahara leve) + grade de cor + grão + vinheta
  const composer = new EffectComposer(renderer); composer.setSize(W, H); composer.addPass(new RenderPass(scene, cam));
  const pass = new ShaderPass({ uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(W, H) }, paint: { value: paint ? 1 : 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; uniform float paint; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){ vec2 px = 1.0 / res; vec3 base = texture2D(tDiffuse, vUv).rgb; vec3 col = base;
        if (paint > 0.5) { const int R = 2; vec3 m[4]; vec3 s[4]; float n[4]; for (int k=0;k<4;k++){ m[k]=vec3(0.0); s[k]=vec3(0.0); n[k]=0.0; }
          for (int j=-R;j<=R;j++) for (int i=-R;i<=R;i++) { vec3 c = texture2D(tDiffuse, vUv + vec2(float(i),float(j))*px).rgb; int q = 0; if (i>=0) q += 1; if (j>=0) q += 2; m[q] += c; s[q] += c*c; n[q] += 1.0; }
          float best = 1e9; vec3 outc = base; for (int k=0;k<4;k++){ vec3 mm = m[k]/n[k]; vec3 v = abs(s[k]/n[k] - mm*mm); float var = v.r+v.g+v.b; if (var < best){ best = var; outc = mm; } } col = mix(base, outc, 0.55); }
        float lum = dot(col, vec3(0.299,0.587,0.114)); col = mix(vec3(lum), col, 0.86); col = mix(col * vec3(0.86,0.96,1.02), col * vec3(1.06,1.0,0.94), smoothstep(0.08, 0.5, lum));
        col += (hash(gl_FragCoord.xy) - 0.5) * 0.018; vec2 d = vUv - 0.5; col *= 1.0 - dot(d,d) * 0.55; gl_FragColor = vec4(col, 1.0); }` });
  composer.addPass(pass); composer.addPass(new OutputPass());
  return { render() { composer.render(); }, lights, props: spec.props.length + (spec.backdrop || []).length };
}
