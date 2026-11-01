// Pântano — manguezal, água parada, palafitas e luz de cogumelo.
import { def, set, along, arc, loop, frame, blob, glow } from './lib.mjs';
const G = '#4af0c0', GG = '#5ae870';

// ────────── 01 · BREJO DA MATRIARCA ──────────
const BR = [[-32, 3], [-15, 1.2], [0, 0], [13, -2], [32, 0]];
def('pantano-brejo', 'pantano', 'Pântano 01 — Brejo da Matriarca', 'Um salgueiro colossal reina sobre o brejo; totens de ossos e cogumelos que brilham guardam o caminho até ele.', 51, {
  paths: [BR, [[0, 0], [-3, -9], [-8, -16], [-8, -32]], [[0, 0], [4, 9], [2, 18], [5, 32]]],
  patches: [
    { type: 'water', x: -15, z: -8, rx: 9, rz: 4.6 }, { type: 'water', x: 16, z: 9, rx: 9, rz: 4.8 }, { type: 'water', x: 21, z: -12, rx: 6.5, rz: 3.6 }, { type: 'water', x: -20, z: 13, rx: 6.5, rz: 3.6 },
    { type: 'mud', x: 0, z: -4, rx: 8, rz: 3.4 }, { type: 'mud', x: -2, z: 9, rx: 6, rz: 3 }, { type: 'moss', x: -24, z: 0, rx: 6, rz: 4 }, { type: 'moss', x: 23, z: 3, rx: 6, rz: 3.6 },
    { type: 'moss', x: 3, z: -17, rx: 9, rz: 5 }, { type: 'mud', x: 3, z: -19, rx: 5, rz: 3 },
  ],
}, (m) => {
  // trono da Matriarca: salgueiros em arco, ossos e runas
  set(m, 3, -18, [['willow', 0, -1.6], ['willow', -7, -0.4], ['willow', 7, -0.2], ['willow', -3.8, -3.6], ['willow', 4.2, -3.4], ['bonepile', -3.6, 1.8], ['bonepile', 3.8, 2], ['totem', -5.6, 3.2], ['totem', 5.8, 3.2], ['ritual', 0, 1.6, { force: true }]]);
  arc(m, ['totem', 'shroom', 'shroom', 'skeleton'], 3, -18, 10.6, 6.2, Math.PI * 0.08, Math.PI * 0.92, 7);
  // poças com docas e barcos
  set(m, -15, -8, [['mangrove', -4.4, -2.4], ['mangrove', 3.6, -2.8], ['reeds', 0, 3.2], ['reeds', -2.6, 3.4], ['reeds', 4.6, 2.2], ['boat', 0.4, 0.2, { force: true }], ['puddle', 5.4, 0.4]]);
  set(m, 16, 9, [['mangrove', -4, -3], ['mangrove', 4.4, -2.6], ['shroom', -1.4, -3.4], ['shroom', 0.8, -3.8], ['shroom', 2.2, -3.2], ['reeds', -4.8, 2.8], ['reeds', 3.6, 3.2], ['dock', 0.4, 0.8, { force: true }]]);
  set(m, 21, -12, [['mangrove', 0, -2.4], ['mangrove', -4.4, 0.8], ['reeds', 4, 2], ['boulder', -2, 3], ['puddle', 2.6, 0.2]]);
  set(m, -20, 13, [['totem', 0, -1.4], ['shroom', -2.8, 0.4], ['shroom', 2.6, 0.8], ['reeds', 0, 3.2], ['skeleton', -4.4, 3], ['willow', 5.4, 0.6]]);
  set(m, 11, -3.6, [['watchtower', 0, -2.4], ['crate', 2.2, 0], ['barrel', 3.2, 1.2]]);
  set(m, -24, 7, [['boat', 0, 0, { force: true }], ['reeds', -3, 1.6], ['reeds', 3.4, -1.4], ['mangrove', 0, -3.6], ['skeleton', 2.8, 2.4]]);
  set(m, 24, 4, [['willow', 0, 0], ['mangrove', -4, 2.4], ['reeds', 3.2, 2.2], ['bonepile', -1.6, -3.2]]);
  along(m, ['reeds', 'reeds', 'shroom', 'deadbush'], BR, { step: 5, off: 2.8, skip: 0.35 });
  frame(m, ['mangrove', 'willow', 'mangrove', 'reeds', 'boulder'], { inset: 1.8, step: 3.4, depth: 2 });
  m.scatter(['reeds', 'shroom', 'deadbush', 'skeleton', 'boulder'], 16, [-27, 27, -23, 19]); m.scatter(['puddle', 'puddle', 'crater'], 7, [-26, 26, -20, 18]);
  glow(m, 3, -18, G, 1.3, 8); glow(m, -2, -16, G, 0.8, 6); glow(m, 8, -16, G, 0.8, 6); glow(m, 16, 6.4, G, 1.0, 7); glow(m, -20, 13, G, 1.0, 6); glow(m, -15, -8, GG, 0.7, 6); glow(m, 21, -12, GG, 0.6, 5); glow(m, 0, 0, '#9affc8', 0.5, 5);
});

