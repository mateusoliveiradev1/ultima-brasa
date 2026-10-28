// Texturas CC0 da Kenney (Particle Pack 1.1) como bases prontas para pintar por cima na Forja.
import { KENNEY_TEX } from './kenney.js';
import { cv } from '../shared/util.js';

export const KENNEY_BASES = {
  'Kenney · Chama suave': 'k_flame1', 'Kenney · Chama viva': 'k_flame2', 'Kenney · Fogo': 'k_fire', 'Kenney · Magia': 'k_magic',
  'Kenney · Clarão de cano': 'k_muzzle', 'Kenney · Corte': 'k_slash', 'Kenney · Corte duplo': 'k_slash2', 'Kenney · Fumaça': 'k_smoke',
  'Kenney · Faísca': 'k_spark', 'Kenney · Faísca longa': 'k_spark2', 'Kenney · Estrela': 'k_star', 'Kenney · Queimadura': 'k_scorch',
  'Kenney · Rastro': 'k_trace', 'Kenney · Redemoinho': 'k_twirl', 'Kenney · Anel': 'k_ring', 'Kenney · Luz': 'k_light', 'Kenney · Runa': 'k_rune', 'Kenney · Flare': 'k_flare',
};
const imgs = new Map();
export function kenneyImage(key) {
  if (imgs.has(key)) return imgs.get(key);
  const p = new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = KENNEY_TEX[key]; });
  imgs.set(key, p); return p;
}
export async function kenneyCanvas(key, size = 256) {
  const i = await kenneyImage(key), c = cv(size);
  c.getContext('2d').drawImage(i, 0, 0, size, size);
  return c;
}
