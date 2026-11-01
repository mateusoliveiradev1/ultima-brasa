// Gera os mapas temáticos em data/maps/*.json. Uso: node maps/gen-all.mjs [nome]
// Cada mapa: centro livre para a partida, 3–5 âncoras (pontos focais) ligadas por trilhas, luzes e detalhes soltos.
import fs from 'node:fs';
import { createMap } from '../src/shared/mapspec.js';

const TINT = {
  ruinas: {},
  pantano: { tint: { color: '#3a8a5c', a: 0.5 }, propTint: { color: '#4d7a5a', a: 0.3 } },
  deserto: { tint: { color: '#c88a48', a: 0.5 }, propTint: { color: '#d0a060', a: 0.26 } },
  tundra: { tint: { color: '#8fb0d8', a: 0.5 }, propTint: { color: '#c0d8f4', a: 0.4 } },
};
const BASE = { bounds: { x: [-30, 30], z: [-26, 22] }, camera: { target: [0, -2], scale: 36 }, spawn: { x: 0, z: 0, r: 3.2 } };
const MAPS = {};
const def = (key, biome, name, blurb, seed, ground, build) => {
  MAPS[key] = () => {
    const m = createMap({ ...BASE, name, seed, ground: { macroSeed: seed + 3, half: 32, paths: [], patches: [], ...ground } });
    build(m); const { backdrop, platforms, ...spec } = m.spec; return { ...spec, biome, blurb, ...TINT[biome] };
  };
};
const ring = (m, cx, cz, rx, rz, ids, n, { a0 = 0, jit = 0.5 } = {}) => { for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI * 2, id = ids[i % ids.length]; m.place(id, cx + Math.cos(a) * rx + (m.rnd() - 0.5) * jit, cz + Math.sin(a) * rz + (m.rnd() - 0.5) * jit); } };

// ───────────── RUÍNAS ─────────────
def('ruinas-rodovia', 'ruinas', 'Ruínas 02 — Rodovia Morta', 'Engarrafamento do fim do mundo ao longo da estrada.', 21, {
  paths: [[[-32, 0.5], [-14, -0.8], [0, 0.2], [14, 1], [32, -0.5]], [[-5, -0.4], [-8, -9], [-6, -18], [-9, -32]], [[9, 0.8], [10, 8], [8, 16], [11, 32]]],
  patches: [{ type: 'asphalt', x: -19, z: -0.6, rx: 13, rz: 2.6, rot: 0.03 }, { type: 'asphalt', x: 19, z: 0.5, rx: 13, rz: 2.6, rot: -0.03 }, { type: 'asphalt', x: 0, z: 0.1, rx: 7, rz: 2.5 },
    { type: 'scorch', x: -17, z: -3, rx: 5, rz: 3 }, { type: 'scorch', x: 17, z: 4, rx: 5, rz: 3 }, { type: 'ash', x: -7, z: -14, rx: 5, rz: 3 }, { type: 'rock', x: 20, z: -16, rx: 6, rz: 3.5 }, { type: 'asphalt', x: 9, z: 13, rx: 6, rz: 3.4, rot: 0.1 }],
}, (m) => {
  m.cluster(-17, -4, ['bus', 'barricade', 'tires', 'barrel', 'sign', 'crate'], { spread: 4.2 }); m.cluster(17, 4.5, ['barricade', 'bus', 'tires', 'crate', 'barrel', 'sign'], { spread: 4.2 });
  m.cluster(-24, 3, ['barricade', 'tires', 'skeleton', 'barrel'], { spread: 3 }); m.cluster(25, -3, ['bus', 'tires', 'barrel', 'sign'], { spread: 3 });
  m.cluster(-6, -14, ['sandbags', 'sandbags', 'tent', 'campfire', 'crate', 'crate', 'sandbags'], { spread: 3.2 }); m.line('fence', [-11, -17], [-1, -17.5], 2.8);
  m.cluster(10, 13, ['house', 'sign', 'barrel', 'barrel', 'barrel', 'lamp', 'crate'], { spread: 3.6 }); m.cluster(-14, 13, ['ruin', 'tree', 'deadbush', 'skeleton'], { spread: 3.4 });
  m.cluster(-18, -15, ['billboard', 'lamp', 'trafficlight', 'barricade'], { spread: 3.2 }); m.cluster(21, -14, ['ruin', 'ruin', 'barrel', 'sign'], { spread: 4 });
  m.line('lamp', [-27, -3.6], [27, -3.8], 7.5, { jitter: 0.6 }); m.line('fence', [-27, 5.6], [-8, 5.9], 3.2); m.line('fence', [8, -5.2], [27, -5.5], 3.2);
  m.scatter(['deadbush', 'skeleton', 'crate', 'tires', 'boulder'], 12, [-28, 28, -22, 18]); m.scatter(['puddle', 'crater'], 5, [-26, 26, -18, 16]);
  m.light(-6, -14, '#ff8a3a', 1.3, 7); m.light(-17, -4, '#ff7a30', 0.8, 6); m.light(17, 4.5, '#ff7a30', 0.8, 6); m.light(10, 13, '#ff7a30', 0.8, 6); m.light(0, 0, '#ffb060', 0.7, 5); m.light(21, -14, '#ff6a28', 0.7, 6);
});

