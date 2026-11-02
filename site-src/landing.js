// Landing da Última Brasa: ranking ao vivo, desafio do dia e conta (mesma camada online do jogo; a sessão fica no mesmo localStorage).
import * as O from '../src/game/online.js';

// links antigos e de teste (?map=…, ?editor=…, ?gl=…) continuam abrindo o jogo
{ const q = new URLSearchParams(location.search); if (['map', 'editor', 'gl', 'daily', 'dev'].some((k) => q.has(k))) location.replace('/jogar/' + location.search + location.hash); }
try { O.takeRedirect(); } catch { /* sem storage */ }

const $ = (s, r = document) => r.querySelector(s);
const h = (tag, props, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(props || {})) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v === true) e.setAttribute(k, ''); else if (v !== false && v != null) e.setAttribute(k, v); } for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k)); return e; };
const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const fmtN = (n) => Number(n || 0).toLocaleString('pt-BR');

// cabeçalho ganha fundo ao rolar
const top = $('.top'); const onScroll = () => top.classList.toggle('scrolled', scrollY > 24); addEventListener('scroll', onScroll, { passive: true }); onScroll();

const NAME = { ruinas: 'Ruínas Cinzentas', pantano: 'Pântano Tóxico', deserto: 'Deserto de Sucata', tundra: 'Tundra Cinzenta' };
const DIFF = { normal: 'Normal', pesadelo: 'Pesadelo', calamidade: 'Calamidade', abissal: 'Abissal' };

if (!O.enabled()) {
  $('#ranking').hidden = true; $('#conta').hidden = true; $('#top-conta').hidden = true; $('a[href="#ranking"]', document.body).hidden = true;
} else boot();

