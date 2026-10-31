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
// ── cartas expandidas ──
// rar: comum | rara | maldita | evo.  fx: efeito por nível (mesmas chaves da árvore).  pick: efeito imediato.  minLv: nível de personagem mínimo para aparecer.
const C = (id, name, ico, max, desc, fx, o = {}) => (PASSIVES[id] = { id, name, ico, max, desc, fx, rar: 'comum', ...o });
C('vamp', 'Sede Rubra', '☩', 4, '+1,5% do dano causado vira vida.', { leech: 0.015 });
C('killheal', 'Fôlego de Guerra', '❦', 4, 'Recupera 0,3 de vida a cada abate.', { killHeal: 0.3 });
C('dashcd', 'Pés de Brasa', '≫', 3, 'Dash recarrega 12% mais rápido.', { dashCdP: 0.12 });
C('thornp', 'Espinhos Vivos', '✸', 4, '+10 de dano de retaliação por nível (ativa a retaliação).', { thornsFlat: 10 });
C('mind', 'Mente Afiada', '✎', 4, '+10% de experiência.', { xpP: 0.1 });
C('hunter', 'Caçador', '♞', 4, '+10% de dano em elites e chefes.', { eliteDmg: 0.1 });
C('close', 'Corpo a Corpo', '⚔', 4, '+12% de dano em inimigos próximos.', { nearDmg: 0.12 });
C('sniper', 'Atirador', '⌖', 4, '+12% de dano em inimigos distantes.', { farDmg: 0.12 });
C('coup', 'Golpe de Misericórdia', '☠', 3, '+15% de dano em inimigos quase mortos.', { execP: 0.15 });
C('savage', 'Golpe Selvagem', '✹', 4, '+25% de dano crítico.', { critMulP: 0.25 });
C('scrapshield', 'Escudo de Sucata', '◈', 3, 'Ganha um escudo de 20 que absorve dano.', {}, { pick: { shield: 20 } });
C('cat', 'Reflexo Felino', '◐', 4, '+4% de chance de esquivar de um golpe.', { dodge: 0.04 });
C('coin', 'Moeda Dupla', '◇', 4, '+6% de chance de a sucata valer o dobro.', { lootDouble: 0.06 });
C('blastp', 'Brasa Final', '✺', 4, '+5% de chance de inimigos explodirem ao morrer.', { killBlast: 0.05 });
C('lvheal', 'Renovação', '✿', 3, 'Cura 6% da vida ao subir de nível.', { lvlHeal: 0.06 });
C('ironhide', 'Pele de Ferro', '◍', 4, '+6% de vida máxima.', { hpPct: 0.06 });
C('combo', 'Cadeia de Golpes', '♪', 4, '+2% de dano a cada 10 de combo.', { comboDmg: 0.02 });
C('heartc', 'Coração Sortudo', '♡', 3, 'Corações caem mais e curam mais.', { heartChance: 0.005, heartBonus: 0.25 });
// raras
C('secondheart', 'Segundo Coração', '☥', 1, 'Revive mais uma vez com 50% de vida.', {}, { rar: 'rara', minLv: 5, pick: { revive: 1 } });
C('rain', 'Chuva de Brasas', '☄', 2, '+12% de chance de explosão ao morrer; explosões maiores.', { killBlast: 0.12, blastX: 1 }, { rar: 'rara', minLv: 5 });
C('resso', 'Ressonância', '◎', 2, '+15% de área e -8% de recarga.', { areaP: 0.15, cdrFlat: 0.08 }, { rar: 'rara', minLv: 4 });
C('thirst', 'Sede Sem Fim', '☄', 2, 'Cada abate acumula dano (até 50 acúmulos).', { frenzy: 0.002, frenzyCap: 1 }, { rar: 'rara', minLv: 6 });
C('gambler', 'Sorte Grande', '☘', 2, '+30% de sucata e +10% de chance de dobrar.', { luckP: 0.3, lootDouble: 0.1 }, { rar: 'rara', minLv: 4 });
C('dance', 'Dança das Cinzas', '✵', 1, 'O dash explode em chamas.', { dashBlast: 1 }, { rar: 'rara', minLv: 5 });
// malditas: poder com preço
C('pact', 'Pacto de Sangue', '☩', 2, '+40% de dano, mas -25% de vida máxima.', { dmgP: 0.4, hpPct: -0.25 }, { rar: 'maldita', minLv: 6 });
C('glass', 'Vidro e Fúria', '❖', 2, '+60% de dano crítico, mas -2 de armadura.', { critMulP: 0.6, armorFlat: -2 }, { rar: 'maldita', minLv: 6 });
C('blind', 'Maré Cega', '≈', 1, '+50% de sucata, mas -20% de velocidade.', { luckP: 0.5, speedP: -0.2 }, { rar: 'maldita', minLv: 6 });
C('hunger', 'Fome Eterna', '☢', 1, 'Inimigos têm +25% de vida, mas você ganha +50% de experiência.', { xpP: 0.5 }, { rar: 'maldita', minLv: 6, pick: { foeHp: 1.25 } });
C('overclock', 'Sobrecarga', '⚡', 2, '-15% de recarga em tudo, mas recebe +15% de dano.', { cdrFlat: 0.15, dmgTaken: 0.15 }, { rar: 'maldita', minLv: 6 });
C('ashpact', 'Pacto de Cinzas', '☗', 1, '+30% de experiência e +25% de dano de habilidades, mas recebe +25% de dano.', { xpP: 0.3, sAll: 0.25, dmgTaken: 0.25 }, { rar: 'maldita', minLv: 8 });
export const PASSIVE_IDS = Object.keys(PASSIVES);
// evoluções: uma habilidade no nível 5+ junto de uma passiva vira outra coisa
export const EVOS = {
  lamina: { name: 'Lâmina Calcinada', need: 'dmg', ico: '⚔', desc: 'Golpe extra e +70% de dano. Corte incandescente.' },
  brasas: { name: 'Coroa de Brasas', need: 'area', ico: '●', desc: '+3 brasas, órbita maior e +70% de dano.' },
  arco: { name: 'Tempestade Tóxica', need: 'crit', ico: '〰', desc: '+4 encadeamentos e +70% de dano.' },
  nova: { name: 'Supernova de Cinzas', need: 'cdr', ico: '◯', desc: 'Raio +25%, +70% de dano e recarga menor.' },
  chuva: { name: 'Chuva Apocalíptica', need: 'luck', ico: '☄', desc: '+6 fragmentos e +70% de dano.' },
  lanca: { name: 'Lança Solar', need: 'spd', ico: '➤', desc: '+2 lanças perfurantes e +70% de dano.' },
};
export const RARITY = { comum: { c: '#ffb347', n: 'PASSIVA' }, rara: { c: '#6fb8ff', n: 'RARA' }, maldita: { c: '#d94bff', n: 'MALDITA' }, evo: { c: '#ff5a2a', n: 'EVOLUÇÃO' } };


