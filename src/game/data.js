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
  brute: { id: 'brute', sheet: 'brute', name: 'Bruto', hp: 150, speed: 1.75, dmg: 22, r: 0.95, xp: 12, scrap: 0.6, heavy: true, charger: true },
  bomber: { id: 'bomber', sheet: 'raider', tint: '#e0432a', name: 'Bombista', hp: 16, speed: 4.1, dmg: 34, r: 0.5, xp: 3, scrap: 0.12, bomber: true, scale: 0.95 },
  spitter: { id: 'spitter', sheet: 'ghoul', tint: '#42e0b4', name: 'Cuspidor', hp: 24, speed: 2.3, dmg: 9, r: 0.5, xp: 3, scrap: 0.14, ranged: true, bolt: '#42e0b4', scale: 1.12 },
  wisp: { id: 'wisp', sheet: 'drone', tint: '#7dffcf', name: 'Fogo-fátuo', hp: 17, speed: 3.7, dmg: 8, r: 0.45, xp: 3, scrap: 0.14, fly: true, ranged: true, erratic: true, bolt: '#7dffcf' },
  toad: { id: 'toad', sheet: 'brute', tint: '#4a9a60', name: 'Sapo-Colosso', hp: 170, speed: 1.9, dmg: 24, r: 0.95, xp: 12, scrap: 0.6, heavy: true, charger: true },
  crawler: { id: 'crawler', sheet: 'ghoul', tint: '#e0a050', name: 'Rastejante', hp: 11, speed: 5.1, dmg: 5, r: 0.38, xp: 1, scrap: 0.07, scale: 0.8 },
  sandman: { id: 'sandman', sheet: 'raider', tint: '#e0a050', name: 'Saqueador das Dunas', hp: 34, speed: 2.8, dmg: 11, r: 0.5, xp: 2, scrap: 0.1 },
  golem: { id: 'golem', sheet: 'brute', tint: '#c88040', name: 'Golem de Sucata', hp: 200, speed: 1.7, dmg: 26, r: 1, xp: 13, scrap: 0.65, heavy: true, charger: true, scale: 1.08 },
  frozen: { id: 'frozen', sheet: 'ghoul', tint: '#8ac0ff', name: 'Gélido', hp: 17, speed: 3.4, dmg: 7, r: 0.42, xp: 1, scrap: 0.07, wob: 1, slow: true },
  frost: { id: 'frost', sheet: 'raider', tint: '#8ac0ff', name: 'Soldado do Gelo', hp: 36, speed: 2.5, dmg: 10, r: 0.5, xp: 2, scrap: 0.1, slow: true },
  icewisp: { id: 'icewisp', sheet: 'drone', tint: '#aee0ff', name: 'Espectro de Gelo', hp: 20, speed: 3.2, dmg: 9, r: 0.5, xp: 3, scrap: 0.16, fly: true, ranged: true, bolt: '#aee0ff', slow: true },
  yeti: { id: 'yeti', sheet: 'brute', tint: '#d6ecff', name: 'Yeti', hp: 210, speed: 1.9, dmg: 26, r: 1, xp: 13, scrap: 0.65, heavy: true, charger: true, slow: true },
  colosso: { id: 'colosso', sheet: 'boss', name: 'O Colosso', hp: 3600, speed: 1.35, dmg: 34, r: 2.1, xp: 150, scrap: 80, heavy: true, boss: true, moves: ['slam', 'summon'], summon: 'ghoul' },
  matriarca: { id: 'matriarca', sheet: 'boss', tint: '#42e0b4', name: 'A Matriarca', hp: 3400, speed: 1.25, dmg: 30, r: 2.1, xp: 160, scrap: 90, heavy: true, boss: true, moves: ['pools', 'volley', 'summon'], summon: 'spitter', bolt: '#42e0b4' },
  titan: { id: 'titan', sheet: 'boss', tint: '#e0a050', name: 'Titã das Dunas', hp: 4100, speed: 1.4, dmg: 38, r: 2.2, xp: 170, scrap: 100, heavy: true, boss: true, moves: ['charge', 'slam', 'summon'], summon: 'crawler' },
  gigante: { id: 'gigante', sheet: 'boss', tint: '#9fd0ff', name: 'Gigante de Gelo', hp: 4300, speed: 1.3, dmg: 36, r: 2.2, xp: 180, scrap: 110, heavy: true, boss: true, moves: ['slam', 'volley', 'summon'], summon: 'frozen', bolt: '#aee0ff', slow: true },
};
export const BOSS_TIME = 300; // segundos até o chefe do mapa

