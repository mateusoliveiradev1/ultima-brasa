// Ruínas — cidade morta: asfalto, ferro, tijolo e fogueiras de saqueadores.
import { def, set, along, arc, loop, frame, blob, glow } from './lib.mjs';

// ────────── 02 · RODOVIA MORTA ──────────
const ROD = [[-32, 3], [-18, 1], [-6, -1], [6, 0.5], [18, 3], [32, 1]];
def('ruinas-rodovia', 'ruinas', 'Ruínas 02 — Rodovia Morta', 'Engarrafamento do fim do mundo sob um viaduto caído; um posto saqueado ao norte.', 21, {
  paths: [ROD, [[-8, -1], [-10, -10], [-7, -19], [-9, -32]], [[12, 1.5], [13, 9], [10, 16], [13, 32]]],
  patches: [
    { type: 'asphalt', x: -25, z: 2.4, rx: 9, rz: 3.8, rot: 0.1 }, { type: 'asphalt', x: -12, z: 0.4, rx: 8, rz: 3.8, rot: -0.1 }, { type: 'asphalt', x: 2, z: -0.2, rx: 8, rz: 3.8 },
    { type: 'asphalt', x: 14, z: 2, rx: 8, rz: 3.8, rot: 0.14 }, { type: 'asphalt', x: 26, z: 2.4, rx: 7, rz: 3.6, rot: 0.06 },
    { type: 'asphalt', x: -9, z: -16, rx: 6, rz: 5, rot: 0.1 }, { type: 'scorch', x: -17, z: -6, rx: 5, rz: 3 }, { type: 'scorch', x: 21, z: 8, rx: 5, rz: 3 },
    { type: 'ash', x: 12, z: 14, rx: 6, rz: 3.4 }, { type: 'rock', x: 22, z: -14, rx: 7, rz: 3.6 }, { type: 'rock', x: -24, z: 12, rx: 6, rz: 3.4 },
  ],
}, (m) => {
  along(m, ['wreck', 'wreck', 'bus', 'tires', 'barrel', 'crate', 'sign', 'wreck'], ROD, { step: 5.4, off: 3.7, skip: 0.18 });
  along(m, ['lamp'], ROD, { step: 9, off: 5.6, skip: 0.2, jit: 0.2 });
  // viaduto caído: pilares dos dois lados da pista
  set(m, -15, -7, [['pillar', -3.8, 0], ['wall', 0, -0.6], ['pillar', 3.8, 0], ['wall', -6.6, -2.4], ['boulder', 6.6, -1.4]]);
  set(m, -15, 8.2, [['pillar', -3.8, 0], ['wall', 0.4, 0.6], ['pillar', 3.8, 0], ['ruin', 7, 1.6], ['boulder', -6.4, 1.2]]);
  // posto de gasolina saqueado
  set(m, -9, -17, [['tank', -3.6, -1.4], ['tank', -3.8, 2.2], ['house', 3.6, -1.6], ['lamp', 0.4, 3.4], ['sign', 6.2, 1.8], ['barrel', 1.2, -4], ['barrel', 2.4, -4.6], ['wreck', 5.8, -4.6], ['brazier', 0.2, 0.2], ['crate', -1.2, 5]]);
  // acampamento ao sul
  set(m, 12, 14, [['tent', -3.2, -0.4], ['tent', 3.2, -1], ['brazier', 0, 0.8], ['crate', -1.4, 3.4], ['crate', -0.2, 3.6], ['sandbags', -5.4, 2.6], ['sandbags', 5.4, 3], ['watchtower', 7.2, -3.8], ['banner', -0.4, -3.8], ['barrel', 3, 3.8]]);
  // placas e semáforos
  set(m, 22, -7, [['billboard', 0, 0], ['trafficlight', 3.6, 1.6], ['lamp', -3.2, 2], ['wreck', -1, 4.4], ['sign', 5.6, -1.4]]);
  set(m, 24, -15, [['ruin', 0, 0], ['ruin', 4.4, 2], ['wall', -3.6, 3.2], ['pillar', 2, -3.6], ['container', 7, -2.4]]);
  set(m, -25, -11, [['container', 0, 0], ['wreck', 4.6, 1.4], ['barrel', -3, 2.4], ['tires', -2.6, -2.8], ['deadbush', 4, -2]]);
  set(m, -26, 12, [['bus', 0, 0], ['barricade', 4.6, 0.6], ['skeleton', -3.2, 2.4], ['tires', 2, 3.6]]);
  frame(m, ['wall', 'ruin', 'wreck', 'container', 'boulder', 'tree', 'deadbush'], { inset: 1.8, step: 4.2 });
  m.scatter(['deadbush', 'skeleton', 'crate', 'tires', 'boulder', 'barrel'], 12, [-27, 27, -23, 19]); m.scatter(['puddle', 'crater'], 6, [-26, 26, -20, 18]);
  glow(m, -9, -17, '#ff8a3a', 1.2, 7); glow(m, 12, 14, '#ff8a3a', 1.3, 7); glow(m, -15, -6, '#ff6a28', 0.7, 6); glow(m, 22, -7, '#ff7a30', 0.6, 6); glow(m, 24, -15, '#ff6a28', 0.6, 6); glow(m, 0, 0, '#ffb060', 0.6, 5);
});