// ────────── 02 · VILA ALAGADA ──────────
const VI = [[-32, -2], [-14, -0.6], [0, 0], [14, 1], [32, 2]];
def('pantano-vila', 'pantano', 'Pântano 02 — Vila Alagada', 'Palafitas, barcos e totens de ossos de um povoado que o brejo engoliu.', 61, {
  paths: [VI, [[0, 0], [-2, -10], [-9, -15], [-10, -32]], [[0, 0], [3, 10], [8, 17], [9, 32]], [[-14, -0.6], [-16, 8], [-14, 15]], [[14, 1], [17, -7], [15, -14]]],
  patches: [
    { type: 'water', x: -18, z: -9, rx: 8, rz: 4.6 }, { type: 'water', x: 18, z: 10, rx: 8, rz: 4.6 }, { type: 'water', x: 3, z: -16, rx: 8, rz: 3.6 }, { type: 'water', x: -3, z: 15, rx: 6, rz: 3 },
    { type: 'mud', x: -6, z: 4, rx: 6, rz: 3 }, { type: 'mud', x: 8, z: -5, rx: 6, rz: 3 }, { type: 'moss', x: 22, z: -9, rx: 6, rz: 4 }, { type: 'moss', x: -24, z: 8, rx: 5, rz: 3.4 },
  ],
}, (m) => {
  // praça central de palafitas
  set(m, 0, -0.2, [['stilthut', -6.4, -4.6], ['stilthut', 6.4, -4.8], ['stilthut', -7, 4.6], ['stilthut', 6.8, 4.4], ['totem', -3.4, 3.8], ['totem', 3.6, -3.8], ['campfire', -3.6, 5.8], ['barrel', -5.4, 7], ['crate', -2, 7.4]]);
  set(m, -18, -9, [['dock', 0, 0.6, { force: true }], ['boat', -3.4, -1.4, { force: true }], ['boat', 3.6, 1.8, { force: true }], ['reeds', -5.4, 2.6], ['reeds', 5.8, -2.2], ['stilthut', 0, -4.4], ['mangrove', -7, -3]]);
  set(m, 18, 10, [['dock', 0, 0.4, { force: true }], ['boat', 3.2, 1.4, { force: true }], ['stilthut', -1.4, -4.6], ['stilthut', 5.4, -4.2], ['reeds', -5, 2.4], ['mangrove', 7, 3]]);
  set(m, 3, -16, [['dock', 0, 0.2, { force: true }], ['totem', -5.6, 1.6], ['totem', 5.6, 1.6], ['shroom', -2.4, -3.2], ['shroom', 2.6, -3.4], ['willow', 0, -4.6], ['bonepile', 0, 3.4]]);
  set(m, -4, 15.4, [['stilthut', -3.6, -0.6], ['barrel', 1.6, 1.2], ['barrel', 2.8, 1.8], ['boat', 4, -1.4, { force: true }], ['reeds', 0, 3]]);
  set(m, -22, 8, [['willow', 0, 0], ['willow', 4.4, 2.6], ['shroom', -2.6, 2.8], ['skeleton', 2.2, 4.2]]);
  set(m, 23, -9, [['mangrove', 0, 0], ['mangrove', -4.6, 2.2], ['watchtower', 4.2, 1.4], ['reeds', -1.4, 3.8]]);
  set(m, -24, -15, [['willow', 0, 0], ['mangrove', 4.4, 1.6], ['bonepile', -3, 3], ['totem', 3.6, -2.6]]);
  set(m, 24, 15, [['willow', 0, 0], ['mangrove', -4.4, -1.6], ['bonepile', 3, -3], ['shroom', -2.4, 3]]);
  along(m, ['fence', 'reeds', 'barrel', 'reeds'], VI, { step: 6, off: 3.8, skip: 0.45 });
  frame(m, ['mangrove', 'willow', 'mangrove', 'reeds', 'stilthut'], { inset: 1.8, step: 3.6, depth: 2 });
  m.scatter(['reeds', 'shroom', 'barrel', 'skeleton', 'boulder'], 14, [-27, 27, -23, 19]); m.scatter(['puddle', 'puddle', 'crater'], 6, [-26, 26, -20, 18]);
  glow(m, -3.6, 5.8, '#ffb060', 1.2, 7); glow(m, -6.4, -4.6, '#ffc880', 0.7, 5); glow(m, 6.8, 4.4, '#ffc880', 0.7, 5); glow(m, -18, -13, '#ffc880', 0.7, 5); glow(m, 3, -16, G, 1.1, 7); glow(m, -22, 8, G, 0.8, 6); glow(m, 18, 6, G, 0.9, 6); glow(m, 0, 0, '#9affc8', 0.4, 5);
});

