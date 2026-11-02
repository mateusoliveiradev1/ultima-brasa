// Arenas — anel fechado em volta da partida (as trilhas abrem as passagens), feitas para a luta contra o chefe.
import { def, set, along, arc, frame, blob, glow } from './lib.mjs';
import { FOOT } from '../src/shared/mapspec.js';
/** Anel contínuo: cada item avança pelo seu próprio raio, então o círculo fecha sem vãos (só as trilhas abrem passagem). */
function ringFill(m, ids, cx, cz, rx, rz) {
  let a = 0, k = 0; const R = (id) => (FOOT[id]?.r ?? 1) + 0.15; let id = ids[k++ % ids.length];
  while (a < Math.PI * 2 - 0.02) {
    const ok = m.place(id, cx + Math.cos(a) * rx, cz + Math.sin(a) * rz), nid = ids[k++ % ids.length], tl = Math.hypot(rx * Math.sin(a), rz * Math.cos(a)) || 1;
    a += (ok ? R(id) + R(nid) : 0.55) / tl; if (ok) id = nid;
  }
}
const X = [[-32, 0.6], [-16, 0], [0, 0], [16, -0.4], [32, 0.4]], Y = [[0, 0], [0.6, -9], [-0.4, -18], [0, -32]], Z = [[0, 0], [-0.6, 9], [0.4, 17], [0, 32]];
const FIRE = '#ff8a3a', G = '#4af0c0', ICE = '#7ad8ff';

def('ruinas-arena', 'ruinas', 'Ruínas 07 — Coliseu de Sucata', 'Uma arena de contêineres e carcaças erguida por saqueadores; braseiros nos portões e estandartes de quem não saiu.', 161, {
  paths: [X, Y, Z], patches: [{ type: 'asphalt', x: 0, z: 0, rx: 16, rz: 10 }, { type: 'scorch', x: 0, z: 0, rx: 8, rz: 5 }, { type: 'rock', x: -22, z: -13, rx: 6, rz: 3.4 }, { type: 'rock', x: 22, z: 13, rx: 6, rz: 3.4 }, { type: 'ash', x: 22, z: -13, rx: 6, rz: 3.4 }, { type: 'ash', x: -22, z: 13, rx: 6, rz: 3.4 }],
}, (m) => {
  ringFill(m, ['container', 'wreck', 'container', 'wall', 'tank'], 0, 0, 15.6, 10, 3.9, { jit: 0.1 });
  for (const [x, z] of [[-14, -2.6], [14, -2.4], [-2.8, -9.6], [2.8, 9.4]]) { m.place('watchtower', x, z); glow(m, x, z + 1.4, '#ffb060', 0.8, 5); }
  for (const [x, z] of [[-12.8, 2.8], [12.8, 2.6], [3, -9.4], [-3, 9.4]]) { m.place('brazier', x, z); glow(m, x, z, FIRE, 1.0, 6); }
  for (const [x, z] of [[-9, -7.4], [9, 7.2], [-9, 7.4], [9, -7.2]]) m.place('banner', x, z);
  m.place('ritual', 0, 0, { force: true }); m.place('crater', 6, 3.4, { force: true });
  set(m, -23, -12, [['bus', 0, 0], ['tires', 4, 1.4], ['barricade', -3, 2.6], ['skeleton', 2, 3.6]]); set(m, 23, 12, [['bus', 0, 0], ['tires', -4, 1.4], ['barricade', 3, 2.6], ['skeleton', -2, 3.6]]);
  set(m, 23, -12, [['house', 0, 0], ['crate', 3.4, 1.6], ['barrel', -3, 1.4], ['sign', 4.4, -1.4]]); set(m, -23, 12, [['house', 0, 0], ['crate', -3.4, 1.6], ['barrel', 3, 1.4], ['sign', -4.4, -1.4]]);
  along(m, ['lamp', 'barrel', 'tires', 'sign'], X, { step: 7, off: 4.8, skip: 0.45, from: 0, to: 0.22 }); along(m, ['lamp', 'barrel', 'tires', 'sign'], X, { step: 7, off: 4.8, skip: 0.45, from: 0.78, to: 1 });
  frame(m, ['wall', 'ruin', 'wreck', 'container', 'boulder', 'deadbush'], { inset: 1.8, step: 4.2 });
  m.scatter(['deadbush', 'skeleton', 'crate', 'tires', 'boulder'], 8, [-27, 27, -23, 19]); m.scatter(['puddle', 'crater'], 4, [-26, 26, -20, 18]);
  glow(m, 0, 0, '#ffb060', 0.9, 8); glow(m, -23, -12, FIRE, 0.7, 6); glow(m, 23, -12, FIRE, 0.7, 6);
}, { arena: { x: 0, z: 0, r: 14 } });

