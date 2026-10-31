// Núcleo do jogo: simulação (combate, inimigos, drops, progressão da expedição) + renderização 2.5D em Canvas2D.
// Os efeitos das habilidades vêm do mesmo motor da Forja (FxSystem) — o que se pinta lá aparece aqui.
import { TAU, clamp, lerp, mulberry32, cv, rgba } from '../shared/util.js';
import { PAL, FOG } from '../shared/theme.js';
import { buildSheet, buildPickups, buildSoft } from '../shared/art-chars.js';
import { buildGround } from '../shared/art-env.js';
import { buildAllProps } from '../shared/art-props.js';
import { buildBiomeProps, tintGround, recolor } from '../shared/art-biomes.js';
import { BIOMES } from './biomes.js';
import { FxSystem, getTex } from '../fx/core.js';
import { drawFx, drawTexFrame } from '../fx/canvas-renderer.js';
import * as store from '../fx/store.js';
import { KENNEY_TEX } from '../assets/kenney.js';
import { SKILLS, SKILL_IDS, PASSIVES, PASSIVE_IDS, ENEMIES, BOSS_TIME, MAX_SKILL, DEPTH_MULT, xpNeed, treeFx, EVOS } from './data.js';
import { World } from './world.js';
import * as A from './audio.js';

const SIN = 0.82, COS = Math.sqrt(1 - SIN * SIN);
const rnd = Math.random;
const pick = (a) => a[(rnd() * a.length) | 0];

// ───────────── arte compartilhada (construída uma vez) ─────────────
const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
function tintImg(img, color, size = 128) {
  const c = cv(size), x = c.getContext('2d'); x.drawImage(img, 0, 0, size, size);
  x.globalCompositeOperation = 'multiply'; x.fillStyle = color; x.fillRect(0, 0, size, size);
  x.globalCompositeOperation = 'destination-in'; x.drawImage(img, 0, 0, size, size); return c;
}
function flashOf(sheet) {
  const c = cv(sheet.width, sheet.height), x = c.getContext('2d'); x.drawImage(sheet, 0, 0);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ffeacc'; x.fillRect(0, 0, c.width, c.height); return c;
}
function scrapSprite() {
  const c = cv(40), x = c.getContext('2d'); x.translate(20, 20);
  const g = x.createRadialGradient(0, 0, 2, 0, 0, 20); g.addColorStop(0, 'rgba(255,170,90,.55)'); g.addColorStop(1, 'rgba(255,120,40,0)'); x.fillStyle = g; x.fillRect(-20, -20, 40, 40);
  x.fillStyle = '#6d7a85'; x.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; x.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); } x.closePath(); x.fill();
  x.fillStyle = '#a9b6bf'; x.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; x.lineTo(Math.cos(a) * 9 * 0.82, Math.sin(a) * 9 * 0.82 - 1); } x.closePath(); x.fill();
  x.fillStyle = '#1a1210'; x.beginPath(); x.arc(0, 0, 3.6, 0, TAU); x.fill();
  return c;
}
function chestSprite() {
  const c = cv(72), x = c.getContext('2d'); x.translate(36, 40);
  const g = x.createRadialGradient(0, 0, 4, 0, 0, 34); g.addColorStop(0, 'rgba(255,200,90,.7)'); g.addColorStop(1, 'rgba(255,150,40,0)'); x.fillStyle = g; x.fillRect(-36, -40, 72, 72);
  x.fillStyle = '#5a3320'; x.fillRect(-18, -4, 36, 18); x.fillStyle = '#7a4a2c'; x.beginPath(); x.moveTo(-18, -4); x.quadraticCurveTo(0, -22, 18, -4); x.closePath(); x.fill();
  x.strokeStyle = '#ffc24a'; x.lineWidth = 3; x.strokeRect(-18, -4, 36, 18); x.beginPath(); x.moveTo(-18, -4); x.quadraticCurveTo(0, -22, 18, -4); x.stroke(); x.beginPath(); x.moveTo(0, -12); x.lineTo(0, 14); x.stroke();
  x.fillStyle = '#ffe9a0'; x.fillRect(-4, 0, 8, 8); return c;
}
export async function buildArt(onProgress = () => {}) {
  const step = () => new Promise((r) => setTimeout(r, 0));
  const art = { sheets: {}, flash: {} };
  for (const n of ['player', 'raider', 'ghoul', 'drone', 'brute', 'boss', 'hound', 'shaman', 'scorpion']) { const s = buildSheet(n); art.sheets[n] = s; art.flash[n] = flashOf(s.canvas); onProgress(0.15 + Math.random() * 0.01); await step(); }
  art.pick = buildPickups(); art.scrap = scrapSprite(); art.soft = buildSoft(); onProgress(0.3); await step();
  art.ground = buildGround(512); onProgress(0.5); await step();
  art.baseProps = buildAllProps(); art.chest = chestSprite(); art.biomeCache = {}; onProgress(0.8); await step();
  const imgs = {}; await Promise.all(Object.entries(KENNEY_TEX).map(async ([k, v]) => { imgs[k] = await loadImg(v); }));
  art.k = imgs;
  art.tex = {
    flame: tintImg(imgs.k_flame2, '#ff9a40'), flameHot: tintImg(imgs.k_flame1, '#ffd98a'), smoke: tintImg(imgs.k_smoke, '#2a211d'), smokeLight: tintImg(imgs.k_smoke, '#9a8a7a'),
    spark: tintImg(imgs.k_spark, '#ffc070'), star: tintImg(imgs.k_star, '#ffdca0'), ring: tintImg(imgs.k_ring, '#ffb060'), scorch: tintImg(imgs.k_scorch, '#050303'), toxic: tintImg(imgs.k_spark2, '#42e0b4'),
    rune: tintImg(imgs.k_rune, '#ff8a3a'), flare: tintImg(imgs.k_flare, '#ffb060'),
  };
  const sheetCache = new Map();
  art.sheetFor = (d) => { const k = d.sheet + (d.tint || ''); let r = sheetCache.get(k); if (!r) { const S = art.sheets[d.sheet]; if (!d.tint) r = { S, F: art.flash[d.sheet] }; else { const canvas = recolor(S.canvas, { color: d.tint, a: 0.66 }); r = { S: { ...S, canvas }, F: flashOf(canvas) }; } sheetCache.set(k, r); } return r; };
  art.biome = (id) => { let b = art.biomeCache[id]; if (!b) { const cfg = BIOMES[id]; b = art.biomeCache[id] = { props: buildBiomeProps(art.baseProps, cfg), ground: tintGround(art.ground, cfg.ground) }; } return b; };
  onProgress(1);
  return art;
}
const softCache = new Map();
function softTint(art, col) {
  let c = softCache.get(col); if (c) return c;
  c = cv(96); const x = c.getContext('2d'), g = x.createRadialGradient(48, 48, 0, 48, 48, 48);
  g.addColorStop(0, rgba(col, 1)); g.addColorStop(0.35, rgba(col, 0.5)); g.addColorStop(1, rgba(col, 0)); x.fillStyle = g; x.fillRect(0, 0, 96, 96);
  softCache.set(col, c); return c;
}

export function skillIcon(id, size = 56) {
  const sk = SKILLS[id], def = store.resolveFx(sk.fx), c = cv(size), x = c.getContext('2d'), col = sk.color;
  const g = x.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size * 0.62); g.addColorStop(0, rgba(col, 0.38)); g.addColorStop(1, 'rgba(10,7,8,0)'); x.fillStyle = g; x.fillRect(0, 0, size, size);
  const tex = getTex(def?.tex?.body);
  if (tex) { x.globalCompositeOperation = 'lighter'; const s = size * 0.92, mt = def.texMeta?.body; drawTexFrame(x, tex, mt, 5, (size - s) / 2, (size - s) / 2, s, s); drawTexFrame(x, tex, mt, 5, (size - s) / 2, (size - s) / 2, s, s); }
  return c;
}

