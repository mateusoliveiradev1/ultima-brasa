// Dados e balanceamento: habilidades, passivas, inimigos, melhorias permanentes (Oficina).
export const MAX_SKILL = 6;

// Parâmetros de cada habilidade por nível (1..6). dmg é antes dos bônus globais.
export const SKILLS = {
  lamina: { id: 'lamina', name: 'Lâmina de Ferrugem', tag: 'Corte', color: '#ff8a2e', fx: 'lamina',
    desc: (l) => (l === 1 ? 'Golpeia em arco o inimigo mais próximo.' : l === 4 ? 'Golpe duplo: um contra-golpe pelas costas.' : l === 6 ? 'Golpe triplo, arco enorme.' : 'Mais dano, alcance e velocidade.'),
    p: (l) => ({ cd: 1.0 * Math.pow(0.92, l - 1), dmg: 17 * (1 + 0.3 * (l - 1)), arc: 112 + 9 * (l - 1), range: 3.7 + 0.28 * l, hits: l >= 6 ? 3 : l >= 4 ? 2 : 1, scale: 1 + 0.08 * (l - 1) }) },
  brasas: { id: 'brasas', name: 'Brasas Orbitais', tag: 'Orbital', color: '#ffb347', fx: 'brasas',
    desc: (l) => (l === 1 ? 'Brasas giram ao redor de você e queimam quem tocar.' : 'Mais brasas, mais dano, órbita maior.'),
    p: (l) => ({ count: [0, 2, 3, 3, 4, 5, 6][l], radius: 2.6 + 0.16 * l, speed: 190 + 12 * l, dmg: 9 * (1 + 0.32 * (l - 1)), tick: 0.42, hitR: 0.85 + 0.04 * l }) },
  arco: { id: 'arco', name: 'Arco Tóxico', tag: 'Raio', color: '#42e0b4', fx: 'arco',
    desc: (l) => (l === 1 ? 'Descarga tóxica que encadeia entre inimigos.' : 'Mais alvos, mais dano, recarga menor.'),
    p: (l) => ({ cd: 2.1 * Math.pow(0.93, l - 1), dmg: 25 * (1 + 0.3 * (l - 1)), chains: 3 + l, range: 11 }) },
  nova: { id: 'nova', name: 'Nova de Cinzas', tag: 'Área', color: '#ffe2a8', fx: 'nova',
    desc: (l) => (l === 1 ? 'Onda de cinzas ardentes que empurra tudo ao redor.' : 'Raio maior, mais dano e empurrão.'),
    p: (l) => ({ cd: 3.8 * Math.pow(0.93, l - 1), dmg: 34 * (1 + 0.3 * (l - 1)), radius: 4.1 + 0.55 * l, knock: 5 + l }) },
  chuva: { id: 'chuva', name: 'Chuva de Sucata', tag: 'Bombardeio', color: '#ff7a2a', fx: 'chuva',
    desc: (l) => (l === 1 ? 'Sucata em chamas despenca sobre os inimigos.' : 'Mais fragmentos, mais dano.'),
    p: (l) => ({ cd: 5.2 * Math.pow(0.93, l - 1), dmg: 32 * (1 + 0.3 * (l - 1)), count: 4 + Math.floor(l * 1.5), hitR: 1.9 }) },
  lanca: { id: 'lanca', name: 'Lança de Brasa', tag: 'Projétil', color: '#ffd98a', fx: 'lanca',
    desc: (l) => (l === 1 ? 'Lança incandescente que atravessa inimigos.' : l % 2 === 1 ? 'Lanças extras em leque.' : 'Mais dano e perfuração.'),
    p: (l) => ({ cd: 1.7 * Math.pow(0.92, l - 1), dmg: 40 * (1 + 0.3 * (l - 1)), count: 1 + Math.floor((l - 1) / 2), pierce: 3 + l, speed: 16, hitR: 0.95 }) },
};
export const SKILL_IDS = Object.keys(SKILLS);

export const PASSIVES = {
  dmg: { id: 'dmg', name: 'Fúria Ferrosa', max: 8, desc: '+12% de dano em tudo.', ico: '✦' },
  cdr: { id: 'cdr', name: 'Ritmo de Forja', max: 6, desc: '-8% de recarga.', ico: '⟳' },
  spd: { id: 'spd', name: 'Pés Leves', max: 5, desc: '+8% velocidade de movimento.', ico: '»' },
  hp: { id: 'hp', name: 'Casco Reforçado', max: 6, desc: '+25 vida máxima e cura 25.', ico: '♥' },
  regen: { id: 'regen', name: 'Brasa Viva', max: 5, desc: '+0,7 vida por segundo.', ico: '+' },
  magnet: { id: 'magnet', name: 'Ímã de Sucata', max: 5, desc: '+30% alcance de coleta.', ico: '◎' },
  area: { id: 'area', name: 'Onda Expandida', max: 5, desc: '+10% de área e alcance.', ico: '◌' },
  luck: { id: 'luck', name: 'Faro de Catador', max: 4, desc: '+15% de sucata e +5% de crítico.', ico: '☘' },
  armor: { id: 'armor', name: 'Chapa Grossa', max: 5, desc: '-1 de dano recebido por golpe.', ico: '▣' },
  crit: { id: 'crit', name: 'Olho de Brasa', max: 5, desc: '+8% de chance de crítico (x2).', ico: '✺' },
};
export const PASSIVE_IDS = Object.keys(PASSIVES);

