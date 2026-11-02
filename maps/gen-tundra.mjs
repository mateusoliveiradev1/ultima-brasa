// Tundra — gelo, neve, aço congelado e brasas teimosas.
import { def, set, along, arc, loop, frame, blob, glow } from './lib.mjs';
const FIRE = '#ff9a50', ICE = '#7ad8ff';

// ────────── 01 · POSTO CONGELADO ──────────
const PO = [[-32, 0.6], [-16, 0], [0, 0], [16, -0.6], [32, 0.4]];
def('tundra-posto', 'tundra', 'Tundra 01 — Posto Congelado', 'Um posto de estrada soterrado na neve: ônibus, tanques e um braseiro que ninguém apagou.', 121, {
  paths: [PO, [[0, 0], [-1, -9], [-7, -15], [-8, -32]], [[0, 0], [2, 9], [-1, 18], [1, 32]]],
  patches: [
    { type: 'snow', x: -15, z: -9, rx: 9, rz: 4.4 }, { type: 'snow', x: 16, z: 10, rx: 9, rz: 4.4 }, { type: 'ice', x: 18, z: -11, rx: 6, rz: 3.4 }, { type: 'ice', x: -20, z: 12, rx: 6, rz: 3.4 },
    { type: 'asphalt', x: 4, z: -15, rx: 9, rz: 5 }, { type: 'rock', x: -4, z: 9, rx: 6, rz: 3 }, { type: 'snow', x: 0, z: 5, rx: 8, rz: 2.6 },
  ],
}, (m) => {
  // o posto: cobertura de tanques, bomba e loja
  set(m, 4, -15.6, [['tank', -4.6, -1.6], ['tank', -1, -2], ['container', 5, -1.2], ['lamp', -7.4, 1.4], ['lamp', 7.6, 1.4], ['wreck', -4, 3], ['bus', 3.4, 3.8], ['brazier', 0, 1.6], ['sign', 0, -5.2], ['barrel', 8, 2.6]]);
  set(m, -15, -9, [['igloo', 0, 0], ['snowpine', -5.4, 1.6], ['snowpine', 5.4, 2], ['snowdrift', -2.8, 3.2], ['snowdrift', 3, 3.4], ['campfire', 0, 3.6]]);
  set(m, 16, 10, [['container', -1.8, 0], ['container', 2.8, 0.4], ['wreck', -5.6, 2.4], ['snowdrift', 0, 3.4], ['snowpine', 6, -2.4], ['crate', -1, 3], ['barrel', 5.4, 2.6]]);
  set(m, 18, -11, [['iceshard', -3, 0], ['iceshard', 0.6, -1], ['iceshard', 3.2, 0.6], ['icewall', 0, 3.4], ['snowpine', 5.6, 3.2]]);
  set(m, -20, 12, [['iceshard', -2.4, 0], ['iceshard', 1.6, 0.6], ['snowpine', 4.4, -1.6], ['snowpine', -5, 1.4], ['icewall', 0.4, 3.4], ['skeleton', 3.6, 3.4]]);
  set(m, -4, 9.4, [['wreck', 0, 0], ['tires', 3, 0.8], ['barricade', -3.8, 1.6], ['snowdrift', 1, 3.2]]);
  set(m, 25, 5, [['watchtower', 0, 0], ['sandbags', -2.8, 2.2], ['snowpine', 3.4, 2.6]]);
  set(m, -26, 6, [['bus', 0, 0], ['snowdrift', 4, 1.4], ['snowdrift', -3.6, 2], ['skeleton', 2, 3.4]]);
  along(m, ['snowpine', 'snowdrift', 'lamp', 'snowdrift'], PO, { step: 6, off: 3.8, skip: 0.4 });
  frame(m, ['snowpine', 'icewall', 'boulder', 'iceshard', 'snowdrift', 'bonepile', 'icewall'], { inset: 1.8, step: 3.8, depth: 2 });
  m.scatter(['snowdrift', 'snowpine', 'skeleton', 'boulder', 'iceshard', 'bonepile', 'snowdrift'], 14, [-27, 27, -23, 19]); m.scatter(['crater'], 3, [-26, 26, -20, 18]);
  glow(m, 4, -14, FIRE, 1.3, 8); glow(m, -15, -5.4, FIRE, 1.0, 7); glow(m, -3.4, -14.4, '#ffd8a0', 0.7, 6); glow(m, 11.6, -14.4, '#ffd8a0', 0.7, 6); glow(m, 18, -11, ICE, 0.8, 6); glow(m, -20, 12, ICE, 0.8, 6); glow(m, 0, 0, '#cfe8ff', 0.6, 5);
});

