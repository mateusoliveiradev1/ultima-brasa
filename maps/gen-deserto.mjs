// Deserto — areia, ferro, ossos e sol de brasa.
import { def, set, along, arc, loop, frame, blob, glow } from './lib.mjs';
const FIRE = '#ff8a3a', WARM = '#ffb060';

// ────────── 01 · CEMITÉRIO DE FERRO ──────────
const CE = [[-32, 1], [-16, 0], [0, 0], [16, -1.4], [32, 0]];
def('deserto-cemiterio', 'deserto', 'Deserto 01 — Cemitério de Ferro', 'Carcaças de veículos, cruzes de ferro e costelas gigantes: o ferro-velho de um deserto sem fim.', 81, {
  paths: [CE, [[0, 0], [-2, -9], [-6, -18], [-5, -32]], [[0, 0], [3, 9], [0, 18], [2, 32]]],
  patches: [
    { type: 'sand', x: -16, z: -9, rx: 9, rz: 4.4 }, { type: 'sand', x: 17, z: 9, rx: 9, rz: 4.4 }, { type: 'sand', x: 0, z: -18, rx: 9, rz: 4 }, { type: 'rock', x: -22, z: 11, rx: 6, rz: 3.4 }, { type: 'rock', x: 22, z: -12, rx: 6, rz: 3.4 },
    { type: 'scorch', x: 0, z: -4, rx: 6, rz: 3 }, { type: 'scorch', x: 8, z: 14, rx: 5, rz: 3 }, { type: 'sand', x: -2, z: 11, rx: 6, rz: 3 },
  ],
}, (m) => {
  // fileiras de cruzes de ferro: o cemitério em si
  set(m, -16, -9, [['ironcross', -4.6, -2], ['ironcross', 0, -3], ['ironcross', 4.6, -2], ['ironcross', -2.4, 1.2], ['ironcross', 2.6, 1.4], ['bonepile', 7, 1.4], ['skeleton', -7, 1.8], ['sandmound', 0, 4.6]]);
  set(m, 17, 9, [['wreck', -4, -2.4], ['wreck', 2.4, -3], ['tank', 6.6, 0.4], ['tires', -2, 2.2], ['tires', 0.4, 3], ['barrel', 4.4, 3.4], ['sandmound', -6.6, 1.2], ['windpump', 0, -6.6]]);
  set(m, 0, -18, [['mesa', -10, -3.4], ['mesa', 7.4, -2.4], ['ribs', 0, -1.4], ['bonepile', -3.6, 2.2], ['bonepile', 3.6, 2.4], ['skeleton', 0, 3.4], ['ironcross', -5.6, 2.4], ['ironcross', 5.8, 2.6]]);
  set(m, -22, 11, [['container', 0, 0], ['wreck', 4.6, 1.4], ['sandmound', -3.6, 2.4], ['tires', 2.2, -3], ['cactus', -4.6, -2]]);
  set(m, 22, -12, [['tank', -1.6, 0], ['tank', 1.8, 0.4], ['brazier', 0, 3.2], ['barrel', 4.4, 1.8], ['wreck', -5, 2.4]]);
  set(m, -3, 11.4, [['bus', 0, 0], ['barricade', 4.6, 0.4], ['tires', -3.2, 2], ['skeleton', 2, 3.4], ['cactus', -5, -1.4]]);
  set(m, 8, 15.4, [['obelisk', 0, 0], ['cactus', 3.4, 1.6], ['deadbush', -2.6, 2.4]]);
  set(m, 8, -4.4, [['sign', 0, 0], ['skeleton', 2.6, 1], ['crater', -1.8, 2.8, { force: true }]]);
  set(m, -9, 3.4, [['wreck', 0, 0], ['ironcross', 3.4, 0.6], ['sandbags', -3.2, 1.6]]);
  along(m, ['ironcross', 'cactus', 'deadbush', 'bonepile'], CE, { step: 6, off: 3.8, skip: 0.45 });
  frame(m, ['mesa', 'boulder', 'cactus', 'bonepile', 'sandmound', 'spire', 'ironcross'], { inset: 1.8, step: 3.8, depth: 2 });
  m.scatter(['cactus', 'deadbush', 'skeleton', 'sandmound', 'boulder', 'bonepile', 'cactus', 'spire'], 24, [-27, 27, -23, 19]); m.scatter(['crater'], 5, [-26, 26, -20, 18]);
  glow(m, 22, -9, FIRE, 1.0, 7); glow(m, 17, 6, FIRE, 0.8, 6); glow(m, -16, -9, WARM, 0.8, 7); glow(m, 0, -18, '#ff6a28', 0.9, 7); glow(m, -3, 11, FIRE, 0.7, 6); glow(m, 0, 0, WARM, 0.6, 5);
});