// ────────── 03 · PRAÇA DO MERCADO ──────────
const RING = [[9.8, 0], [7, 6.2], [0, 8.8], [-7, 6.2], [-9.8, 0], [-7, -6.2], [0, -8.8], [7, -6.2], [9.8, 0.2]];
def('ruinas-praca', 'ruinas', 'Ruínas 03 — Praça do Mercado', 'Uma praça circular de saqueadores: barracas, braseiros e prédios caídos em volta.', 31, {
  paths: [[[-32, -1], [-14, 0.4], [0, 0], [14, -0.6], [32, 1]], [[0, 0], [1, -10], [-0.4, -20], [0, -32]], [[0, 0], [-1, 9], [0.6, 18], [0, 32]], RING],
  patches: [{ type: 'asphalt', x: 0, z: 0, rx: 13, rz: 9.4 }, { type: 'asphalt', x: 0, z: 0, rx: 9, rz: 6.4, rot: 0.2 }, { type: 'scorch', x: -17, z: -10, rx: 5, rz: 3 }, { type: 'scorch', x: 17, z: 11, rx: 5, rz: 3 },
    { type: 'ash', x: 20, z: -9, rx: 5, rz: 3 }, { type: 'ash', x: -20, z: 11, rx: 5, rz: 3 }, { type: 'rock', x: 0, z: -22, rx: 8, rz: 3 }, { type: 'rock', x: 2, z: 18, rx: 8, rz: 3 }],
}, (m) => {
  // contorno de prédios
  arc(m, ['house', 'ruin', 'tower', 'ruin', 'house', 'wall'], 0, -0.5, 20.5, 14, 0, Math.PI * 2 - 0.2, 16, { jit: 0.9 });
  // barracas do mercado entre o anel e os prédios
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.31, x = Math.cos(a) * 14.2, z = -0.5 + Math.sin(a) * 9.6; if (m.place('tent', x, z)) { m.place(['crate', 'barrel', 'crate', 'sandbags'][i % 4], x + 1.9, z + 0.7); m.place(i % 3 === 0 ? 'banner' : 'crate', x - 1.8, z - 0.9); } }
  // braseiros iluminando o anel central
  for (const a of [0.8, 2.4, 3.9, 5.5]) { const x = Math.cos(a) * 6.6, z = Math.sin(a) * 4.6; m.place('brazier', x, z); glow(m, x, z, '#ff8a3a', 0.9, 6); }
  // portões
  set(m, 0, -17.5, [['pillar', -4.2, 0], ['pillar', 4.2, 0], ['billboard', -8, -2], ['lamp', 6.4, 1.6], ['sign', -5.8, 2], ['barricade', 8, 1]]);
  set(m, 0, 16.5, [['pillar', -4.2, 0], ['pillar', 4.2, 0], ['ruin', -9, 2], ['wreck', 7.6, 1], ['skeleton', -5.4, 1.6]]);
  set(m, -24, -1, [['watchtower', 0, -5], ['bus', 1.2, 4.6], ['barricade', 4.6, -1.4], ['tires', -3.6, 2.4], ['banner', 3.4, -4.6]]);
  set(m, 24, -1, [['watchtower', 0, 5], ['bus', -1, -4.6], ['barricade', -4.6, 1.4], ['crate', 3.6, -2.4], ['banner', -3.4, 4.6]]);
  frame(m, ['wall', 'ruin', 'house', 'boulder', 'deadbush', 'wreck'], { inset: 1.8, step: 4.4 });
  m.scatter(['deadbush', 'skeleton', 'crate', 'boulder', 'tires'], 12, [-27, 27, -23, 19]); m.scatter(['puddle', 'crater'], 5, [-26, 26, -20, 18]);
  glow(m, 14, -4, '#ff8a3a', 1.2, 7); glow(m, -14, 4, '#ff8a3a', 1.2, 7); glow(m, 0, -17, '#ff7a30', 0.9, 6); glow(m, 0, 16, '#ff6a28', 0.7, 6); glow(m, 0, 0, '#ffb060', 0.6, 5);
});