// ───────── Árvore da Brasa (permanente) ─────────
// Cada nó: posição (x,y) em unidades de grade, custo = base*grow^nível, pré-requisitos [[id,nível]].
export const BRANCH = {
  def: { name: 'Casco', color: '#e0432a' }, off: { name: 'Fúria', color: '#ff8a2e' }, eco: { name: 'Engenho', color: '#42e0b4' }, hab: { name: 'Forja', color: '#ffc24a' },
};
const N = (id, name, branch, x, y, max, base, grow, req, desc, fmt, ico) => ({ id, name, branch, x, y, max, base, grow, req: req || [], desc, fmt, ico });
export const catadorRate = (l) => (l > 0 ? 0.06 * l * (1 + 0.06 * l) : 0);
export const TREE = [
  N('vida', 'Casco', 'def', 0, 1, 25, 22, 1.42, [], '+12 vida máxima', (l) => `+${l * 12}`, '♥'),
  N('regen', 'Brasa Viva', 'def', -1, 2, 12, 75, 1.6, [['vida', 2]], '+0,15 vida por segundo', (l) => `+${(l * 0.15).toFixed(2)}/s`, '✚'),
  N('chapa', 'Chapa', 'def', 1, 2, 10, 140, 1.7, [['vida', 2]], '-0,5 de dano por golpe recebido', (l) => `-${(l * 0.5).toFixed(1)}`, '▣'),
  N('dash', 'Esquiva', 'def', -1, 3, 8, 220, 1.6, [['regen', 2]], 'Dash recarrega 6% mais rápido', (l) => `-${l * 6}%`, '»'),
  N('espinhos', 'Retaliação', 'def', 1, 3, 10, 260, 1.65, [['chapa', 2]], 'Ao ser ferido, explode em volta e causa dano', (l) => `${l * 9} dano`, '✸'),
  N('revive', 'Segundo Fôlego', 'def', 0, 4, 2, 700, 3.2, [['dash', 2], ['espinhos', 2]], 'Revive uma vez por expedição com 50% de vida', (l) => `${l}x`, '☥'),

  N('dano', 'Fúria', 'off', 0, -1, 25, 38, 1.5, [], '+6% de dano', (l) => `+${l * 6}%`, '✦'),
  N('recarga', 'Ritmo', 'off', -1, -2, 12, 110, 1.65, [['dano', 2]], '-2,5% de recarga das habilidades', (l) => `-${(l * 2.5).toFixed(1)}%`, '⟳'),
  N('crit', 'Olho de Brasa', 'off', 1, -2, 15, 130, 1.55, [['dano', 2]], '+2% de chance de crítico', (l) => `+${l * 2}%`, '✺'),
  N('area', 'Onda Expandida', 'off', 0, -2, 12, 160, 1.6, [['dano', 3]], '+3% de área e alcance', (l) => `+${l * 3}%`, '◌'),
  N('critd', 'Golpe Brutal', 'off', 2, -3, 10, 320, 1.7, [['crit', 4]], '+10% de dano crítico', (l) => `+${l * 10}%`, '✹'),
  N('exec', 'Executor', 'off', 0, -3, 8, 380, 1.75, [['recarga', 3], ['crit', 3]], '+20% de dano em inimigos com menos de 25% de vida', (l) => `+${l * 20}%`, '☠'),

  N('ima', 'Ímã', 'eco', -1, 0, 12, 28, 1.5, [], '+8% de alcance de coleta', (l) => `+${l * 8}%`, '◎'),
  N('sorte', 'Faro', 'eco', -2, 0, 18, 85, 1.6, [['ima', 2]], '+8% de sucata ganha', (l) => `+${l * 8}%`, '☘'),
  N('catador', 'Catadores', 'eco', -3, 0, 40, 90, 1.46, [['sorte', 3]], 'Drones coletam sucata sozinhos, até offline', (l) => `${catadorRate(l).toFixed(2)}/s`, '⚙'),
  N('xpg', 'Aprendizado', 'eco', -2, -1, 15, 120, 1.55, [['ima', 2]], '+6% de experiência', (l) => `+${l * 6}%`, '✎'),
  N('cartas', 'Olhar Aguçado', 'eco', -3, -2, 1, 1500, 2, [['xpg', 5]], '+1 carta nas escolhas de nível', (l) => `+${l}`, '❖'),
  N('vel', 'Pés Leves', 'eco', -1, 1, 12, 55, 1.55, [['ima', 2]], '+2,5% de velocidade de movimento', (l) => `+${(l * 2.5).toFixed(1)}%`, '≫'),
  N('reroll', 'Segunda Chance', 'eco', -2, 1, 5, 280, 2.3, [['sorte', 2]], '+1 troca de cartas por expedição', (l) => `+${l}`, '↻'),
  N('impulso', 'Impulso', 'eco', -4, 0, 3, 800, 2.6, [['catador', 4]], 'Começa a expedição com níveis extras', (l) => `+${l} nv`, '⇧'),

  N('slots', 'Mente de Forja', 'hab', 1, 0, 2, 400, 3, [], '+1 espaço de habilidade por expedição', (l) => `+${l}`, '▤'),
  N('r_arco', 'Relíquia: Arco Tóxico', 'hab', 2, -1, 1, 160, 1, [['slots', 1]], 'Libera o Arco Tóxico como habilidade inicial', () => 'liberado', '〰'),
  N('r_brasas', 'Relíquia: Brasas', 'hab', 2, 0, 1, 300, 1, [['slots', 1]], 'Libera as Brasas Orbitais como habilidade inicial', () => 'liberado', '●'),
  N('r_nova', 'Relíquia: Nova', 'hab', 2, 1, 1, 650, 1, [['slots', 1]], 'Libera a Nova de Cinzas como habilidade inicial', () => 'liberado', '◯'),
  N('r_lanca', 'Relíquia: Lança', 'hab', 3, -0.5, 1, 1100, 1, [['r_arco', 1], ['r_brasas', 1]], 'Libera a Lança de Brasa como habilidade inicial', () => 'liberado', '➤'),
  N('r_chuva', 'Relíquia: Chuva', 'hab', 3, 0.5, 1, 1900, 1, [['r_brasas', 1], ['r_nova', 1]], 'Libera a Chuva de Sucata como habilidade inicial', () => 'liberado', '☄'),
  N('maestria', 'Maestria', 'hab', 4, 0, 3, 2600, 2.6, [['r_lanca', 1], ['r_chuva', 1]], 'A habilidade inicial começa com nível extra', (l) => `+${l} nv`, '★'),
];
export const NODE = Object.fromEntries(TREE.map((n) => [n.id, n]));
export const NODE_IDS = TREE.map((n) => n.id);
export const nodeCost = (id, lvl) => Math.floor(NODE[id].base * Math.pow(NODE[id].grow, lvl));
export const nodeOpen = (id, meta) => NODE[id].req.every(([r, l]) => (meta[r] || 0) >= l);
export const RELIC_NODE = { arco: 'r_arco', brasas: 'r_brasas', nova: 'r_nova', lanca: 'r_lanca', chuva: 'r_chuva' };
export const hasRelic = (id, meta) => id === 'lamina' || (meta[RELIC_NODE[id]] || 0) > 0;