def('ruinas-praca', 'ruinas', 'Ruínas 03 — Praça do Mercado', 'Uma praça cercada de prédios caídos e barracas de saqueadores.', 31, {
  paths: [[[-32, -1], [-14, 0.4], [0, 0], [14, -0.6], [32, 1]], [[0, 0], [1, -10], [-0.4, -20], [0, -32]], [[0, 0], [-1, 9], [0.6, 18], [0, 32]]],
  patches: [{ type: 'asphalt', x: 0, z: 0, rx: 11, rz: 7.5 }, { type: 'scorch', x: -15, z: -10, rx: 5, rz: 3 }, { type: 'scorch', x: 15, z: 11, rx: 5, rz: 3 }, { type: 'ash', x: 19, z: -9, rx: 5, rz: 3 }, { type: 'ash', x: -19, z: 10, rx: 5, rz: 3 }, { type: 'rock', x: 0, z: -22, rx: 8, rz: 3 }],
}, (m) => {
  // prédios formando o contorno da praça
  ring(m, 0, -0.5, 19, 12.5, ['house', 'ruin', 'house', 'ruin', 'tower'], 12, { a0: 0.2, jit: 1.2 });
  m.cluster(-9, -5, ['tent', 'crate', 'crate', 'barrel', 'sandbags'], { spread: 2.6 }); m.cluster(9, -5.5, ['tent', 'tent', 'crate', 'campfire', 'barrel'], { spread: 2.8 });
  m.cluster(-9.5, 6, ['tent', 'crate', 'sandbags', 'sandbags', 'barrel'], { spread: 2.6 }); m.cluster(9.5, 6.5, ['barricade', 'crate', 'tires', 'barrel'], { spread: 2.6 });
  m.cluster(0, -17, ['billboard', 'lamp', 'sign', 'barricade', 'barrel'], { spread: 3.2 }); m.cluster(0, 15, ['ruin', 'tree', 'deadbush', 'skeleton'], { spread: 3.4 });
  m.cluster(-22, -1, ['bus', 'barricade', 'tires'], { spread: 3 }); m.cluster(22, -1, ['bus', 'barricade', 'crate'], { spread: 3 });
  m.place('crater', 0, -0.2, { allowPath: true, force: true }); m.scatter(['deadbush', 'skeleton', 'crate', 'boulder'], 10, [-28, 28, -22, 18]); m.scatter(['puddle', 'crater'], 4, [-24, 24, -18, 16]);
  m.light(9, -5.5, '#ff8a3a', 1.3, 7); m.light(-9, -5, '#ff7a30', 0.8, 6); m.light(0, -17, '#ff7a30', 0.8, 6); m.light(9.5, 6.5, '#ff6a28', 0.7, 6); m.light(0, 0, '#ffb060', 0.7, 5);
});

