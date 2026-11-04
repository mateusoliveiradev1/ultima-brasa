// Lista das skins (só dados leves): usada pelo jogo e pela landing. A arte fica em art-chars.js.
export const RAR = { comum: { n: 'Comum', c: '#b9ada0' }, rara: { n: 'Rara', c: '#4fb4f0' }, epica: { n: 'Épica', c: '#b57aff' }, lendaria: { n: 'Lendária', c: '#ffb347' }, sazonal: { n: 'Sazonal', c: '#ff7ab8' } };
// c = [capa, cachecol, lanterna] para as bolinhas
export const SKIN_META = {
  padrao: { name: 'Sobrevivente', rar: 'comum', c: ['#3a2c27', '#d9622f', '#ff7a2a'] },
  ruinas: { name: 'Saqueador', rar: 'rara', c: ['#3a3e46', '#e0463a', '#ffe08a'] },
  pantano: { name: 'Musgo Tóxico', rar: 'rara', c: ['#243a2c', '#42e0b4', '#42e0b4'] },
  deserto: { name: 'Nômade da Duna', rar: 'rara', c: ['#7a5c36', '#4fb4f0', '#ffb347'] },
  tundra: { name: 'Geada', rar: 'rara', c: ['#5a6a78', '#ffffff', '#8fe0ff'] },
  cacador: { name: 'Caçador de Chefes', rar: 'epica', c: ['#4a3a2a', '#c8442c', '#ff6a3a'] },
  veterano: { name: 'Veterano de Ferro', rar: 'epica', c: ['#2e3a4a', '#e8c866', '#ffd98a'] },
  cinzas: { name: 'Cinzas Eternas', rar: 'epica', c: ['#1c1514', '#ffd35a', '#ffd35a'] },
  calamidade: { name: 'Calamidade', rar: 'epica', c: ['#4a1a1a', '#e0321e', '#ff3a2a'] },
  laureado: { name: 'Laureado', rar: 'epica', c: ['#2a3a52', '#f0d070', '#f0d070'] },
  coroa: { name: 'Coroa da Brasa', rar: 'lendaria', c: ['#bfae8c', '#fff0a8', '#fff0a8'] },
  campeao: { name: 'Campeão da Semana', rar: 'lendaria', c: ['#1a2a4a', '#fff0a8', '#9ae0ff'] },
  bruxo: { name: 'Bruxo da Brasa', rar: 'sazonal', c: ['#3a2250', '#ffb04a', '#ff8a1c'] },
  caipira: { name: 'Caipira da Brasa', rar: 'sazonal', c: ['#6a4630', '#ee4a3a', '#ffcf4a'] },
  natal: { name: 'Brasa Natalina', rar: 'sazonal', c: ['#7a1c1c', '#46d06a', '#ffd35a'] },
  reveillon: { name: 'Réveillon', rar: 'sazonal', c: ['#d8d4cc', '#fff0a8', '#fff0a8'] },
  folia: { name: 'Folião de Cinzas', rar: 'sazonal', c: ['#5a1a6a', '#4fd8ff', '#ffe35a'] },
};
export const SKIN_ORDER = Object.keys(SKIN_META);
