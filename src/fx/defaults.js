// Efeitos padrão do jogo (um por habilidade) com texturas pintadas por código.
import * as T from '../shared/art-fx.js';
import * as T2 from '../shared/art-fx2.js';
import { normalizeDef } from './core.js';

let cache = null;
export function defaultDefs() {
  if (cache) return cache;
  const tx = { slash: T.texSlash(), flame: T.texFlame(), spark: T.texSpark(), smoke: T.texSmoke(), bolt: T.texBolt(), ring: T.texRing(), lance: T.texLance(), meteor: T.texMeteor(), impact: T.texImpact(), tspark: T.texToxicSpark(), fire: T.texFireSheetTall(), fireBig: T.texFireSheetBig(), fireToxic: T.texFireSheetToxic(), fire2: T.texFireV2(), fire2Big: T.texFireV2Big(), fire2Toxic: T.texFireV2Toxic(), ember: T.texEmber(), smokeS: T.texSmokeSheet(), saw: T.texSaw() };
  const sm = (c) => (c && c.__sheet) || null;
  const mk = (o) => normalizeDef(o);
  const D = {};
  D.lamina = mk({
    id: 'lamina', name: 'Lâmina de Ferrugem', kind: 'slash', life: 0.34, glow: 1.5, tint: 0.5,
    colors: ['#fff2c8', '#ff8a2e', '#4a1608'],
    body: { size0: 3.4, size1: 4.6, offset: 1.5, sweep: 70, alpha: 'flash', y: 0.9, flat: false, ease: 'out' },
    part: { burst: 10, rate: 70, life: 0.5, speed: 6, spread: 80, gravity: 3, drag: 2.2, size0: 0.55, size1: 0, stretch: 0.5, y: 0.9, spin: 0 },
    args: { arc: 110 }, tex: { body: tx.slash, part: tx.spark },
  });
  D.brasas = mk({
    id: 'brasas', name: 'Brasas Orbitais', kind: 'orbit', life: 0, glow: 1.5, tint: 0.3,
    colors: ['#fff2c8', '#ffb347', '#c2562a'],
    body: { size0: 1.5, size1: 1.5, y: 0.95, alpha: 'hold', flat: false },
    part: { burst: 0, rate: 16, life: 0.55, speed: 1.2, spread: 360, gravity: -1.5, drag: 1.2, size0: 0.4, size1: 0, y: 0.95, lift: 0.4 },
    args: { orbitRadius: 2.6, orbitSpeed: 190, count: 3 }, tex: { body: tx.fire2, part: tx.ember }, texMeta: { body: sm(tx.fire2) },
  });
  D.brasas.part.stretch = 0.7; D.brasas.part.size0 = 0.7;
  D.brasas.body.fps = 18; D.brasas.body.flicker = 1; D.brasas.body.size0 = 1.9; D.brasas.part.lift = 1.4; D.brasas.part.gravity = -2.2; D.brasas.part.rate = 22;
  D.labareda = mk({
    id: 'labareda', name: 'Bola de Fogo', kind: 'projectile', life: 1.2, glow: 1.6, tint: 0.35,
    colors: ['#fff2c8', '#ffa23a', '#a8300c'],
    body: { size0: 2.7, size1: 2.7, y: 0.95, alpha: 'hold', flat: false, fps: 22, flicker: 0.5, rot0: 90 },
    part: { burst: 14, rate: 80, life: 0.7, speed: 2.2, spread: 360, gravity: -2.4, drag: 1.4, size0: 0.42, size1: 0, y: 0.95, lift: 0.9 },
    hit: { on: true, size0: 1.2, size1: 3.6, life: 0.3, flat: false, y: 0.9 },
    args: { speed: 13 }, tex: { body: tx.fire2Big, part: tx.ember, hit: tx.impact, smoke: tx.smokeS }, texMeta: { body: sm(tx.fire2Big), smoke: sm(tx.smokeS) },
    smoke: { on: true, rate: 16, life: 1.3, size0: 0.7, size1: 2.0, rise: 0.6, drift: 0.3, y: 0.95, alpha: 0.26 },
  });
  D.labareda.part.stretch = 0.8; D.labareda.part.size0 = 0.7;
  D.fogueira = mk({
    id: 'fogueira', name: 'Fogueira', kind: 'orbit', life: 0, glow: 1.7, tint: 0.3,
    colors: ['#fff2c8', '#ff9a3a', '#b8340e'],
    body: { size0: 3.2, size1: 3.2, y: 1.15, alpha: 'hold', flat: false, fps: 16, flicker: 0.45 },
    part: { burst: 0, rate: 26, life: 1.5, speed: 0.9, spread: 360, gravity: -1.6, drag: 0.9, size0: 0.34, size1: 0, y: 0.6, lift: 1.7, anim: 'life' },
    args: { orbitRadius: 0.8, orbitSpeed: 0, count: 1 }, tex: { body: tx.fire2Big, part: tx.ember, smoke: tx.smokeS }, texMeta: { body: sm(tx.fire2Big), smoke: sm(tx.smokeS) },
    smoke: { on: true, rate: 6, life: 2.8, size0: 1.0, size1: 3.2, rise: 1.2, drift: 0.6, y: 2.2, alpha: 0.34 },
  });
  D.fogueira.part.stretch = 0.55; D.fogueira.part.size0 = 0.75;
  D.fogoToxico = mk({
    id: 'fogoToxico', name: 'Chama Tóxica', kind: 'orbit', life: 0, glow: 1.7, tint: 0.2,
    colors: ['#e8fff8', '#42e0b4', '#0b5a48'],
    body: { size0: 2.8, size1: 2.8, y: 1.05, alpha: 'hold', flat: false, fps: 18, flicker: 1 },
    part: { burst: 0, rate: 24, life: 1.3, speed: 0.8, spread: 360, gravity: -1.6, drag: 0.9, size0: 0.3, size1: 0, y: 0.6, lift: 1.5 },
    args: { orbitRadius: 0.8, orbitSpeed: 0, count: 1 }, tex: { body: tx.fire2Toxic, part: tx.tspark, smoke: tx.smokeS }, texMeta: { body: sm(tx.fire2Toxic), smoke: sm(tx.smokeS) },
    smoke: { on: true, rate: 5, life: 2.4, size0: 0.8, size1: 2.6, rise: 1.0, drift: 0.5, y: 1.8, alpha: 0.2 },
  });
  D.arco = mk({
    id: 'arco', name: 'Arco Tóxico', kind: 'chain', life: 0.24, glow: 1.6, tint: 0.55,
    colors: ['#e8fff8', '#42e0b4', '#0b3a30'],
    body: { size0: 1.1, size1: 1.1, y: 1.0, alpha: 'flash', ease: 'lin', offset: 0 },
    part: { burst: 8, life: 0.4, speed: 4, spread: 360, gravity: 2, drag: 2, size0: 0.55, size1: 0, y: 1.0, stretch: 0.4 },
    hit: { on: true, size0: 0.8, size1: 2.2, life: 0.22, flat: false, y: 1.0 },
    args: { chains: 4, thick: 1 }, tex: { body: tx.bolt, part: tx.tspark, hit: tx.tspark },
  });
  D.nova = mk({
    id: 'nova', name: 'Nova de Cinzas', kind: 'nova', life: 0.55, glow: 1.4, tint: 0.55,
    colors: ['#ffe2a8', '#ff7a2a', '#3b1208'],
    body: { size0: 0.8, size1: 8, y: 0.05, alpha: 'fade', flat: true, ease: 'out' },
    part: { burst: 34, life: 0.7, speed: 8, spread: 360, gravity: 1.5, drag: 2.4, size0: 0.6, size1: 0, y: 0.35, stretch: 0.45 },
    args: { radius: 5, useRadius: true }, tex: { body: tx.ring, part: tx.spark },
  });
  D.chuva = mk({
    id: 'chuva', name: 'Chuva de Sucata', kind: 'rain', life: 1.1, glow: 1.4, tint: 0.35,
    colors: ['#fff2c8', '#ff8a2e', '#4a1608'],
    body: { size0: 2.0, size1: 2.0, alpha: 'hold', flat: false },
    part: { burst: 14, life: 0.55, speed: 6, spread: 360, gravity: 4, drag: 1.6, size0: 0.55, size1: 0, y: 0.3, stretch: 0.5 },
    hit: { on: true, size0: 1, size1: 4, life: 0.4, flat: true, y: 0.05 },
    args: { count: 6, spread: 4, fall: 0.4 }, tex: { body: tx.meteor, part: tx.spark, hit: tx.ring },
  });
  D.lanca = mk({
    id: 'lanca', name: 'Lança de Brasa', kind: 'projectile', life: 1.4, glow: 1.5, tint: 0.4,
    colors: ['#fff2c8', '#ffb347', '#c2562a'],
    body: { size0: 2.4, size1: 2.4, y: 0.9, alpha: 'hold', flat: false },
    part: { burst: 10, rate: 55, life: 0.4, speed: 3, spread: 360, gravity: 0, drag: 2, size0: 0.4, size1: 0, y: 0.9 },
    hit: { on: true, size0: 0.8, size1: 2.2, life: 0.22, flat: false, y: 0.9 },
    args: { speed: 16 }, tex: { body: tx.lance, part: tx.spark, hit: tx.impact },
  });
  D.impacto = mk({
    id: 'impacto', name: 'Impacto', kind: 'nova', life: 0.2, glow: 1.4, tint: 0.5,
    colors: ['#fff2c8', '#ff9a40', '#4a1608'],
    body: { size0: 0.5, size1: 1.5, y: 0.9, alpha: 'flash', flat: false },
    part: { burst: 5, life: 0.35, speed: 5, spread: 360, gravity: 5, drag: 2, size0: 0.4, size1: 0, y: 0.9, stretch: 0.5 },
    args: { useRadius: false }, tex: { body: tx.impact, part: tx.spark },
  });
  D.serra = mk({
    id: 'serra', name: 'Disco de Serra', kind: 'projectile', life: 2.4, glow: 1.3, tint: 0.2,
    colors: ['#fff6dc', '#ffb347', '#6a3a1a'],
    body: { size0: 1.9, size1: 1.9, y: 0.8, alpha: 'hold', flat: false, spin: 14 },
    part: { burst: 6, rate: 46, life: 0.45, speed: 3, spread: 360, gravity: 4, drag: 2, size0: 0.4, size1: 0, y: 0.8, stretch: 0.6 },
    hit: { on: true, size0: 0.8, size1: 2.2, life: 0.2, flat: false, y: 0.8 },
    args: { speed: 11 }, tex: { body: tx.saw, part: tx.spark, hit: tx.impact },
  });
  D.mina = mk({
    id: 'mina', name: 'Mina de Brasa', kind: 'orbit', life: 0, glow: 1.5, tint: 0.5,
    colors: ['#fff0d0', '#ff4a2a', '#4a0c08'],
    body: { size0: 1.3, size1: 1.3, y: 0.3, alpha: 'hold', flat: false, fps: 14, flicker: 1 },
    part: { burst: 0, rate: 8, life: 0.6, speed: 0.6, spread: 360, gravity: -1, drag: 1, size0: 0.35, size1: 0, y: 0.3, lift: 0.8 },
    args: { orbitRadius: 0.01, orbitSpeed: 0, count: 1 }, tex: { body: tx.fire2, part: tx.ember }, texMeta: { body: sm(tx.fire2) },
  });
  D.marreta = mk({
    id: 'marreta', name: 'Marreta Sísmica', kind: 'nova', life: 0.5, glow: 1.3, tint: 0.5,
    colors: ['#ffe9c0', '#d0873a', '#3a2010'],
    body: { size0: 0.6, size1: 6, y: 0.05, alpha: 'fade', flat: true, ease: 'out' },
    part: { burst: 26, life: 0.7, speed: 6, spread: 360, gravity: 9, drag: 1.8, size0: 0.55, size1: 0, y: 0.2, stretch: 0.5 },
    args: { radius: 3.4, useRadius: true }, tex: { body: tx.ring, part: tx.spark },
  });
  D.rastro = mk({
    id: 'rastro', name: 'Rastro de Fogo', kind: 'orbit', life: 0, glow: 1.6, tint: 0.3,
    colors: ['#fff2c8', '#ff8a2e', '#7a2208'],
    body: { size0: 2.6, size1: 2.6, y: 0.7, alpha: 'hold', flat: false, fps: 18, flicker: 0.8 },
    part: { burst: 0, rate: 14, life: 0.9, speed: 0.7, spread: 360, gravity: -1.6, drag: 1, size0: 0.4, size1: 0, y: 0.4, lift: 1.2 },
    args: { orbitRadius: 0.01, orbitSpeed: 0, count: 1 }, tex: { body: tx.fire2Big, part: tx.ember, smoke: tx.smokeS }, texMeta: { body: sm(tx.fire2Big), smoke: sm(tx.smokeS) },
    smoke: { on: true, rate: 3, life: 2.0, size0: 0.8, size1: 2.4, rise: 1.0, drift: 0.5, y: 1.4, alpha: 0.2 },
  });
  D.veneno = mk({
    id: 'veneno', name: 'Poça Tóxica', kind: 'orbit', life: 0, glow: 1.6, tint: 0.25,
    colors: ['#e8fff8', '#42e0b4', '#0b5a48'],
    body: { size0: 2.4, size1: 2.4, y: 0.6, alpha: 'hold', flat: false, fps: 16, flicker: 1 },
    part: { burst: 0, rate: 16, life: 1.1, speed: 0.6, spread: 360, gravity: -1.2, drag: 1, size0: 0.35, size1: 0, y: 0.4, lift: 1.0 },
    args: { orbitRadius: 0.01, orbitSpeed: 0, count: 1 }, tex: { body: tx.fire2Toxic, part: tx.tspark }, texMeta: { body: sm(tx.fire2Toxic) },
  });
  D.totem = mk({
    id: 'totem', name: 'Totem de Cinzas', kind: 'orbit', life: 0, glow: 1.8, tint: 0.4,
    colors: ['#fff6d8', '#ffd35a', '#6a3a8a'],
    body: { size0: 3.2, size1: 3.2, y: 1.2, alpha: 'hold', flat: false, fps: 16, flicker: 0.6 },
    part: { burst: 0, rate: 22, life: 1.2, speed: 0.9, spread: 360, gravity: -1.8, drag: 0.9, size0: 0.4, size1: 0, y: 0.8, lift: 1.7 },
    args: { orbitRadius: 0.01, orbitSpeed: 0, count: 1 }, tex: { body: tx.fire2Big, part: tx.ember, smoke: tx.smokeS }, texMeta: { body: sm(tx.fire2Big), smoke: sm(tx.smokeS) },
    smoke: { on: true, rate: 4, life: 2.4, size0: 1.0, size1: 3.0, rise: 1.2, drift: 0.5, y: 2.2, alpha: 0.28 },
  });
  D.vortice = mk({
    id: 'vortice', name: 'Vórtice', kind: 'orbit', life: 0, glow: 1.5, tint: 0.4,
    colors: ['#f0e0ff', '#a05cff', '#2a1050'],
    body: { size0: 5, size1: 5, y: 0.06, alpha: 'hold', flat: true, spin: 6 },
    part: { burst: 0, rate: 34, life: 0.9, speed: 1.4, spread: 360, gravity: -0.6, drag: 1.2, size0: 0.5, size1: 0, y: 0.6, lift: 0.8, stretch: 0.5 },
    args: { orbitRadius: 0.01, orbitSpeed: 0, count: 1 }, tex: { body: tx.ring, part: tx.spark },
  });

  // ───────── biblioteca de efeitos (2ª geração de texturas) ─────────
  const t2 = { ice: T2.texIceShard(), light: T2.texLightning(), vazio: T2.texVoid(), holy: T2.texHoly(), claw: T2.texClaw(), cracks: T2.texCracks(), rune: T2.texRune(), star: T2.texStar(), orb: T2.texOrb(), spores: T2.texSpores(), slashX: T2.texSlashX(), smokeRing: T2.texSmokeRing(), splat: T2.texSplat() };
  D.gelo = mk({
    id: 'gelo', name: 'Estilhaço de Gelo', kind: 'projectile', life: 1.2, glow: 1.25, tint: 0.62,
    colors: ['#ffffff', '#8fd8ff', '#2a5fb8'],
    body: { size0: 2.6, size1: 2.6, y: 0.9, alpha: 'hold', flat: false },
    part: { burst: 10, rate: 50, life: 0.6, speed: 2.4, spread: 360, gravity: 2.5, drag: 1.6, size0: 0.4, size1: 0, y: 0.9, stretch: 0.5 },
    hit: { on: true, size0: 1, size1: 3, life: 0.3, flat: false, y: 0.9 }, args: { speed: 15 }, tex: { body: t2.ice, part: tx.spark, hit: t2.star },
  });
  D.nevasca = mk({
    id: 'nevasca', name: 'Nevasca (onda de gelo)', kind: 'nova', life: 0.6, glow: 1.25, tint: 0.62,
    colors: ['#f0fbff', '#8fd8ff', '#1a3f8a'],
    body: { size0: 0.8, size1: 9, y: 0.05, alpha: 'fade', flat: true, ease: 'out' },
    part: { burst: 40, life: 0.8, speed: 7, spread: 360, gravity: 3, drag: 2, size0: 0.55, size1: 0, y: 0.4, stretch: 0.5 },
    args: { radius: 5, useRadius: true }, tex: { body: t2.smokeRing, part: tx.spark },
  });
  D.relampago = mk({
    id: 'relampago', name: 'Relâmpago', kind: 'chain', life: 0.26, glow: 1.25, tint: 0.62,
    colors: ['#ffffff', '#7ab8ff', '#1a2a8a'],
    body: { size0: 1.5, size1: 1.5, y: 1.0, alpha: 'flash', ease: 'lin', offset: 0 },
    part: { burst: 10, life: 0.4, speed: 5, spread: 360, gravity: 2, drag: 2, size0: 0.55, size1: 0, y: 1.0, stretch: 0.5 },
    hit: { on: true, size0: 1, size1: 2.6, life: 0.25, flat: false, y: 1.0 }, args: { chains: 5, thick: 1.2 }, tex: { body: t2.light, part: tx.spark, hit: t2.star },
  });
  D.trovao = mk({
    id: 'trovao', name: 'Trovões', kind: 'rain', life: 1.0, glow: 1.25, tint: 0.62,
    colors: ['#ffffff', '#9ac8ff', '#2a3a9a'],
    body: { size0: 2.4, size1: 2.4, alpha: 'hold', flat: false }, part: { burst: 16, life: 0.5, speed: 7, spread: 360, gravity: 3, drag: 1.6, size0: 0.5, size1: 0, y: 0.3, stretch: 0.5 },
    hit: { on: true, size0: 1.2, size1: 4.4, life: 0.4, flat: true, y: 0.05 }, args: { count: 6, spread: 4, fall: 0.3 }, tex: { body: t2.star, part: tx.spark, hit: t2.cracks },
  });
  D.vazio = mk({
    id: 'vazio', name: 'Vazio (redemoinho)', kind: 'orbit', life: 0, glow: 1.25, tint: 0.62,
    colors: ['#f0e0ff', '#a05cff', '#2a1050'],
    body: { size0: 4.4, size1: 4.4, y: 0.06, alpha: 'hold', flat: true, spin: 3 },
    part: { burst: 0, rate: 26, life: 1.0, speed: 1.6, spread: 360, gravity: -0.4, drag: 1.2, size0: 0.5, size1: 0, y: 0.5, lift: 0.7, stretch: 0.5 },
    args: { orbitRadius: 0.01, orbitSpeed: 0, count: 1 }, tex: { body: t2.vazio, part: tx.spark },
  });
  D.implosao = mk({
    id: 'implosao', name: 'Implosão', kind: 'nova', life: 0.5, glow: 1.25, tint: 0.62,
    colors: ['#f6e8ff', '#b070ff', '#2a1050'],
    body: { size0: 6.5, size1: 0.6, y: 0.05, alpha: 'hold', flat: true, ease: 'in', spin: 5 },
    part: { burst: 30, life: 0.6, speed: 7, spread: 360, gravity: 0, drag: 3, size0: 0.55, size1: 0, y: 0.5, stretch: 0.5 },
    args: { radius: 5, useRadius: true }, tex: { body: t2.vazio, part: tx.spark },
  });
  D.sagrado = mk({
    id: 'sagrado', name: 'Pulso Sagrado', kind: 'nova', life: 0.7, glow: 1.25, tint: 0.62,
    colors: ['#fffbe8', '#ffd35a', '#8a5a10'],
    body: { size0: 0.8, size1: 8, y: 0.06, alpha: 'fade', flat: true, ease: 'out', spin: 1.2 },
    part: { burst: 28, life: 0.9, speed: 4, spread: 360, gravity: -2, drag: 1.6, size0: 0.6, size1: 0, y: 0.5, stretch: 0 }, hit: { on: false },
    args: { radius: 5, useRadius: true }, tex: { body: t2.holy, part: t2.star },
  });
  D.garras = mk({
    id: 'garras', name: 'Garras', kind: 'slash', life: 0.3, glow: 1.25, tint: 0.62,
    colors: ['#fff4e0', '#ff6a3a', '#3a0a08'],
    body: { size0: 3.8, size1: 5, offset: 1.6, sweep: 20, alpha: 'flash', y: 0.9, flat: false, ease: 'out' },
    part: { burst: 14, rate: 80, life: 0.5, speed: 6, spread: 70, gravity: 4, drag: 2, size0: 0.55, size1: 0, y: 0.9, stretch: 0.6 }, args: { arc: 90 }, tex: { body: t2.claw, part: t2.splat },
  });
  D.corteX = mk({
    id: 'corteX', name: 'Cortes Cruzados', kind: 'nova', life: 0.32, glow: 1.25, tint: 0.62,
    colors: ['#ffffff', '#ffc070', '#5a1a08'],
    body: { size0: 1, size1: 5, y: 0.9, alpha: 'flash', flat: false, ease: 'out', spin: 0 },
    part: { burst: 12, life: 0.5, speed: 6, spread: 360, gravity: 3, drag: 2, size0: 0.5, size1: 0, y: 0.9, stretch: 0.5 }, args: { radius: 3, useRadius: false }, tex: { body: t2.slashX, part: tx.spark },
  });
  D.terremoto = mk({
    id: 'terremoto', name: 'Terremoto (rachaduras)', kind: 'nova', life: 0.8, glow: 1.25, tint: 0.62,
    colors: ['#fff0c8', '#ff9a40', '#4a1608'],
    body: { size0: 1, size1: 8, y: 0.04, alpha: 'fade', flat: true, ease: 'out' },
    part: { burst: 30, life: 0.8, speed: 6, spread: 360, gravity: 10, drag: 1.6, size0: 0.6, size1: 0, y: 0.3, stretch: 0.5 }, hit: { on: false },
    smoke: { on: true, rate: 0, life: 1.6, size0: 1.2, size1: 3.4, rise: 1, drift: 0.5, y: 0.6, alpha: 0.4 },
    args: { radius: 5, useRadius: true }, tex: { body: t2.cracks, part: tx.spark, smoke: tx.smokeS }, texMeta: { smoke: sm(tx.smokeS) },
  });
  D.runas = mk({
    id: 'runas', name: 'Círculo de Runas', kind: 'orbit', life: 0, glow: 1.25, tint: 0.62,
    colors: ['#fff3d6', '#ffb347', '#7a3a10'],
    body: { size0: 4.2, size1: 4.2, y: 0.05, alpha: 'hold', flat: true, spin: 0.6 },
    part: { burst: 0, rate: 12, life: 1.2, speed: 0.5, spread: 360, gravity: -1.4, drag: 1, size0: 0.35, size1: 0, y: 0.2, lift: 1.4 },
    args: { orbitRadius: 0.01, orbitSpeed: 0, count: 1 }, tex: { body: t2.rune, part: t2.star },
  });
  D.nuvemToxica = mk({
    id: 'nuvemToxica', name: 'Nuvem Tóxica', kind: 'orbit', life: 0, glow: 1.25, tint: 0.62,
    colors: ['#eafff6', '#42e0b4', '#0b5a48'],
    body: { size0: 4.5, size1: 4.5, y: 0.5, alpha: 'hold', flat: false, spin: 0.4 },
    part: { burst: 0, rate: 18, life: 1.3, speed: 0.7, spread: 360, gravity: -0.8, drag: 1, size0: 0.4, size1: 0, y: 0.4, lift: 1.1 },
    args: { orbitRadius: 0.01, orbitSpeed: 0, count: 1 }, tex: { body: t2.spores, part: tx.tspark },
  });
  D.orbeArcano = mk({
    id: 'orbeArcano', name: 'Orbe Arcano', kind: 'projectile', life: 1.4, glow: 1.25, tint: 0.62,
    colors: ['#f4e6ff', '#b070ff', '#3a1a7a'],
    body: { size0: 2.4, size1: 2.4, y: 0.95, alpha: 'hold', flat: false },
    part: { burst: 10, rate: 60, life: 0.5, speed: 2.4, spread: 360, gravity: 0, drag: 1.8, size0: 0.4, size1: 0, y: 0.95, stretch: 0.4 },
    hit: { on: true, size0: 1, size1: 3.2, life: 0.3, flat: false, y: 0.95 }, args: { speed: 12 }, tex: { body: t2.orb, part: t2.star, hit: t2.star },
  });
  D.cuspe = mk({
    id: 'cuspe', name: 'Cuspe Ácido', kind: 'projectile', life: 1.2, glow: 1.25, tint: 0.62,
    colors: ['#f0fff8', '#42e0b4', '#0b5a48'],
    body: { size0: 1.8, size1: 1.8, y: 0.9, alpha: 'hold', flat: false },
    part: { burst: 8, rate: 40, life: 0.5, speed: 2, spread: 360, gravity: 2, drag: 1.6, size0: 0.35, size1: 0, y: 0.9 }, hit: { on: true, size0: 1, size1: 3, life: 0.3, flat: false, y: 0.8 },
    args: { speed: 12 }, tex: { body: t2.orb, part: tx.tspark, hit: t2.spores },
  });
  D.estrela = mk({
    id: 'estrela', name: 'Brilho em Estrela', kind: 'nova', life: 0.3, glow: 1.25, tint: 0.62,
    colors: ['#ffffff', '#ffe08a', '#a04a10'],
    body: { size0: 0.6, size1: 3.2, y: 0.9, alpha: 'flash', flat: false, ease: 'out', spin: 1 },
    part: { burst: 8, life: 0.4, speed: 5, spread: 360, gravity: 0, drag: 3, size0: 0.4, size1: 0, y: 0.9 }, args: { useRadius: false }, tex: { body: t2.star, part: tx.spark },
  });
  D.explosao = mk({
    id: 'explosao', name: 'Explosão', kind: 'nova', life: 0.55, glow: 1.25, tint: 0.62,
    colors: ['#ffffff', '#ff9a40', '#3a0c06'],
    body: { size0: 1, size1: 6.4, y: 0.7, alpha: 'flash', flat: false, ease: 'out' },
    part: { burst: 36, life: 0.8, speed: 9, spread: 360, gravity: 6, drag: 2, size0: 0.7, size1: 0, y: 0.6, stretch: 0.55 }, hit: { on: false },
    smoke: { on: true, rate: 0, life: 1.6, size0: 1.2, size1: 3.6, rise: 1.2, drift: 0.6, y: 0.9, alpha: 0.45 },
    args: { radius: 4, useRadius: true }, tex: { body: t2.splat, part: tx.spark, smoke: tx.smokeS }, texMeta: { smoke: sm(tx.smokeS) },
  });
  // ───────── variantes de evolução: mesma habilidade, visual novo ─────────
  const variant = (b, id, name, patch) => {
    const d = { ...b, id, name, colors: (patch.colors || b.colors).slice(), body: { ...b.body, ...(patch.body || {}) }, part: { ...b.part, ...(patch.part || {}) }, hit: { ...b.hit, ...(patch.hit || {}) }, smoke: { ...b.smoke, ...(patch.smoke || {}) }, args: { ...b.args, ...(patch.args || {}) }, tex: { ...b.tex, ...(patch.tex || {}) }, texMeta: { ...b.texMeta, ...(patch.texMeta || {}) } };
    if (patch.glow) d.glow = patch.glow; if (patch.tint !== undefined) d.tint = patch.tint; delete d._rgb; delete d.__src;
    D[id] = mk(d);
  };
  variant(D.lamina, 'lamina_evo', 'Lâmina Calcinada (evolução)', { colors: ['#ffffff', '#ffd35a', '#c2301a'], glow: 1.4, body: { size0: 4.6, size1: 6 }, part: { burst: 26, rate: 120, size0: 0.7 }, tex: { body: t2.slashX }, smoke: { on: true, rate: 20, size0: 0.8, size1: 2.4, y: 1 }, texMeta: { smoke: sm(tx.smokeS) } });
  D.lamina_evo.tex.smoke = tx.smokeS;
  variant(D.brasas, 'brasas_evo', 'Coroa de Brasas (evolução)', { colors: ['#ffffff', '#ffe08a', '#e0702a'], glow: 1.4, body: { size0: 2.4, size1: 2.4 }, part: { rate: 40 } });
  variant(D.arco, 'arco_evo', 'Tempestade Tóxica (evolução)', { colors: ['#f2fff8', '#5affcf', '#0a6a50'], glow: 1.4, body: { size0: 1.7, size1: 1.7 }, args: { thick: 1.3 }, tex: { body: t2.light, hit: t2.spores } });
  variant(D.nova, 'nova_evo', 'Supernova de Cinzas (evolução)', { colors: ['#fff0ff', '#c070ff', '#2a1050'], glow: 1.4, body: { size1: 11 }, part: { burst: 60, size0: 0.8 }, tex: { body: t2.smokeRing, part: t2.star } });
  variant(D.chuva, 'chuva_evo', 'Chuva Apocalíptica (evolução)', { colors: ['#fff0d0', '#ff5a2a', '#3a0806'], glow: 1.4, body: { size0: 2.6, size1: 2.6 }, part: { burst: 24 }, hit: { size1: 6 }, tex: { hit: t2.cracks } });
  variant(D.lanca, 'lanca_evo', 'Lança Solar (evolução)', { colors: ['#ffffff', '#ffe27a', '#ff8a2a'], glow: 1.4, body: { size0: 3.2, size1: 3.2 }, part: { rate: 90, size0: 0.55 }, tex: { part: t2.star, hit: t2.star } });
  variant(D.serra, 'serra_evo', 'Disco Ceifador (evolução)', { colors: ['#ffffff', '#ff7a5a', '#5a0a10'], glow: 1.35, body: { size0: 2.4, size1: 2.4, spin: 18 }, part: { rate: 80 } });
  variant(D.mina, 'mina_evo', 'Campo Minado (evolução)', { colors: ['#ffffff', '#ff6a3a', '#5a0a08'], glow: 1.35, body: { size0: 1.6, size1: 1.6 } });
  variant(D.marreta, 'marreta_evo', 'Terremoto (evolução)', { colors: ['#fff0c8', '#ffa040', '#4a1608'], glow: 1.35, body: { size1: 7.5 }, part: { burst: 44 }, tex: { body: t2.cracks } });
  variant(D.rastro, 'rastro_evo', 'Trilha Infernal (evolução)', { colors: ['#ffffff', '#ffb040', '#a01808'], glow: 1.4, body: { size0: 3.2, size1: 3.2 }, part: { rate: 24 } });
  variant(D.totem, 'totem_evo', 'Totem Ancestral (evolução)', { colors: ['#fffbe8', '#ffd35a', '#a05cff'], glow: 1.4, body: { size0: 3.8, size1: 3.8 } });
  variant(D.vortice, 'vortice_evo', 'Buraco Negro (evolução)', { colors: ['#ffffff', '#c070ff', '#12002a'], glow: 1.4, body: { size0: 6.5, size1: 6.5, spin: 9 }, part: { rate: 50 }, tex: { body: t2.vazio, part: t2.star } });
  cache = D;
  return D;
}
export const SKILL_FX = ['lamina', 'brasas', 'arco', 'nova', 'chuva', 'lanca', 'serra', 'mina', 'marreta', 'rastro', 'totem', 'vortice', 'veneno', 'impacto',
  'lamina_evo', 'brasas_evo', 'arco_evo', 'nova_evo', 'chuva_evo', 'lanca_evo', 'serra_evo', 'mina_evo', 'marreta_evo', 'rastro_evo', 'totem_evo', 'vortice_evo'];