def('pantano-arena', 'pantano', 'Pântano 04 — Clareira da Matriarca', 'Salgueiros e totens fecham uma clareira de musgo; o círculo de runas no centro pulsa em verde.', 171, {
  paths: [X, Y, Z], patches: [{ type: 'moss', x: 0, z: 0, rx: 16, rz: 10 }, { type: 'mud', x: 0, z: 0, rx: 8, rz: 5 }, { type: 'water', x: -22, z: -12, rx: 7, rz: 3.8 }, { type: 'water', x: 22, z: 12, rx: 7, rz: 3.8 }, { type: 'water', x: 22, z: -12, rx: 6, rz: 3.4 }, { type: 'water', x: -22, z: 12, rx: 6, rz: 3.4 }],
}, (m) => {
  ringFill(m, ['willow', 'mangrove', 'willow', 'totem', 'willow'], 0, 0, 15.2, 9.8, 3.6, { jit: 0.4 });
  for (const [x, z] of [[-13.4, 3], [13.4, 2.8], [3, -9.2], [-3, 9.2]]) { m.place('totem', x, z); glow(m, x, z, G, 1.0, 6); }
  arc(m, ['shroom', 'reeds', 'shroom'], 0, 0, 10, 6.2, 0.1, Math.PI * 2 - 0.1, 14, { jit: 0.5 });
  m.place('ritual', 0, 0, { force: true }); m.place('bonepile', 5.6, 3, { force: true }); m.place('bonepile', -5.8, -3.2, { force: true });
  set(m, -22, -12, [['dock', 0, 0.4, { force: true }], ['boat', 3, 1.6, { force: true }], ['mangrove', -4, -2.4], ['reeds', 4.6, -2], ['stilthut', 0, -4.2]]); set(m, 22, 12, [['dock', 0, 0.4, { force: true }], ['boat', -3, 1.6, { force: true }], ['mangrove', 4, -2.4], ['reeds', -4.6, -2], ['stilthut', 0, -4.2]]);
  set(m, 22, -12, [['willow', 0, 0], ['mangrove', -4, 2], ['shroom', 3, 2.6], ['skeleton', -1.4, 3.6]]); set(m, -22, 12, [['willow', 0, 0], ['mangrove', 4, 2], ['shroom', -3, 2.6], ['skeleton', 1.4, 3.6]]);
  along(m, ['reeds', 'shroom', 'reeds', 'deadbush'], X, { step: 6, off: 3.4, skip: 0.4, from: 0, to: 0.22 }); along(m, ['reeds', 'shroom', 'reeds', 'deadbush'], X, { step: 6, off: 3.4, skip: 0.4, from: 0.78, to: 1 });
  frame(m, ['mangrove', 'willow', 'mangrove', 'reeds', 'boulder'], { inset: 1.8, step: 3.5, depth: 2 });
  m.scatter(['reeds', 'shroom', 'skeleton', 'boulder'], 8, [-27, 27, -23, 19]); m.scatter(['puddle', 'crater'], 4, [-26, 26, -20, 18]);
  glow(m, 0, 0, G, 1.5, 9); glow(m, -22, -12, '#5ae870', 0.8, 6); glow(m, 22, 12, '#5ae870', 0.8, 6);
}, { arena: { x: 0, z: 0, r: 14 } });