// ───────────── jogo ─────────────
export class Game {
  constructor(canvas, art, hooks = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.art = art; this.hooks = hooks;
    this.fx = new FxSystem({ sinTilt: SIN }); this.fx.maxParts = 2600;
    this.fx.onLight = (x, z, def, life) => this.lights.push({ x, y: 0.8, z, r: 3.4, col: def.colors[1] || '#ff9a40', a: 0.9, t: life * 1.3, life: life * 1.3 });
    this.keys = new Set(); this.joy = { x: 0, z: 0 }; this.dashReq = false;
    this.mode = 'hub'; this.paused = false; this.fxVersion = 0;
    this.cam = { x: 0, z: 0, shake: 0, sx: 0, sz: 0 };
    this.ash = Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd(), s: 0.5 + rnd(), v: 0.02 + rnd() * 0.05, w: rnd() * TAU }));
    this.qLight = cv(8); this.qFx = cv(8); this.qG1 = cv(8); this.qG2 = cv(8);
    this.bloom = true; this.fpsAvg = 16; this.quality = 1; this.opts = { shake: 1, numbers: true }; this.camHub = { x: 2.4, z: 0.5 };
    this.resize();
    this.enterHub({ skill: 'lamina', biome: 'ruinas' });
  }
  setBiome(id) { this.biomeId = id; this.biome = BIOMES[id]; this.bart = this.art.biome(id); this.world = new World(this.bart.props, this.biome); }

  resize() {
    const r = this.canvas.getBoundingClientRect(), cap = 2400000;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.6); if (r.width * r.height * dpr * dpr > cap) dpr = Math.sqrt(cap / (r.width * r.height));
    this.W = this.canvas.width = Math.max(320, Math.floor(r.width * dpr)); this.H = this.canvas.height = Math.max(240, Math.floor(r.height * dpr));
    this.ppu = clamp(Math.min(this.W / 21, this.H / 12.2), 22 * dpr, 90 * dpr);
    const mk = (c, w, h) => { c.width = Math.max(8, Math.ceil(w)); c.height = Math.max(8, Math.ceil(h)); };
    mk(this.qLight, this.W / 4, this.H / 4); mk(this.qFx, this.W / 2, this.H / 2); mk(this.qG1, this.W / 5, this.H / 5); mk(this.qG2, this.W / 14, this.H / 14);
  }

  // ─────────── ciclo de vida ───────────
  reset() {
    this.fx.clear(); this.dmgInd = []; this.corpses = []; this.enemies = []; this.gems = []; this.proj = []; this.ebolts = []; this.texts = []; this.decals = []; this.timers = []; this.lights = []; this.sparks = []; this.telegraphs = [];
    this.hero = { x: 0, z: 0, vx: 0, vz: 0, dx: 1, dz: 0, face: 1, hp: 100, maxHp: 100, iframes: 0, dashT: 0, dashCd: 0, ddx: 1, ddz: 0, anim: 0, hurt: 0, moving: false };
    this.cam.x = 0; this.cam.z = 0; this.cam.shake = 0;
    this.time = 0; this.kills = 0; this.level = 1; this.xp = 0; this.xpNext = xpNeed(1); this.pending = 0; this.scrapRun = 0; this.scrapPieces = 0;
    this.sk = {}; this.skillLv = {}; this.pass = {}; PASSIVE_IDS.forEach((k) => (this.pass[k] = 0));
    this.hitFx = 0; this.hitSfx = 0; this.deathSfx = 0; this.spawnAcc = 0; this.packT = 22; this.bruteT = 105; this.boss = null; this.bossSpawned = false; this.bossDead = false; this.dying = 0; this.over = false; this.slow = 1; this.hurtFlash = 0; this.rerolls = 0; this.hubT = 0; this.lvlQueued = false; this.combo = 0; this.comboT = 0; this.maxCombo = 0; this.elitesKilled = 0; this.pools = []; this.chests = 0; this.eventT = 70; this.event = null; this.revives = 0; this.endless = false; this.bossN = 0; this.tideT = 0; this.bossAt = BOSS_TIME; this.eliteT = 55; this.rings = []; this.ghosts = []; this.ghostT = 0; this.flashA = 0; this.flashCol = '#7dffcf'; this.hitStop = 0; this.trailT = 0;
  }
  enterHub(o) {
    this.reset(); this.setBiome(o.biome || this.biomeId || 'ruinas'); this.mode = 'hub'; this.paused = false; this.hubSkill = o.skill || 'lamina';
    this.hero.x = 0; this.hero.z = 0; this.hero.hp = this.hero.maxHp = 100; this.stats = this.computeStats({}, {}, true);
    this.dummies = [[3.6, -1.6], [5.0, 1.8], [2.6, 3.4], [6.4, -0.4]].map(([x, z], i) => this.makeEnemy(['raider', 'ghoul', 'raider', 'brute'][i], x, z, { dummy: true }));
    this.enemies = this.dummies; this.hubCast = 0.8; this.setHubSkill(this.hubSkill);
  }
  setHubSkill(id) {
    this.hubSkill = id; this.fx.clear(); this.sk = {}; this.skillLv = { [id]: 4 }; this.hubCast = 0.4;
    if (id === 'brasas') this.skillLv = { brasas: 4 };
  }
  startRun({ skill, depth, meta, biome, mul }) {
    this.reset(); this.paused = false; this.over = false; this.setBiome(biome || 'ruinas'); this.mode = 'run'; this.meta = meta; this.mul = mul || { dmg: 1, scrap: 1 }; this.depth = depth; const dm = DEPTH_MULT(depth), b = this.biome; this.dm = { hp: dm.hp * b.hp, dmg: dm.dmg * b.dmg, scrap: dm.scrap * b.scrap }; this.rerolls = meta.reroll || 0;
    this.skillLv[skill] = 1 + (meta.maestria || 0); this.sk[skill] = { cd: 0.3, inst: null };
    this.stats = this.computeStats(meta, this.pass, false, this.mul); this.hero.maxHp = this.stats.maxHp; this.hero.hp = this.hero.maxHp; this.revives = this.stats.revive; this.shield = this.stats.t.shield || 0; this.evo = {}; this.cursed = {}; this.painT = 0; this.frenzyN = 0; this.frenzyT = 0;
    if (meta.impulso) { this.pending = meta.impulso; this.timers.push({ t: 0.7, fn: () => { if (this.pending > 0 && !this.paused) this.openLevelUp(); } }); }
    this.hooks.onStart?.();
  }
  computeStats(m, p, hub = false, mul = { dmg: 1, scrap: 1 }) {
    const g = (o, k) => o[k] || 0, t = treeFx(m), T = (k) => t[k] || 0;
    for (const id in p) { const lv = p[id], fx = PASSIVES[id]?.fx; if (lv && fx) for (const k in fx) t[k] = (t[k] || 0) + fx[k] * lv; }
    return {
      t,
      maxHp: (100 + g(m, 'vida') * 12 + g(p, 'hp') * 25) * (1 + T('hpPct')), dmg: (1 + g(m, 'dano') * 0.06 + T('dmgP')) * (1 + g(p, 'dmg') * 0.12) * mul.dmg, cd: Math.max(0.25, (1 - g(m, 'recarga') * 0.025 - T('cdrFlat')) * (1 - g(p, 'cdr') * 0.08)),
      speed: 5.4 * (1 + g(m, 'vel') * 0.025 + T('speedP')) * (1 + g(p, 'spd') * 0.08), magnet: 2.7 * (1 + g(m, 'ima') * 0.08 + T('magP')) * (1 + g(p, 'magnet') * 0.3), regen: g(m, 'regen') * 0.15 + T('regenFlat') + g(p, 'regen') * 0.7,
      armor: g(m, 'chapa') * 0.5 + T('armorFlat') + g(p, 'armor'), crit: 0.05 + g(m, 'crit') * 0.02 + T('critFlat') + g(p, 'crit') * 0.08 + g(p, 'luck') * 0.05, critMul: 2 + g(m, 'critd') * 0.1 + T('critMulP'), area: 1 + g(p, 'area') * 0.1 + g(m, 'area') * 0.03 + T('areaP'),
      luck: (1 + g(m, 'sorte') * 0.08 + g(p, 'luck') * 0.15) * (1 + T('luckP')) * mul.scrap, xp: (1 + g(m, 'xpg') * 0.06) * (1 + T('xpP')), cards: 3 + g(m, 'cartas'), slots: 4 + g(m, 'slots'), dashCd: 1.4 * Math.max(0.2, 1 - g(m, 'dash') * 0.06 - T('dashCdP')),
      revive: g(m, 'revive'), thorns: (g(m, 'espinhos') * 9 + T('thornsFlat')) * (1 + T('thornsMul')) * (T('thornsX2') ? 2 : 1), exec: g(m, 'exec') * 0.2 + T('execP'), execT: 0.25 + T('execT'),
    };
  }

  // ─────────── entidades ───────────
  makeEnemy(id, x, z, o = {}) {
    const d = ENEMIES[id], t = this.time || 0, dm = this.dm || { hp: 1, dmg: 1 };
    const hpMul = (1 + (t / 60) * 0.3 + Math.pow(t / 60, 2) * 0.012) * dm.hp * (o.elite ? 7 : 1), dmgMul = (1 + (t / 60) * 0.1) * dm.dmg * (o.elite ? 1.3 : 1);
    const hp = d.hp * hpMul, sc = (d.scale || 1) * (o.elite ? 1.3 : 1);
    const e = { d, id, x, z, hp, maxHp: hp, r: d.r * sc, sc, elite: !!o.elite, speed: d.speed * (0.92 + rnd() * 0.16) * (d.wob ? 1.05 : 1) * (o.elite ? 1.1 : 1), dmg: dmgMul * d.dmg, face: -1, anim: rnd() * 6, flash: 0, kx: 0, kz: 0, atk: 0.3, spawn: o.dummy ? 1 : 0, orbCd: 0, t: rnd() * 10, dummy: !!o.dummy, shoot: 1 + rnd() * 1.5, chargeT: 3 + rnd() * 3, charging: 0, fuse: 0, enr: false, hover: d.fly ? 1.15 : 0, mv: {}, fl: rnd() * 2 - 1, lg: 0, lgCd: 1 + rnd() * 2, cast: 3 + rnd() * 3, buff: 0, lx: x, lz: z, stT: 0, slideT: 0, slideS: 1, affix: null, afT: 2 + rnd() * 2 };
    if (o.elite && !d.boss) this.applyAffix(e);
    return e;
  }
  applyAffix(e) {
    const A_ = [['veloz', 'Veloz', '#7dffcf'], ['blindado', 'Blindado', '#9fb0bc'], ['explosivo', 'Explosivo', '#ff5a2a'], ['vampiro', 'Vampiro', '#e0433a'], ['atirador', 'Atirador', '#ffb347']], a = pick(A_);
    e.affix = a[0]; e.affixName = a[1]; e.affixCol = a[2];
    if (a[0] === 'veloz') e.speed *= 1.4; if (a[0] === 'blindado') { e.hp *= 1.7; e.maxHp = e.hp; e.r *= 1.08; e.sc *= 1.08; }  }
  spawnEnemy(id, x, z) { const e = this.makeEnemy(id, x, z); this.enemies.push(e); return e; }
  ringPos(extra = 0) {
    const hx = this.W / (2 * this.ppu) + 2.2 + extra, hz = this.H / (2 * this.ppu * SIN) + 2.2 + extra, a = rnd() * TAU;
    return [this.cam.x + Math.cos(a) * hx * (0.95 + rnd() * 0.25), this.cam.z + Math.sin(a) * hz * (0.95 + rnd() * 0.25)];
  }

  // ─────────── entrada ───────────
  inputVec() {
    let x = (this.keys.has('d') || this.keys.has('arrowright') ? 1 : 0) - (this.keys.has('a') || this.keys.has('arrowleft') ? 1 : 0);
    let z = (this.keys.has('s') || this.keys.has('arrowdown') ? 1 : 0) - (this.keys.has('w') || this.keys.has('arrowup') ? 1 : 0);
    x += this.joy.x; z += this.joy.z; const l = Math.hypot(x, z); if (l > 1) { x /= l; z /= l; } return [x, z];
  }

  // ─────────── combate ───────────
  ok(e) { return !e.dead && e.spawn > 0.3 && (!e.dummy || this.mode === 'hub'); }
  nearest(x, z, max = 99) {
    let best = null, bd = max * max;
    for (const e of this.enemies) { if (!this.ok(e)) continue; const d = (e.x - x) ** 2 + (e.z - z) ** 2; if (d < bd) { bd = d; best = e; } }
    return best;
  }
  hurt(e, dmg, o = {}) {
    if (e.dead) return;
    if (this.mode === 'hub') { e.flash = 0.1; if (o.text !== false) this.floatText(e.x, 1.6, e.z, Math.round(dmg * this.stats.dmg), '#ffd98a', false); return; }
    const T = this.stats.t, h0 = this.hero, big = e.elite || e.d.boss;
    let d = dmg * this.stats.dmg, crit = false, bonus = 0;
    if (this.mode === 'run') {
      if (T.frenzy && this.frenzyN) bonus += T.frenzy * this.frenzyN;
      if (T.nearDmg && Math.hypot(e.x - h0.x, e.z - h0.z) < 3.5) bonus += T.nearDmg;
      if (T.farDmg && Math.hypot(e.x - h0.x, e.z - h0.z) > 7) bonus += T.farDmg;
      if (big) bonus += (T.eliteDmg || 0) + (e.d.boss ? (T.bossDmg || 0) : 0);
      if (T.comboDmg) bonus += T.comboDmg * Math.floor(this.combo / 10);
      if (h0.hp < h0.maxHp * 0.5) bonus += T.lowHpDmg || 0;
      if (this.painT > 0) bonus += T.painDmg || 0;
      d *= 1 + bonus; if (T.lastBreath && h0.hp < h0.maxHp * 0.25) d *= 1.5;
    }
    if (this.stats.exec && e.hp < e.maxHp * this.stats.execT) d *= 1 + this.stats.exec;
    if (rnd() < this.stats.crit) { d *= this.stats.critMul + (T.verdict && big ? 0.5 : 0); crit = true; }
    if (this.mode === 'run' && T.leech) h0.hp = Math.min(h0.maxHp, h0.hp + d * T.leech);
    if (crit && T.gume && !o.sec) this.areaDamage(e.x, e.z, 2.6, dmg * 0.5, { sec: true });
    e.hp -= d; e.flash = 0.1; e.hitT = 0.2; e.hkx = o.kdx ?? 0;
    if (o.kb && !e.d.boss) { const k = o.kb * (e.d.heavy ? 0.25 : 1); e.kx += (o.kdx ?? 0) * k; e.kz += (o.kdz ?? 0) * k; }
    if (o.text !== false) this.floatText(e.x + (rnd() - 0.5) * 0.6, (e.d.fly ? e.hover : 0) + 1.5 * (e.sc || 1) * (e.d.boss ? 2 : 1), e.z, Math.round(d), crit ? '#fff2c8' : '#ffb347', crit);
    if (crit && this.hitFx < 6) { this.hitFx++; this.spawnImpact(e.x, e.z, 0.9); if (this.mode === 'run') { this.hitStop = Math.max(this.hitStop, e.d.boss ? 0.02 : 0.035); this.cam.shake = Math.max(this.cam.shake, 0.12); } }
    if (this.hitSfx < 3) { this.hitSfx++; A.sfx(pick(['hit1', 'hit2', 'hit3']), { vol: crit ? 0.5 : 0.28, pan: clamp((e.x - this.cam.x) / 12, -1, 1) }); }
    if (e.hp <= 0) this.killEnemy(e);
  }
  spawnImpact(x, z, sc = 0.8) { const d = store.resolveFx('impacto'); if (d) this.fx.spawn(d, { x, z, dx: 1, dz: 0, scale: sc }); }
  comboMul() { return 1 + Math.min(0.6, Math.floor(this.combo / 10) * 0.05); }
  killEnemy(e) {
    if (this.mode === 'run' || this.mode === 'hub') this.corpses.push({ d: e.d, x: e.x, z: e.z, sc: e.sc || 1, face: e.face, anim: e.anim, hover: e.hover || 0, dir: (e.hkx ?? e.kx) >= 0 ? 1 : -1, t: 0, life: e.d.boss ? 0.7 : 0.34 });
    if (this.mode === 'run') {
      const T = this.stats.t, h0 = this.hero;
      if (T.killHeal) h0.hp = Math.min(h0.maxHp, h0.hp + T.killHeal);
      if (T.frenzy) { this.frenzyN = Math.min(T.frenzyCap ? 50 : 20, (this.frenzyN || 0) + 1); this.frenzyT = 3; }
      if (T.killBlast && !this._blast && rnd() < T.killBlast) { this._blast = true; const ex = e.x, ez = e.z, X = T.blastX ? 1 : 0; this.areaDamage(ex, ez, X ? 4 : 2.6, X ? 42 : 14, { sec: true, kb: 3 }); this.ring(ex, ez, X ? 4 : 2.6, '#ff9a54', 0.4, 0.14); this._blast = false; }
    }
    e.dead = true; this.kills++; this.combo++; this.comboT = 3.2; this.maxCombo = Math.max(this.maxCombo, this.combo);
    const d = e.d, tier = d.xp >= 12 ? 2 : d.xp >= 3 ? 1 : 0, cm = this.comboMul();
    this.gems.push({ x: e.x, z: e.z, v: d.xp * (e.elite ? 4 : 1), tier, vx: (rnd() - 0.5) * 3, vz: (rnd() - 0.5) * 3, pull: false, t: 0, bob: rnd() * 6 });
    const tide = this.tideT > 0 ? 3 : 1;
    if (rnd() < d.scrap * this.stats.luck * 0.5 * tide || d.boss || e.elite) {
      const T = this.stats.t, n = Math.round((d.boss ? 30 : e.elite ? 8 : d.heavy ? 3 + ((rnd() * 3) | 0) : 1) * ((d.boss || e.elite) ? 1 + (T.eliteScrap || 0) : 1));
      for (let i = 0; i < n; i++) this.gems.push({ x: e.x + (rnd() - 0.5), z: e.z + (rnd() - 0.5), v: 2 * cm * (rnd() < (T.lootDouble || 0) ? 2 : 1), tier: 'scrap', vx: (rnd() - 0.5) * 6, vz: (rnd() - 0.5) * 6, pull: false, t: 0, bob: rnd() * 6 });
    }
    if (e.elite) { this.elitesKilled++; this.gems.push({ x: e.x, z: e.z, v: 1, tier: 'chest', vx: 0, vz: 0, pull: false, t: 0, bob: 0 }); this.hooks.onWarn?.('Elite derrotado — baú!'); A.sfx('bell', { vol: 0.35, rate: 1.4 }); }
    if (rnd() < (d.heavy ? 0.25 : 0.006 + (this.stats.t.heartChance || 0)) && !d.boss) this.gems.push({ x: e.x, z: e.z, v: 0.25, tier: 'heart', vx: 0, vz: 0, pull: false, t: 0, bob: 0 });
    if (e.affix === 'explosivo') { const ex = e.x, ez = e.z, dm_ = e.dmg * 1.1; this.telegraph(ex, ez, 3.6, 0.9, () => this.blastAt(ex, ez, 3.6, dm_)); }
    const big = d.heavy ? 2.2 : 1; if (d.heavy && !d.boss) { this.ring(e.x, e.z, 2.6, '#ff9a54', 0.45, 0.12); this.hitStop = Math.max(this.hitStop, 0.04); } if (e.elite) this.ring(e.x, e.z, 5, '#ffc24a', 0.7, 0.16);
    this.addSpark({ tex: 'smoke', x: e.x, y: 0.6, z: e.z, vx: 0, vy: 0.8, vz: 0, life: 0.7, s0: 1.2 * big, s1: 2.6 * big, a: 0.55, add: false, rot: rnd() * TAU });
    for (let i = 0; i < (d.heavy ? 8 : 3); i++) this.addSpark({ tex: 'spark', x: e.x, y: 0.8, z: e.z, vx: (rnd() - 0.5) * 7, vy: 2 + rnd() * 4, vz: (rnd() - 0.5) * 7, life: 0.5, s0: 0.5, s1: 0.1, a: 1, add: true, g: 12, rot: rnd() * TAU, stretch: true });
    if (this.decals.length < 90) this.decals.push({ x: e.x, z: e.z, r: 0.9 * big * (0.8 + rnd() * 0.5), rot: rnd() * TAU, a: 0.6 });
    if (this.deathSfx < 2) { this.deathSfx++; A.sfx(d.heavy ? 'thud' : 'punch', { vol: d.heavy ? 0.6 : 0.22, rate: d.heavy ? 0.8 : 1.15 }); }
    if (d.boss) { this.cam.shake = 1.2; A.synth('boom', { vol: 0.6 }); this.bossDead = true; this.timers.push({ t: 2.2, fn: () => this.finish(true) }); this.slow = 0.35; }
    else if (d.heavy) { this.cam.shake = Math.max(this.cam.shake, 0.3); }
  }
  addSpark(s) { if (this.sparks.length < 260) { s.age = 0; this.sparks.push(s); } }
  ring(x, z, r, col, life = 0.6, w = 0.12) { if (this.rings.length > 14) this.rings.shift(); this.rings.push({ x, z, r, col, life, w, t: 0 }); }
  burst(x, z, n, y = 0.8, sp = 8) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, v = sp * (0.4 + rnd() * 0.6); this.addSpark({ tex: 'spark', x, y, z, vx: Math.cos(a) * v, vy: 2 + rnd() * 5, vz: Math.sin(a) * v, life: 0.6 + rnd() * 0.3, s0: 0.5, s1: 0.1, a: 1, add: true, g: 12, rot: rnd() * TAU, stretch: true }); } }
  floatText(x, y, z, txt, col, crit) { if (!this.opts.numbers && !crit && this.mode === 'run') return; if (this.texts.length > 44) this.texts.shift(); this.texts.push({ x, y, z, txt: String(txt), col, crit, t: 0, life: crit ? 0.9 : 0.65, vx: (rnd() - 0.5) * 0.8 }); }
  areaDamage(x, z, r, dmg, o = {}) {
    for (const e of this.enemies) { if (!this.ok(e)) continue; const d = Math.hypot(e.x - x, e.z - z); if (d < r + e.r) { const k = d || 1; this.hurt(e, dmg, { ...o, kdx: (e.x - x) / k, kdz: (e.z - z) / k }); } }
  }
  hurtHero(dmg, srcx, srcz, o = {}) {
    const h = this.hero; if (h.iframes > 0 || h.dashT > 0 || this.over || this.mode !== 'run' || this.dying > 0) return;
    const T = this.stats.t;
    if (T.dodge && rnd() < Math.min(0.5, T.dodge)) { h.iframes = 0.3; this.floatText(h.x, 2.3, h.z, 'Esquivou!', '#7dffcf', false); A.synth('whoosh', { vol: 0.2 }); return; }
    dmg = Math.max(1, dmg - this.stats.armor); if (T.dmgRed) dmg = Math.max(1, dmg * (1 - Math.min(0.5, T.dmgRed))); if (T.dmgTaken) dmg *= 1 + T.dmgTaken; if (T.capHit) dmg = Math.min(dmg, h.maxHp * 0.25);
    if (this.shield > 0) { const ab = Math.min(this.shield, dmg); this.shield -= ab; dmg -= ab; this.floatText(h.x, 2.6, h.z, '🛡' + Math.round(ab), '#9fd6ff', false); if (dmg <= 0) { h.iframes = 0.45; this.ring(h.x, h.z, 2.6, '#9fd6ff', 0.4, 0.12); return; } }
    this.painT = 4; h.hp -= dmg; h.iframes = 0.55; h.hurt = 0.25; this.hurtFlash = 1; this.hitStop = Math.max(this.hitStop, 0.06); this.ring(h.x, h.z, 3, '#ff4a3a', 0.45, 0.14); this.burst(h.x, h.z, 8, 1, 6); this.cam.shake = Math.max(this.cam.shake, 0.45); this.combo = Math.floor(this.combo * 0.5);
    if (o.slow) h.slowT = 1.6 * (1 - Math.min(0.8, T.slowRes || 0));
    this.addDmgInd(o.ox ?? srcx, o.oz ?? srcz, false);
    this.floatText(h.x, 2.2, h.z, '-' + Math.round(dmg), '#ff5a4a', false); A.synth('hurt', { vol: 0.5 }); A.sfx('punch', { vol: 0.5, rate: 0.8 });
    const k = Math.hypot(h.x - srcx, h.z - srcz) || 1; h.vx += ((h.x - srcx) / k) * 4; h.vz += ((h.z - srcz) / k) * 4;
    if (this.stats.thorns) { this.areaDamage(h.x, h.z, 3.2, this.stats.thorns, { kb: 5 }); this.spawnImpact(h.x, h.z, 1.7); }
    if (h.hp <= 0 && !this.dying) {
      if (this.revives > 0) { this.revives--; h.hp = h.maxHp * Math.min(1, 0.5 + (T.reviveHp || 0)); h.iframes = T.reviveNova ? 4 : 2.2; this.cam.shake = 1; this.hooks.onWarn?.('Segundo Fôlego!'); A.synth('chime', { vol: 0.4 }); const nv = store.resolveFx('nova'); if (nv) this.fx.spawn(nv, { x: h.x, z: h.z, radius: 7, dx: 1, dz: 0 }); this.areaDamage(h.x, h.z, T.reviveNova ? 11 : 7, T.reviveNova ? 320 : 80, { kb: 9 }); return; }
      this.dying = 1.3; this.slow = 0.3; A.synth('boom', { vol: 0.5 }); A.sfx('creak', { vol: 0.5 });
    }
  }

  // ─────────── habilidades ───────────
  sp(id) {
    const P = SKILLS[id].p(this.skillLv[id] || 1), t = this.stats?.t; if (!t) return P;
    const dm = 1 + (t['s_' + id + '_dmg'] || 0) + (t.sAll || 0), cd = Math.max(0.3, 1 - (t['s_' + id + '_cd'] || 0) - (t.sAllCd || 0)), n = t['s_' + id + '_n'] || 0;
    P.dmg *= dm; if (P.cd) P.cd *= cd;
    if (this.evo?.[id]) { P.dmg *= 1.7; if (P.cd) P.cd *= id === 'nova' ? 0.85 : 1; if (id === 'arco') P.chains += 4; else if (id === 'brasas') { P.count += 3; P.radius *= 1.2; } else if (id === 'lanca') { P.count += 2; P.pierce += 3; } else if (id === 'chuva') P.count += 6; else if (id === 'nova') P.radius *= 1.25; else if (id === 'lamina') P.hits += 1; }
    if (id === 'arco') P.chains += n; else if (id === 'brasas') P.count += n; else if (id === 'lanca') P.count += n; else if (id === 'chuva') P.count += 2 * n;
    else if (id === 'nova') P.radius *= 1 + 0.06 * n; else if (id === 'lamina') { P.range *= 1 + 0.05 * n; P.arc += 3 * n; }
    return P;
  }
  cast(id) {
    const h = this.hero, st = this.sk[id] || (this.sk[id] = { cd: 0, inst: null }), P = this.sp(id), def = store.resolveFx(SKILLS[id].fx), area = this.stats.area;
    if (!def) return true;
    const orbitFix = (inst) => { if (inst && inst.def.kind === 'orbit' && id !== 'brasas') this.timers.push({ t: 1.1, fn: () => this.fx.kill(inst) }); return inst; };
    switch (id) {
      case 'lamina': {
        const t = this.nearest(h.x, h.z, 8.5 * area); if (!t) return false;
        let dx = t.x - h.x, dz = t.z - h.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; h.dx = dx; h.dz = dz; if (Math.abs(dx) > 0.2) h.face = dx > 0 ? 1 : -1;
        for (let i = 0; i < P.hits; i++) {
          const sgn = i % 2 ? -1 : 1, ddx = dx * sgn, ddz = dz * sgn;
          this.timers.push({ t: i * 0.2, fn: () => {
            orbitFix(this.fx.spawn(def, { x: h.x, z: h.z, dx: ddx, dz: ddz, scale: P.scale * area }));
            A.sfx(pick(['slash1', 'slash2']), { vol: 0.42 });
            this.timers.push({ t: 0.06, fn: () => {
              const ang = Math.atan2(ddz, ddx), half = (P.arc * Math.PI) / 360, R = P.range * area;
              for (const e of this.enemies) {
                if (!this.ok(e)) continue; const ex = e.x - h.x, ez = e.z - h.z, d = Math.hypot(ex, ez);
                if (d > R + e.r) continue; let da = Math.abs(Math.atan2(ez, ex) - ang); if (da > Math.PI) da = TAU - da;
                if (da <= half + Math.atan2(e.r, Math.max(d, 0.5))) this.hurt(e, P.dmg, { kb: 2.4, kdx: ex / (d || 1), kdz: ez / (d || 1) });
              }
            } });
          } });
        }
        return true;
      }
      case 'arco': {
        const list = this.enemies.filter((e) => this.ok(e) && Math.hypot(e.x - h.x, e.z - h.z) < P.range * area).sort((a, b) => Math.hypot(a.x - h.x, a.z - h.z) - Math.hypot(b.x - h.x, b.z - h.z)).slice(0, P.chains);
        if (!list.length && this.mode !== 'hub') return false;
        const targets = list.map((e) => ({ x: e.x, z: e.z }));
        orbitFix(this.fx.spawn(def, { x: h.x, z: h.z, targets }));
        list.forEach((e, i) => this.timers.push({ t: i * 0.03, fn: () => this.hurt(e, P.dmg, { kb: 1 }) }));
        A.synth('zap', { vol: 0.28 }); A.sfx('glass', { vol: 0.3, rate: 1.4 });
        return true;
      }
      case 'nova': {
        if (this.mode !== 'hub' && !this.nearest(h.x, h.z, P.radius * area + 2)) return false;
        const R = P.radius * area; orbitFix(this.fx.spawn(def, { x: h.x, z: h.z, radius: R, dx: 1, dz: 0 }));
        this.timers.push({ t: 0.1, fn: () => this.areaDamage(h.x, h.z, R, P.dmg, { kb: P.knock }) });
        this.cam.shake = Math.max(this.cam.shake, 0.35); A.sfx('hitHeavy', { vol: 0.5, rate: 0.7 }); A.synth('boom', { vol: 0.25 });
        return true;
      }
      case 'chuva': {
        const near = this.enemies.filter((e) => this.ok(e) && Math.hypot(e.x - h.x, e.z - h.z) < 12 * area);
        if (!near.length && this.mode !== 'hub') return false;
        const pts = []; const pool = near.length ? near : this.enemies;
        for (let i = 0; i < P.count; i++) { const e = pool[(rnd() * pool.length) | 0]; pts.push({ x: e.x + (rnd() - 0.5) * 1.6, z: e.z + (rnd() - 0.5) * 1.2 }); }
        orbitFix(this.fx.spawn(def, { x: h.x, z: h.z, count: P.count, points: pts, onLand: (d) => { this.areaDamage(d.x, d.z, P.hitR * area, P.dmg, { kb: 2 }); A.sfx(pick(['pot', 'hit3']), { vol: 0.3, rate: 0.9, gap: 0.03 }); this.cam.shake = Math.max(this.cam.shake, 0.12); } }));
        A.sfx('draw', { vol: 0.3, rate: 0.7 });
        return true;
      }
      case 'lanca': {
        const t = this.nearest(h.x, h.z, 14 * area); if (!t) return false;
        let dx = t.x - h.x, dz = t.z - h.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        for (let i = 0; i < P.count; i++) {
          const off = (i - (P.count - 1) / 2) * 0.17, c = Math.cos(off), s = Math.sin(off), ddx = dx * c - dz * s, ddz = dx * s + dz * c;
          const pr = { x: h.x + ddx * 0.8, z: h.z + ddz * 0.8, dx: ddx, dz: ddz, speed: P.speed, dead: false, hit: new Set(), pierce: P.pierce, dmg: P.dmg, life: 1.5, hitR: P.hitR * area };
          this.proj.push(pr); orbitFix(this.fx.spawn(def, { x: pr.x, z: pr.z, dx: ddx, dz: ddz, follow: pr }));
        }
        A.sfx('draw', { vol: 0.4, rate: 1.3 }); A.synth('whoosh', { vol: 0.2 });
        return true;
      }
    }
    return true;
  }
  updateSkills(dt) {
    for (const id of Object.keys(this.skillLv)) {
      const st = this.sk[id] || (this.sk[id] = { cd: 0.2, inst: null }), P = this.sp(id);
      if (id === 'brasas') {
        const def = store.resolveFx('brasas'); if (!def) continue;
        if (!st.inst || !this.fx.insts.includes(st.inst)) st.inst = this.fx.spawn(def, { x: this.hero.x, z: this.hero.z, follow: this.hero, loop: true, count: P.count });
        st.inst.count = P.count; st.inst.sc = (P.radius * this.stats.area) / (def.args.orbitRadius || 2.6);
        const pts = this.fx.orbitPoints(st.inst);
        for (const e of this.enemies) { if (!this.ok(e)) continue; e.orbCd -= dt; if (e.orbCd > 0) continue;
          for (const q of pts) if ((q.x - e.x) ** 2 + (q.z - e.z) ** 2 < (P.hitR * this.stats.area + e.r) ** 2) { this.hurt(e, P.dmg, { kb: 1.2, kdx: e.x - this.hero.x, kdz: e.z - this.hero.z }); e.orbCd = P.tick; A.sfx('latch', { vol: 0.14, rate: 1.5, gap: 0.08 }); break; } }
        continue;
      }
      st.cd -= dt; if (st.cd > 0) continue;
      st.cd = this.cast(id) ? P.cd * this.stats.cd : 0.12;
    }
  }
  updateProjectiles(dt) {
    for (const p of this.proj) {
      p.life -= dt; if (p.life <= 0) { p.dead = true; continue; }
      p.x += p.dx * p.speed * dt; p.z += p.dz * p.speed * dt;
      for (const e of this.enemies) {
        if (!this.ok(e) || p.hit.has(e)) continue;
        if ((e.x - p.x) ** 2 + (e.z - p.z) ** 2 < (p.hitR + e.r) ** 2) { p.hit.add(e); this.hurt(e, p.dmg, { kb: 2.5, kdx: p.dx, kdz: p.dz }); if (--p.pierce <= 0) { p.dead = true; break; } }
      }
      if (this.world.boxesAt(p.x, p.z).some((b) => p.x > b[0] && p.x < b[1] && p.z > b[2] && p.z < b[3])) p.dead = true;
    }
    this.proj = this.proj.filter((p) => !p.dead);
  }

  // ─────────── progressão ───────────
  choices() {
    const owned = Object.keys(this.skillLv), opts = [];
    for (const id of SKILL_IDS) {
      const lv = this.skillLv[id] || 0;
      if (lv > 0 && lv < MAX_SKILL) opts.push({ kind: 'skill', id, lv: lv + 1, w: 3 * (1 + (this.stats.t.skillBias || 0)) });
      else if (lv === 0 && owned.length < this.stats.slots) opts.push({ kind: 'skill', id, lv: 1, w: 2.4 * (1 + (this.stats.t.skillBias || 0)), isNew: true });
    }
    const owns = (id) => (this.pass[id] || 0) > 0;
    for (const id of PASSIVE_IDS) { const d = PASSIVES[id], lv = this.pass[id] || 0; if (lv >= d.max || (d.minLv && this.level < d.minLv)) continue; if (d.rar === 'maldita' && Object.values(this.cursed || {}).filter(Boolean).length >= 3) continue; opts.push({ kind: 'pass', id, lv: lv + 1, w: d.rar === 'rara' ? 0.7 : d.rar === 'maldita' ? 0.45 : 1.5, rar: d.rar }); }
    for (const id in EVOS) if ((this.skillLv[id] || 0) >= 5 && !this.evo?.[id] && (this.pass[EVOS[id].need] || 0) >= 2) opts.push({ kind: 'evo', id, lv: 1, w: 6, rar: 'evo' });
    const out = [], n = this.stats.cards;
    while (out.length < n && opts.length) {
      let tot = opts.reduce((a, o) => a + o.w, 0), r = rnd() * tot, i = 0;
      for (; i < opts.length; i++) { r -= opts[i].w; if (r <= 0) break; }
      out.push(opts.splice(Math.min(i, opts.length - 1), 1)[0]);
    }
    return out;
  }
  openLevelUp() {
    this.paused = true; this.choicesNow = this.choices();
    if (!this.choicesNow.length) { this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + this.hero.maxHp * 0.3); this.paused = false; this.pending = Math.max(0, this.pending - 1); return; }
    A.synth('chime', { vol: 0.35 }); A.sfx('bell', { vol: 0.2, rate: 1.6 });
    this.hooks.onLevelUp?.(this.choicesNow, this.rerolls);
  }
  reroll() { if (this.rerolls <= 0) return false; this.rerolls--; this.choicesNow = this.choices(); this.hooks.onLevelUp?.(this.choicesNow, this.rerolls); return true; }
  choose(i) {
    const c = this.choicesNow?.[i]; if (!c || !this.paused) return;
    if (c.kind === 'skill') { this.skillLv[c.id] = c.lv; if (!this.sk[c.id]) this.sk[c.id] = { cd: 0.2, inst: null }; }
    else if (c.kind === 'evo') { (this.evo ||= {})[c.id] = true; this.ring(this.hero.x, this.hero.z, 8, '#ff5a2a', 0.9, 0.24); this.hooks.onWarn?.(EVOS[c.id].name + '!'); A.synth('chime', { vol: 0.5 }); }
    else { const pd = PASSIVES[c.id]; this.pass[c.id] = c.lv; if (pd.rar === 'maldita') (this.cursed ||= {})[c.id] = true; if (pd.pick) { if (pd.pick.shield) this.shield = (this.shield || 0) + pd.pick.shield; if (pd.pick.revive) this.revives++; if (pd.pick.foeHp) this.dm.hp *= pd.pick.foeHp; } const old = this.stats.maxHp; this.stats = this.computeStats(this.meta, this.pass, false, this.mul); if (this.stats.maxHp > old) { this.hero.hp += this.stats.maxHp - old; } this.hero.maxHp = this.stats.maxHp; }
    this.pending = Math.max(0, this.pending - 1); this.paused = false; this.choicesNow = null; A.sfx('latch', { vol: 0.5 }); this.hooks.onChosen?.();
    if (this.pending > 0) this.queueLevel(0.3);
  }
  queueLevel(delay = 0.15) {
    if (this.lvlQueued) return; this.lvlQueued = true;
    this.timers.push({ t: delay, fn: () => { this.lvlQueued = false; if (this.pending > 0 && !this.paused && !this.over) this.openLevelUp(); } });
  }
  gainXp(v) {
    this.xp += v * this.stats.xp * (this.time < 120 ? 1 + (this.stats.t.xpEarly || 0) : 1);
    while (this.xp >= this.xpNext) { this.xp -= this.xpNext; this.level++; if (this.stats.t.lvlHeal && this.mode === 'run') this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + this.hero.maxHp * this.stats.t.lvlHeal); this.xpNext = xpNeed(this.level); this.pending++; this.hooks.onLevelGain?.(this.level); this.ring(this.hero.x, this.hero.z, 7.5, '#7dffcf', 0.9, 0.22); this.ring(this.hero.x, this.hero.z, 4, '#ffffff', 0.55, 0.1); this.burst(this.hero.x, this.hero.z, 18, 1, 9); this.flashA = 0.32; this.flashCol = '#7dffcf'; this.floatText(this.hero.x, 3, this.hero.z, 'NÍVEL ' + this.level, '#7dffcf', true); }
    if (this.pending > 0 && !this.paused) this.queueLevel();
  }
  finish(victory) {
    if (this.over) return; this.over = true; this.paused = true;
    const luck = this.stats.luck, dm = this.dm.scrap;
    const base = this.kills * 0.35 + this.time * 0.45 + this.level * 4 + this.scrapRun + (() => { let b = 0; const n = victory ? this.bossN + 1 : this.bossN; for (let i = 0; i < n; i++) b += 300 * (1 + i * 0.5); return b; })() + this.elitesKilled * 25;
    const gain = Math.floor(base * dm * luck);
    this.hooks.onEnd?.({ victory, time: this.time, kills: this.kills, level: this.level, scrapFound: this.scrapRun, gain, depth: this.depth, biome: this.biomeId, combo: this.maxCombo, elites: this.elitesKilled, bossN: this.bossN, skills: { ...this.skillLv }, pass: { ...this.pass } });
  }
  // Depois de vencer: continuar no modo infinito (outro chefe mais forte em 2:30)
  continueRun() {
    this.over = false; this.paused = false; this.endless = true; this.bossN++; this.bossSpawned = false; this.bossDead = false; this.boss = null; this.bossAt = this.time + 150; this.slow = 1; this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + this.hero.maxHp * 0.5); this.hero.iframes = 1.5;
    this.hooks.onWarn?.('Modo infinito — próximo chefe em 2:30');
  }
  scrapEstimate() { return Math.floor((this.kills * 0.35 + this.time * 0.45 + this.level * 4 + this.scrapRun + this.elitesKilled * 25) * (this.dm?.scrap || 1) * this.stats.luck); }

  // ─────────── diretor de inimigos ───────────
  pickPool(t) {
    const list = this.biome.pool.filter((p) => p[1] <= t); let tot = 0; for (const p of list) tot += p[2];
    let r = rnd() * tot; for (const p of list) { r -= p[2]; if (r <= 0) return p[0]; } return list[0][0];
  }
  telegraph(x, z, r, t, fn, col) { const tg = { x, z, r, t, total: t, col }; this.telegraphs.push(tg); this.timers.push({ t, fn }); return tg; }
  blastAt(x, z, r, dmg, o = {}) {
    const d = store.resolveFx('nova'); if (d) this.fx.spawn(d, { x, z, radius: r, dx: 1, dz: 0 });
    this.cam.shake = Math.max(this.cam.shake, 0.5); A.synth('boom', { vol: 0.4 }); A.sfx('hitHeavy', { vol: 0.5, rate: 0.6 });
    if (Math.hypot(this.hero.x - x, this.hero.z - z) < r + 0.3) this.hurtHero(dmg, x, z, o);
    if (o.hitEnemies) this.areaDamage(x, z, r, o.hitEnemies, { kb: 6 });
  }
  runEvent() {
    const k = pick(['tide', 'meteor', 'siege']), h = this.hero; this.eventT = 55 + rnd() * 25;
    if (k === 'tide') { this.tideT = 22; this.hooks.onWarn?.('Maré de Sucata! Drops x3'); A.sfx('coin2', { vol: 0.5, rate: 0.7 }); }
    else if (k === 'meteor') {
      this.hooks.onWarn?.('Chuva de Meteoros!'); A.sfx('creak', { vol: 0.4 });
      for (let i = 0; i < 16; i++) this.timers.push({ t: i * 0.85, fn: () => { if (this.over) return; const a = rnd() * TAU, d = rnd() * 6; const x = this.hero.x + Math.cos(a) * d + this.hero.vx * 0.6, z = this.hero.z + Math.sin(a) * d * 0.8 + this.hero.vz * 0.6; const dmg = 26 * this.dm.dmg; this.telegraph(x, z, 2.3, 1.1, () => this.blastAt(x, z, 2.3, dmg, { hitEnemies: 70 })); } });
    } else {
      this.hooks.onWarn?.('Cerco! Eles vêm de todos os lados'); const id = this.biome.pool[0][0], n = 30;
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU, hx = this.W / (2 * this.ppu) + 2.5, hz = this.H / (2 * this.ppu * SIN) + 2.5; this.spawnEnemy(id, this.cam.x + Math.cos(a) * hx, this.cam.z + Math.sin(a) * hz); }
    }
  }
  director(dt) {
    const t = this.time, B = this.biome;
    if (!this.bossSpawned) { this.eventT -= dt; if (this.eventT <= 0 && t > 20) this.runEvent(); }
    if (this.tideT > 0) this.tideT -= dt;
    if (!this.bossSpawned && t >= this.bossAt) {
      this.bossSpawned = true; const [x, z] = this.ringPos(1), b = this.spawnEnemy(B.boss, x, z); b.hp *= 1 + this.bossN * 0.7; b.maxHp = b.hp; b.dmg *= 1 + this.bossN * 0.25; this.boss = b;
      this.hooks.onBoss?.(b); A.sfx('bell', { vol: 0.8, rate: 0.5 }); this.cam.shake = 0.8; this.ring(this.hero.x, this.hero.z, 13, '#ff4a2a', 1.2, 0.3); this.ring(this.hero.x, this.hero.z, 8, '#ffb347', 0.9, 0.18); this.flashA = 0.35; this.flashCol = '#ff3a1a';
      for (const e of this.enemies) if (!e.d.boss && rnd() < 0.5) e.dead = true;
    }
    const alive = this.enemies.length, cap = Math.min(150, 42 + t * 0.34) * (this.bossSpawned && !this.bossDead ? 0.5 : 1);
    const rate = (1.5 + t * 0.021) * (this.bossSpawned ? 0.5 : 1);
    this.spawnAcc += rate * dt;
    while (this.spawnAcc >= 1) { this.spawnAcc -= 1; if (alive >= cap) continue; const [x, z] = this.ringPos(); this.spawnEnemy(this.pickPool(t), x, z); }
    this.packT -= dt;
    if (this.packT <= 0 && !this.bossSpawned) { this.packT = Math.max(11, 26 - t * 0.04); const n = 8 + Math.floor(t / 14), a0 = (Math.hypot(this.hero.vx || 0, this.hero.vz || 0) > 1 && rnd() < 0.6) ? Math.atan2(this.hero.vz, this.hero.vx) - 0.65 : rnd() * TAU, id = B.pool[0][0]; for (let i = 0; i < n; i++) { const a = a0 + (i / n) * 1.3, hx = this.W / (2 * this.ppu) + 2.5, hz = this.H / (2 * this.ppu * SIN) + 2.5; this.spawnEnemy(id, this.cam.x + Math.cos(a) * hx, this.cam.z + Math.sin(a) * hz); } this.hooks.onWarn?.('Horda!'); }
    this.bruteT -= dt;
    if (this.bruteT <= 0 && !this.bossSpawned) { this.bruteT = Math.max(9, 22 - t * 0.035); const [x, z] = this.ringPos(); this.spawnEnemy(B.brute, x, z); }
    this.eliteT = (this.eliteT ?? 55) - dt;
    if (this.eliteT <= 0 && !this.bossSpawned) { this.eliteT = Math.max(28, 52 - t * 0.05); const [x, z] = this.ringPos(); const e = this.makeEnemy(this.pickPool(Math.max(t, 40)), x, z, { elite: true }); this.enemies.push(e); this.hooks.onWarn?.('Elite se aproxima'); A.sfx('bell', { vol: 0.35, rate: 0.8 }); }
  }

  // ─────────── atualização ───────────
  update(dtReal) {
    this.hitFx = 0; this.hitSfx = 0; this.deathSfx = 0;
    let dt = Math.min(dtReal, 0.05); if (this.slow < 1) { this.slow = Math.min(1, this.slow + dtReal * 0.35); }
    dt *= this.slow; if (this.hitStop > 0) { this.hitStop -= dtReal; dt *= 0.08; }
    // timers e fx rodam também com o jogo parado nos menus? (não) — mas não no hub
    if (!this.paused) { for (let i = this.timers.length - 1; i >= 0; i--) { const t = this.timers[i]; t.t -= dt; if (t.t <= 0) { this.timers.splice(i, 1); t.fn(); } } }
    if (this.paused && this.mode === 'run') { this.cam.shake *= 0.9; return; }
    this.hubT += dt;
    this.fx.step(dt);
    const h = this.hero;

    if (this.mode === 'hub') {
      this.hubCast -= dt;
      if (this.hubCast <= 0) { const id = this.hubSkill; this.hubCast = id === 'chuva' ? 3.2 : id === 'nova' ? 2.6 : 1.8; if (id === 'brasas') this.hubCast = 99; this.cast(id); }
      if (this.hubSkill === 'brasas') this.updateSkills(dt);
      for (const e of this.enemies) { e.flash = Math.max(0, e.flash - dt); e.kx *= Math.exp(-6 * dt); e.kz *= Math.exp(-6 * dt); e.anim += dt; if (e.hitT > 0) e.hitT = Math.max(0, e.hitT - dt); }
      for (const p of this.proj) { p.life -= dt; p.x += p.dx * p.speed * dt; p.z += p.dz * p.speed * dt; if (p.life <= 0) p.dead = true; } this.proj = this.proj.filter((p) => !p.dead);
      this.tickCommon(dt); this.cam.x = lerp(this.cam.x, this.camHub.x, 0.05); this.cam.z = lerp(this.cam.z, this.camHub.z, 0.05); return;
    }

    this.time += dt;
    // herói
    const [ix, iz] = this.inputVec(); h.moving = Math.abs(ix) + Math.abs(iz) > 0.05;
    if (h.dashT > 0) { h.dashT -= dt; h.vx = h.ddx * 17; h.vz = h.ddz * 17; if (rnd() < 0.8) this.addSpark({ tex: 'flameHot', x: h.x, y: 0.7, z: h.z, vx: 0, vy: 0.5, vz: 0, life: 0.3, s0: 1.1, s1: 0.2, a: 0.8, add: true, rot: rnd() * TAU }); }
    else {
      const sp = this.stats.speed * (h.slowT > 0 ? 0.62 : 1); h.vx = lerp(h.vx, ix * sp, 1 - Math.exp(-14 * dt)); h.vz = lerp(h.vz, iz * sp, 1 - Math.exp(-14 * dt));
      if (h.moving) { h.dx = ix; h.dz = iz; if (Math.abs(ix) > 0.15) h.face = ix > 0 ? 1 : -1; }
    }
    if (this.dashReq && h.dashCd <= 0 && !this.dying) { this.dashReq = false; const l = Math.hypot(ix, iz); h.ddx = l > 0.1 ? ix / l : h.face; h.ddz = l > 0.1 ? iz / l : 0; h.dashT = 0.17; h.dashCd = this.stats.dashCd; this.ghostT = 0; this.ring(h.x, h.z, 2.4, '#ffe2b0', 0.35, 0.1); h.iframes = Math.max(h.iframes, 0.25 + (this.stats.t.dashI || 0)); if (this.stats.t.dashBlast) { this.areaDamage(h.x, h.z, 3.4, 22, { sec: true, kb: 4 }); this.spawnImpact(h.x, h.z, 1.6); } A.synth('whoosh', { vol: 0.25 }); }
    this.dashReq = false; h.dashCd = Math.max(0, h.dashCd - dt);
    if (h.dashT > 0) { this.ghostT -= dt; if (this.ghostT <= 0) { this.ghostT = 0.028; this.ghosts.push({ x: h.x, z: h.z, face: h.face, an: h.anim, a: 0.55 }); } }
    if (h.moving && h.dashT <= 0) { this.trailT -= dt; if (this.trailT <= 0) { this.trailT = 0.09; this.addSpark({ tex: 'spark', x: h.x - h.dx * 0.2 + (rnd() - 0.5) * 0.3, y: 0.15, z: h.z - h.dz * 0.2 + (rnd() - 0.5) * 0.2, vx: -h.dx * 0.8 + (rnd() - 0.5), vy: 0.9 + rnd(), vz: -h.dz * 0.8 + (rnd() - 0.5), life: 0.55, s0: 0.28, s1: 0.04, a: 0.8, add: true, rot: rnd() * TAU }); } }
    h.x += h.vx * dt; h.z += h.vz * dt; this.world.pushOut(h, 0.42);
    h.anim += dt * (h.moving ? 1 : 0.3) * (h.dashT > 0 ? 2 : 1); h.iframes = Math.max(0, h.iframes - dt); h.hurt = Math.max(0, h.hurt - dt); h.slowT = Math.max(0, (h.slowT || 0) - dt);
    h.hp = Math.min(h.maxHp, h.hp + this.stats.regen * (this.stats.t.lowRegen && h.hp < h.maxHp * 0.3 ? 3 : 1) * dt);
    if (this.painT > 0) this.painT -= dt; if (this.frenzyT > 0) { this.frenzyT -= dt; if (this.frenzyT <= 0) this.frenzyN = 0; }
    if (h.moving && Math.floor(h.anim * 2.4) !== Math.floor((h.anim - dt) * 2.4)) A.sfx('step', { vol: 0.12, rate: 0.9, gap: 0.12 });

    this.updateSkills(dt);
    this.updateProjectiles(dt);
    this.director(dt);
    this.updateEnemies(dt);
    this.updatePickups(dt);
    this.tickCommon(dt);
    if (this.dying > 0) { this.dying -= dtReal; if (this.dying <= 0) this.finish(false); }
    // câmera
    this.cam.x = lerp(this.cam.x, h.x + h.vx * 0.12, 1 - Math.exp(-7 * dt)); this.cam.z = lerp(this.cam.z, h.z + h.vz * 0.12, 1 - Math.exp(-7 * dt));
    A.setIntensity(clamp(this.time / this.bossAt, 0, 1)); A.beat(dt, clamp(1 - h.hp / h.maxHp + this.time / this.bossAt * 0.5, 0, 1));
  }
  tickCommon(dt) {
    this.cam.shake = Math.max(0, this.cam.shake - dt * 2.2); this.hurtFlash = Math.max(0, this.hurtFlash - dt * 2.2);
    const shk = this.cam.shake * 12 * this.opts.shake; this.cam.sx = (rnd() - 0.5) * shk; this.cam.sz = (rnd() - 0.5) * shk;
    for (const di of this.dmgInd) di.t += dt; this.dmgInd = this.dmgInd.filter((d) => d.t < d.life);
    for (const c of this.corpses) c.t += dt; this.corpses = this.corpses.filter((c) => c.t < c.life);
    for (const r of this.rings) r.t += dt; this.rings = this.rings.filter((r) => r.t < r.life);
    for (const g of this.ghosts) g.a -= dt * 2.6; this.ghosts = this.ghosts.filter((g) => g.a > 0.02); this.flashA = Math.max(0, this.flashA - dt * 1.6);
    for (const t of this.texts) { t.t += dt; t.y += dt * (t.crit ? 1.1 : 1.6); t.x += t.vx * dt; } this.texts = this.texts.filter((t) => t.t < t.life);
    for (const l of this.lights) l.t -= dt; this.lights = this.lights.filter((l) => l.t > 0);
    for (const s of this.sparks) { s.age += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; if (s.g) s.vy -= s.g * dt; s.vx *= 0.985; s.vz *= 0.985; if (s.y < 0.03 && s.g) { s.y = 0.03; s.vy *= -0.3; } } this.sparks = this.sparks.filter((s) => s.age < s.life);
    this.enemies = this.enemies.filter((e) => !e.dead);
    for (const d of this.decals) d.a = Math.max(0.12, d.a - dt * 0.01);
    this.telegraphs.forEach((t) => (t.t -= dt)); this.telegraphs = this.telegraphs.filter((t) => t.t > 0);
    if (this.mode === 'run') {
      if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }
      const h = this.hero;
      for (const p of this.pools) { p.life -= dt; p.tick -= dt; if (p.tick <= 0) { p.tick = 0.45; if (Math.hypot(h.x - p.x, h.z - p.z) < p.r) this.hurtHero(p.dmg, p.x, p.z, { slow: p.slow }); } }
      this.pools = this.pools.filter((p) => p.life > 0);
    }
  }
  // Indicador direcional de dano: só aparece quando a fonte NÃO está visível na tela (ataque de longe / fora do quadro).
  // warn = aviso de atirador fora da tela prestes a disparar. Ataques que o jogador está vendo não mostram nada.
  addDmgInd(x, z, warn) {
    const h = this.hero, W = this.W, H = this.H; if (!W) return;
    const [sx, sy] = this.proj3(x, 0.8, z); if (sx > 44 && sx < W - 44 && sy > 44 && sy < H - 44) return;
    const [hx, hy] = this.proj3(h.x, 0.9, h.z), ang = Math.atan2(sy - hy, sx - hx), ex = this.dmgInd.find((d) => d.warn === warn && Math.abs(Math.atan2(Math.sin(d.ang - ang), Math.cos(d.ang - ang))) < 0.4);
    if (ex) { ex.t = 0; ex.ang = ang; ex.n++; return; }
    if (this.dmgInd.length < 6) this.dmgInd.push({ ang, t: 0, life: warn ? 0.9 : 1.5, warn, n: 1 });
  }
  shootBolt(e, ang, sp = 7.2, life = 3.4) { this.addDmgInd(e.x, e.z, true); this.ebolts.push({ ox: e.x, oz: e.z, x: e.x, z: e.z, y: e.hover || 1, vx: Math.cos(ang) * sp, vz: Math.sin(ang) * sp, life, dmg: e.dmg, col: e.d.bolt || '#ff7a2a', slow: e.d.slow }); }
  updateEnemies(dt) {
    const h = this.hero, grid = new Map(), CELL = 1.6;
    for (const e of this.enemies) { if (e.dead) continue; const k = ((Math.floor(e.x / CELL) + 512) << 12) | (Math.floor(e.z / CELL) + 512); let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(e); }
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = e.d, mv = e.mv; e.t += dt; e.spawn = Math.min(1, e.spawn + dt * 2.2); e.flash = Math.max(0, e.flash - dt); e.atk -= dt; if (e.hitT > 0) e.hitT = Math.max(0, e.hitT - dt); if (e.atkT > 0) e.atkT = Math.max(0, e.atkT - dt);
      let dx = h.x - e.x, dz = h.z - e.z; const dist = Math.hypot(dx, dz) || 1; dx /= dist; dz /= dist;
      if (Math.abs(dx) > 0.1) e.face = dx > 0 ? 1 : -1;
      let sp = e.speed, mx = dx, mz = dz;
      if (d.wob) { const w = Math.sin(e.t * 5 + e.anim) * 0.5; mx += -dz * w; mz += dx * w; }
      if (d.ranged) {
        if (dist < 5) { mx = -dx; mz = -dz; } else if (dist < 7.5) { const sg = Math.sign(Math.sin(e.anim * 0.7)) || 1; mx = -dz * sg; mz = dx * sg; sp *= 0.7; }
        if (d.erratic) { mx += Math.sin(e.t * 3.1 + e.anim) * 0.9; mz += Math.cos(e.t * 2.7) * 0.9; }
        e.shoot -= dt; if (e.shoot <= 0 && dist < 12 && e.spawn >= 1) { e.shoot = (d.fly ? 2.3 : 2.9) + rnd() * 0.8; const lead = (dist / 7.2) * 0.75, ang0 = Math.atan2(h.z + (h.vz || 0) * lead - e.z, h.x + (h.vx || 0) * lead - e.x); if (d.fan) { for (let k = -1; k <= 1; k++) this.shootBolt(e, ang0 + k * 0.26); } else this.shootBolt(e, ang0); A.sfx('latch', { vol: 0.2, rate: 1.8 }); }
      }
      // — flanco: inimigos de corpo a corpo desviam em arco e fecham o cerco perto do herói
      if (!d.ranged && !d.boss && !d.bomber && !d.support && e.charging <= 0 && dist > 2.6 && this.mode === 'run') {
        const ang = e.fl * 0.9 * clamp((dist - 2.4) / 7, 0, 1), ca = Math.cos(ang), sa = Math.sin(ang); mx = dx * ca - dz * sa; mz = dx * sa + dz * ca;
        if (d.wob) { const w = Math.sin(e.t * 5 + e.anim) * 0.5; mx += -dz * w; mz += dx * w; }
      }
      // — desvio de obstáculos: se não saiu do lugar, contorna pelo lado
      if (!d.fly && !d.boss && this.mode === 'run') {
        e.stT += dt; if (e.stT >= 0.35) { const mvd = Math.hypot(e.x - e.lx, e.z - e.lz); if (mvd < e.speed * 0.35 * 0.3 && dist > e.r + 1.3 && e.spawn >= 1) { e.slideT = 0.8; e.slideS = rnd() < 0.5 ? -1 : 1; } e.lx = e.x; e.lz = e.z; e.stT = 0; }
        if (e.slideT > 0) { e.slideT -= dt; mx = mx * 0.35 - dz * e.slideS; mz = mz * 0.35 + dx * e.slideS; }
      }
      // — investida de golpe (aviso curto antes de saltar)
      if (d.lunge && this.mode === 'run') {
        e.lgCd -= dt;
        if (e.lg === 0 && e.lgCd <= 0 && dist < 3.1 && dist > 1.0 && e.spawn >= 1) { e.lg = -0.34; e.cdx = dx; e.cdz = dz; }
        if (e.lg < 0) { e.lg += dt; sp = 0; e.flash = Math.max(e.flash, 0.06); if (e.lg >= 0) e.lg = 0.22; }
        else if (e.lg > 0) { e.lg -= dt; sp *= 4.4; mx = e.cdx; mz = e.cdz; if (e.lg <= 0) { e.lg = 0; e.lgCd = 2.4 + rnd() * 1.6; } }
      }
      // — xamã: mantém distância e fortalece/cura aliados
      if (d.support && this.mode === 'run') {
        if (dist < 6.5) { mx = -dx; mz = -dz; sp *= 1.05; } else if (dist > 9.5) { mx = dx; mz = dz; } else { const sg = e.fl > 0 ? 1 : -1; mx = -dz * sg * 0.6; mz = dx * sg * 0.6; sp *= 0.6; }
        e.cast -= dt;
        if (e.cast <= 0 && e.spawn >= 1) { e.cast = 6.5 + rnd() * 1.5; let n = 0; for (const o of this.enemies) { if (o.dead || o === e || o.d.boss) continue; if ((o.x - e.x) ** 2 + (o.z - e.z) ** 2 < 49) { o.buff = 4.5; o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.15); n++; } } this.ring(e.x, e.z, 7, '#ffb347', 0.7, 0.16); this.burst(e.x, e.z, 10, 1.6, 5); A.synth('chime', { vol: 0.25 }); }
      }
      if (e.buff > 0) { e.buff -= dt; sp *= 1.4; }
      // — afixos de elite
      if (e.affix === 'atirador') { e.afT -= dt; if (e.afT <= 0 && dist < 13 && e.spawn >= 1) { e.afT = 3.6; for (let i = 0; i < 8; i++) this.shootBolt(e, (i / 8) * TAU + e.t, 5.5, 3.2); A.sfx('latch', { vol: 0.3, rate: 1.1 }); } }
      if (d.bomber) {
        if (e.fuse > 0) { e.fuse -= dt; sp = 0; if (e.fuse <= 0) { const ex = e.x, ez = e.z; this.blastAt(ex, ez, 2.9, e.dmg); e.hp = 0; this.killEnemy(e); continue; } }
        else if (dist < 3.3 && e.spawn >= 1) { e.fuse = 0.75; this.telegraphs.push({ x: e.x, z: e.z, r: 2.9, t: 0.75, total: 0.75, follow: e }); A.sfx('latch', { vol: 0.4, rate: 0.7 }); }
        else sp *= 1.05;
      }
      if (d.charger && !d.boss) {
        e.chargeT -= dt;
        if (e.chargeT <= 0 && e.charging <= 0 && dist < 11 && dist > 3) { e.charging = -0.55; e.chargeT = 5 + rnd() * 2; e.cdx = dx; e.cdz = dz; }
        if (e.charging < 0) { e.charging += dt; sp = 0; if (e.charging >= 0) e.charging = 0.7; }
        else if (e.charging > 0) { e.charging -= dt; sp *= 3.6; mx = e.cdx; mz = e.cdz; }
      }
      if (d.boss) {
        const enr = e.hp < e.maxHp * 0.5; if (enr && !e.enr) { e.enr = true; this.cam.shake = 0.8; A.sfx('bell', { vol: 0.8, rate: 0.45 }); this.hooks.onWarn?.(d.name + ' enfurece'); }
        sp *= enr ? 1.5 : 1; const rdy = e.spawn >= 1, T = (k, v) => (mv[k] === undefined ? (mv[k] = v) : mv[k]);
        for (const m of d.moves) {
          if (m === 'slam') { mv.slam = T('slam', 3) - dt; if (mv.slam <= 0 && rdy) { mv.slam = enr ? 3.4 : 4.8; const tx = h.x, tz = h.z; this.telegraph(tx, tz, 4.2, 1.1, () => this.slamAt(tx, tz, 4.2, e.dmg, d.slow)); } }
          if (m === 'summon') { mv.sum = T('sum', 8) - dt; if (mv.sum <= 0 && rdy) { mv.sum = enr ? 7 : 10; for (let i = 0; i < 7; i++) { const a = rnd() * TAU; this.spawnEnemy(d.summon, e.x + Math.cos(a) * 2.5, e.z + Math.sin(a) * 2); } this.hooks.onWarn?.(d.name + ' invoca aliados'); } }
          if (m === 'volley') { mv.vol = T('vol', 5) - dt; if (mv.vol <= 0 && rdy) { mv.vol = enr ? 4 : 5.6; const n = enr ? 16 : 11, a0 = rnd() * TAU; for (let i = 0; i < n; i++) this.shootBolt(e, a0 + (i / n) * TAU, 6, 4.5); A.sfx('hitHeavy', { vol: 0.5, rate: 1.2 }); } }
          if (m === 'pools') { mv.pool = T('pool', 5) - dt; if (mv.pool <= 0 && rdy) { mv.pool = enr ? 5 : 7; for (let i = 0; i < (enr ? 5 : 3); i++) { const a = rnd() * TAU, r = 1 + rnd() * 5, px = h.x + Math.cos(a) * r, pz = h.z + Math.sin(a) * r * 0.8; this.telegraph(px, pz, 2.4, 1.0, () => { this.pools.push({ x: px, z: pz, r: 2.4, life: 8, tick: 0.2, dmg: 9 * this.dm.dmg, slow: true, col: d.bolt }); }); } } }
          if (m === 'charge') {
            mv.chg = T('chg', 6) - dt;
            if (mv.chg <= 0 && rdy && !e.chging) { e.chging = -0.9; mv.chg = enr ? 5 : 7; e.cdx = dx; e.cdz = dz; this.hooks.onWarn?.(d.name + ' investe!'); }
            if (e.chging < 0) { e.chging += dt; sp = 0; if (e.chging >= 0) e.chging = 0.95; }
            else if (e.chging > 0) { e.chging -= dt; sp *= 5; mx = e.cdx; mz = e.cdz; if (e.chging <= 0) { e.chging = 0; this.slamAt(e.x, e.z, 3.4, e.dmg * 0.6); } }
          }
        }
      }
      const slowK = e.spawn < 1 ? 0.3 : 1;
      e.mvx = mx * sp * slowK; e.x += (mx * sp * slowK + e.kx) * dt; e.z += (mz * sp * slowK + e.kz) * dt;
      e.kx *= Math.exp(-5 * dt); e.kz *= Math.exp(-5 * dt); e.anim += dt * (0.6 + sp * 0.9);
      const gx = Math.floor(e.x / CELL), gz = Math.floor(e.z / CELL);
      for (let ax = -1; ax <= 1; ax++) for (let az = -1; az <= 1; az++) { const a = grid.get(((gx + ax + 512) << 12) | (gz + az + 512)); if (!a) continue;
        for (const o of a) { if (o === e || o.dead) continue; const ox = e.x - o.x, oz = e.z - o.z, rr = e.r + o.r, d2 = ox * ox + oz * oz; if (d2 < rr * rr && d2 > 1e-6) { const dd = Math.sqrt(d2), push = ((rr - dd) / dd) * (d.heavy && !o.d.heavy ? 0.1 : 0.5); e.x += ox * push; e.z += oz * push; } } }
      if (!d.fly) this.world.pushOut(e, e.r * 0.8);
      if (dist < e.r + 0.42 && e.atk <= 0 && e.spawn >= 1 && this.mode === 'run' && !d.bomber) { e.atk = d.boss ? 1.1 : 0.85; e.atkT = 0.24; this.hurtHero(e.dmg * (e.buff > 0 ? 1.2 : 1), e.x, e.z, { slow: d.slow }); if (e.affix === 'vampiro') e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.2); }
      if (dist > 34 && !d.boss && this.mode === 'run') { const [x, z] = this.ringPos(); e.x = x; e.z = z; }
    }
    for (const b of this.ebolts) {
      b.life -= dt; b.x += b.vx * dt; b.z += b.vz * dt;
      if ((b.x - h.x) ** 2 + (b.z - h.z) ** 2 < 0.55 ** 2) { this.hurtHero(b.dmg, b.x - b.vx * 0.1, b.z - b.vz * 0.1, { slow: b.slow, ox: b.ox, oz: b.oz }); b.life = 0; }
    }
    this.ebolts = this.ebolts.filter((b) => b.life > 0);
  }
  slamAt(x, z, r, dmg, slow) {
    const d = store.resolveFx('nova'); if (d) this.fx.spawn(d, { x, z, radius: r, dx: 1, dz: 0 });
    this.cam.shake = 0.9; A.synth('boom', { vol: 0.6 }); A.sfx('hitHeavy', { vol: 0.8, rate: 0.5 });
    if (Math.hypot(this.hero.x - x, this.hero.z - z) < r + 0.3) this.hurtHero(dmg, x, z, { slow });
    for (let i = 0; i < 14; i++) this.addSpark({ tex: 'smokeLight', x: x + (rnd() - 0.5) * r, y: 0.3, z: z + (rnd() - 0.5) * r * 0.8, vx: (rnd() - 0.5) * 2, vy: 1, vz: (rnd() - 0.5), life: 0.9, s0: 1.4, s1: 3, a: 0.4, add: false, rot: rnd() * TAU });
  }
  updatePickups(dt) {
    const h = this.hero, mg = this.stats.magnet;
    for (const g of this.gems) {
      g.t += dt; const dx = h.x - g.x, dz = h.z - g.z, d = Math.hypot(dx, dz);
      if (g.tier === 'heart' && h.hp >= h.maxHp) { g.vx *= 0.9; g.vz *= 0.9; }
      else if (d < mg || g.pull) { g.pull = true; const sp = 9 + g.t * 4 + (mg - d > 0 ? 6 : 0); g.vx = (dx / (d || 1)) * Math.max(sp, 10); g.vz = (dz / (d || 1)) * Math.max(sp, 10); }
      else { g.vx *= Math.exp(-4 * dt); g.vz *= Math.exp(-4 * dt); }
      g.x += g.vx * dt; g.z += g.vz * dt;
      if (d < 0.75) {
        g.dead = true;
        if (g.tier === 'scrap') { this.scrapRun += g.v * this.dm.scrap; this.scrapPieces++; A.sfx(pick(['coin', 'coin2']), { vol: 0.25, rate: 1.2, gap: 0.06 }); }
        else if (g.tier === 'chest') { this.chests++; this.pending++; this.ring(h.x, h.z, 6, '#ffc24a', 0.8, 0.18); this.burst(h.x, h.z, 16, 1.2, 8); this.flashA = 0.2; this.flashCol = '#ffc24a'; this.floatText(h.x, 3, h.z, 'BAÚ!', '#ffd98a', true); A.sfx('coin2', { vol: 0.6, rate: 0.8 }); this.queueLevel(0.2); }
        else if (g.tier === 'heart') { this.ring(h.x, h.z, 3.5, '#7dffcf', 0.6, 0.12); { const hv = h.maxHp * g.v * (1 + (this.stats.t.heartBonus || 0)); h.hp = Math.min(h.maxHp, h.hp + hv); this.floatText(h.x, 2.4, h.z, '+' + Math.round(hv), '#7dffcf', false); } A.synth('tick', { f: 520, vol: 0.4 }); }
        else { this.gainXp(g.v * this.comboMul()); A.synth('tick', { f: 700 + Math.min(this.gems.length, 40) * 8 + g.tier * 160, vol: 0.18 }); }
      }
    }
    this.gems = this.gems.filter((g) => !g.dead);
    if (this.gems.length > 320) { const old = this.gems.filter((g) => typeof g.tier === 'number' && g.tier < 2).slice(0, 80); for (const g of old) { g.dead = true; this.gainXp(g.v); } this.gems = this.gems.filter((g) => !g.dead); }
  }

  // ─────────── renderização ───────────
  proj3(x, y, z) { return [this.W / 2 + (x - this.cam.x) * this.ppu + this.cam.sx, this.H * 0.56 + ((z - this.cam.z) * SIN - y * COS) * this.ppu + this.cam.sz]; }
  render(now) {
    const ctx = this.ctx, W = this.W, H = this.H, ppu = this.ppu, art = this.art, h = this.hero;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#0a0708'; ctx.fillRect(0, 0, W, H);
    // chão
    ctx.save(); const [ox, oy] = this.proj3(0, 0, 0); ctx.translate(ox, oy); ctx.scale(1, SIN); const ps = ppu / 38; ctx.scale(ps, ps);
    ctx.fillStyle = ctx.createPattern(this.bart.ground, 'repeat'); ctx.fillRect(-ox / ps - 200, -(oy / (SIN * ps)) - 200, W / ps + 400, H / (SIN * ps) + 400); ctx.restore();
    // decalques
    for (const d of this.decals) { const [sx, sy] = this.proj3(d.x, 0, d.z); if (sx < -80 || sx > W + 80 || sy < -80 || sy > H + 80) continue; ctx.save(); ctx.translate(sx, sy); ctx.scale(1, SIN); ctx.rotate(d.rot); ctx.globalAlpha = d.a; const s = d.r * ppu * 2; ctx.drawImage(art.tex.scorch, -s / 2, -s / 2, s, s); ctx.restore(); }
    ctx.globalAlpha = 1;
    // telegrafos do chefe
    for (const t of this.telegraphs) { if (t.follow) { t.x = t.follow.x; t.z = t.follow.z; } const [sx, sy] = this.proj3(t.x, 0, t.z), u = 1 - t.t / t.total; ctx.save(); ctx.translate(sx, sy); ctx.scale(1, SIN);
      const g = ctx.createRadialGradient(0, 0, t.r * ppu * u * 0.9, 0, 0, t.r * ppu); g.addColorStop(0, 'rgba(255,60,30,0)'); g.addColorStop(1, `rgba(255,70,30,${0.25 + 0.35 * u})`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, t.r * ppu, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(255,120,60,${0.5 + 0.5 * u})`; ctx.lineWidth = 3; ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.arc(0, 0, t.r * ppu, 0, TAU); ctx.stroke(); ctx.restore(); }
    // poças perigosas
    for (const p of this.pools) { const [sx, sy] = this.proj3(p.x, 0, p.z), a = Math.min(1, p.life / 1.2); ctx.save(); ctx.translate(sx, sy); ctx.scale(1, SIN); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * ppu); g.addColorStop(0, rgba(p.col || '#42e0b4', 0.55 * a)); g.addColorStop(0.7, rgba(p.col || '#42e0b4', 0.3 * a)); g.addColorStop(1, rgba(p.col || '#42e0b4', 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, p.r * ppu, 0, TAU); ctx.fill(); ctx.restore(); }
    // coletar desenháveis visíveis
    const hx = W / (2 * ppu) + 4, hz = H / (2 * ppu * SIN) + 4, items = [], fires = [], glowers = [];
    this.world.each(this.cam.x - hx - 8, this.cam.x + hx + 8, this.cam.z - hz - 6, this.cam.z + hz + 22, (c) => { for (const p of c.list) {
      if (Math.abs(p.x - this.cam.x) > hx + p.def.w || p.z < this.cam.z - hz - 2 || p.z > this.cam.z + hz + p.def.h * 1.3) continue;
      const tall = p.type === 'ruin' || p.type === 'tree' || p.type === 'pillar', occ = tall && h.z < p.z && p.z - h.z < p.def.h * 0.8 && Math.abs(h.x - p.x) < p.def.w * 0.55;
      p.a = lerp(p.a, occ ? 0.38 : 1, 0.12); items.push({ z: p.def.flat ? p.z - 9999 : p.z, k: 0, o: p }); if (p.fire) fires.push(p); if (p.glow) glowers.push(p);
    } });
    for (const g of this.gems) items.push({ z: g.z, k: 1, o: g });
    for (const e of this.enemies) items.push({ z: e.z, k: 2, o: e });
    for (const c of this.corpses) items.push({ z: c.z, k: 5, o: c });
    items.push({ z: h.z, k: 3, o: h });
    for (const b of this.ebolts) items.push({ z: b.z, k: 4, o: b });
    items.sort((a, b) => a.z - b.z);
    // sombras primeiro
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    for (const e of this.enemies) { const [sx, sy] = this.proj3(e.x, 0, e.z), w = e.d.boss ? 3.6 : e.r * 2.6; ctx.globalAlpha = e.spawn * (e.d.fly ? 0.35 : 0.55); ctx.beginPath(); ctx.ellipse(sx, sy, w * 0.5 * ppu, w * 0.5 * ppu * SIN * 0.7, 0, 0, TAU); ctx.fill(); }
    { const [sx, sy] = this.proj3(h.x, 0, h.z); ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.ellipse(sx, sy, 0.62 * ppu, 0.62 * ppu * SIN * 0.7, 0, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    // sprites ordenados
    const T = now / 1000;
    for (const gh of this.ghosts) { const S = this.art.sheets.player, [sx, sy] = this.proj3(gh.x, 0, gh.z), hh = S.h * ppu, w = (hh * S.fw) / S.fh, fr = Math.floor(gh.an * 7.5) % S.frames; ctx.save(); ctx.translate(sx, sy + hh * 0.07); if (gh.face < 0) ctx.scale(-1, 1); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = gh.a; ctx.drawImage(this.art.flash.player, fr * S.fw, 0, S.fw, S.fh, -w / 2, -hh, w, hh); ctx.restore(); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    for (const it of items) {
      if (it.k === 0) { const p = it.o, [sx, sy] = this.proj3(p.x, 0, p.z), w = p.def.w * ppu, hh = p.def.h * ppu, cw = p.def.canvas; ctx.globalAlpha = p.a;
        if (p.flip) { ctx.save(); ctx.translate(sx, 0); ctx.scale(-1, 1); ctx.drawImage(cw, -w / 2, sy - hh * p.def.anchor, w, hh); ctx.restore(); } else ctx.drawImage(cw, sx - w / 2, sy - hh * p.def.anchor, w, hh); ctx.globalAlpha = 1; }
      else if (it.k === 1) { const g = it.o, [sx, sy0] = this.proj3(g.x, 0, g.z), bob = Math.sin(T * 4 + g.bob) * 0.08, [, sy] = this.proj3(g.x, 0.5 + bob, g.z), sz = 0.8 * ppu;
        if (g.tier === 'chest') { const s = 1.5 * ppu; ctx.drawImage(art.chest, sx - s / 2, sy - s * 0.62, s, s); }
        else if (g.tier === 'scrap') { const s = 0.75 * ppu; ctx.save(); ctx.translate(sx, sy); ctx.rotate(T * 2 + g.bob); ctx.drawImage(art.scrap, -s / 2, -s / 2, s, s); ctx.restore(); }
        else { const fr = g.tier === 'heart' ? 3 : g.tier; ctx.drawImage(art.pick.canvas, fr * 64, 0, 64, 64, sx - sz / 2, sy - sz / 2, sz, sz); } }
      else if (it.k === 2) this.drawEnemy(ctx, it.o);
      else if (it.k === 3) this.drawHero(ctx, T);
      else if (it.k === 5) this.drawCorpse(ctx, it.o);
      else if (it.k === 4) { const b = it.o, [sx, sy] = this.proj3(b.x, b.y, b.z), s = 1.1 * ppu; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(this.flareFor(b.col), sx - s / 2, sy - s / 2, s, s); ctx.globalCompositeOperation = 'source-over'; }
    }
    // fogo dos barris (chamas Kenney)
    ctx.globalCompositeOperation = 'lighter';
    for (const p of fires) { const [sx, sy] = this.proj3(p.x, 1.15, p.z); for (let i = 0; i < 3; i++) { const ph = T * 3 + p.ph + i * 2.1, u = (ph % 1), s = (0.9 + 0.5 * Math.sin(ph * 4 + i)) * ppu * (1.3 - u * 0.7); ctx.globalAlpha = (1 - u) * 0.85; ctx.drawImage(i === 0 ? art.tex.flameHot : art.tex.flame, sx - s / 2 + Math.sin(ph * 5) * 3, sy - s * 0.9 - u * ppu * 0.8, s, s); } }
    // brilho dos cogumelos e cristais
    for (const p of glowers) { const [sx, sy] = this.proj3(p.x, 0.9, p.z), s = (p.def.w * 1.7 + Math.sin(T * 2 + p.ph) * 0.2) * ppu; ctx.globalAlpha = 0.4 + 0.12 * Math.sin(T * 2.4 + p.ph); ctx.drawImage(softTint(art, p.glow), sx - s / 2, sy - s / 2, s, s); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // névoa do horizonte
    const fog = ctx.createLinearGradient(0, 0, 0, H * 0.42); fog.addColorStop(0, rgba(this.biome.fog, 0.92)); fog.addColorStop(1, rgba(this.biome.fog, 0)); ctx.fillStyle = fog; ctx.fillRect(0, 0, W, H * 0.42);
    // fumaça baixa em movimento
    ctx.globalAlpha = 0.07; for (let i = 0; i < 5; i++) { const s = W * 0.55, x = ((T * 14 * (i % 2 ? 1 : -0.7) + i * W * 0.33) % (W + s)) - s * 0.5, y = H * (0.18 + i * 0.17); ctx.drawImage(art.tex.smokeLight, x, y, s, s * 0.45); } ctx.globalAlpha = 1;
    // luz (multiplicação)
    this.glowersNow = glowers; this.drawLights(ctx, fires, T);
    // efeitos das habilidades (meia resolução + bloom barato)
    this.drawFxLayer(ctx); this.drawRings(ctx);
    // faíscas/fumaça (Kenney)
    this.drawSparks(ctx);
    // números de dano
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    for (const t of this.texts) { const [sx, sy] = this.proj3(t.x, t.y, t.z), u = t.t / t.life, sc = (t.crit ? 1 + 0.5 * Math.sin(Math.min(1, u * 5) * Math.PI * 0.5) : 1) * (1 + 0.45 * Math.max(0, 1 - u * 7)); ctx.globalAlpha = 1 - u * u; ctx.font = `${Math.round((t.crit ? 30 : 21) * (ppu / 52) * sc)}px "Bebas Neue", sans-serif`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,5,4,.9)'; ctx.strokeText(t.txt, sx, sy); ctx.fillStyle = t.col; ctx.fillText(t.txt, sx, sy); }
    ctx.globalAlpha = 1;
    // cinzas caindo
    ctx.globalCompositeOperation = 'source-over';
    for (const a of this.ash) { a.y += a.v * 0.016 * (this.paused ? 0 : 1); a.x += Math.sin(T * 0.6 + a.w) * 0.0006 + 0.0004; if (a.y > 1.05) { a.y = -0.05; a.x = rnd(); } if (a.x > 1.05) a.x = -0.05; ctx.globalAlpha = 0.28 * a.s; ctx.fillStyle = this.biome.ash; const s = a.s * 1.6 * (W / 1200 + 0.6); ctx.fillRect(a.x * W, a.y * H, s, s); }
    ctx.globalAlpha = 1;
    if (this.flashA > 0.01) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = this.flashA * 0.55; ctx.fillStyle = this.flashCol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    // vinheta + dano
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, W * 0.72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,3,3,.78)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    const low = this.mode === 'run' ? clamp(1 - h.hp / h.maxHp * 2.2, 0, 1) : 0, hf = Math.max(this.hurtFlash * 0.6, low * (0.25 + 0.15 * Math.sin(T * 6)));
    if (hf > 0.01) { const rg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7); rg.addColorStop(0, 'rgba(160,20,10,0)'); rg.addColorStop(1, `rgba(190,28,16,${hf})`); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); }
    // indicadores direcionais de dano/aviso (só fontes fora da tela)
    for (const di of this.dmgInd) {
      const k = 1 - di.t / di.life, a = Math.min(1, k * 1.8) * (di.warn ? 0.8 : 1), rx = W / 2 - 34, ry = H / 2 - 34, px = W / 2 + Math.cos(di.ang) * rx, py = H / 2 + Math.sin(di.ang) * ry, s = Math.max(14, W / 70) * (di.warn ? 0.85 : 1.15), col = di.warn ? '255,190,70' : '255,60,44';
      ctx.save(); ctx.translate(px, py); ctx.rotate(di.ang); ctx.globalAlpha = a;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 3.2); g.addColorStop(0, `rgba(${col},.55)`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 3.2, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(${col},1)`; ctx.strokeStyle = 'rgba(20,4,4,.85)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(s * 0.9, 0); ctx.lineTo(-s * 0.7, -s * 0.85); ctx.lineTo(-s * 0.25, 0); ctx.lineTo(-s * 0.7, s * 0.85); ctx.closePath(); ctx.stroke(); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (this.dying > 0) { ctx.fillStyle = `rgba(10,0,0,${clamp(1 - this.dying / 1.3, 0, 0.7)})`; ctx.fillRect(0, 0, W, H); }
  }
  flareFor(col) { const c = col || '#ff7a2a'; this._fl = this._fl || {}; if (!this._fl[c]) { const im = this.art.k.k_flare, k = cv(96), x = k.getContext('2d'); x.drawImage(im, 0, 0, 96, 96); x.globalCompositeOperation = 'multiply'; x.fillStyle = c; x.fillRect(0, 0, 96, 96); x.globalCompositeOperation = 'destination-in'; x.drawImage(im, 0, 0, 96, 96); this._fl[c] = k; } return this._fl[c]; }
  drawEnemy(ctx, e) {
    const ppu = this.ppu, { S, F } = this.art.sheetFor(e.d);
    const [sx, sy] = this.proj3(e.x, e.hover + (e.d.fly ? Math.sin(e.t * 3) * 0.12 : 0), e.z), h = S.h * ppu * (e.sc || 1), w = (h * S.fw) / S.fh, fr = Math.floor(e.anim * 1.6) % S.frames;
    if (e.elite) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55 + 0.2 * Math.sin(e.t * 5); const a = w * 1.5; ctx.drawImage(softTint(this.art, e.affixCol || '#ffc24a'), sx - a / 2, sy - h * 0.55 - a / 2, a, a); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
    if (e.buff > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.15 * Math.sin(e.t * 8); const a2 = w * 1.2; ctx.drawImage(softTint(this.art, '#ffb347'), sx - a2 / 2, sy - h * 0.4 - a2 / 2, a2, a2); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
    const winding = (e.charging < 0 || e.chging < 0 || e.lg < 0) ? 1 + Math.sin(e.t * 50) * 0.02 : 1, fuse = e.fuse > 0 ? 0.5 + 0.5 * Math.sin(e.t * 40) : 0;
    ctx.save(); ctx.globalAlpha = e.spawn; ctx.translate(sx, sy + h * 0.07);
    // animação procedural: surgir, inclinar no movimento, passo saltitado, antecipar/avançar no ataque, recuar ao apanhar
    const spw = e.spawn, back = spw >= 1 ? 1 : 1 + 2.2 * Math.pow(spw - 1, 3) + 1.2 * Math.pow(spw - 1, 2), mvx = e.mvx || 0, moving = Math.abs(mvx) + 0 > 0.4 || Math.abs(e.kx) > 0.5;
    let ax = 1, ay = 1, tx = 0, ty = (1 - spw) * h * 0.18;
    if (!e.d.boss || true) { ctx.rotate(clamp(mvx / 7, -1, 1) * 0.08 * (e.d.fly ? 1.4 : 1)); }
    if (moving && !e.d.fly) ty -= Math.abs(Math.sin(e.anim * 3.4)) * h * 0.022;
    if (e.atkT > 0) { const u = 1 - e.atkT / 0.24, s = Math.sin(u * Math.PI), dir = this.hero.x > e.x ? 1 : -1; tx += dir * s * h * 0.2; ax *= 1 + 0.13 * s; ay *= 1 - 0.09 * s; }
    else if (e.atk > 0 && e.atk < 0.2 && e.spawn >= 1 && this.mode === 'run' && Math.hypot(this.hero.x - e.x, this.hero.z - e.z) < e.r + 1.1) { const k = 1 - e.atk / 0.2; ax *= 1 + 0.06 * k; ay *= 1 - 0.08 * k; tx -= (this.hero.x > e.x ? 1 : -1) * k * h * 0.04; }
    if (e.hitT > 0) { const k = e.hitT / 0.2; ax *= 1 + 0.16 * k; ay *= 1 - 0.14 * k; tx += Math.sign(e.hkx || e.kx || 0) * k * h * 0.06; }
    ctx.translate(tx, ty); if (e.face < 0) ctx.scale(-1, 1); const sq = 1 + Math.sin(e.anim * 4.2) * 0.025; ctx.scale(winding * ax * back, sq * (e.charging < 0 ? 0.92 : 1) * ay * back);
    ctx.drawImage(S.canvas, fr * S.fw, 0, S.fw, S.fh, -w / 2, -h, w, h);
    const fl = Math.max(e.flash > 0 ? Math.min(1, e.flash * 9) : 0, fuse * 0.7);
    if (fl > 0) { ctx.globalAlpha = fl * e.spawn; ctx.drawImage(F, fr * S.fw, 0, S.fw, S.fh, -w / 2, -h, w, h); }
    ctx.restore(); ctx.globalAlpha = 1;
    if ((e.d.heavy || e.elite) && !e.d.boss && (e.hp < e.maxHp || e.elite) && !e.dummy) { const bw = Math.max(w * 0.5, 34), col = e.affixCol || (e.elite ? '#ffc24a' : '#c2562a'); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(sx - bw / 2, sy - h - 8, bw, 5); ctx.fillStyle = col; ctx.fillRect(sx - bw / 2, sy - h - 8, bw * clamp(e.hp / e.maxHp, 0, 1), 5);
      if (e.affixName) { ctx.font = `700 ${Math.round(13 * (ppu / 52))}px Rajdhani, sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,4,4,.9)'; ctx.strokeText(e.affixName.toUpperCase(), sx, sy - h - 12); ctx.fillStyle = col; ctx.fillText(e.affixName.toUpperCase(), sx, sy - h - 12); } }
  }
  drawCorpse(ctx, c) {
    const u = c.t / c.life, { S, F } = this.art.sheetFor(c.d), ppu = this.ppu, [sx, sy] = this.proj3(c.x + c.dir * u * 0.5, c.hover * (1 - u), c.z), h = S.h * ppu * c.sc, w = (h * S.fw) / S.fh, fr = Math.floor(c.anim * 1.6) % S.frames;
    ctx.save(); ctx.globalAlpha = Math.pow(1 - u, 1.3); ctx.translate(sx, sy + h * 0.07); ctx.rotate(c.dir * (1 - Math.pow(1 - u, 2)) * 1.25); if (c.face < 0) ctx.scale(-1, 1); ctx.scale(1 + 0.25 * u, 1 - 0.5 * u);
    ctx.drawImage(S.canvas, fr * S.fw, 0, S.fw, S.fh, -w / 2, -h, w, h);
    if (u < 0.35) { ctx.globalAlpha = (1 - u / 0.35) * 0.9; ctx.drawImage(F, fr * S.fw, 0, S.fw, S.fh, -w / 2, -h, w, h); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  drawHero(ctx, T) {
    const h = this.hero, ppu = this.ppu, S = this.art.sheets.player, [sx, sy] = this.proj3(h.x, 0, h.z), hh = S.h * ppu, w = (hh * S.fw) / S.fh, fr = h.moving ? Math.floor(h.anim * 7.5) % S.frames : (Math.floor(T * 1.8) % 2) * 2;
    ctx.save(); ctx.translate(sx, sy + hh * 0.07);
    // animação procedural: inclinar no movimento, passo saltitado, esticar no dash, encolher ao apanhar
    ctx.rotate(clamp((h.vx || 0) / 6, -1, 1) * 0.07);
    if (h.moving && h.dashT <= 0) ctx.translate(0, -Math.abs(Math.sin(h.anim * Math.PI * 3.75)) * hh * 0.028);
    if (h.dashT > 0) ctx.scale(1.28, 0.84); if (h.hurt > 0) { const k = h.hurt / 0.25; ctx.scale(1 + 0.14 * k, 1 - 0.12 * k); ctx.translate(-Math.sign(h.vx || 0) * k * hh * 0.03, 0); }
    if (h.face < 0) ctx.scale(-1, 1);
    const sq = h.moving ? 1 + Math.sin(h.anim * 15) * 0.03 : 1 + Math.sin(T * 2) * 0.012; ctx.scale(1, sq);
    ctx.globalAlpha = h.iframes > 0 && h.dashT <= 0 ? 0.55 + 0.45 * Math.sin(T * 50) : h.dashT > 0 ? 0.55 : 1;
    ctx.drawImage(S.canvas, fr * S.fw, 0, S.fw, S.fh, -w / 2, -hh, w, hh);
    if (h.hurt > 0) { ctx.globalAlpha = h.hurt * 3; ctx.drawImage(this.art.flash.player, fr * S.fw, 0, S.fw, S.fh, -w / 2, -hh, w, hh); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  drawLights(ctx, fires, T) {
    const q = this.qLight, x = q.getContext('2d'), k = q.width / this.W, ppu = this.ppu * k, art = this.art, h = this.hero;
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.fillStyle = this.mode === 'hub' ? this.biome.hubAmb : this.biome.ambient; x.fillRect(0, 0, q.width, q.height); x.globalCompositeOperation = 'lighter';
    const L = (wx, wy, wz, r, col, a) => { const [sx, sy] = this.proj3(wx, wy, wz), rr = r * ppu * 2; if (sx < -rr || sx > this.W + rr || sy < -rr || sy > this.H + rr) return; const sq = SIN + 0.18; x.globalAlpha = a; x.drawImage(softTint(art, col), sx * k - rr / 2, sy * k - (rr * sq) / 2, rr, rr * sq); };
    const fl = 0.9 + 0.1 * Math.sin(T * 17) + 0.05 * Math.sin(T * 31);
    L(h.x, 0.8, h.z, 8.2, '#ffa95a', 0.95 * fl); L(h.x, 0.8, h.z, 3, '#ffe2b0', 0.6 * fl);
    for (const p of fires) L(p.x, 0.8, p.z, 7 + Math.sin(T * 9 + p.ph) * 0.5, this.biome.fire, 0.85);
    for (const p of this.glowersNow || []) L(p.x, 0.8, p.z, 5, p.glow, 0.7);
    for (const l of this.lights) L(l.x, l.y, l.z, l.r * (1.4 - 0.4 * (l.t / l.life)), l.col, l.a * clamp(l.t / l.life * 1.4, 0, 1));
    for (const i of this.fx.insts) { const d = i.def; if (d.kind === 'orbit') { const pts = this.fx.orbitPoints(i); for (const q of pts) L(q.x, 0.9, q.z, 3.4, d.colors[1], 0.6); } else if (d.kind === 'projectile') L(i.x, 0.9, i.z, 4.2, d.colors[1], 0.8); else if (d.kind === 'nova' && i.t < d.life) L(i.x, 0.3, i.z, i.radius * 0.9 * clamp(i.t / d.life * 2, 0, 1) + 2, d.colors[1], 0.7 * (1 - i.t / d.life)); else if (d.kind === 'slash' && i.t < d.life) L(i.x + i.dx * 2, 0.9, i.z + i.dz * 2, 4.6, d.colors[1], 0.8 * (1 - i.t / d.life)); else if (d.kind === 'chain' && i.nodes && i.t < d.life) for (const n of i.nodes) L(n.x, 1, n.z, 3.6, d.colors[1], 0.8 * (1 - i.t / d.life)); }
    for (const b of this.ebolts) L(b.x, b.y, b.z, 3, b.col || '#ff7a2a', 0.8);
    for (const g of this.gems) if (g.tier === 'chest') L(g.x, 0.6, g.z, 4, '#ffc24a', 0.8);
    for (const e of this.enemies) if (e.elite) L(e.x, 0.8, e.z, 4, '#ffc24a', 0.5);
    for (const g of this.gems) if (g.tier === 2) L(g.x, 0.5, g.z, 2.4, '#7dffcf', 0.6);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    ctx.globalCompositeOperation = 'multiply'; ctx.imageSmoothingEnabled = true; ctx.drawImage(q, 0, 0, this.W, this.H); ctx.globalCompositeOperation = 'source-over';
    // halo quente extra (somar)
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.22; ctx.drawImage(q, 0, 0, this.W, this.H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  drawRings(ctx) {
    if (!this.rings.length) return; ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const r of this.rings) { const u = r.t / r.life, e = 1 - Math.pow(1 - u, 3), rad = r.r * e * this.ppu, [sx, sy] = this.proj3(r.x, 0, r.z); ctx.globalAlpha = (1 - u) * 0.9; ctx.strokeStyle = r.col; ctx.lineWidth = Math.max(1, this.ppu * r.w * 0.5 * (1 - u * 0.7)); ctx.beginPath(); ctx.ellipse(sx, sy, rad, rad * SIN, 0, 0, TAU); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  drawFxLayer(ctx) {
    const q = this.qFx, x = q.getContext('2d'), k = q.width / this.W; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, q.width, q.height);
    if (!this.fx.items.length) return;
    drawFx(x, this.fx.items, (a, b, c) => { const p = this.proj3(a, b, c); return [p[0] * k, p[1] * k]; }, this.ppu * k, SIN, false);
    ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = true; ctx.drawImage(q, 0, 0, this.W, this.H);
    if (this.bloom) {
      const g1 = this.qG1.getContext('2d'), g2 = this.qG2.getContext('2d');
      g1.clearRect(0, 0, this.qG1.width, this.qG1.height); g1.drawImage(q, 0, 0, this.qG1.width, this.qG1.height);
      g2.clearRect(0, 0, this.qG2.width, this.qG2.height); g2.drawImage(this.qG1, 0, 0, this.qG2.width, this.qG2.height);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.75; ctx.drawImage(this.qG1, 0, 0, this.W, this.H); ctx.globalAlpha = 0.9; ctx.drawImage(this.qG2, 0, 0, this.W, this.H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
  }
  drawSparks(ctx) {
    const ppu = this.ppu, tex = this.art.tex;
    for (const s of this.sparks) {
      const u = s.age / s.life, [sx, sy] = this.proj3(s.x, s.y, s.z), sz = lerp(s.s0, s.s1, u) * ppu, im = tex[s.tex]; if (!im) continue;
      ctx.globalCompositeOperation = s.add ? 'lighter' : 'source-over'; ctx.globalAlpha = s.a * (1 - u) * Math.min(1, u * 12);
      if (s.stretch) { const vx = s.vx, vy = -s.vy * COS + s.vz * SIN; ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.atan2(vy, vx)); ctx.drawImage(im, -sz, -sz / 2, sz * 2, sz); ctx.restore(); }
      else { ctx.save(); ctx.translate(sx, sy); ctx.rotate(s.rot + u); ctx.drawImage(im, -sz / 2, -sz / 2, sz, sz); ctx.restore(); }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  hud() {
    const h = this.hero;
    return { hp: h.hp, maxHp: h.maxHp, xp: this.xp, xpNext: this.xpNext, level: this.level, time: this.time, kills: this.kills, scrap: this.scrapEstimate(), dash: h.dashCd,
      skills: Object.keys(this.skillLv).map((id) => { const st = this.sk[id], P = this.sp(id); return { id, lv: this.skillLv[id], cd: id === 'brasas' || !st ? 0 : clamp(st.cd / (P.cd * this.stats.cd), 0, 1) }; }),
      boss: this.boss && !this.boss.dead ? { hp: this.boss.hp, max: this.boss.maxHp, name: this.boss.d.name } : null, bossIn: Math.max(0, this.bossAt - this.time), combo: this.combo, comboT: this.comboT / 3.2, comboMul: this.comboMul(), tide: this.tideT, pending: this.pending, revives: this.revives };
  }

  // ─────────── laço ───────────
  start() {
    let prev = performance.now(), acc = 0; this.running = true;
    const loop = (now) => {
      if (!this.running) return; this.raf = requestAnimationFrame(loop);
      const dt = (now - prev) / 1000; prev = now;
      this.fpsAvg = lerp(this.fpsAvg, dt * 1000, 0.05);
      if (this.fpsAvg > 26 && this.bloom && this.quality === 1 && this.time > 5) { this.bloom = false; this.quality = 0; }
      this.update(Math.min(dt, 0.1)); this.render(now);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
}