// ────────── 04 · ACAMPAMENTO DOS SOBREVIVENTES ──────────
def('ruinas-acampamento', 'ruinas', 'Ruínas 04 — Acampamento dos Sobreviventes', 'Paliçada de arame, torres de vigia e fogueiras: o último reduto de gente viva.', 41, {
  paths: [[[-32, 3], [-15, 1.4], [0, 0], [15, -1.4], [32, -3]], [[0, 0], [1.6, -9], [-1, -18], [1, -32]], [[0, 0], [-2.4, 9], [-1, 18], [-2, 32]]],
  patches: [{ type: 'ash', x: 0, z: -0.5, rx: 11, rz: 7 }, { type: 'scorch', x: 15, z: -11, rx: 5, rz: 3 }, { type: 'rock', x: -21, z: -15, rx: 6, rz: 3.5 }, { type: 'ash', x: -17, z: 13, rx: 5, rz: 3 }, { type: 'asphalt', x: 21, z: 13, rx: 7, rz: 3, rot: 0.15 }],
}, (m) => {
  loop(m, 'fence', 0, -0.5, 14.8, 9.8, 2.7); // paliçada (o portão aparece onde a trilha cruza)
  for (const [x, z] of [[-16, -11.5], [16, -11.5], [-16, 10.5], [16, 10.5]]) { m.place('watchtower', x, z); glow(m, x, z + 1, '#ffb060', 0.6, 5); }
  // pátio interno
  for (const [a, k] of [[0.7, 'campfire'], [2.4, 'campfire'], [3.9, 'campfire'], [5.5, 'campfire']]) { const x = Math.cos(a) * 5.2, z = -0.5 + Math.sin(a) * 3.8; m.place(k, x, z); glow(m, x, z, '#ff8a3a', 1.0, 6); }
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + 0.2, x = Math.cos(a) * 10, z = -0.5 + Math.sin(a) * 6.5; if (m.place('tent', x, z)) { m.place(['crate', 'barrel', 'sandbags'][i % 3], x + Math.cos(a) * 1.9, z + Math.sin(a) * 1.5); } }
  set(m, -11.5, 0.2, [['banner', 0, -2.6, {}], ['crate', -1.4, 2.4], ['barrel', 0.2, 2.6]]); set(m, 11.5, -0.4, [['banner', 0, 2.6], ['crate', 1.4, -2.4], ['barrel', -0.2, -2.6]]);
  // lado de fora: barricadas e sinais de ataque
  set(m, 24, 3, [['wreck', 0, 0], ['barricade', 4.2, 1.2], ['tires', -3, 2.6], ['sign', 2.6, -2.6], ['skeleton', 6, -1]]);
  set(m, -24, 4, [['ruin', 0, 0], ['wall', 4, 1.8], ['skeleton', -3, 2.6], ['deadbush', 2.6, -3], ['bonepile', -2, -3.4]]);
  set(m, 4, -19, [['barricade', -3.6, 0], ['sandbags', -1, 1.6], ['sandbags', 4, 1.2], ['brazier', 2, -2.4]]); set(m, -3, 18, [['barricade', 3.6, 0], ['wreck', -4, 1.4], ['skeleton', 0.6, 2.4]]);
  set(m, 20, 15, [['house', 0, 0], ['barrel', 3, 2.2], ['sign', -3, 2.6], ['pillar', 5, -2]]); set(m, -22, -14, [['bus', 0, 0], ['tires', 4, 1], ['crate', -3, 2]]);
  frame(m, ['tree', 'deadbush', 'boulder', 'ruin', 'wreck'], { inset: 1.8, step: 3.8 });
  blob(m, ['tree', 'deadbush', 'boulder'], 20, -16, 6, 4, 7); blob(m, ['tree', 'deadbush', 'skeleton'], -22, 15, 6, 4, 6);
  m.scatter(['deadbush', 'skeleton', 'boulder', 'crate'], 10, [-27, 27, -23, 19]); m.scatter(['puddle', 'crater'], 4, [-26, 26, -20, 18]);
  glow(m, 0, 0, '#ffb060', 0.8, 6); glow(m, 24, 3, '#ff6a28', 0.5, 5);
});