export const DEPTH_MULT = (d) => ({ hp: 1 + 0.4 * (d - 1), dmg: 1 + 0.22 * (d - 1), scrap: 1 + 0.35 * (d - 1) });
export const xpNeed = (lvl) => Math.floor(4 + lvl * 5 + Math.pow(lvl, 1.7));

// Prestígio ("Renascer") e patente da conta
export const cinzasFor = (earned) => Math.floor(Math.sqrt(Math.max(0, earned) / 5000));
export const REBIRTH_MIN = 20000;
export const patenteOf = (lifetime) => Math.floor(Math.sqrt(Math.max(0, lifetime) / 60));
export const patenteNeed = (p) => Math.floor(Math.pow(p, 2) * 60);

// Marcos: metas permanentes com recompensa
export const MILESTONES = [
  { id: 'k100', name: 'Primeiro sangue', desc: 'Abata 100 inimigos', goal: 100, get: (s) => s.kills, reward: 60 },
  { id: 'k1000', name: 'Ceifador', desc: 'Abata 1.000 inimigos', goal: 1000, get: (s) => s.kills, reward: 400 },
  { id: 'k10000', name: 'Praga viva', desc: 'Abata 10.000 inimigos', goal: 10000, get: (s) => s.kills, reward: 4000 },
  { id: 'r10', name: 'Veterano', desc: 'Faça 10 expedições', goal: 10, get: (s) => s.runs, reward: 200 },
  { id: 'r50', name: 'Andarilho', desc: 'Faça 50 expedições', goal: 50, get: (s) => s.runs, reward: 2500 },
  { id: 'w1', name: 'Derrubador', desc: 'Derrote um chefe', goal: 1, get: (s) => s.wins, reward: 500 },
  { id: 'w5', name: 'Caçador de titãs', desc: 'Derrote 5 chefes', goal: 5, get: (s) => s.wins, reward: 3000 },
  { id: 'l15', name: 'Chama alta', desc: 'Chegue ao nível 15', goal: 15, get: (s) => s.best.level, reward: 350 },
  { id: 'l30', name: 'Inferno', desc: 'Chegue ao nível 30', goal: 30, get: (s) => s.best.level, reward: 3500 },
  { id: 't300', name: 'Sobrevivente', desc: 'Resista 5:00', goal: 300, get: (s) => s.best.time, reward: 300 },
  { id: 'c60', name: 'Sequência', desc: 'Alcance combo de 60', goal: 60, get: (s) => s.best.combo || 0, reward: 600 },
  { id: 'e10', name: 'Caça-elites', desc: 'Derrote 10 elites', goal: 10, get: (s) => s.elites || 0, reward: 900 },
  { id: 'life10k', name: 'Tesouro', desc: 'Junte 10.000 de sucata (total)', goal: 10000, get: (s) => s.lifetime, reward: 1000 },
  { id: 'life250k', name: 'Dragão de sucata', desc: 'Junte 250.000 de sucata (total)', goal: 250000, get: (s) => s.lifetime, reward: 20000 },
  { id: 'b2', name: 'Pântano limpo', desc: 'Vença no Pântano Tóxico', goal: 1, get: (s) => s.biomeWins?.pantano || 0, reward: 1200 },
  { id: 'b3', name: 'Rei das dunas', desc: 'Vença no Deserto de Sucata', goal: 1, get: (s) => s.biomeWins?.deserto || 0, reward: 2500 },
  { id: 'b4', name: 'Quebra-gelo', desc: 'Vença na Tundra Cinzenta', goal: 1, get: (s) => s.biomeWins?.tundra || 0, reward: 5000 },
];