def('ruinas-acampamento', 'ruinas', 'Ruínas 04 — Acampamento dos Sobreviventes', 'Fogueiras, tendas remendadas e cercas de arame no meio do nada.', 41, {
  paths: [[[-32, 4], [-14, 1.6], [0, 0], [14, -1.4], [32, -5]], [[0, 0], [2, -9], [-1, -18], [1, -32]], [[0, 0], [-3, 10], [-1, 18], [-2, 32]]],
  patches: [{ type: 'ash', x: 0, z: -8, rx: 7, rz: 4 }, { type: 'scorch', x: 14, z: -10, rx: 5, rz: 3 }, { type: 'rock', x: -19, z: -14, rx: 6, rz: 3.5 }, { type: 'ash', x: -15, z: 11, rx: 5, rz: 3 }, { type: 'asphalt', x: 20, z: 12, rx: 7, rz: 3, rot: 0.15 }],
}, (m) => {
  m.cluster(0, -10, ['campfire', 'tent', 'tent', 'tent', 'crate', 'sandbags', 'sandbags', 'barrel'], { spread: 4.4 }); m.cluster(-15, -6, ['tent', 'tent', 'campfire', 'crate', 'barrel', 'sandbags'], { spread: 3.6 });
  m.cluster(15, -9, ['tent', 'crate', 'crate', 'barrel', 'barrel', 'sandbags'], { spread: 3.4 }); m.cluster(-4, 13, ['tent', 'campfire', 'crate', 'barrel'], { spread: 3 });
  // paliçada de arame com abertura nas trilhas
  m.line('fence', [-24, -17], [-4, -19], 2.8); m.line('fence', [4, -19], [24, -16], 2.8); m.line('fence', [-24, 12], [-9, 14], 2.8); m.line('fence', [3, 15], [24, 11], 2.8);
  m.cluster(22, 3, ['barricade', 'bus', 'tires', 'sign'], { spread: 3.4 }); m.cluster(-23, 4, ['ruin', 'tree', 'skeleton', 'deadbush'], { spread: 3.6 }); m.cluster(18, 16, ['house', 'barrel', 'sign'], { spread: 3 });
  m.scatter(['tree', 'deadbush', 'skeleton', 'boulder', 'crate'], 14, [-28, 28, -23, 19]); m.scatter(['puddle', 'crater'], 4, [-24, 24, -18, 16]);
  m.light(0, -10, '#ff8a3a', 1.4, 8); m.light(-15, -6, '#ff8a3a', 1.1, 7); m.light(-4, 13, '#ff8a3a', 1.0, 6); m.light(0, 0, '#ffb060', 0.7, 5); m.light(22, 3, '#ff6a28', 0.6, 6);
});

// ───────────── PÂNTANO ─────────────
def('pantano-brejo', 'pantano', 'Pântano 01 — Brejo da Matriarca', 'Manguezal denso, poças tóxicas e cogumelos que brilham no escuro.', 51, {
  paths: [[[-32, 3], [-15, 1], [0, 0], [13, -2], [32, 0]], [[0, 0], [-3, -9], [1, -17], [-1, -32]], [[0, 0], [4, 9], [2, 18], [5, 32]]],
  patches: [{ type: 'water', x: -14, z: -8, rx: 8, rz: 4.4 }, { type: 'water', x: 15, z: 9, rx: 8.5, rz: 4.6 }, { type: 'water', x: 20, z: -12, rx: 6, rz: 3.4 }, { type: 'water', x: -19, z: 13, rx: 6, rz: 3.4 },
    { type: 'mud', x: 0, z: -4, rx: 8, rz: 3.4 }, { type: 'mud', x: -2, z: 9, rx: 6, rz: 3 }, { type: 'moss', x: -24, z: 0, rx: 6, rz: 4 }, { type: 'moss', x: 23, z: 3, rx: 6, rz: 3.6 }],
}, (m) => {
  m.cluster(-14, -8, ['mangrove', 'reeds', 'reeds', 'boat', 'puddle', 'reeds'], { spread: 4.6 }); m.cluster(15, 9, ['mangrove', 'shroom', 'shroom', 'reeds', 'puddle', 'reeds'], { spread: 4.6 });
  m.cluster(20, -12, ['mangrove', 'mangrove', 'reeds', 'boulder', 'puddle'], { spread: 4 }); m.cluster(-19, 13, ['totem', 'shroom', 'reeds', 'puddle', 'skeleton'], { spread: 3.6 });
  m.cluster(1, -16, ['totem', 'shroom', 'shroom', 'mangrove', 'skeleton', 'puddle'], { spread: 4 });
  ring(m, 0, 0, 19, 13, ['mangrove', 'reeds', 'mangrove', 'boulder', 'reeds'], 14, { jit: 1.6 });
  m.scatter(['reeds', 'shroom', 'deadbush', 'skeleton', 'boulder'], 18, [-28, 28, -23, 19]); m.scatter(['puddle', 'puddle', 'crater'], 7, [-26, 26, -20, 18]);
  m.light(15, 9, '#4af0c0', 1.0, 7); m.light(-19, 13, '#4af0c0', 1.0, 6); m.light(1, -16, '#4af0c0', 1.1, 7); m.light(-14, -8, '#5ae870', 0.7, 6); m.light(20, -12, '#5ae870', 0.6, 5); m.light(0, 0, '#9affc8', 0.5, 5);
});