// ────────── 02 · OÁSIS SECO ──────────
const OA = [[-32, 0.4], [-16, 1], [0, 0], [16, -0.6], [32, 0]];
def('deserto-oasis', 'deserto', 'Deserto 02 — Oásis Seco', 'Palmeiras mortas em volta de um lago que secou; caravanas acampam onde havia água.', 91, {
  paths: [OA, [[0, 0], [2, -9], [-1, -18], [1, -32]], [[0, 0], [-3, 9], [-1, 18], [-3, 32]]],
  patches: [
    { type: 'sand', x: 0, z: -13, rx: 13, rz: 6.4 }, { type: 'mud', x: 0, z: -13, rx: 8, rz: 3.6 }, { type: 'sand', x: -18, z: 10, rx: 8, rz: 4 }, { type: 'sand', x: 19, z: 10, rx: 8, rz: 4 },
    { type: 'rock', x: -22, z: -8, rx: 6, rz: 3.6 }, { type: 'rock', x: 23, z: -8, rx: 6, rz: 3.6 }, { type: 'scorch', x: 0, z: 9, rx: 5, rz: 2.6 },
  ],
}, (m) => {
  // o lago seco e suas palmeiras
  set(m, 0, -13, [['palm', -9, -2], ['palm', 9, -1.6], ['palm', -5.4, -4.6], ['palm', 5.6, -4.4], ['palm', -10, 2.4], ['palm', 10, 2.6], ['skeleton', 0, 0.4], ['ribs', -3.6, 1.4], ['bonepile', 3.8, 1.6], ['crater', 0, -2.2, { force: true }], ['deadbush', -6.4, 3.4], ['deadbush', 6.6, 3.2]]);
  set(m, -18, 10, [['tent', -2.6, 0], ['tent', 2.8, -0.6], ['campfire', 0.2, 2.4], ['crate', -4.4, 2.8], ['barrel', 4.6, 2.4], ['palm', 0, -3.8], ['banner', -6.4, -1.4]]);
  set(m, 19, 10, [['tent', 0, -0.4], ['campfire', 2.6, 2], ['sandbags', -3.2, 1.8], ['wreck', 5.4, -1.6], ['crate', -2.4, 3.4], ['palm', -5, -2.6], ['cactus', 6.4, 3]]);
  set(m, -23, -8, [['mesa', 0, -1.4], ['spire', 4.6, 1.2], ['sandmound', -3.2, 2.8], ['cactus', 3.4, 3.6]]);
  set(m, 24, -8, [['mesa', 0, -1.4], ['spire', -4.6, 1.2], ['sandmound', 3.2, 2.8], ['cactus', -3.4, 3.6]]);
  set(m, -11, 13, [['windpump', 0, 0], ['tank', 3.4, 1.2], ['barrel', -2.6, 1.6]]);
  set(m, 9, 5.6, [['palm', 0, 0], ['cactus', 3, 1.4], ['sign', -2.6, 1.2]]);
  set(m, -12, -3, [['palm', 0, 0], ['sandmound', 3.2, 1.6], ['cactus', -3, 1.6]]);
  along(m, ['cactus', 'deadbush', 'sandmound', 'palm'], OA, { step: 6, off: 3.6, skip: 0.4 });
  frame(m, ['mesa', 'palm', 'cactus', 'boulder', 'sandmound'], { inset: 1.8, step: 4, depth: 1 });
  m.scatter(['cactus', 'deadbush', 'skeleton', 'sandmound', 'boulder', 'cactus', 'spire', 'bonepile'], 24, [-27, 27, -23, 19]); m.scatter(['crater'], 4, [-26, 26, -20, 18]);
  glow(m, -18, 12, FIRE, 1.2, 7); glow(m, 21, 12, FIRE, 1.1, 7); glow(m, 0, -13, WARM, 0.7, 8); glow(m, -4, 11, '#ff6a28', 0.6, 6); glow(m, 0, 0, WARM, 0.6, 5);
});