// ────────── 05 · FORTALEZA DE SUCATA ──────────
def('ruinas-fortaleza', 'ruinas', 'Ruínas 05 — Fortaleza de Sucata', 'Contêineres empilhados viram muralha; tanques e torres guardam o pátio do ferro-velho.', 51, {
  paths: [[[-32, 0.6], [-16, 0], [0, 0], [16, -0.4], [32, 0.4]], [[0, 0], [0.4, -9], [-0.6, -18], [0, -32]], [[0, 0], [3, 9], [1, 17], [4, 32]]],
  patches: [{ type: 'asphalt', x: 0, z: -2, rx: 14, rz: 9 }, { type: 'scorch', x: -9, z: -6, rx: 4.5, rz: 2.8 }, { type: 'scorch', x: 10, z: 4, rx: 4.5, rz: 2.8 }, { type: 'rock', x: -22, z: 12, rx: 7, rz: 3.6 }, { type: 'rock', x: 22, z: 14, rx: 7, rz: 3.6 }, { type: 'ash', x: 0, z: 16, rx: 7, rz: 3.4 }],
}, (m) => {
  // muralha de contêineres (aberturas onde a trilha passa)
  m.line('container', [-16, -12], [16, -12], 4.2, { jitter: 0.1 }); m.line('container', [-17, -9], [-17, 8], 4.0, { jitter: 0.1 }); m.line('container', [17, -9], [17, 8], 4.0, { jitter: 0.1 });
  for (const [x, z] of [[-17.5, -13.5], [17.5, -13.5], [-17.5, 10], [17.5, 10]]) { m.place('watchtower', x, z); glow(m, x, z + 1.4, '#ffb060', 0.7, 5); }
  set(m, -9, -6.6, [['tank', 0, 0], ['tank', 3.4, 0.5], ['barrel', -2.6, 2], ['barrel', 6, 2.4], ['brazier', 1.6, 3.4]]);
  set(m, 10.5, -6.4, [['crate', 0, 0], ['crate', 1.5, 0.4], ['crate', 0.8, 1.6], ['sandbags', 4, 1.2], ['banner', -3, 0.4], ['brazier', 2.6, 3.2]]);
  set(m, -10, 5.4, [['wreck', 0, 0], ['tires', 3.4, 0.6], ['barrel', -2.6, 1.4], ['crate', 2, 3]]); set(m, 10, 6.2, [['tent', 0, 0], ['tent', 3.6, 0.8], ['campfire', 1.8, 3], ['sandbags', -3, 1.6]]);
  // frente aberta: barricadas improvisadas
  for (let i = 0; i < 7; i++) { const x = -18 + i * 6 + (i % 2) * 1.2, z = 11 + Math.sin(i * 1.7) * 1.2; m.place(['wreck', 'tires', 'barricade', 'bus', 'sandbags', 'wreck', 'tires'][i], x, z); }
  set(m, 0, -17, [['billboard', -5, -2], ['lamp', 4.6, 1], ['sign', 5.8, -1.2], ['barricade', -7, 1.6], ['skeleton', 3, -3]]);
  set(m, -24, -15, [['ruin', 0, 0], ['wall', 4.2, 1.8], ['pillar', -3, 2.8], ['boulder', 3, -3]]); set(m, 24, -15, [['ruin', 0, 0], ['wall', -4.2, 1.8], ['pillar', 3, 2.8], ['boulder', -3, -3]]);
  frame(m, ['wreck', 'container', 'wall', 'boulder', 'tires', 'tree'], { inset: 1.8, step: 4.4 });
  m.scatter(['deadbush', 'skeleton', 'boulder', 'tires', 'barrel'], 10, [-27, 27, -23, 19]); m.scatter(['puddle', 'crater'], 5, [-26, 26, -20, 18]);
  glow(m, -7.4, -6.4, '#ff8a3a', 1.0, 7); glow(m, 13, -3.2, '#ff8a3a', 1.0, 7); glow(m, 11.8, 9.2, '#ff8a3a', 1.0, 6); glow(m, 0, -17, '#ff7a30', 0.7, 6); glow(m, 0, 0, '#ffb060', 0.6, 5);
});