// ────────── 03 · SANTUÁRIO AFOGADO ──────────
const SA = [[-32, 0], [-16, -1], [0, 0], [16, 1.4], [32, 0]];
def('pantano-santuario', 'pantano', 'Pântano 03 — Santuário Afogado', 'Um templo de runas meio submerso; círculos rituais acendem em verde entre obeliscos e salgueiros.', 71, {
  paths: [SA, [[0, 0], [1, -10], [-1, -19], [0, -32]], [[0, 0], [-2, 9], [1, 18], [0, 32]]],
  patches: [
    { type: 'water', x: -12, z: -9, rx: 8, rz: 4.4 }, { type: 'water', x: 12, z: -9, rx: 8, rz: 4.4 }, { type: 'water', x: 0, z: -4, rx: 4, rz: 2 }, { type: 'water', x: -14, z: 11, rx: 8, rz: 4 }, { type: 'water', x: 15, z: 11, rx: 8, rz: 4 },
    { type: 'moss', x: 0, z: -15, rx: 11, rz: 5 }, { type: 'moss', x: -23, z: -2, rx: 5, rz: 4 }, { type: 'moss', x: 23, z: 2, rx: 5, rz: 4 }, { type: 'mud', x: 0, z: 10, rx: 7, rz: 3 },
  ],
}, (m) => {
  // templo: colunas e muros em U ao redor de um altar ritual
  set(m, 0, -15, [['ritual', 0, 0.4, { force: true }], ['pillar', -6, -3], ['pillar', 6, -3], ['pillar', -6, 3.2], ['pillar', 6, 3.2], ['wall', -9.6, 0], ['wall', 9.6, 0], ['wall', -3.4, -6.2], ['wall', 3.4, -6.2], ['bonepile', 0, -3.4], ['brazier', -2.6, 0.6], ['brazier', 2.6, 0.6]]);
  set(m, -12, -9, [['willow', -5, -2], ['mangrove', 4.6, -2.4], ['reeds', 0, 2.8], ['reeds', -3.6, 2.4], ['pillar', 0.2, -0.4], ['shroom', 3.6, 2.4]]);
  set(m, 12, -9, [['willow', 5, -2], ['mangrove', -4.6, -2.4], ['reeds', 0, 2.8], ['reeds', 3.6, 2.4], ['pillar', -0.2, -0.4], ['shroom', -3.6, 2.4]]);
  set(m, -14, 11, [['dock', 0, 0, { force: true }], ['totem', -4.6, -2.6], ['totem', 4.8, -2.4], ['reeds', -5, 2.4], ['mangrove', 5.8, 2.6], ['boat', 1.8, 2.6, { force: true }]]);
  set(m, 15, 11, [['dock', 0, 0, { force: true }], ['totem', -4.8, -2.6], ['totem', 4.6, -2.4], ['reeds', 5, 2.4], ['mangrove', -5.8, 2.6], ['skeleton', -1.8, 2.8]]);
  set(m, -24, -12, [['obelisk', 0, 0], ['ritual', 0, 3, { force: true }], ['shroom', -3, 3.4], ['willow', 4.6, -1]]);
  set(m, 24, -12, [['obelisk', 0, 0], ['ritual', 0, 3, { force: true }], ['shroom', 3, 3.4], ['willow', -4.6, -1]]);
  set(m, -25, 4, [['obelisk', 0, 0], ['mangrove', 3.6, 2.2], ['reeds', -2.4, 3.2], ['bonepile', 2, -3.2]]);
  set(m, 25, 5, [['obelisk', 0, 0], ['mangrove', -3.6, 2.2], ['reeds', 2.4, 3.2], ['bonepile', -2, -3.2]]);
  along(m, ['totem', 'shroom', 'reeds', 'shroom'], SA, { step: 6.5, off: 3.2, skip: 0.3 });
  frame(m, ['mangrove', 'willow', 'wall', 'reeds', 'boulder'], { inset: 1.8, step: 3.5, depth: 2 });
  m.scatter(['reeds', 'shroom', 'bonepile', 'skeleton', 'boulder'], 12, [-27, 27, -23, 19]); m.scatter(['puddle', 'crater'], 6, [-26, 26, -20, 18]);
  glow(m, 0, -15, '#ffb060', 0.9, 7); glow(m, 0, -15, G, 1.4, 9); glow(m, -24, -9, G, 1.0, 6); glow(m, 24, -9, G, 1.0, 6); glow(m, -14, 8, G, 0.9, 6); glow(m, 15, 8, G, 0.9, 6); glow(m, -25, 4, GG, 0.7, 5); glow(m, 25, 5, GG, 0.7, 5); glow(m, 0, 0, '#9affc8', 0.5, 5);
});
