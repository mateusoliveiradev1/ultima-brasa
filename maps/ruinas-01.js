// Ruínas 01 — "Cruzamento": cruzamento de trilhas com um bairro destruído, acampamento e planalto ao fundo.
import { createMap } from '../src/shared/mapspec.js';

const m = createMap({
  name: 'Ruínas 01 — Cruzamento', seed: 11,
  bounds: { x: [-22, 22], z: [-20, 12] },
  camera: { target: [0, -4], scale: 40 },
  ground: { macroSeed: 5, half: 32, paths: [
    [[-32, -1.5], [-12, 0.8], [0, -0.6], [12, 0.6], [32, 4]],     // leste-oeste
    [[0, -0.6], [-1, -4], [0.4, -9], [0.2, -14], [1, -32]],        // ramal norte
  ] },
  spawn: { x: 0, z: 1.2, r: 2.6 },
  platforms: [{ x: -15, z: -15, w: 14, d: 7, h: 2.4 }],
  backdrop: [],
});
const { cluster, line, scatter, place, light, spec } = m;

// âncoras (pontos focais), cada uma com seu entorno
cluster(-10, -6, ['house', 'house', 'barrel', 'barrel', 'sign', 'rubble'].filter((i) => i !== 'rubble'), { spread: 3.6 });
cluster(9, -7, ['ruin', 'ruin', 'barricade', 'crate', 'barrel', 'sign'], { spread: 4 });
cluster(14, 5, ['tent', 'tent', 'campfire', 'crate', 'sandbags', 'sandbags'], { spread: 3.2 });
cluster(-12, 6, ['bus', 'tree', 'deadbush', 'skeleton', 'barrel'], { spread: 3.6 });
cluster(4, 8, ['tree', 'tree', 'tree', 'deadbush', 'deadbush', 'skeleton'], { spread: 3.4 });
cluster(-4, -11, ['billboard', 'lamp', 'trafficlight', 'barricade'], { spread: 3.4 });
// planalto ao fundo-esquerda (props em cima, y = altura do platô)
cluster(-15, -15, ['ruin', 'tree', 'tree', 'barrel'], { spread: 2.8, y: 2.4 });
// bordas da trilha e detalhes de mundo
line('fence', [4, -3], [9, -3.4], 2.6);
scatter(['deadbush', 'skeleton', 'crate'], 6, [-20, 20, -18, 11]);
scatter(['puddle', 'crater'], 3, [-18, 18, -16, 10]);

// luzes: brasas e fogueira
light(14, 5, '#ff8a3a', 1.2, 7); light(-10, -6, '#ff7a30', 0.9, 6); light(9, -7, '#ff7a30', 0.9, 6); light(0, 1.2, '#ffb060', 0.7, 5); light(-5, -11, '#ff6a28', 0.7, 6);
spec.smoke.push([-10, -6, 2.5], [9, -7, 3]);

// cidade perdida ao fundo (só render; fora da área jogável)
for (let i = 0; i < 9; i++) spec.backdrop.push({ id: 'tower', x: -24 + i * 6 + (m.rnd() - 0.5) * 2.5, z: -22 - m.rnd() * 2, v: i });

export default spec;