function boot() {
  // ───── desafio do dia ─────
  O.dailyInfo().then((r) => { const d = r.ok ? r.data : null; if (!d) return; const el = $('#daily'); el.textContent = ''; el.append(`${NAME[d.biome] || d.biome} · ${DIFF[d.diff] || d.diff}`, h('small', {}, 'Vale para todo mundo, só hoje.')); });

  // ───── ranking ─────
  let cur = { scope: 'all', board: 'run' }, token = 0;
  const board = $('#board');
  const row = (x) => h('li', { class: x.me ? 'me' : '' },
    h('span', { class: 'pos' }, x.rank), h('span', { class: 'nick' }, x.nick || 'Sobrevivente', x.me ? h('i', {}, 'você') : null),
    cur.board === 'progress' ? h('span', { class: 'meta' }, 'progresso') : h('span', { class: 'meta' }, `${fmtT(x.secs || 0)} · ${fmtN(x.kills)} abates${x.victory ? ' · chefe' : ''}`),
    h('span', { class: 'pts' }, fmtN(x.pts)));
  async function loadBoard() {
    const my = ++token; board.setAttribute('aria-busy', 'true'); board.replaceChildren(h('p', { class: 'state' }, 'Carregando o ranking…'));
    const r = await O.leaderboard(cur.scope, null, null, cur.board); if (my !== token) return; board.setAttribute('aria-busy', 'false');
    if (!r.ok) { board.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'state err' }, 'Não deu para carregar o ranking agora (' + (r.err || 'erro') + ').'), h('button', { class: 'btn sm', onclick: loadBoard }, 'Tentar de novo'))); return; }
    const list = Array.isArray(r.data) ? r.data : [];
    if (!list.length) { board.replaceChildren(h('div', { class: 'empty' }, h('p', {}, cur.scope === 'day' ? 'Ninguém fez o desafio de hoje ainda. A primeira posição está livre.' : 'O ranking ainda está vazio. A primeira posição está livre.'), h('a', { class: 'btn primary', href: '/jogar/' }, 'Ser o primeiro'))); return; }
    const top10 = list.slice(0, 10), me = list.find((x) => x.me), ol = h('ol', {}, top10.map(row));
    if (me && me.rank > 10) ol.append(h('li', { class: 'gap', 'aria-hidden': 'true' }, '···'), row(me));
    board.replaceChildren(ol);
  }
  $('#rank-tabs').addEventListener('click', (e) => { const b = e.target.closest('button[role=tab]'); if (!b) return; for (const t of $('#rank-tabs').children) t.setAttribute('aria-selected', String(t === b)); cur = { scope: b.dataset.scope, board: b.dataset.board }; loadBoard(); });
  loadBoard();

  // ───── conta ─────
  const acc = $('#account'); let mode = 'in', busy = false, prof = null;
  async function render() {
    const u = O.user(); const topBtn = $('#top-conta');
    if (!u) { topBtn.textContent = 'Entrar'; return form(); }
    topBtn.textContent = 'Minha conta'; acc.replaceChildren(h('p', { class: 'state' }, 'Carregando sua conta…'));
    const r = await O.myProfile(); prof = r.ok ? r.data : null;
    if (r.ok === false && /login/i.test(r.err || '')) { return form(); }
    if (!prof || !prof.nick) return nickForm(u);
    acc.replaceChildren(h('div', { class: 'who' }, h('b', {}, prof.nick), h('span', {}, u.email || '')), h('p', {}, 'Seu progresso está salvo na nuvem. Entre no jogo para continuar de onde parou.'),
      h('div', { class: 'row' }, h('a', { class: 'btn primary', href: '/jogar/' }, 'Continuar jogando'), h('button', { class: 'btn', onclick: () => { O.signOut(); mode = 'in'; render(); } }, 'Sair')));
  }
  function nickForm(u) {
    const inp = h('input', { id: 'nick', type: 'text', maxlength: '16', minlength: '3', autocomplete: 'nickname', placeholder: 'Ex.: Cinza_07', required: true }), msg = h('p', { class: 'msg', role: 'status' });
    acc.replaceChildren(h('div', { class: 'who' }, h('b', {}, 'Escolha seu apelido'), h('span', {}, 'É o nome que aparece no ranking.')),
      h('form', { class: 'card-form', style: 'display:grid;gap:14px', onsubmit: async (e) => { e.preventDefault(); const r = await O.setNick(inp.value); const d = r.ok ? r.data : null; if (d && d.ok) { render(); } else { msg.className = 'msg err'; msg.textContent = (d && d.err) || r.err || 'Não foi possível salvar.'; } } },
        h('div', { class: 'field' }, h('label', { for: 'nick' }, 'Apelido'), inp, h('small', {}, '3 a 16 letras, números, espaço ou _.')), msg, h('button', { class: 'btn primary', type: 'submit' }, 'Salvar apelido')),
      h('button', { class: 'btn sm', onclick: () => { O.signOut(); render(); } }, 'Sair'));
    inp.focus({ preventScroll: true });
  }
  function form() {
    const email = h('input', { id: 'email', type: 'email', autocomplete: 'email', inputmode: 'email', required: true, placeholder: 'voce@email.com' });
    const pass = h('input', { id: 'pass', type: 'password', autocomplete: mode === 'in' ? 'current-password' : 'new-password', required: true, minlength: '6', placeholder: 'mínimo 6 caracteres' });
    const msg = h('p', { class: 'msg', role: 'status' }), go = h('button', { class: 'btn primary', type: 'submit' }, mode === 'in' ? 'Entrar' : 'Criar conta');
    const seg = h('div', { class: 'seg' }, ['in', 'up'].map((m) => h('button', { type: 'button', 'aria-pressed': String(mode === m), onclick: () => { mode = m; form(); } }, m === 'in' ? 'Entrar' : 'Criar conta')));
    const f = h('form', { style: 'display:grid;gap:14px', novalidate: true, onsubmit: async (e) => {
      e.preventDefault(); if (busy) return;
      if (!/^\S+@\S+\.\S+$/.test(email.value)) { msg.className = 'msg err'; msg.textContent = 'Digite um e-mail válido.'; email.focus(); return; }
      if (pass.value.length < 6) { msg.className = 'msg err'; msg.textContent = 'A senha precisa ter pelo menos 6 caracteres.'; pass.focus(); return; }
      busy = true; go.disabled = true; go.textContent = 'Aguarde…'; msg.className = 'msg'; msg.textContent = '';
      const r = mode === 'in' ? await O.signInPassword(email.value.trim(), pass.value) : await O.signUpPassword(email.value.trim(), pass.value);
      busy = false; go.disabled = false; go.textContent = mode === 'in' ? 'Entrar' : 'Criar conta';
      if (!r.ok) { msg.className = 'msg err'; msg.textContent = r.err || 'Não foi possível entrar.'; return; }
      if (r.confirm) { msg.className = 'msg ok'; msg.textContent = 'Conta criada. Confirme pelo link que enviamos ao seu e-mail e depois use "Entrar".'; mode = 'in'; return; }
    } }, h('div', { class: 'field' }, h('label', { for: 'email' }, 'E-mail'), email), h('div', { class: 'field' }, h('label', { for: 'pass' }, 'Senha'), pass), msg, go);
    acc.replaceChildren(seg, f);
  }
  render(); O.onChange(() => { render(); loadBoard(); });
}