// ────────── 02 · LAGO RACHADO ──────────
const LA = [[-32, 0.4], [-16, -0.4], [0, 0], [16, 0.6], [32, -0.2]];
def('tundra-lago', 'tundra', 'Tundra 02 — Lago Rachado', 'O gelo do lago está trincado; pescadores abandonaram barracas e barcos presos na superfície.', 131, {
  paths: [LA, [[0, 0], [0.4, -9], [-0.6, -18], [0, -32]], [[0, 0], [-0.4, 9], [0.6, 18], [0, 32]]],
  patches: [
    { type: 'ice', x: -2, z: -2, rx: 16, rz: 8.4 }, { type: 'ice', x: 9, z: 12, rx: 8, rz: 4.2 }, { type: 'ice', x: -14, z: -16, rx: 7, rz: 3.6 }, { type: 'snow', x: -22, z: 4, rx: 7, rz: 4 }, { type: 'snow', x: 23, z: -6, rx: 7, rz: 4 },
    { type: 'snow', x: 22, z: 14, rx: 6, rz: 3.2 }, { type: 'rock', x: -22, z: -13, rx: 5, rz: 3 },
  ],
}, (m) => {
  // pesca no gelo: barracas, barcos, buracos
  set(m, -9, -8, [['tent', 0, 0], ['tent', 3.4, 0.8], ['campfire', 1.6, 3.2], ['boat', -4.6, 1.6, { force: true }], ['crate', -2.6, 3], ['barrel', 4.6, 3.4]]);
  set(m, 8, 5, [['boat', 0, 0, { force: true }], ['iceshard', 4.6, -1.6], ['iceshard', 6, 1.2], ['crater', -3.6, 1.8, { force: true }], ['crater', -5.4, -1.6, { force: true }]]);
  set(m, 10, -10, [['iceshard', 0, 0], ['iceshard', 2.4, 1], ['iceshard', -2.6, 1.4], ['iceshard', 0.4, 3.2], ['icewall', 5.6, 2.4]]);
  set(m, -16, 6, [['boat', 0, 0, { force: true }], ['snowdrift', 3.4, 1], ['skeleton', -3, 2.4], ['crater', 2, 3, { force: true }]]);
  set(m, 9, 12, [['watchtower', 0, -1.4], ['sandbags', -2.6, 1.6], ['crate', 2.6, 1.8], ['snowpine', 5.6, 1]]);
  set(m, -14, -16, [['icewall', 0, 0], ['icewall', 4.4, 0.8], ['snowpine', -4, 2], ['snowpine', 3, 3.2]]);
  set(m, -22, 4, [['snowpine', 0, 0], ['snowpine', 3.2, 1.4], ['snowpine', -2.8, 2.2], ['snowdrift', 0.6, 3.4], ['igloo', 4.6, -3]]);
  set(m, 23, -6, [['snowpine', 0, 0], ['snowpine', -3.4, 1.6], ['snowdrift', 2.6, 2.6], ['bonepile', -1, 4]]);
  set(m, 22, 14, [['bus', 0, 0], ['snowdrift', -4, 1.4], ['wreck', 4.6, 1.2]]);
  along(m, ['snowdrift', 'snowpine', 'iceshard', 'snowdrift'], LA, { step: 6.4, off: 3.8, skip: 0.45 });
  frame(m, ['snowpine', 'icewall', 'boulder', 'snowdrift', 'iceshard', 'bonepile'], { inset: 1.8, step: 3.8, depth: 2 });
  m.scatter(['snowdrift', 'skeleton', 'boulder', 'iceshard'], 12, [-27, 27, -23, 19]);
  glow(m, -9, -4.8, FIRE, 1.2, 7); glow(m, 8, 5, ICE, 0.9, 7); glow(m, 10, -10, ICE, 1.0, 7); glow(m, -14, -16, ICE, 0.8, 6); glow(m, 9, 12, FIRE, 0.8, 6); glow(m, -2, -2, '#9ad8ff', 0.7, 9); glow(m, 0, 0, '#cfe8ff', 0.6, 5);
});