def('pantano-vila', 'pantano', 'Pântano 02 — Vila Alagada', 'Palafitas, barcos e totens de ossos de um povoado que o brejo engoliu.', 61, {
  paths: [[[-32, -2], [-14, -0.6], [0, 0], [14, 1], [32, 2]], [[0, 0], [-2, -10], [2, -19], [0, -32]], [[0, 0], [3, 10], [-1, 19], [1, 32]]],
  patches: [{ type: 'water', x: -10, z: -11, rx: 9, rz: 4.5 }, { type: 'water', x: 11, z: 11, rx: 9, rz: 4.5 }, { type: 'water', x: 17, z: -9, rx: 6, rz: 3.2 }, { type: 'water', x: -17, z: 10, rx: 6, rz: 3.2 }, { type: 'mud', x: 0, z: 0, rx: 9, rz: 4 }, { type: 'moss', x: -23, z: -4, rx: 6, rz: 3.6 }],
}, (m) => {
  m.cluster(-10, -12, ['stilthut', 'stilthut', 'boat', 'reeds', 'barrel'], { spread: 4.6 }); m.cluster(11, 12, ['stilthut', 'stilthut', 'boat', 'shroom', 'reeds'], { spread: 4.6 });
  m.cluster(17, -9, ['stilthut', 'totem', 'mangrove', 'reeds', 'campfire'], { spread: 3.8 }); m.cluster(-17, 10, ['stilthut', 'totem', 'boat', 'reeds', 'campfire'], { spread: 3.8 });
  m.line('fence', [-26, -2.5], [-8, -3.6], 2.6); m.line('fence', [8, 4.2], [26, 4.8], 2.6);
  m.cluster(0, -20, ['totem', 'totem', 'skeleton', 'shroom', 'mangrove'], { spread: 3.4 }); m.cluster(1, 18, ['mangrove', 'mangrove', 'reeds', 'boat'], { spread: 3.8 });
  m.scatter(['reeds', 'mangrove', 'shroom', 'crate', 'barrel', 'boulder'], 16, [-28, 28, -23, 19]); m.scatter(['puddle', 'puddle'], 6, [-26, 26, -20, 18]);
  m.light(17, -9, '#ff8a3a', 1.2, 7); m.light(-17, 10, '#ff8a3a', 1.2, 7); m.light(-10, -12, '#4af0c0', 0.8, 6); m.light(11, 12, '#4af0c0', 0.8, 6); m.light(0, -20, '#4af0c0', 1.0, 6); m.light(0, 0, '#9affc8', 0.5, 5);
});

// ───────────── DESERTO ─────────────
def('deserto-cemiterio', 'deserto', 'Deserto 01 — Cemitério de Ferro', 'Carcaças de veículos, costelas de criaturas gigantes e cata-ventos quebrados.', 71, {
  paths: [[[-32, -3], [-14, -1], [0, 0], [14, 2], [32, 4]], [[0, 0], [-4, -9], [-1, -18], [-3, -32]], [[0, 0], [5, 9], [3, 17], [6, 32]]],
  patches: [{ type: 'sand', x: -16, z: -9, rx: 8, rz: 4 }, { type: 'sand', x: 16, z: 10, rx: 8, rz: 4 }, { type: 'sand', x: 19, z: -12, rx: 6, rz: 3.4 }, { type: 'sand', x: -19, z: 12, rx: 6, rz: 3.4 },
    { type: 'rock', x: 0, z: -21, rx: 7, rz: 3 }, { type: 'scorch', x: -6, z: 10, rx: 5, rz: 3 }, { type: 'ash', x: 8, z: -9, rx: 5, rz: 3 }],
}, (m) => {
  m.cluster(-16, -9, ['ribs', 'ribs', 'skeleton', 'boulder', 'sandmound'], { spread: 4 }); m.cluster(16, 10, ['bus', 'barricade', 'tires', 'tires', 'barrel', 'crate'], { spread: 4.2 });
  m.cluster(19, -12, ['windpump', 'tires', 'barrel', 'boulder', 'skeleton'], { spread: 3.4 }); m.cluster(-19, 12, ['bus', 'ribs', 'tires', 'cactus', 'skeleton'], { spread: 4 });
  m.cluster(0, -20, ['windpump', 'windpump', 'ribs', 'boulder', 'boulder'], { spread: 4.2 }); m.cluster(-6, 11, ['barricade', 'tires', 'barrel', 'crate'], { spread: 3 });
  ring(m, 0, 0, 20, 13.5, ['boulder', 'cactus', 'boulder', 'spire', 'cactus'], 13, { jit: 1.8 });
  m.scatter(['cactus', 'boulder', 'skeleton', 'deadbush', 'tires', 'spire'], 20, [-28, 28, -23, 19]); m.scatter(['sandmound', 'sandmound', 'crater'], 7, [-26, 26, -20, 18]);
  m.light(16, 10, '#ff8a3a', 0.9, 6); m.light(-16, -9, '#ffb060', 0.7, 6); m.light(0, -20, '#ff7a30', 0.9, 7); m.light(-19, 12, '#ff7a30', 0.7, 6); m.light(0, 0, '#ffc070', 0.6, 5);
});

