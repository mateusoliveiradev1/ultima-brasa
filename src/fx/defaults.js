// Efeitos padrão do jogo (um por habilidade) com texturas pintadas por código.
import * as T from '../shared/art-fx.js';
import { normalizeDef } from './core.js';

let cache = null;
export function defaultDefs() {
  if (cache) return cache;
  const tx = { slash: T.texSlash(), flame: T.texFlame(), spark: T.texSpark(), smoke: T.texSmoke(), bolt: T.texBolt(), ring: T.texRing(), lance: T.texLance(), meteor: T.texMeteor(), impact: T.texImpact(), tspark: T.texToxicSpark(), fire: T.texFireSheetTall(), fireBig: T.texFireSheetBig(), fireToxic: T.texFireSheetToxic(), fire2: T.texFireV2(), fire2Big: T.texFireV2Big(), fire2Toxic: T.texFireV2Toxic(), ember: T.texEmber(), smokeS: T.texSmokeSheet() };
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
  cache = D;
  return D;
}
export const SKILL_FX = ['lamina', 'brasas', 'arco', 'nova', 'chuva', 'lanca', 'impacto'];