export const ENEMIES = {
  ghoul: { id: 'ghoul', sheet: 'ghoul', name: 'Carniçal', hp: 14, speed: 3.5, dmg: 6, r: 0.42, xp: 1, scrap: 0.07, wob: 1 },
  raider: { id: 'raider', sheet: 'raider', name: 'Saqueador', hp: 28, speed: 2.55, dmg: 9, r: 0.5, xp: 2, scrap: 0.1, lunge: true },
  drone: { id: 'drone', sheet: 'drone', name: 'Drone Sentinela', hp: 20, speed: 3.1, dmg: 8, r: 0.5, xp: 3, scrap: 0.16, fly: true, ranged: true },
  brute: { id: 'brute', sheet: 'brute', name: 'Bruto', hp: 150, speed: 1.75, dmg: 22, r: 0.95, xp: 12, scrap: 0.6, heavy: true, charger: true },
  bomber: { id: 'bomber', sheet: 'raider', tint: '#e0432a', name: 'Bombista', hp: 16, speed: 4.1, dmg: 34, r: 0.5, xp: 3, scrap: 0.12, bomber: true, scale: 0.95 },
  spitter: { id: 'spitter', sheet: 'ghoul', tint: '#42e0b4', name: 'Cuspidor', hp: 24, speed: 2.3, dmg: 9, r: 0.5, xp: 3, scrap: 0.14, ranged: true, bolt: '#42e0b4', scale: 1.12 },
  wisp: { id: 'wisp', sheet: 'drone', tint: '#7dffcf', name: 'Fogo-fátuo', hp: 17, speed: 3.7, dmg: 8, r: 0.45, xp: 3, scrap: 0.14, fly: true, ranged: true, erratic: true, bolt: '#7dffcf' },
  toad: { id: 'toad', sheet: 'brute', tint: '#4a9a60', name: 'Sapo-Colosso', hp: 170, speed: 1.9, dmg: 24, r: 0.95, xp: 12, scrap: 0.6, heavy: true, charger: true },
  crawler: { id: 'crawler', sheet: 'hound', name: 'Cão de Sucata', hp: 12, speed: 5.0, dmg: 6, r: 0.4, xp: 1, scrap: 0.07, lunge: true },
  wolf: { id: 'wolf', sheet: 'hound', tint: '#8ac0ff', name: 'Lobo de Gelo', hp: 26, speed: 4.5, dmg: 8, r: 0.45, xp: 2, scrap: 0.1, lunge: true, slow: true, scale: 1.1 },
  scorpion: { id: 'scorpion', sheet: 'scorpion', name: 'Escorpião de Sucata', hp: 46, speed: 3.0, dmg: 12, r: 0.6, xp: 4, scrap: 0.2, ranged: true, fan: true, bolt: '#ffb347' },
  shaman: { id: 'shaman', sheet: 'shaman', name: 'Xamã das Cinzas', hp: 40, speed: 2.4, dmg: 6, r: 0.5, xp: 5, scrap: 0.25, support: true },
  bogshaman: { id: 'bogshaman', sheet: 'shaman', tint: '#42e0b4', name: 'Xamã do Brejo', hp: 44, speed: 2.4, dmg: 6, r: 0.5, xp: 5, scrap: 0.25, support: true },
  frostshaman: { id: 'frostshaman', sheet: 'shaman', tint: '#8ac0ff', name: 'Xamã do Gelo', hp: 46, speed: 2.4, dmg: 6, r: 0.5, xp: 5, scrap: 0.25, support: true, slow: true },
  sandman: { id: 'sandman', sheet: 'raider', tint: '#e0a050', name: 'Saqueador das Dunas', hp: 34, speed: 2.8, dmg: 11, r: 0.5, xp: 2, scrap: 0.1, lunge: true },
  golem: { id: 'golem', sheet: 'brute', tint: '#c88040', name: 'Golem de Sucata', hp: 200, speed: 1.7, dmg: 26, r: 1, xp: 13, scrap: 0.65, heavy: true, charger: true, scale: 1.08 },
  frozen: { id: 'frozen', sheet: 'ghoul', tint: '#8ac0ff', name: 'Gélido', hp: 17, speed: 3.4, dmg: 7, r: 0.42, xp: 1, scrap: 0.07, wob: 1, slow: true },
  frost: { id: 'frost', sheet: 'raider', tint: '#8ac0ff', name: 'Soldado do Gelo', hp: 36, speed: 2.5, dmg: 10, r: 0.5, xp: 2, scrap: 0.1, slow: true, lunge: true },
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
const N = (id, name, branch, x, y, max, base, grow, req, desc, fmt, ico, fx) => ({ id, name, branch, x, y, max, base, grow, req: req || [], desc, fmt, ico, fx: fx || {}, tier: 0 });
export const catadorRate = (l) => (l > 0 ? 0.06 * l * (1 + 0.06 * l) : 0);
// posição local (profundidade d para fora, lateral l) → grade; cada ramo irradia numa direção
const OFS = 1.6; // cada ramo começa afastado do centro para não invadir o vizinho
const POS = { off: (d, l) => [l, -(d + OFS)], def: (d, l) => [l, d + OFS], eco: (d, l) => [-(d + OFS), l], hab: (d, l) => [d + OFS, l] };
const mk = (b, d, l, id, name, ico, max, req, desc, fmt, fx, o = {}) => { const [x, y] = POS[b](d, l), n = N(id, name, b, x, y, max, o.base ?? Math.round(28 * Math.pow(1.8, d - 1) * (o.k || 1)), o.grow ?? (1.46 + 0.02 * d), req, desc, fmt, ico, fx); n.tier = d; if (o.key) n.key = true; return n; };
// nó de atributo: +per por nível em `stat`
const S = (b, d, l, id, name, ico, max, req, stat, per, unit, desc, o) => mk(b, d, l, id, name, ico, max, req, desc, (lv) => `${per < 0 ? '-' : '+'}${+Math.abs(lv * per).toFixed(2)}${unit}`, { [stat]: Math.abs(per) }, o);
// pedra-angular: nível único, efeito marcante
const K = (b, d, l, id, name, ico, req, desc, fx, o = {}) => mk(b, d, l, id, name, ico, 1, req, desc, () => 'ativa', fx, { base: Math.round(28 * Math.pow(1.8, d - 1) * 5), grow: 1, key: true, ...o });
const sk = (b, lane, d0, sid, nm, parent, ico, nDesc, nUnit, nMax = 4) => [
  S(b, d0, lane, `${sid}_a`, `${nm}: Afiado`, ico, 8, [[parent, 1]], `s_${sid}_dmg`, 0.06, '% dano', `+6% de dano de ${nm}`),
  S(b, d0 + 1, lane, `${sid}_b`, `${nm}: Cadência`, ico, 6, [[`${sid}_a`, 3]], `s_${sid}_cd`, 0.03, '% recarga', `-3% de recarga de ${nm}`),
  S(b, d0 + 2, lane, `${sid}_c`, `${nm}: ${nUnit[0]}`, ico, nMax, [[`${sid}_b`, 3]], `s_${sid}_n`, 1, nUnit[1], nDesc),
  S(b, d0 + 3, lane, `${sid}_d`, `${nm}: Domínio`, ico, 6, [[`${sid}_c`, 2]], `s_${sid}_dmg`, 0.08, '% dano', `+8% de dano de ${nm}`),
];
export const TREE = [
  // ───────── CASCO (resistir) ─────────
  mk('def', 1, 0, 'vida', 'Casco', '♥', 25, [], '+12 vida máxima', (l) => `+${l * 12}`, {}, { base: 22, grow: 1.42 }),
  mk('def', 2, -1, 'regen', 'Brasa Viva', '✚', 12, [['vida', 2]], '+0,15 vida por segundo', (l) => `+${(l * 0.15).toFixed(2)}/s`, {}, { base: 75, grow: 1.6 }),
  mk('def', 2, 1, 'chapa', 'Chapa', '▣', 10, [['vida', 2]], '-0,5 de dano por golpe recebido', (l) => `-${(l * 0.5).toFixed(1)}`, {}, { base: 140, grow: 1.7 }),
  mk('def', 3, -1, 'dash', 'Esquiva', '»', 8, [['regen', 2]], 'Dash recarrega 6% mais rápido', (l) => `-${l * 6}%`, {}, { base: 220, grow: 1.6 }),
  mk('def', 3, 1, 'espinhos', 'Retaliação', '✸', 10, [['chapa', 2]], 'Ao ser ferido, explode em volta e causa dano', (l) => `${l * 9} dano`, {}, { base: 260, grow: 1.65 }),
  mk('def', 4, 0, 'revive', 'Segundo Fôlego', '☥', 2, [['dash', 2], ['espinhos', 2]], 'Revive uma vez por expedição com 50% de vida', (l) => `${l}x`, {}, { base: 700, grow: 3.2 }),
  S('def', 3, 0, 'pele', 'Pele Grossa', '◍', 10, [['vida', 4]], 'hpPct', 0.03, '% vida', '+3% de vida máxima'),
  S('def', 3, -2, 'seiva', 'Seiva', '❦', 10, [['regen', 3]], 'killHeal', 0.15, ' vida', 'Recupera vida a cada inimigo morto'),
  S('def', 4, -2, 'coracao', 'Coração Voraz', '♡', 5, [['seiva', 3]], 'heartBonus', 0.2, '%', 'Corações curam mais'),
  S('def', 5, -2, 'fonte', 'Fonte Viva', '❂', 8, [['coracao', 2]], 'regenFlat', 0.2, '/s', 'Regeneração extra por segundo'),
  K('def', 6, -2, 'k_fenix', 'Pira Eterna', '♨', [['fonte', 4]], 'Abaixo de 30% de vida, a regeneração triplica', { lowRegen: 1 }),
  S('def', 4, -1, 'reflexo', 'Reflexo', '◐', 10, [['dash', 3]], 'dodge', 0.02, '% esquiva', 'Chance de ignorar um golpe por completo'),
  S('def', 5, -1, 'fantasma', 'Passo Fantasma', '≋', 6, [['reflexo', 3]], 'dashI', 0.06, 's', 'Fica invulnerável por mais tempo ao usar o dash'),
  K('def', 6, -1, 'k_danca', 'Dança das Cinzas', '✵', [['fantasma', 3]], 'O dash explode em chamas e fere quem estiver perto', { dashBlast: 1 }),
  S('def', 3, 2, 'couraca', 'Couraça', '▤', 10, [['chapa', 3]], 'armorFlat', 0.4, '', 'Reduz dano de cada golpe'),
  S('def', 4, 2, 'bloqueio', 'Bloqueio', '▦', 10, [['couraca', 3]], 'dmgRed', 0.015, '% dano recebido', 'Reduz todo dano recebido', { }),
  S('def', 5, 2, 'barreira', 'Barreira de Cinzas', '◈', 10, [['bloqueio', 3]], 'shield', 10, ' escudo', 'Começa a expedição com um escudo que absorve dano'),
  K('def', 6, 2, 'k_muralha', 'Inabalável', '▮', [['barreira', 4]], 'Nenhum golpe tira mais que 25% da sua vida máxima', { capHit: 1 }),
  S('def', 4, 3, 'toxina', 'Resistência Tóxica', '☣', 5, [['couraca', 4]], 'slowRes', 0.15, '% lentidão', 'Reduz o tempo de lentidão sofrido'),
  S('def', 5, 3, 'casco2', 'Casco Reforçado', '◉', 8, [['toxina', 3]], 'hpPct', 0.02, '% vida', '+2% de vida máxima'),
  S('def', 6, 3, 'vigor', 'Vigor Final', '▩', 6, [['casco2', 4]], 'armorFlat', 0.5, '', 'Reduz dano de cada golpe'),
  S('def', 4, 1, 'farpas', 'Farpas', '⌖', 10, [['espinhos', 3]], 'thornsMul', 0.1, '% espinhos', 'Retaliação causa mais dano'),
  S('def', 5, 1, 'ecodor', 'Eco da Dor', '⚡', 8, [['farpas', 3]], 'painDmg', 0.03, '% dano', 'Ao ser ferido, causa mais dano por 4 segundos'),
  K('def', 6, 1, 'k_coroa', 'Coroa de Espinhos', '♛', [['ecodor', 3]], 'A Retaliação causa o dobro de dano', { thornsX2: 1 }),
  S('def', 5, 0, 'vontade', 'Vontade de Ferro', '☥', 5, [['revive', 1]], 'reviveHp', 0.1, '% vida ao reviver', 'Revive com mais vida'),
  K('def', 6, 0, 'k_cinza', 'Cinza Renascida', '☀', [['vontade', 3]], 'Ao reviver, uma explosão enorme e 4s de invulnerabilidade', { reviveNova: 1 }),

  // ───────── FÚRIA (destruir) ─────────
  mk('off', 1, 0, 'dano', 'Fúria', '✦', 25, [], '+6% de dano', (l) => `+${l * 6}%`, {}, { base: 38, grow: 1.5 }),
  mk('off', 2, -1, 'recarga', 'Ritmo', '⟳', 12, [['dano', 2]], '-2,5% de recarga das habilidades', (l) => `-${(l * 2.5).toFixed(1)}%`, {}, { base: 110, grow: 1.65 }),
  mk('off', 2, 0, 'area', 'Onda Expandida', '◌', 12, [['dano', 3]], '+3% de área e alcance', (l) => `+${l * 3}%`, {}, { base: 160, grow: 1.6 }),
  mk('off', 2, 1, 'crit', 'Olho de Brasa', '✺', 15, [['dano', 2]], '+2% de chance de crítico', (l) => `+${l * 2}%`, {}, { base: 130, grow: 1.55 }),
  mk('off', 3, 0, 'exec', 'Executor', '☠', 8, [['recarga', 3], ['crit', 3]], '+20% de dano em inimigos com menos de 25% de vida', (l) => `+${l * 20}%`, {}, { base: 380, grow: 1.75 }),
  mk('off', 3, 2, 'critd', 'Golpe Brutal', '✹', 10, [['crit', 4]], '+10% de dano crítico', (l) => `+${l * 10}%`, {}, { base: 320, grow: 1.7 }),
  S('off', 3, -1, 'sangria', 'Sede de Sangue', '☩', 10, [['recarga', 3]], 'leech', 0.004, '% roubo de vida', 'Recupera vida com o dano causado'),
  S('off', 4, -1, 'frenesi', 'Frenesi', '⚔', 10, [['sangria', 3]], 'frenzy', 0.0015, '% por abate', 'Cada abate seguido acumula dano (até 20 acúmulos)'),
  K('off', 5, -1, 'k_sede', 'Sede Sem Fim', '☄', [['frenesi', 5]], 'O Frenesi acumula até 50 vezes', { frenzyCap: 1 }),
  S('off', 3, -2, 'pavio', 'Pavio Curto', '✧', 10, [['recarga', 4]], 'nearDmg', 0.04, '% dano de perto', 'Mais dano em inimigos próximos'),
  S('off', 4, -2, 'combustao', 'Combustão', '✺', 10, [['pavio', 3]], 'killBlast', 0.05, '% explosão', 'Chance de inimigos explodirem ao morrer'),
  K('off', 5, -2, 'k_pira', 'Pira de Guerra', '♨', [['combustao', 4]], 'As explosões ao morrer ficam maiores e três vezes mais fortes', { blastX: 1 }),
  S('off', 3, -3, 'cadencia', 'Cadência', '⟲', 10, [['recarga', 5]], 'cdrFlat', 0.015, '% recarga', 'Reduz a recarga das habilidades'),
  S('off', 4, -3, 'sintonia', 'Sintonia', '♪', 10, [['cadencia', 3]], 'comboDmg', 0.02, '% a cada 10 de combo', 'Mais dano conforme o combo'),
  K('off', 5, -3, 'k_resso', 'Ressonância', '◎', [['sintonia', 5]], 'Recarga -10% e área +10%, sempre', { cdrFlat: 0.10, areaP: 0.10 }),
  S('off', 3, -4, 'brasa_a', 'Brasa Ardente', '◆', 10, [['cadencia', 3]], 'dmgP', 0.03, '% dano', 'Mais dano em tudo'),
  S('off', 4, -4, 'inferno', 'Inferno', '◈', 8, [['brasa_a', 5]], 'dmgP', 0.04, '% dano', 'Mais dano em tudo'),
  S('off', 3, 1, 'mira', 'Mira Certeira', '⌖', 10, [['crit', 3]], 'farDmg', 0.04, '% dano de longe', 'Mais dano em inimigos distantes'),
  S('off', 4, 1, 'predador', 'Olho do Predador', '◉', 10, [['mira', 3]], 'eliteDmg', 0.05, '% vs elites e chefes', 'Mais dano em elites e chefes'),
  S('off', 5, 1, 'cacador', 'Caçador de Chefes', '♞', 8, [['predador', 3]], 'bossDmg', 0.06, '% vs chefes', 'Mais dano contra chefes'),
  K('off', 6, 1, 'k_veredito', 'Veredito', '⚖', [['cacador', 4]], 'Críticos contra elites e chefes causam +50% de dano crítico', { verdict: 1 }),
  S('off', 4, 2, 'lamina_af', 'Lâmina Afiada', '✂', 10, [['critd', 4]], 'critFlat', 0.015, '% crítico', 'Mais chance de crítico'),
  K('off', 5, 2, 'k_gume', 'Gume Duplo', '⚔', [['lamina_af', 5]], 'Críticos também explodem em volta do alvo', { gume: 1 }),
  S('off', 4, 0, 'carrasco', 'Carrasco', '☠', 10, [['exec', 3]], 'execT', 0.02, '% limiar', 'Executor passa a valer em inimigos com mais vida'),
  S('off', 5, 0, 'desespero', 'Desespero', '☢', 8, [['carrasco', 3]], 'lowHpDmg', 0.05, '% dano com vida baixa', 'Mais dano abaixo de 50% de vida'),
  K('off', 6, 0, 'k_ultimo', 'Último Suspiro', '☗', [['desespero', 4]], 'Abaixo de 25% de vida, causa 50% a mais de dano', { lastBreath: 1 }),

  // ───────── ENGENHO (acumular) ─────────
  mk('eco', 1, 0, 'ima', 'Ímã', '◎', 12, [], '+8% de alcance de coleta', (l) => `+${l * 8}%`, {}, { base: 28, grow: 1.5 }),
  mk('eco', 2, -1, 'sorte', 'Faro', '☘', 18, [['ima', 2]], '+8% de sucata ganha', (l) => `+${l * 8}%`, {}, { base: 85, grow: 1.6 }),
  mk('eco', 2, 0, 'vel', 'Pés Leves', '≫', 12, [['ima', 2]], '+2,5% de velocidade de movimento', (l) => `+${(l * 2.5).toFixed(1)}%`, {}, { base: 55, grow: 1.55 }),
  mk('eco', 2, 1, 'xpg', 'Aprendizado', '✎', 15, [['ima', 2]], '+6% de experiência', (l) => `+${l * 6}%`, {}, { base: 120, grow: 1.55 }),
  mk('eco', 3, -1, 'catador', 'Catadores', '⚙', 40, [['sorte', 3]], 'Drones coletam sucata sozinhos, até offline', (l) => `${catadorRate(l).toFixed(2)}/s`, {}, { base: 90, grow: 1.46 }),
  mk('eco', 3, -2, 'reroll', 'Segunda Chance', '↻', 5, [['sorte', 2]], '+1 troca de cartas por expedição', (l) => `+${l}`, {}, { base: 280, grow: 2.3 }),
  mk('eco', 3, 1, 'cartas', 'Olhar Aguçado', '❖', 1, [['xpg', 5]], '+1 carta nas escolhas de nível', (l) => `+${l}`, {}, { base: 1500, grow: 2 }),
  mk('eco', 5, -1, 'impulso', 'Impulso', '⇧', 3, [['catador', 4]], 'Começa a expedição com níveis extras', (l) => `+${l} nv`, {}, { base: 800, grow: 2.6 }),
  S('eco', 4, -1, 'drones', 'Drones Velozes', '⚙', 10, [['catador', 5]], 'catMul', 0.05, '% catadores', 'Catadores trabalham mais rápido'),
  S('eco', 5, -2, 'fundicao', 'Fundição Noturna', '☾', 8, [['drones', 3]], 'offMul', 0.1, '% offline', 'Catadores rendem mais enquanto você está fora'),
  K('eco', 6, -2, 'k_linha', 'Linha de Montagem', '⛭', [['fundicao', 4]], 'Catadores trabalham 50% mais rápido', { catX: 1 }),
  S('eco', 3, -3, 'garimpo', 'Garimpeiro', '⛏', 8, [['sorte', 4]], 'eliteScrap', 0.1, '% sucata de elites', 'Elites e chefes soltam mais sucata'),
  S('eco', 4, -3, 'veio', 'Veio Rico', '◇', 10, [['garimpo', 3]], 'lootDouble', 0.03, '% dobra', 'Chance de cada sucata valer o dobro'),
  K('eco', 5, -3, 'k_rei', 'Rei do Lixão', '♚', [['veio', 5]], 'Sucata +30% e +15% de chance de dobrar', { luckP: 0.3, lootDouble: 0.15 }),
  S('eco', 3, 2, 'renov', 'Renovação', '✿', 8, [['xpg', 4]], 'lvlHeal', 0.04, '% vida por nível', 'Cura ao subir de nível'),
  S('eco', 4, 2, 'estudo', 'Estudo Dirigido', '✐', 5, [['renov', 3]], 'xpEarly', 0.1, '% xp nos 2 min iniciais', 'Mais experiência no começo da expedição'),
  K('eco', 5, 2, 'k_mestre', 'Mestre das Cinzas', '☯', [['estudo', 3]], 'Ganha 15% a mais de experiência, sempre', { xpP: 0.15 }),
  S('eco', 3, 0, 'sortudo', 'Coração Sortudo', '♡', 10, [['vel', 3]], 'heartChance', 0.004, '% de drop de coração', 'Mais chance de corações caírem'),
  S('eco', 4, 0, 'magx', 'Ímã Veloz', '◎', 8, [['sortudo', 3]], 'magP', 0.06, '% coleta', 'Aumenta o alcance de coleta'),
  K('eco', 5, 0, 'k_vento', 'Ventania', '≈', [['magx', 4]], 'Velocidade +10% e alcance de coleta +25%', { speedP: 0.10, magP: 0.25 }),

  // ───────── FORJA (habilidades) ─────────
  mk('hab', 1, 0, 'slots', 'Mente de Forja', '▤', 2, [], '+1 espaço de habilidade por expedição', (l) => `+${l}`, {}, { base: 400, grow: 3 }),
  mk('hab', 2, -3, 'r_arco', 'Relíquia: Arco Tóxico', '〰', 1, [['slots', 1]], 'Libera o Arco Tóxico como habilidade inicial', () => 'liberado', {}, { base: 160, grow: 1 }),
  mk('hab', 2, 0, 'r_brasas', 'Relíquia: Brasas', '●', 1, [['slots', 1]], 'Libera as Brasas Orbitais como habilidade inicial', () => 'liberado', {}, { base: 300, grow: 1 }),
  mk('hab', 2, 3, 'r_nova', 'Relíquia: Nova', '◯', 1, [['slots', 1]], 'Libera a Nova de Cinzas como habilidade inicial', () => 'liberado', {}, { base: 650, grow: 1 }),
  mk('hab', 3, -1.5, 'r_lanca', 'Relíquia: Lança', '➤', 1, [['r_arco', 1], ['r_brasas', 1]], 'Libera a Lança de Brasa como habilidade inicial', () => 'liberado', {}, { base: 1100, grow: 1 }),
  mk('hab', 3, 1.5, 'r_chuva', 'Relíquia: Chuva', '☄', 1, [['r_brasas', 1], ['r_nova', 1]], 'Libera a Chuva de Sucata como habilidade inicial', () => 'liberado', {}, { base: 1900, grow: 1 }),
  mk('hab', 5, 0, 'maestria', 'Maestria', '★', 3, [['r_lanca', 1], ['r_chuva', 1]], 'A habilidade inicial começa com nível extra', (l) => `+${l} nv`, {}, { base: 2600, grow: 2.6 }),
  // Lâmina (habilidade inicial) — entradas baratas
  S('hab', 1, -1.5, 'lamina_a', 'Lâmina: Afiada', '⚔', 8, [], 's_lamina_dmg', 0.06, '% dano', '+6% de dano da Lâmina de Ferrugem', { base: 60, grow: 1.5 }),
  S('hab', 1, 1.5, 'lamina_b', 'Lâmina: Alcance', '⚔', 6, [], 's_lamina_n', 1, ' alc.', 'Aumenta arco e alcance da Lâmina', { base: 90, grow: 1.55 }),
  ...sk('hab', -3, 3, 'arco', 'Arco', 'r_arco', '〰', '+1 alvo encadeado', ['Encadeamento', ' alvos']),
  ...sk('hab', 3, 3, 'nova', 'Nova', 'r_nova', '◯', '+6% de raio por nível', ['Raio', ' nv']),
  ...sk('hab', -1.5, 4, 'lanca', 'Lança', 'r_lanca', '➤', '+1 lança lançada', ['Leque', ' lanças'], 3),
  ...sk('hab', 1.5, 4, 'chuva', 'Chuva', 'r_chuva', '☄', '+2 fragmentos por nível', ['Saraivada', ' nv'], 4),
  S('hab', 3, 0, 'brasas_a', 'Brasas: Afiadas', '●', 8, [['r_brasas', 1]], 's_brasas_dmg', 0.06, '% dano', '+6% de dano das Brasas Orbitais'),
  S('hab', 4, 0, 'brasas_b', 'Brasas: Enxame', '●', 4, [['brasas_a', 3]], 's_brasas_n', 1, ' brasa', '+1 brasa orbitando'),
  S('hab', 6, 0, 'estudo_rel', 'Estudo de Relíquias', '✎', 10, [['maestria', 1]], 'sAll', 0.03, '% dano de habilidades', 'Mais dano em todas as habilidades'),
  S('hab', 7, 0, 'fornalha', 'Fornalha', '♨', 5, [['estudo_rel', 3]], 'skillBias', 0.2, '% chance de habilidades', 'Habilidades aparecem mais nas cartas'),
  K('hab', 8, 0, 'k_chama', 'Chama Mestra', '✹', [['fornalha', 3]], 'Todas as habilidades: dano +10% e recarga -8%', { sAll: 0.10, sAllCd: 0.08 }),
];
// posicionamento: separa nós que caiam sobre a mesma célula
export const NODE = Object.fromEntries(TREE.map((n) => [n.id, n]));
export const NODE_IDS = TREE.map((n) => n.id);
export const nodeCost = (id, lvl) => Math.floor(NODE[id].base * Math.pow(NODE[id].grow, lvl));
export const nodeOpen = (id, meta) => NODE[id].req.every(([r, l]) => (meta[r] || 0) >= l);
/** soma dos efeitos de cada nó comprado (chave → valor); pedras-angulares entram como 1 */
export function treeFx(meta) { const t = {}; for (const n of TREE) { const l = meta[n.id] || 0; if (!l) continue; for (const k in n.fx) t[k] = (t[k] || 0) + n.fx[k] * l; } return t; }
export const catadorMul = (meta) => (1 + (treeFx(meta).catMul || 0)) * (meta.k_linha ? 1.5 : 1);
export const RELIC_NODE = { arco: 'r_arco', brasas: 'r_brasas', nova: 'r_nova', lanca: 'r_lanca', chuva: 'r_chuva' };
export const hasRelic = (id, meta) => id === 'lamina' || (meta[RELIC_NODE[id]] || 0) > 0;

export const DEPTH_MULT = (d) => ({ hp: 1 + 0.4 * (d - 1), dmg: 1 + 0.22 * (d - 1), scrap: 1 + 0.35 * (d - 1) });
export const xpNeed = (lvl) => Math.floor(4 + lvl * 5 + Math.pow(lvl, 1.7));

// Prestígio ("Renascer") e patente da conta
// ── dificuldades (camada sobre a profundidade) ──
export const DIFFS = [
  { id: 'normal', name: 'Normal', color: '#ffb347', hp: 1, dmg: 1, scrap: 1, spd: 1, spawn: 1, elite: 1, hearts: 1, boss: 1, desc: 'A experiência padrão.' },
  { id: 'pesadelo', name: 'Pesadelo', color: '#ff7a2a', hp: 1.6, dmg: 1.35, scrap: 1.7, spd: 1.04, spawn: 1.25, elite: 1.5, hearts: 0.8, boss: 1.3, desc: 'Mais inimigos e elites mais frequentes.' },
  { id: 'calamidade', name: 'Calamidade', color: '#e0432a', hp: 2.7, dmg: 1.9, scrap: 3.2, spd: 1.08, spawn: 1.5, elite: 2.2, hearts: 0.5, boss: 1.8, desc: 'Hordas pesadas, poucos corações, chefes brutais.' },
  { id: 'abissal', name: 'Abissal', color: '#b04bff', hp: 4.8, dmg: 2.8, scrap: 6, spd: 1.14, spawn: 1.85, elite: 3, hearts: 0.2, boss: 2.6, desc: 'Quase sem cura. Só para quem domina a Árvore.' },
];
export const DIFF = Object.fromEntries(DIFFS.map((d) => [d.id, d]));
/** libera cada dificuldade vencendo um chefe na anterior */
export const diffUnlocked = (s, id) => { const i = DIFFS.findIndex((d) => d.id === id); return i <= 0 || (s.diffWins?.[DIFFS[i - 1].id] || 0) > 0; };
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
  // ── marcos adicionais ──
  ...[[500, 'Matança', 200], [2500, 'Colheita', 1200], [5000, 'Cemitério ambulante', 2500], [25000, 'Apocalipse particular', 9000]].map(([g, n, r]) => ({ id: 'k' + g, name: n, desc: `Abata ${g.toLocaleString('pt-BR')} inimigos`, goal: g, get: (s) => s.kills, reward: r })),
  ...[[25, 'Rotina de risco', 800], [100, 'Lenda da estrada', 7000]].map(([g, n, r]) => ({ id: 'r' + g, name: n, desc: `Faça ${g} expedições`, goal: g, get: (s) => s.runs, reward: r })),
  ...[[3, 'Tripla coroa', 1400], [10, 'Flagelo dos titãs', 8000], [25, 'Fim dos gigantes', 20000]].map(([g, n, r]) => ({ id: 'w' + g, name: n, desc: `Derrote ${g} chefes`, goal: g, get: (s) => s.wins, reward: r })),
  ...[[10, 'Faísca', 120], [20, 'Fogueira', 1200], [40, 'Sol de cinzas', 9000]].map(([g, n, r]) => ({ id: 'l' + g, name: n, desc: `Chegue ao nível ${g}`, goal: g, get: (s) => s.best.level, reward: r })),
  ...[[120, 'Primeiro fôlego', 100], [600, 'Maratonista', 900], [900, 'Resistência', 2200]].map(([g, n, r]) => ({ id: 't' + g, name: n, desc: `Resista ${Math.floor(g / 60)}:${String(g % 60).padStart(2, '0')}`, goal: g, get: (s) => s.best.time, reward: r })),
  ...[[30, 'Embalo', 250], [100, 'Fúria contínua', 1500], [150, 'Imparável', 3500]].map(([g, n, r]) => ({ id: 'c' + g, name: n, desc: `Alcance combo de ${g}`, goal: g, get: (s) => s.best.combo || 0, reward: r })),
  ...[[25, 'Predador', 2200], [50, 'Terror das elites', 5000], [100, 'Extermínio de elite', 12000]].map(([g, n, r]) => ({ id: 'e' + g, name: n, desc: `Derrote ${g} elites`, goal: g, get: (s) => s.elites || 0, reward: r })),
  ...[[1000, 'Primeiro cofre', 150], [50000, 'Magnata do lixo', 4000], [1e6, 'Império de ferrugem', 60000], [5e6, 'Dono das ruínas', 200000]].map(([g, n, r]) => ({ id: 'life' + g, name: n, desc: `Junte ${g.toLocaleString('pt-BR')} de sucata (total)`, goal: g, get: (s) => s.lifetime, reward: r })),
  { id: 'b1', name: 'Ruínas dominadas', desc: 'Vença 3 vezes nas Ruínas', goal: 3, get: (s) => s.biomeWins?.ruinas || 0, reward: 1000 },
  { id: 'b2x', name: 'Mestre do Pântano', desc: 'Vença 5 vezes no Pântano', goal: 5, get: (s) => s.biomeWins?.pantano || 0, reward: 6000 },
  { id: 'b3x', name: 'Senhor das dunas', desc: 'Vença 5 vezes no Deserto', goal: 5, get: (s) => s.biomeWins?.deserto || 0, reward: 12000 },
  { id: 'b4x', name: 'Rei do gelo', desc: 'Vença 5 vezes na Tundra', goal: 5, get: (s) => s.biomeWins?.tundra || 0, reward: 25000 },
  { id: 'df1', name: 'Pesadelo vencido', desc: 'Derrote um chefe no Pesadelo', goal: 1, get: (s) => s.diffWins?.pesadelo || 0, reward: 6000 },
  { id: 'df2', name: 'Calamidade vencida', desc: 'Derrote um chefe na Calamidade', goal: 1, get: (s) => s.diffWins?.calamidade || 0, reward: 30000 },
  { id: 'df3', name: 'Abismo domado', desc: 'Derrote um chefe no Abissal', goal: 1, get: (s) => s.diffWins?.abissal || 0, reward: 150000 },
  ...[[3, 'Mais fundo', 1500], [5, 'Descida', 4000], [10, 'Abismo', 25000]].map(([g, n, r]) => ({ id: 'd' + g, name: n, desc: `Alcance a profundidade ${g}`, goal: g, get: (s) => s.depthMax || 1, reward: r })),
  ...[[10, 'Primeiros passos', 300], [25, 'Crescendo', 1500], [50, 'Árvore frondosa', 8000], [75, 'Quase completa', 30000]].map(([g, n, r]) => ({ id: 'n' + g, name: n, desc: `Compre ${g} nós diferentes da Árvore`, goal: g, get: (s) => Object.values(s.meta).filter((v) => v > 0).length, reward: r })),
  ...[[5, 'Aperfeiçoado', 1000], [15, 'Mestre de ofício', 6000], [30, 'Perfeccionista', 30000]].map(([g, n, r]) => ({ id: 'nm' + g, name: n, desc: `Leve ${g} nós ao nível máximo`, goal: g, get: (s) => TREE.filter((t) => (s.meta[t.id] || 0) >= t.max).length, reward: r })),
  ...[[1, 'Pedra fundamental', 900], [4, 'Quatro pilares', 5000], [8, 'Arquiteto', 20000], [16, 'Todas as pedras', 80000]].map(([g, n, r]) => ({ id: 'ks' + g, name: n, desc: `Ative ${g} pedra${g > 1 ? 's' : ''}-angular${g > 1 ? 'es' : ''}`, goal: g, get: (s) => TREE.filter((t) => t.key && (s.meta[t.id] || 0) > 0).length, reward: r })),
  ...[[1, 'Renascido', 2000], [3, 'Ciclo', 8000], [10, 'Fênix', 50000]].map(([g, n, r]) => ({ id: 'rb' + g, name: n, desc: `Renasça ${g} vez${g > 1 ? 'es' : ''}`, goal: g, get: (s) => s.rebirths || 0, reward: r })),
  ...[[10, 'Cinzas acumuladas', 5000], [100, 'Montanha de cinzas', 60000]].map(([g, n, r]) => ({ id: 'ci' + g, name: n, desc: `Tenha ${g} Cinzas`, goal: g, get: (s) => s.cinzas || 0, reward: r })),
  ...[[3, 'Arsenal', 1500], [5, 'Museu de relíquias', 9000]].map(([g, n, r]) => ({ id: 'rl' + g, name: n, desc: `Libere ${g} relíquias`, goal: g, get: (s) => Object.keys(s.meta).filter((k) => k.startsWith('r_') && s.meta[k] > 0).length, reward: r })),
];
