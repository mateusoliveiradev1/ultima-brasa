// Telas do modo online: conta, apelido, save na nuvem, rankings e desafio do dia.
import * as O from './online.js';

export function mountOnline(H) {
  const { el, btn, openDlg, closeDlg, save, SV, toast, BIOMES, BIOME_ORDER, DIFFS, diffUnlocked, biomeUnlocked, startDaily, fmt, fmtTime } = H;
  let prof = null, checked = false, pushT = 0, pushing = false;
  const accountBtn = btn('sm', 'Entrar', () => openAccount(), { title: 'Conta, save na nuvem e ranking' });
  const rankBtn = btn('sm', 'Ranking', () => openRank(), { title: 'Rankings e desafio do dia' });
  const refreshLabel = () => { accountBtn.textContent = O.user() ? (prof?.nick || 'Conta') : 'Entrar'; accountBtn.classList.toggle('pri', !!prof); };
  const diffName = (id) => DIFFS.find((d) => d.id === id)?.name || id;

  async function loadProfile() {
    if (!O.user()) { prof = null; refreshLabel(); return null; }
    const r = await O.myProfile(); prof = r.ok ? r.data : null; refreshLabel(); return prof;
  }
  // ── save na nuvem ──
  const summary = (s) => `⬢ ${fmt(Math.floor(s.lifetime || 0))} no total · ${s.wins || 0} chefes · ${s.cinzas || 0} Cinzas`;
  async function sync(manual) {
    if (!O.user() || !prof) return;
    const local = SV.data(), r = await O.pullSave(); if (!r.ok) { if (manual) toast('Não foi possível falar com a nuvem.'); return; }
    const cloud = r.data;
    if (cloud && cloud.save && cloud.save_at > (local.t || 0) + 1000) {
      openDlg('Save da nuvem mais novo',
        el('p', { class: 'hp-p' }, 'Há um progresso mais recente salvo na sua conta. Qual você quer usar?'),
        el('p', { class: 'hp-p' }, el('b', {}, 'Nuvem: '), summary(cloud.save), el('br'), el('b', {}, 'Este aparelho: '), summary(local)),
        el('div', { class: 'dlg-foot' }, btn('sm', 'Manter este aparelho', async () => { await pushNow(true); closeDlg(); }), btn('sm pri', 'Usar a nuvem', () => SV.replaceFromCloud(cloud.save))));
      return;
    }
    await pushNow(false); if (manual) toast('Save sincronizado com a nuvem.');
  }
  async function pushNow(force) {
    if (!O.user() || !prof || pushing) return; pushing = true;
    try { const s = SV.data(); const at = force ? Date.now() : (s.t || Date.now()); if (force) { s.t = at; } await O.pushSave(s, at); } finally { pushing = false; }
  }
  SV.onSave(() => { if (!O.user() || !prof) return; clearTimeout(pushT); pushT = setTimeout(() => pushNow(false), 30000); });

  // ── conta ──
  function openAccount() {
    const body = el('div', { class: 'on-box' });
    const render = () => {
      body.innerHTML = ''; const u = O.user();
      if (!u) {
        const email = el('input', { class: 'on-in', type: 'email', placeholder: 'seu@email.com', autocomplete: 'email' }), pw = el('input', { class: 'on-in', type: 'password', placeholder: 'senha (mín. 6 caracteres)', autocomplete: 'current-password' }), msg = el('div', { class: 'dim' });
        const go = async (up) => {
          const v = email.value.trim(); if (!/^\S+@\S+\.\S+$/.test(v)) { msg.textContent = 'Digite um e-mail válido.'; return; }
          if (pw.value.length < 6) { msg.textContent = 'A senha precisa ter pelo menos 6 caracteres.'; return; }
          msg.textContent = 'Aguarde…'; const r = up ? await O.signUpPassword(v, pw.value) : await O.signInPassword(v, pw.value);
          if (!r.ok) msg.textContent = r.err; else if (r.confirm) msg.textContent = 'Conta criada! Abra o e-mail que enviamos para confirmar e depois clique em Entrar.'; else { await loadProfile(); render(); if (prof) await sync(false); }
        };
        body.append(el('p', { class: 'hp-p' }, 'Entre para guardar seu progresso na nuvem e aparecer nos rankings. É opcional: o jogo funciona normalmente sem conta.'), email, pw,
          el('div', { class: 'dlg-foot on-btns' }, btn('go sm2', 'Entrar', () => go(false)), btn('sm', 'Criar conta', () => go(true))), msg);
        return;
      }
      if (!prof) {
        const nick = el('input', { class: 'on-in', maxlength: 16, placeholder: 'Escolha seu apelido (3 a 16)' }), msg = el('div', { class: 'dim' });
        body.append(el('p', { class: 'hp-p' }, `Conectado como ${u.email || 'jogador'}. Falta escolher o apelido que aparece no ranking.`), nick,
          btn('go sm2', 'Salvar apelido', async () => { const r = await O.setNick(nick.value); const d = r.data; if (r.ok && d?.ok) { await loadProfile(); render(); await sync(false); } else msg.textContent = d?.err || r.err || 'Erro ao salvar'; }), msg);
        return;
      }
      const place = el('div', { class: 'ac-place' }, el('span', { class: 'dim' }, 'Sua posição no ranking: carregando…'));
      O.leaderboard('all', '', '', 'run').then((r) => { const me = r.ok && (r.data || []).find((x) => x.me); place.innerHTML = ''; place.append(me ? el('span', {}, 'Sua posição no ranking ', el('b', {}, '#' + me.rank), el('small', {}, ` · ${fmt(me.pts)} pontos`)) : el('span', { class: 'dim' }, r.ok ? 'Você ainda não está no ranking. Termine uma partida de 1 minuto ou mais.' : 'Não foi possível ver sua posição agora.')); });
      const sv = SV.data(), hist = el('div', { class: 'ac-hist' }, ...[['Partidas', sv.runs], ['Vitórias', sv.wins], ['Melhor tempo', fmtTime(sv.best.time)], ['Abates', fmt(sv.kills)]].map(([a, v]) => el('div', {}, el('span', {}, a), el('b', {}, v))));
      body.append(el('p', { class: 'hp-p' }, el('b', {}, prof.nick), el('br'), el('span', { class: 'dim' }, u.email || '')), place, hist,
        el('p', { class: 'hp-p dim' }, prof.save_at ? `Último save na nuvem: ${new Date(prof.save_at).toLocaleString('pt-BR')}` : 'Ainda sem save na nuvem.'),
        el('div', { class: 'dlg-foot on-btns' }, btn('sm', 'Sincronizar agora', async () => { await sync(true); await loadProfile(); render(); }), btn('sm', 'Sair da conta', () => { O.signOut(); prof = null; refreshLabel(); render(); })));
    };
    openDlg('Conta', body); render();
  }

  // ── ranking ──
  function openRank() {
    const st = { tab: 'all', biome: '', diff: '' }, box = el('div', { class: 'on-box' }), list = el('div', { class: 'rk-list' }), tabs = el('div', { class: 'rk-tabs' }), filt = el('div', { class: 'rk-filt' }), dailyBox = el('div', { class: 'rk-daily' });
    const sel = (opts, cur, on) => { const s = el('select', { class: 'on-in sm' }, ...opts.map(([v, t]) => el('option', { value: v, selected: v === cur }, t))); s.addEventListener('change', () => on(s.value)); return s; };
    const TABS = [['all', 'Geral'], ['week', 'Semana'], ['day', 'Desafio do dia'], ['progress', 'Progresso']];
    async function render() {
      tabs.innerHTML = ''; TABS.forEach(([k, t]) => tabs.append(el('button', { class: 'rk-tab' + (st.tab === k ? ' on' : ''), onclick: () => { st.tab = k; render(); } }, t)));
      filt.innerHTML = ''; dailyBox.innerHTML = '';
      if (st.tab === 'all' || st.tab === 'week') filt.append(sel([['', 'Todos os mapas'], ...BIOME_ORDER.map((b) => [b, BIOMES[b].name])], st.biome, (v) => { st.biome = v; render(); }), sel([['', 'Todas as dificuldades'], ...DIFFS.map((d) => [d.id, d.name])], st.diff, (v) => { st.diff = v; render(); }));
      list.innerHTML = ''; list.append(el('div', { class: 'dim' }, 'Carregando…'));
      if (st.tab === 'day') {
        const d = await O.dailyInfo();
        if (d.ok && d.data) { const i = d.data, okB = biomeUnlocked(i.biome, save), okD = diffUnlocked(save, i.diff), can = okB && okD && prof;
          dailyBox.append(el('div', { class: 'rk-dinfo' }, el('b', {}, `Hoje: ${BIOMES[i.biome]?.name || i.biome} · ${diffName(i.diff)}`), el('span', { class: 'dim' }, 'Todos jogam o mesmo mapa e dificuldade; vale o melhor resultado do dia.')),
            can ? btn('go sm2', 'Jogar o desafio de hoje', () => { closeDlg(); startDaily(i); }) : el('div', { class: 'dim' }, !prof ? 'Entre na sua conta e escolha um apelido para participar.' : !okB ? 'Desbloqueie este mapa para participar.' : `Desbloqueie a dificuldade ${diffName(i.diff)} para participar.`)); }
      }
      const r = await O.leaderboard(st.tab === 'all' ? 'all' : st.tab === 'week' ? 'week' : st.tab === 'day' ? 'day' : 'all', st.biome, st.diff, st.tab === 'progress' ? 'progress' : 'run');
      list.innerHTML = ''; if (!r.ok) { list.append(el('div', { class: 'dim' }, 'Não foi possível carregar o ranking: ' + r.err)); return; }
      const rows = r.data || []; if (!rows.length) { list.append(el('div', { class: 'dim' }, 'Ainda não há ninguém aqui. Termine uma partida de 1 minuto ou mais para abrir o ranking.')); return; }
      rows.forEach((x, i) => { if (x.me && i > 0 && x.rank > rows[i - 1].rank + 1) list.append(el('div', { class: 'rk-gap dim' }, '···')); list.append(el('div', { class: 'rk-row' + (x.me ? ' me' : '') }, el('b', { class: 'rk-n' }, '#' + x.rank), el('span', { class: 'rk-nick' }, x.nick, x.victory ? el('i', { title: 'Derrotou o chefe' }, ' ★') : null),
        el('span', { class: 'rk-s dim' }, x.secs ? `${fmtTime(x.secs)} · ${fmt(x.kills)} abates · nv ${x.lvl}` : ''), el('b', { class: 'rk-p' }, fmt(x.pts)))); });
    }
    box.append(tabs, filt, dailyBox, list); openDlg('Ranking', box); render();
  }

  async function onRunEnd(r, daily) {
    if (!O.user() || !prof) return null;
    const res = await O.submitRun(r, daily); const d = res.data; let out = null;
    if (res.ok && d?.ok) { out = { rank: d.rank, pts: d.pts }; if (!H.onRank) toast(`Ranking: #${d.rank} · ${fmt(d.pts)} pontos${daily ? ' (desafio do dia)' : ''}`, 5000); }
    else if (d?.err && d.err !== 'run rejeitada') toast(d.err, 4000);
    pushNow(false); return out;
  }

  async function boot() {
    O.takeRedirect(); O.onChange(refreshLabel); refreshLabel();
    if (O.user()) { await loadProfile(); if (!prof) setTimeout(openAccount, 600); else sync(false); }
    checked = true;
  }
  boot();
  return { buttons: [rankBtn, accountBtn], onRunEnd, openRank, openAccount, label: () => (O.user() ? (prof?.nick ? `Conectado como ${prof.nick}` : 'Escolha seu apelido') : 'Entrar ou criar conta') };
}