export const ENEMIES = {
  ghoul: { id: 'ghoul', sheet: 'ghoul', name: 'Carniçal', hp: 14, speed: 3.5, dmg: 6, r: 0.42, xp: 1, scrap: 0.07, wob: 1 },
  raider: { id: 'raider', sheet: 'raider', name: 'Saqueador', hp: 28, speed: 2.55, dmg: 9, r: 0.5, xp: 2, scrap: 0.1 },
  drone: { id: 'drone', sheet: 'drone', name: 'Drone Sentinela', hp: 20, speed: 3.1, dmg: 8, r: 0.5, xp: 3, scrap: 0.16, fly: true, ranged: true },
  brute: { id: 'brute', sheet: 'brute', name: 'Bruto', hp: 150, speed: 1.75, dmg: 22, r: 0.95, xp: 12, scrap: 0.6, heavy: true },
  boss: { id: 'boss', sheet: 'boss', name: 'O Colosso', hp: 3600, speed: 1.35, dmg: 34, r: 2.1, xp: 150, scrap: 80, heavy: true, boss: true },
};
export const BOSS_TIME = 300; // segundos até o Colosso

// Melhorias permanentes — custo = base * growth^nivel
export const META = {
  vida: { id: 'vida', name: 'Casco', desc: '+12 vida máxima inicial', max: 25, base: 22, grow: 1.42, fmt: (l) => `+${l * 12}` },
  dano: { id: 'dano', name: 'Fúria', desc: '+6% de dano', max: 25, base: 38, grow: 1.5, fmt: (l) => `+${l * 6}%` },
  vel: { id: 'vel', name: 'Pés Leves', desc: '+2,5% de velocidade', max: 12, base: 55, grow: 1.55, fmt: (l) => `+${(l * 2.5).toFixed(1)}%` },
  ima: { id: 'ima', name: 'Ímã', desc: '+8% de alcance de coleta', max: 12, base: 28, grow: 1.5, fmt: (l) => `+${l * 8}%` },
  regen: { id: 'regen', name: 'Brasa Viva', desc: '+0,15 vida/s', max: 12, base: 75, grow: 1.6, fmt: (l) => `+${(l * 0.15).toFixed(2)}/s` },
  recarga: { id: 'recarga', name: 'Ritmo', desc: '-2,5% de recarga', max: 12, base: 110, grow: 1.65, fmt: (l) => `-${(l * 2.5).toFixed(1)}%` },
  sorte: { id: 'sorte', name: 'Faro', desc: '+8% de sucata ganha', max: 18, base: 85, grow: 1.6, fmt: (l) => `+${l * 8}%` },
  chapa: { id: 'chapa', name: 'Chapa', desc: '-0,5 de dano por golpe', max: 10, base: 140, grow: 1.7, fmt: (l) => `-${(l * 0.5).toFixed(1)}` },
  reroll: { id: 'reroll', name: 'Segunda Chance', desc: '+1 troca de cartas por expedição', max: 5, base: 280, grow: 2.3, fmt: (l) => `+${l}` },
  catador: { id: 'catador', name: 'Catadores', desc: 'Drones coletam sucata sozinhos (inclusive offline)', max: 40, base: 90, grow: 1.46, fmt: (l) => `${catadorRate(l).toFixed(2)}/s` },
};
export const META_IDS = Object.keys(META);
export const metaCost = (id, lvl) => Math.floor(META[id].base * Math.pow(META[id].grow, lvl));
export const catadorRate = (l) => (l > 0 ? 0.06 * l * (1 + 0.06 * l) : 0);

// Relíquias: habilidades iniciais desbloqueáveis (compra única)
export const RELICS = { lamina: 0, arco: 160, brasas: 300, nova: 650, lanca: 1100, chuva: 1900 };
export const DEPTH_MULT = (d) => ({ hp: 1 + 0.4 * (d - 1), dmg: 1 + 0.22 * (d - 1), scrap: 1 + 0.35 * (d - 1) });
export const xpNeed = (lvl) => Math.floor(5 + lvl * 6.5 + Math.pow(lvl, 1.65));