def('deserto-oasis', 'deserto', 'Deserto 02 — Oásis Seco', 'O que restou de um oásis: árvores mortas, tendas de nômades e dunas.', 81, {
  paths: [[[-32, 2], [-13, 0.6], [0, 0], [13, -1.4], [32, -3]], [[0, 0], [2, -9], [-2, -18], [0, -32]], [[0, 0], [-3, 9], [-1, 17], [-3, 32]]],
  patches: [{ type: 'sand', x: -2, z: -12, rx: 12, rz: 5 }, { type: 'sand', x: 3, z: 13, rx: 12, rz: 5 }, { type: 'mud', x: 0, z: -11, rx: 5, rz: 2.4 }, { type: 'rock', x: -22, z: -12, rx: 6, rz: 3.4 }, { type: 'rock', x: 22, z: 14, rx: 6, rz: 3.4 }, { type: 'ash', x: 15, z: -8, rx: 5, rz: 3 }],
}, (m) => {
  // oásis seco: árvores mortas em volta de uma cratera
  m.place('crater', 0, -11.5, { allowPath: true, force: true, s: 1.7 }); ring(m, 0, -11.5, 6.4, 3.4, ['tree', 'tree', 'deadbush', 'tree', 'skeleton', 'deadbush'], 8, { jit: 0.6 });
  m.cluster(-13, -4, ['tent', 'tent', 'campfire', 'crate', 'sandbags', 'cactus'], { spread: 3.6 }); m.cluster(14, -6, ['tent', 'campfire', 'crate', 'barrel', 'cactus'], { spread: 3.2 });
  m.cluster(-14, 11, ['ribs', 'skeleton', 'boulder', 'cactus', 'sandmound'], { spread: 3.6 }); m.cluster(16, 12, ['windpump', 'tires', 'barrel', 'cactus', 'boulder'], { spread: 3.6 });
  m.cluster(22, 1, ['bus', 'barricade', 'tires', 'cactus'], { spread: 3.2 }); m.cluster(-24, 4, ['spire', 'boulder', 'boulder', 'cactus'], { spread: 3.4 });
  m.line('fence', [-9, -2], [-2, -7.5], 3); m.line('fence', [7, -2], [14, -9], 3);
  m.scatter(['cactus', 'cactus', 'boulder', 'skeleton', 'deadbush', 'spire'], 20, [-28, 28, -23, 19]); m.scatter(['sandmound', 'sandmound', 'crater'], 7, [-26, 26, -20, 18]);
  m.light(-13, -4, '#ff8a3a', 1.2, 7); m.light(14, -6, '#ff8a3a', 1.2, 7); m.light(0, -11.5, '#ffb060', 0.7, 6); m.light(16, 12, '#ff7a30', 0.7, 6); m.light(0, 0, '#ffc070', 0.6, 5);
});

