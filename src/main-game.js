import { mountGame } from './game/ui.js';
import { bootMapEditor } from './mapas/boot.js';
const root = document.getElementById('app');
// ?editor=mapas abre a Forja de Mapas no lugar do jogo (mesma página publicada)
if (new URLSearchParams(location.search).get('editor') === 'mapas') bootMapEditor(root); else mountGame(root);