// ────────── 03 · OSSUÁRIO GELADO ──────────
const OS = [[-32, 0.8], [-16, 0], [0, 0], [16, -1], [32, 0]];
def('tundra-ossuario', 'tundra', 'Tundra 03 — Ossuário Gelado', 'Montes de ossos presos no gelo em torno de um círculo ritual: o lugar para onde tudo veio morrer.', 141, {
  paths: [OS, [[0, 0], [-2, -8], [-11, -13], [-12, -32]], [[0, 0], [-2, 9], [1, 18], [0, 32]]],
  patches: [
    { type: 'ice', x: 5, z: -14, rx: 13, rz: 6.4 }, { type: 'snow', x: -17, z: -7, rx: 8, rz: 4 }, { type: 'snow', x: 18, z: -7, rx: 8, rz: 4 }, { type: 'ice', x: -17, z: 12, rx: 7, rz: 3.6 }, { type: 'snow', x: 17, z: 12, rx: 7, rz: 3.6 }, { type: 'rock', x: 0, z: 9, rx: 6, rz: 3 },
  ],
}, (m) => {
  set(m, 5, -14.4, [['ritual', 0, 0.6, { force: true }], ['icewall', -8.4, -1], ['icewall', 8.6, -0.6], ['icewall', -4, -5.2], ['icewall', 4.4, -5], ['bonepile', -3.6, -1.6], ['bonepile', 3.8, -1.4], ['bonepile', 0, -3.4], ['iceshard', -6, 3.2], ['iceshard', 6.4, 3.2], ['brazier', 0, 3]]);
  set(m, -17, -7, [['bonepile', 0, 0], ['bonepile', 3.4, 1.6], ['skeleton', -3, 2], ['skeleton', 1.4, 3.6], ['snowpine', -5.6, -2.6], ['iceshard', 5, -2.4]]);
  set(m, 18, -7, [['bonepile', 0, 0], ['bonepile', -3.4, 1.6], ['skeleton', 3, 2], ['skeleton', -1.4, 3.6], ['snowpine', 5.6, -2.6], ['iceshard', -5, -2.4]]);
  set(m, -17, 12, [['icewall', 0, -0.4], ['iceshard', 4.4, 1.4], ['iceshard', -3.6, 1.8], ['snowpine', 0.6, 3.6], ['ironcross', -5.6, -1.2]]);
  set(m, 17, 12, [['igloo', 0, 0], ['campfire', 0.8, 3.4], ['snowpine', -5, 0.8], ['snowpine', 5.4, 1.4], ['crate', -3, 3]]);
  set(m, 8, 9.6, [['wreck', 0, 0], ['tires', 3, 0.6], ['skeleton', -3, 1.6], ['snowdrift', 1, 3]]);
  set(m, -26, 6, [['obelisk', 0, 0], ['snowdrift', 3, 1.8], ['snowpine', -3.4, 2.6]]);
  set(m, 26, 6, [['obelisk', 0, 0], ['snowdrift', -3, 1.8], ['snowpine', 3.4, 2.6]]);
  along(m, ['bonepile', 'snowdrift', 'skeleton', 'iceshard'], OS, { step: 6, off: 3.6, skip: 0.4 });
  frame(m, ['icewall', 'snowpine', 'boulder', 'bonepile', 'snowdrift', 'iceshard'], { inset: 1.8, step: 3.8, depth: 2 });
  m.scatter(['snowdrift', 'skeleton', 'boulder', 'iceshard', 'bonepile'], 12, [-27, 27, -23, 19]); m.scatter(['crater'], 3, [-26, 26, -20, 18]);
  glow(m, 5, -14, '#ffb070', 1.0, 7); glow(m, 5, -14.4, ICE, 1.4, 9); glow(m, -17, -7, ICE, 0.8, 6); glow(m, 18, -7, ICE, 0.8, 6); glow(m, 17, 13, FIRE, 1.0, 6); glow(m, -17, 12, ICE, 0.8, 6); glow(m, 0, 0, '#cfe8ff', 0.6, 5);
});