// ────────── 03 · CÂNION DAS MESAS ──────────
const CA = [[-32, -1], [-18, 0.6], [0, 0], [16, 1.6], [32, 0]];
def('deserto-canion', 'deserto', 'Deserto 03 — Cânion das Mesas', 'Paredões de arenito e obeliscos antigos fecham um desfiladeiro onde algo antigo ainda acende.', 101, {
  paths: [CA, [[0, 0], [-2, -8], [-9, -14], [-9, -32]], [[0, 0], [3, 9], [0, 17], [-2, 32]]],
  patches: [
    { type: 'rock', x: -17, z: -12, rx: 9, rz: 4.4 }, { type: 'rock', x: 17, z: -12, rx: 9, rz: 4.4 }, { type: 'sand', x: -2, z: 9, rx: 9, rz: 4 }, { type: 'sand', x: 0, z: -19, rx: 8, rz: 3.6 },
    { type: 'scorch', x: 0, z: -6, rx: 5, rz: 2.6 }, { type: 'sand', x: -23, z: 6, rx: 5, rz: 3.4 }, { type: 'sand', x: 23, z: 7, rx: 5, rz: 3.4 },
  ],
}, (m) => {
  // paredões de mesas formando o desfiladeiro
  for (const [x, z] of [[-24, -14], [-17, -17], [9, -16], [16, -17], [24, -14], [-26, 9], [-18, 14], [18, 14], [26, 9]]) m.place('mesa', x, z, { force: true });
  set(m, 3, -19.4, [['obelisk', -4, 0], ['obelisk', 4, 0], ['ritual', 0, 1.6, { force: true }], ['brazier', -2, 1.6], ['brazier', 2, 1.6], ['bonepile', 0, 4.2]]);
  set(m, -10, -4.6, [['pillar', 0, 0], ['pillar', 3.4, 0.6], ['wall', 1.6, -2.2], ['sandmound', -3.2, 1.8]]);
  set(m, 11, -5, [['pillar', 0, 0], ['pillar', -3.4, 0.6], ['wall', -1.6, -2.2], ['sandmound', 3.2, 1.8]]);
  set(m, -3, 9, [['tent', -2.4, 0], ['tent', 2.6, -0.6], ['campfire', 0, 2.2], ['crate', -4.4, 1.6], ['barrel', 4.4, 1.8], ['banner', 0, -3.4]]);
  set(m, -23, 6, [['ironcross', 0, 0], ['ironcross', 3, 1.4], ['skeleton', -2.6, 2.4], ['spire', 3.6, -3]]);
  set(m, 23, 7, [['ironcross', 0, 0], ['ironcross', -3, 1.4], ['skeleton', 2.6, 2.4], ['spire', -3.6, -3]]);
  set(m, 12, 11, [['wreck', 0, 0], ['tires', 3, 1.4], ['cactus', -3.2, 1.6], ['barrel', 2, -2.6]]);
  set(m, -12, 2.6, [['cactus', 0, 0], ['cactus', 2.4, 1.2], ['deadbush', -2.2, 1.4]]);
  along(m, ['cactus', 'deadbush', 'sandmound', 'spire'], CA, { step: 6, off: 3.6, skip: 0.4 });
  frame(m, ['mesa', 'spire', 'boulder', 'sandmound'], { inset: 1.6, step: 4.4, depth: 1 });
  m.scatter(['cactus', 'deadbush', 'skeleton', 'sandmound', 'boulder', 'spire', 'ironcross'], 20, [-27, 27, -23, 19]); m.scatter(['crater'], 4, [-26, 26, -20, 18]);
  glow(m, 3, -18, FIRE, 1.1, 7); glow(m, 3, -19.4, '#ff5a28', 1.3, 9); glow(m, -3, 11, FIRE, 1.1, 7); glow(m, -10, -4, WARM, 0.6, 5); glow(m, 11, -5, WARM, 0.6, 5); glow(m, 0, 0, WARM, 0.6, 5);
});

