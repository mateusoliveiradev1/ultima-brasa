// Abre a Forja de Mapas: pinta a arte do jogo (a mesma que o jogo usa) e monta o editor.
import { buildArt } from '../game/game.js';
import { mountMapEditor } from './editor.js';
export async function bootMapEditor(root) {
  root.innerHTML = '<div class="mp-load">Acendendo a Forja de Mapas…</div>';
  await new Promise((r) => setTimeout(r, 30));
  const art = await buildArt((p) => { root.firstChild.textContent = 'Acendendo a Forja de Mapas… ' + Math.round(p * 100) + '%'; });
  mountMapEditor(root, art);
}