def('deserto-arena', 'deserto', 'Deserto 05 — Anel de Pedra', 'Mesas, obeliscos e cruzes de ferro desenham um anel perfeito na areia; no centro, o círculo ainda queima.', 181, {
  paths: [X, Y, Z], patches: [{ type: 'sand', x: 0, z: 0, rx: 16, rz: 10 }, { type: 'scorch', x: 0, z: 0, rx: 7, rz: 4.4 }, { type: 'rock', x: -22, z: -12, rx: 7, rz: 3.6 }, { type: 'rock', x: 22, z: 12, rx: 7, rz: 3.6 }, { type: 'sand', x: 22, z: -12, rx: 6, rz: 3.4 }, { type: 'sand', x: -22, z: 12, rx: 6, rz: 3.4 }],
}, (m) => {
  ringFill(m, ['mesa', 'obelisk', 'ironcross', 'pillar', 'mesa', 'ironcross'], 0, 0, 15.6, 10, 3.9, { jit: 0.15 });
  for (const [x, z] of [[-13.4, 3], [13.4, 2.8], [3, -9.2], [-3, 9.2]]) { m.place('brazier', x, z); glow(m, x, z, '#ff6a28', 1.1, 7); }
  arc(m, ['bonepile', 'skeleton', 'sandmound'], 0, 0, 9.2, 5.8, 0.2, Math.PI * 2 - 0.2, 10, { jit: 0.4 });
  m.place('ritual', 0, 0, { force: true }); m.place('ribs', 5.6, 3.2, { force: true });
  set(m, -22, -12, [['wreck', 0, 0], ['tank', 4, 1], ['tires', -3, 2.4], ['cactus', 3, 3.6]]); set(m, 22, 12, [['wreck', 0, 0], ['tank', -4, 1], ['tires', 3, 2.4], ['cactus', -3, 3.6]]);
  set(m, 22, -12, [['palm', 0, 0], ['palm', 3.6, 1.6], ['skeleton', -2.4, 2.4], ['cactus', 1, 3.6]]); set(m, -22, 12, [['palm', 0, 0], ['palm', -3.6, 1.6], ['skeleton', 2.4, 2.4], ['cactus', -1, 3.6]]);
  along(m, ['cactus', 'deadbush', 'sandmound', 'ironcross'], X, { step: 6.4, off: 3.8, skip: 0.4, from: 0, to: 0.22 }); along(m, ['cactus', 'deadbush', 'sandmound', 'ironcross'], X, { step: 6.4, off: 3.8, skip: 0.4, from: 0.78, to: 1 });
  frame(m, ['mesa', 'boulder', 'cactus', 'sandmound', 'spire'], { inset: 1.8, step: 4.2 });
  m.scatter(['cactus', 'deadbush', 'skeleton', 'boulder'], 8, [-27, 27, -23, 19]); m.scatter(['crater'], 3, [-26, 26, -20, 18]);
  glow(m, 0, 0, '#ff6a28', 1.3, 9); glow(m, 0, 0, '#ffb060', 0.7, 6);
}, { arena: { x: 0, z: 0, r: 14 } });

def('tundra-arena', 'tundra', 'Tundra 05 — Anel de Gelo', 'Paredões de gelo e ossos fecham um círculo congelado; as fendas azuis do chão brilham sob o ritual.', 191, {
  paths: [X, Y, Z], patches: [{ type: 'ice', x: 0, z: 0, rx: 16, rz: 10 }, { type: 'snow', x: 0, z: 0, rx: 7, rz: 4.4 }, { type: 'snow', x: -22, z: -12, rx: 7, rz: 3.6 }, { type: 'snow', x: 22, z: 12, rx: 7, rz: 3.6 }, { type: 'rock', x: 22, z: -12, rx: 6, rz: 3.4 }, { type: 'rock', x: -22, z: 12, rx: 6, rz: 3.4 }],
}, (m) => {
  ringFill(m, ['icewall', 'iceshard', 'icewall', 'bonepile', 'icewall', 'iceshard'], 0, 0, 15.6, 10, 3.9, { jit: 0.2 });
  for (const [x, z] of [[-13.4, 3], [13.4, 2.8], [3, -9.2], [-3, 9.2]]) { m.place('brazier', x, z); glow(m, x, z, '#ff9a50', 1.0, 6); }
  arc(m, ['iceshard', 'bonepile', 'snowdrift', 'skeleton'], 0, 0, 9.4, 5.8, 0.2, Math.PI * 2 - 0.2, 10, { jit: 0.4 });
  m.place('ritual', 0, 0, { force: true });
  set(m, -22, -12, [['igloo', 0, 0], ['campfire', 3.6, 2.6], ['snowpine', -4, 1.4], ['crate', -1.4, 3.6]]); set(m, 22, 12, [['igloo', 0, 0], ['campfire', -3.6, 2.6], ['snowpine', 4, 1.4], ['crate', 1.4, 3.6]]);
  set(m, 22, -12, [['wreck', 0, 0], ['snowdrift', 3.6, 1.4], ['snowpine', -4, 1.6], ['skeleton', 1, 3.4]]); set(m, -22, 12, [['wreck', 0, 0], ['snowdrift', -3.6, 1.4], ['snowpine', 4, 1.6], ['skeleton', -1, 3.4]]);
  along(m, ['snowdrift', 'iceshard', 'snowpine', 'bonepile'], X, { step: 6.4, off: 3.8, skip: 0.4, from: 0, to: 0.22 }); along(m, ['snowdrift', 'iceshard', 'snowpine', 'bonepile'], X, { step: 6.4, off: 3.8, skip: 0.4, from: 0.78, to: 1 });
  frame(m, ['snowpine', 'icewall', 'boulder', 'iceshard', 'snowdrift', 'bonepile'], { inset: 1.8, step: 3.8, depth: 2 });
  m.scatter(['snowdrift', 'skeleton', 'boulder', 'iceshard'], 8, [-27, 27, -23, 19]);
  glow(m, 0, 0, ICE, 1.5, 9); glow(m, 0, 0, '#ffb070', 0.6, 6); glow(m, -22, -12, '#ffb070', 0.8, 6); glow(m, 22, 12, '#ffb070', 0.8, 6);
}, { arena: { x: 0, z: 0, r: 14 } });