// ────────── 04 · REFINARIA SECA ──────────
const RE = [[-32, 1], [-16, 0.2], [0, 0], [16, -0.8], [32, 0.6]];
def('deserto-refinaria', 'deserto', 'Deserto 04 — Refinaria Seca', 'Tanques de combustível, dutos e torres de vigia: uma refinaria que ainda queima sozinha.', 111, {
  paths: [RE, [[0, 0], [0.4, -9], [-3, -18], [-3, -32]], [[0, 0], [-2, 9], [1, 18], [0, 32]]],
  patches: [
    { type: 'scorch', x: 0, z: -2, rx: 14, rz: 7 }, { type: 'rock', x: -19, z: -10, rx: 8, rz: 4 }, { type: 'rock', x: 20, z: 12, rx: 8, rz: 4 }, { type: 'sand', x: -20, z: 12, rx: 7, rz: 3.6 }, { type: 'sand', x: 20, z: -11, rx: 7, rz: 3.6 }, { type: 'asphalt', x: 0, z: 14, rx: 7, rz: 3.2 },
  ],
}, (m) => {
  // bateria de tanques
  set(m, -12, -7.4, [['tank', 0, 0], ['tank', 3.6, 0.4], ['tank', 7.2, -0.2], ['barrel', -2.6, 2.4], ['barrel', 2, 3], ['brazier', 5, 3.4]]);
  set(m, 10.6, -8.2, [['tank', 0, 0], ['tank', -3.6, 0.6], ['crate', 3.2, 1.8], ['crate', 4.6, 2.4], ['brazier', 0, 3.6]]);
  m.line('fence', [-14, -3.4], [-3, -3.6], 2.6); m.line('fence', [3.4, -3.4], [15, -3.8], 2.6);
  set(m, -11, 8, [['container', 0, 0], ['container', 4.6, 0.4], ['wreck', -4, 2.2], ['tires', 2, 3.6]]);
  set(m, 11, 8.6, [['watchtower', 0, -2], ['sandbags', -3.2, 1], ['sandbags', 3.4, 1.2], ['barrel', 0, 3]]);
  set(m, 4, -19, [['watchtower', -6.4, 0], ['watchtower', 6.4, 0.2], ['tank', 0, -1.4], ['brazier', -3.4, 2], ['brazier', 3.4, 2.2], ['sign', 0, 3.8]]);
  set(m, -22, 12, [['windpump', 0, 0], ['wreck', 4.4, 1.2], ['sandmound', -3.4, 2.4], ['cactus', 3.6, 3.6]]);
  set(m, 22, -12, [['mesa', 0, -1], ['spire', -4.4, 1.6], ['sandmound', 3.4, 2.6], ['cactus', 4.4, 4.2]]);
  set(m, -24, -13, [['mesa', 0, -1], ['spire', 4.4, 1.6], ['sandmound', -3.4, 2.6]]);
  set(m, 24, 14, [['bus', 0, 0], ['barricade', 4.4, 0.6], ['skeleton', -3, 2.4], ['ironcross', 3, -3]]);
  along(m, ['barrel', 'cactus', 'deadbush', 'tires'], RE, { step: 6.4, off: 3.8, skip: 0.45 });
  frame(m, ['mesa', 'boulder', 'cactus', 'wreck', 'tank', 'sandmound'], { inset: 1.8, step: 4.4, depth: 1 });
  m.scatter(['cactus', 'deadbush', 'skeleton', 'sandmound', 'boulder', 'barrel'], 12, [-27, 27, -23, 19]); m.scatter(['crater'], 4, [-26, 26, -20, 18]);
  for (const [x, z] of [[-8, -4], [14, -6.6], [10.6, -4.4], [-2.4, -19], [10.4, -19], [11, 9.6]]) glow(m, x, z, '#ff6a28', 1.0, 7); glow(m, -9, -5, FIRE, 0.9, 7); glow(m, 0, 0, WARM, 0.6, 5);
});
