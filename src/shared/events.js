// Eventos sazonais: janelas fixas por data (repetem todo ano). Sem servidor: o relógio do aparelho decide.
export const EVENT_GOAL = 12; // pontos: chefe derrotado = 3, partida de 2 min ou mais = 1
export const EVENTS = [
  { id: 'noite', name: 'Noite das Cinzas', skin: 'bruxo', from: [10, 25], to: [11, 9], blurb: 'As cinzas dos que partiram ainda brilham. Abóboras acesas, lanterna encantada.' },
  { id: 'carnaval', name: 'Carnaval de Cinzas', skin: 'folia', carnaval: true, blurb: 'Até o fim do mundo tem folia. Penas, máscara e confete na brasa.' },
  { id: 'junina', name: 'Arraiá da Brasa', skin: 'caipira', from: [6, 5], to: [7, 5], blurb: 'Fogueira acesa e bandeirinhas no ferro-velho.' },
  { id: 'natal', name: 'Natal de Cinzas', skin: 'natal', from: [12, 10], to: [12, 25], blurb: 'Neve de cinza sobre as ruínas. Um gorro vermelho para esquentar a luta.' },
  { id: 'reveillon', name: 'Réveillon de Brasa', skin: 'reveillon', from: [12, 26], to: [1, 6], blurb: 'Mais um ano de pé. Confete, dourado e a chama virando o calendário.' },
];
function easter(y) { // algoritmo de Gauss/Meeus (calendário gregoriano)
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(y, mo - 1, da);
}
/** janela do evento que começa no ano `y` */
export function windowOf(ev, y) {
  if (ev.carnaval) { const ash = new Date(easter(y)); ash.setDate(ash.getDate() - 46); const s = new Date(ash); s.setDate(s.getDate() - 12); const e = new Date(ash); e.setDate(e.getDate() - 1); e.setHours(23, 59, 59, 999); return { start: s, end: e }; }
  const [m0, d0] = ev.from, [m1, d1] = ev.to; return { start: new Date(y, m0 - 1, d0), end: new Date(m1 < m0 ? y + 1 : y, m1 - 1, d1, 23, 59, 59, 999) };
}
/** eventos acontecendo agora: [{ev, start, end, year, daysLeft}] */
export function activeEvents(now = new Date()) {
  const out = [], y = now.getFullYear();
  for (const ev of EVENTS) for (const yy of [y - 1, y]) { const w = windowOf(ev, yy); if (now >= w.start && now <= w.end) out.push({ ev, ...w, year: yy, daysLeft: Math.max(1, Math.ceil((w.end - now) / 864e5)) }); }
  return out;
}
/** próximo evento a começar (ou null) */
export function nextEvent(now = new Date()) {
  let best = null; const y = now.getFullYear();
  for (const ev of EVENTS) for (const yy of [y, y + 1]) { const w = windowOf(ev, yy); if (w.start > now && (!best || w.start < best.start)) best = { ev, ...w, year: yy, daysTo: Math.ceil((w.start - now) / 864e5) }; }
  return best;
}
export const fmtDM = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
