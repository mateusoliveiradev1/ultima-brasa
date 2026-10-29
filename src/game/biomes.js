// Mapas (biomas): clima, cenário, inimigos e chefe de cada um. Liberados em sequência ao vencer o chefe do anterior.
export const BIOME_ORDER = ['ruinas', 'pantano', 'deserto', 'tundra'];
export const BIOMES = {
  ruinas: {
    id: 'ruinas', name: 'Ruínas Cinzentas', sub: 'O que sobrou da cidade', color: '#ff8a2e', boss: 'colosso', brute: 'brute',
    ambient: '#4d4145', hubAmb: '#5c4e52', fog: '#1a1210', ash: '#d8c8b4', fire: '#ff7a2a', hp: 1, dmg: 1, scrap: 1, ruinP: 0.5,
    props: [['rubble', 0.26], ['tree', 0.13], ['wreck', 0.1], ['pillar', 0.12], ['sign', 0.07], ['barrel', 0.28]],
    pool: [['ghoul', 0, 6], ['raider', 20, 3.2], ['drone', 60, 1.3], ['shaman', 85, 1.1], ['bomber', 130, 1.1]],
    ground: null, tint: null,
  },
  pantano: {
    id: 'pantano', name: 'Pântano Tóxico', sub: 'Névoa verde e água que queima', color: '#42e0b4', boss: 'matriarca', brute: 'toad',
    ambient: '#364a43', hubAmb: '#46594f', fog: '#0c1814', ash: '#a8e8c8', fire: '#42e0b4', hp: 1.18, dmg: 1.12, scrap: 1.3, ruinP: 0.3,
    props: [['tree', 0.24], ['shroom', 0.2], ['pool', 0.17], ['rubble', 0.09], ['wreck', 0.06], ['barrel', 0.12], ['sign', 0.05], ['pillar', 0.07]],
    pool: [['ghoul', 0, 5], ['spitter', 15, 3], ['wisp', 55, 1.8], ['bogshaman', 75, 1.2], ['bomber', 120, 1]],
    ground: { color: '#2f7a58', a: 0.62, puddle: '#1a5a48' }, tint: { color: '#3e8a5a', a: 0.5 },
  },
  deserto: {
    id: 'deserto', name: 'Deserto de Sucata', sub: 'Dunas, ossos e ferro enterrado', color: '#e0a050', boss: 'titan', brute: 'golem',
    ambient: '#5a4636', hubAmb: '#66503e', fog: '#2a180e', ash: '#f0c890', fire: '#ff9a40', hp: 1.34, dmg: 1.22, scrap: 1.65, ruinP: 0.12,
    props: [['spire', 0.22], ['ribs', 0.13], ['wreck', 0.14], ['rubble', 0.14], ['pillar', 0.1], ['sign', 0.08], ['barrel', 0.19]],
    pool: [['crawler', 0, 6], ['sandman', 18, 3], ['scorpion', 35, 2.4], ['bomber', 70, 1.7], ['drone', 100, 1]],
    ground: { color: '#c0803c', a: 0.68, streaks: true }, tint: { color: '#c88a48', a: 0.55 },
  },
  tundra: {
    id: 'tundra', name: 'Tundra Cinzenta', sub: 'Inverno nuclear, silêncio e gelo', color: '#8ac0ff', boss: 'gigante', brute: 'yeti',
    ambient: '#3c4558', hubAmb: '#4a5468', fog: '#0e131c', ash: '#e8f4ff', fire: '#ffb070', hp: 1.55, dmg: 1.35, scrap: 2.1, ruinP: 0.28,
    props: [['crystal', 0.22], ['tree', 0.16], ['wreck', 0.14], ['pillar', 0.1], ['rubble', 0.12], ['spire', 0.1], ['barrel', 0.16]],
    pool: [['frozen', 0, 4], ['wolf', 8, 3.2], ['frost', 18, 3], ['icewisp', 55, 1.8], ['frostshaman', 80, 1.1], ['bomber', 130, 1]],
    ground: { color: '#6a90bc', a: 0.6, snow: true }, tint: { color: '#8fb0d8', a: 0.55 },
  },
};
export const biomeUnlocked = (id, save) => { const i = BIOME_ORDER.indexOf(id); return i <= 0 || (save.biomeWins?.[BIOME_ORDER[i - 1]] || 0) > 0; };