// ────────── 06 · PÁTIO DE CONTÊINERES ──────────
def('ruinas-patio', 'ruinas', 'Ruínas 06 — Pátio de Contêineres', 'Um porto morto: fileiras de contêineres formam corredores e becos entre guindastes quebrados.', 61, {
  paths: [[[-32, -1], [-14, 0.4], [0, 0], [14, -0.6], [32, 0.6]], [[0, 0], [-1, -9], [1, -18], [0, -32]], [[0, 0], [1.4, 9], [-0.6, 17], [0.6, 32]], [[-18, 0.4], [-19, 9], [-17, 16]], [[18, -0.6], [19, -9], [17, -16]]],
  patches: [{ type: 'asphalt', x: 0, z: -2, rx: 22, rz: 10 }, { type: 'asphalt', x: 0, z: 0, rx: 12, rz: 5, rot: 0.2 }, { type: 'scorch', x: 8, z: -9, rx: 4, rz: 2.6 }, { type: 'ash', x: -9, z: 10, rx: 5, rz: 3 }, { type: 'rock', x: 24, z: 14, rx: 6, rz: 3.4 }, { type: 'rock', x: -24, z: -14, rx: 6, rz: 3.4 }],
}, (m) => {
  // blocos de contêineres em fileiras, com ruas entre eles
  for (const [cx, cz, fl] of [[-9, -10, 0], [9, -10, 1], [-9, 9, 1], [9, 9, 0], [-25, -6, 0], [25, -6, 1], [-25, 10, 1], [25, 10, 0]]) {
    const V = [['wreck', 'crate'], ['tank', 'barrel'], ['container', 'sandbags'], ['watchtower', 'brazier']][(Math.abs(cx * 3 + cz) | 0) % 4];
    set(m, cx, cz, [['container', -2.4, 0], [V[0], 2.4, 0], ['container', -2.4, 3.2], ['container', 2.4, 3.2], ['container', 0, -3.2], [V[1], 5.6, 2], ['crate', -5.6, 3.6], ['barrel', 0.4, 6]], { flip: !!fl });
  }
  for (const [x, z] of [[-14, -4.5], [14, 4.5], [-4, 14.5], [4, -15.5]]) { m.place('tank', x, z); }
  set(m, 0, -18.5, [['watchtower', -6, 0], ['watchtower', 6, 0], ['brazier', -2, 1.4], ['brazier', 2, 1.4], ['sign', 0, -2]]); set(m, 0, 17.5, [['wall', -6, 0], ['wall', 6, 0], ['wreck', -2, 2.6], ['barrel', 3, 2.6], ['skeleton', 0, 1.6]]);
  m.scatter(['crate', 'barrel', 'tires', 'sandbags'], 16, [-26, 26, -22, 18]);
  frame(m, ['container', 'wall', 'wreck', 'tank', 'boulder'], { inset: 1.8, step: 4.6 });
  m.scatter(['deadbush', 'skeleton', 'boulder'], 7, [-27, 27, -23, 19]); m.scatter(['puddle', 'crater'], 5, [-26, 26, -20, 18]);
  for (const [x, z] of [[-9, -6], [9, -6], [-9, 12], [9, 12], [0, -17], [-22, 2], [22, 2]]) glow(m, x, z, '#ff8a3a', 0.9, 6); glow(m, 0, 0, '#ffb060', 0.6, 5);
});
