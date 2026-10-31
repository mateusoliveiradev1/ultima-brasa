// Cliente enxuto do Supabase (Auth + RPC) sem dependências. Sessão em localStorage.
import { CFG as C0 } from './online.config.js';

const cfg = () => (typeof window !== 'undefined' && window.__ONLINE_CFG) || C0;
export const enabled = () => !!(cfg().url && cfg().key);
const SK = 'ultimabrasa.auth.v1', subs = new Set();
let sess = null; try { sess = JSON.parse(localStorage.getItem(SK)); } catch { sess = null; }
const put = (s) => { sess = s; try { s ? localStorage.setItem(SK, JSON.stringify(s)) : localStorage.removeItem(SK); } catch { /* sem storage */ } subs.forEach((f) => f()); };
export const onChange = (f) => subs.add(f);
export const user = () => sess?.user || null;

const decode = (jwt) => { try { const j = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); return { id: j.sub, email: j.email }; } catch { return null; } };
/** Chamar no boot: captura os tokens que o Supabase devolve no #hash após o login (Google ou link por e-mail). */
export function takeRedirect() {
  if (!enabled() || !location.hash.includes('access_token')) return false;
  const p = new URLSearchParams(location.hash.slice(1)), at = p.get('access_token'); if (!at) return false;
  put({ access_token: at, refresh_token: p.get('refresh_token'), expires_at: +p.get('expires_at') || Math.floor(Date.now() / 1000) + (+p.get('expires_in') || 3600), user: decode(at) });
  history.replaceState(null, '', location.pathname + location.search); return true;
}

async function raw(path, { method = 'GET', body, token } = {}) {
  try {
    const r = await fetch(cfg().url + path, { method, headers: { apikey: cfg().key, Authorization: 'Bearer ' + (token || cfg().key), 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch { j = null; }
    if (!r.ok) return { ok: false, status: r.status, err: j?.message || j?.msg || j?.error_description || `erro ${r.status}` };
    return { ok: true, data: j };
  } catch { return { ok: false, err: 'sem conexão' }; }
}
async function token() {
  if (!sess) return null;
  if (sess.expires_at - 60 < Date.now() / 1000) {
    const r = await raw('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: sess.refresh_token } });
    if (!r.ok || !r.data?.access_token) { if (r.status === 400 || r.status === 401) put(null); return null; }
    const d = r.data; put({ access_token: d.access_token, refresh_token: d.refresh_token || sess.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600), user: decode(d.access_token) || sess.user });
  }
  return sess.access_token;
}
async function rpc(fn, args = {}, auth = true) {
  const t = auth ? await token() : null; if (auth && !t) return { ok: false, err: 'faça login' };
  return raw('/rest/v1/rpc/' + fn, { method: 'POST', body: args, token: t });
}

const back = () => location.origin + location.pathname;
export const signInGoogle = () => { location.href = `${cfg().url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(back())}`; };
export const signInEmail = (email) => raw('/auth/v1/otp?redirect_to=' + encodeURIComponent(back()), { method: 'POST', body: { email, create_user: true } });
export const signOut = () => put(null);

export const myProfile = () => rpc('my_profile');
export const setNick = (nick) => rpc('set_nick', { p_nick: nick });
export const pushSave = (save, at) => rpc('save_push', { p_save: save, p_at: at });
export const pullSave = () => rpc('save_pull');
export const dailyInfo = () => rpc('daily_info', {}, false);
export const leaderboard = (scope, biome, diff, board) => rpc('leaderboard', { p_scope: scope, p_biome: biome || null, p_diff: diff || null, p_board: board || 'run', p_limit: 50 }, !!sess);
export const submitRun = (r, daily) => rpc('submit_run', { p_biome: r.biome, p_diff: r.diff || 'normal', p_depth: r.depth || 1, p_secs: Math.round(r.time), p_kills: r.kills | 0, p_lvl: r.level | 0, p_combo: r.combo | 0, p_victory: !!r.victory, p_daily: !!daily });