// ───────────── TUNDRA ─────────────
def('tundra-posto', 'tundra', 'Tundra 01 — Posto Congelado', 'Um posto de estrada soterrado na neve, com ônibus e carros congelados.', 91, {
  paths: [[[-32, -2], [-14, 0], [0, 0], [14, -1.4], [32, 1]], [[0, 0], [3, -9], [0, -18], [2, -32]], [[0, 0], [-4, 9], [-2, 17], [-5, 32]]],
  patches: [{ type: 'snow', x: -12, z: -9, rx: 9, rz: 4.4 }, { type: 'snow', x: 13, z: 11, rx: 9, rz: 4.4 }, { type: 'snow', x: 19, z: -11, rx: 7, rz: 3.6 }, { type: 'ice', x: -19, z: 11, rx: 6, rz: 3.4 }, { type: 'asphalt', x: 0, z: -14, rx: 9, rz: 3.2 }, { type: 'rock', x: -22, z: -14, rx: 5, rz: 3 }],
}, (m) => {
  m.cluster(0, -14, ['house', 'sign', 'barrel', 'barrel', 'lamp', 'crate', 'tires'], { spread: 3.8 }); m.cluster(-12, -9, ['bus', 'barricade', 'tires', 'snowdrift', 'snowpine'], { spread: 4 });
  m.cluster(13, 11, ['bus', 'barricade', 'crate', 'snowdrift', 'snowpine'], { spread: 4 }); m.cluster(19, -11, ['tent', 'campfire', 'sandbags', 'crate', 'snowpine'], { spread: 3.2 });
  m.cluster(-19, 11, ['iceshard', 'iceshard', 'boulder', 'snowpine'], { spread: 3.4 }); m.cluster(-24, -2, ['billboard', 'lamp', 'trafficlight'], { spread: 3 });
  ring(m, 0, 0, 20, 13.5, ['snowpine', 'snowpine', 'boulder', 'iceshard', 'snowpine'], 14, { jit: 1.8 });
  m.scatter(['snowpine', 'boulder', 'iceshard', 'skeleton', 'crate', 'tires'], 20, [-28, 28, -23, 19]); m.scatter(['snowdrift', 'snowdrift', 'crater'], 8, [-26, 26, -20, 18]);
  m.light(19, -11, '#ffb070', 1.3, 7); m.light(0, -14, '#ffb070', 0.9, 6); m.light(-19, 11, '#9ad0ff', 0.9, 6); m.light(-12, -9, '#9ad0ff', 0.5, 5); m.light(0, 0, '#cfe4ff', 0.5, 5);
});

def('tundra-lago', 'tundra', 'Tundra 02 — Lago Rachado', 'Um lago congelado cheio de rachaduras, cristais de gelo e pinheiros mortos.', 101, {
  paths: [[[-32, 4], [-15, 2], [0, 0], [14, -2], [32, -4]], [[0, 0], [-3, -9], [1, -18], [-1, -32]], [[0, 0], [3, 9], [1, 18], [3, 32]]],
  patches: [{ type: 'ice', x: -2, z: -4, rx: 14, rz: 6.6 }, { type: 'ice', x: 8, z: 9, rx: 9, rz: 4.2 }, { type: 'snow', x: -20, z: -12, rx: 7, rz: 3.6 }, { type: 'snow', x: 21, z: 12, rx: 7, rz: 3.6 }, { type: 'snow', x: 20, z: -14, rx: 6, rz: 3.2 }, { type: 'rock', x: -22, z: 12, rx: 5, rz: 3 }],
}, (m) => {
  ring(m, -2, -4, 15.5, 7.4, ['iceshard', 'snowpine', 'iceshard', 'boulder'], 11, { jit: 1 }); m.cluster(-20, -12, ['iceshard', 'iceshard', 'snowpine', 'snowdrift'], { spread: 3.6 });
  m.cluster(21, 12, ['tent', 'tent', 'campfire', 'crate', 'sandbags', 'snowpine'], { spread: 3.4 }); m.cluster(20, -14, ['iceshard', 'iceshard', 'boulder', 'snowpine'], { spread: 3.4 });
  m.cluster(-22, 12, ['snowpine', 'snowpine', 'skeleton', 'boulder', 'snowdrift'], { spread: 3.6 }); m.cluster(8, 15, ['bus', 'tires', 'barrel', 'snowdrift'], { spread: 3 });
  m.place('boat', -4, -3.4, { force: true }); m.place('skeleton', 6, -6, { force: true });
  m.scatter(['snowpine', 'boulder', 'iceshard', 'skeleton', 'crate'], 18, [-28, 28, -23, 19]); m.scatter(['snowdrift', 'snowdrift', 'crater'], 8, [-26, 26, -20, 18]);
  m.light(21, 12, '#ffb070', 1.3, 7); m.light(-20, -12, '#9ad0ff', 1.0, 7); m.light(20, -14, '#9ad0ff', 1.0, 7); m.light(-2, -4, '#cfe4ff', 0.7, 8); m.light(0, 0, '#cfe4ff', 0.5, 5);
});

const only = process.argv[2];
fs.mkdirSync('data/maps', { recursive: true });
for (const [key, mk] of Object.entries(MAPS)) {
  if (only && key !== only) continue;
  const spec = mk(), rep = lintLite(spec); fs.writeFileSync(`data/maps/${key}.json`, JSON.stringify(spec, null, 1));
  console.log(key.padEnd(20), spec.props.length + ' props', spec.lights.length + ' luzes', rep);
}
function lintLite(spec) { return ''; }