// ────────── 04 · ALDEIA DOS IGLUS ──────────
const AL = [[-32, -0.6], [-16, 0.4], [0, 0], [16, 1], [32, -0.4]];
def('tundra-aldeia', 'tundra', 'Tundra 04 — Aldeia dos Iglus', 'Um povoado de iglus em círculo em torno de uma fogueira comunal; estandartes rasgados e vigias nas encostas.', 151, {
  paths: [AL, [[0, 0], [-1, -9], [1, -18], [0, -32]], [[0, 0], [2, 9], [-1, 18], [1, 32]]],
  patches: [
    { type: 'snow', x: 0, z: 0, rx: 16, rz: 8 }, { type: 'ice', x: -20, z: -12, rx: 6, rz: 3.2 }, { type: 'ice', x: 20, z: 12, rx: 6, rz: 3.2 }, { type: 'rock', x: 20, z: -12, rx: 6, rz: 3.2 }, { type: 'rock', x: -20, z: 12, rx: 6, rz: 3.2 },
  ],
}, (m) => {
  // iglus em círculo, fogueira comunal ao centro
  const n = 8, ig = (i) => { const a = (i / n) * Math.PI * 2 + Math.PI / 8; return [Math.cos(a) * 13, Math.sin(a) * 8.8]; }; for (let i = 0; i < n; i++) { const [x, z] = ig(i); for (const k of [1, 0.92, 1.08, 0.84, 1.16]) if (m.place('igloo', x * k, z * (k > 1 ? 1.05 : k))) break; }
  set(m, 6, -6.4, [['campfire', 0, 0], ['crate', -2.2, 1.4], ['crate', -0.8, 1.8], ['barrel', 2.4, 1.4], ['banner', -4.2, -1], ['banner', 4.4, -1]]);
  set(m, -9, 4.6, [['tent', 0, 0], ['sandbags', 3.4, 1.4], ['barrel', -2.6, 1.8]]);
  set(m, 9, 4.8, [['crate', 0, 0], ['crate', 1.5, 0.4], ['snowdrift', 3.6, 1.2], ['sandbags', -3, 1.6]]);
  set(m, -20, -12, [['watchtower', 0, -1], ['iceshard', 4.4, 1], ['snowpine', -4, 2], ['snowdrift', 1, 3.4]]);
  set(m, 20, 12, [['watchtower', 0, -1], ['iceshard', -4.4, 1], ['snowpine', 4, 2], ['snowdrift', -1, 3.4]]);
  set(m, 20, -12, [['boulder', 0, 0], ['boulder', 3.4, 1.4], ['icewall', -3, 3], ['snowpine', 4.4, -2.6]]);
  set(m, -20, 12, [['boulder', 0, 0], ['boulder', -3.4, 1.4], ['icewall', 3, 3], ['snowpine', -4.4, -2.6]]);
  set(m, 0, 17, [['sign', 0, 0], ['skeleton', 3, 1.4], ['snowdrift', -3, 1.6], ['barricade', 6, 0.4]]);
  along(m, ['snowdrift', 'banner', 'snowdrift', 'iceshard'], AL, { step: 6.4, off: 4.4, skip: 0.45 });
  frame(m, ['snowpine', 'icewall', 'boulder', 'snowdrift', 'iceshard', 'watchtower'], { inset: 1.8, step: 3.8, depth: 2 });
  m.scatter(['snowdrift', 'skeleton', 'boulder', 'iceshard', 'crate'], 12, [-27, 27, -23, 19]);
  glow(m, 6, -6.4, FIRE, 1.5, 9); glow(m, -9, 4.6, FIRE, 0.9, 6); glow(m, -20, -13, '#ffd8a0', 0.7, 6); glow(m, 20, 11, '#ffd8a0', 0.7, 6); for (let i = 0; i < n; i += 2) { const [x, z] = ig(i); glow(m, x, z + 1.2, '#ffb070', 0.5, 4); } glow(m, 0, 0, '#cfe8ff', 0.6, 5);
});
