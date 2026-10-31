-- Última Brasa — backend (Supabase / Postgres)
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute uma vez.
-- Princípios: ninguém escreve direto nas tabelas; tudo passa por funções que validam.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nick text not null,
  save jsonb,
  save_at bigint not null default 0,          -- carimbo (ms) do último save aceito
  progress int not null default 0,            -- derivado do save (ranking de progresso)
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_nick_ci on public.profiles (lower(nick));

create table if not exists public.runs (
  id bigserial primary key,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  biome text not null,
  diff text not null,
  depth int not null default 1,
  secs int not null,
  kills int not null,
  lvl int not null,
  combo int not null default 0,
  victory boolean not null default false,
  pts int not null,
  daily date,                                  -- preenchido quando for o desafio do dia
  created_at timestamptz not null default now()
);
create index if not exists runs_board on public.runs (biome, diff, pts desc);
create index if not exists runs_user on public.runs (user_id, created_at desc);
create index if not exists runs_daily on public.runs (daily, pts desc) where daily is not null;

alter table public.profiles enable row level security;
alter table public.runs enable row level security;
-- sem policies: acesso direto negado; só as funções abaixo (security definer) leem/escrevem.

-- ───────── utilidades ─────────
create or replace function public.ub_points(p_secs int, p_kills int, p_lvl int, p_victory boolean, p_diff text)
returns int language sql immutable as $$
  select floor((p_kills + p_lvl * 25 + p_secs * 3 + case when p_victory then 3000 else 0 end)
    * case p_diff when 'pesadelo' then 1.5 when 'calamidade' then 2.5 when 'abissal' then 4 else 1 end)::int
$$;

-- desafio do dia: mapa e dificuldade determinísticos pela data (UTC)
create or replace function public.daily_info()
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'day', (now() at time zone 'utc')::date,
    'seed', (extract(epoch from (now() at time zone 'utc')::date)::bigint / 86400)::int,
    'biome', (array['ruinas','pantano','deserto','tundra'])[1 + ((extract(epoch from (now() at time zone 'utc')::date)::bigint / 86400)::int % 4)],
    'diff',  (array['normal','pesadelo','normal','calamidade','pesadelo','normal','abissal'])[1 + ((extract(epoch from (now() at time zone 'utc')::date)::bigint / 86400)::int % 7)]
  )
$$;

-- ───────── perfil ─────────
create or replace function public.set_nick(p_nick text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); n text := btrim(p_nick);
begin
  if u is null then raise exception 'login necessário'; end if;
  if n !~ '^[A-Za-z0-9_ ]{3,16}$' then return jsonb_build_object('ok', false, 'err', 'Use 3 a 16 letras, números, espaço ou _'); end if;
  if lower(n) ~ '(admin|moderador|fdp|puta|caralho|nazi|hitler)' then return jsonb_build_object('ok', false, 'err', 'Apelido não permitido'); end if;
  begin
    insert into profiles (user_id, nick) values (u, n)
      on conflict (user_id) do update set nick = excluded.nick;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'err', 'Esse apelido já está em uso');
  end;
  return jsonb_build_object('ok', true, 'nick', n);
end $$;

create or replace function public.my_profile()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('nick', nick, 'save_at', save_at, 'progress', progress) from profiles where user_id = auth.uid()), 'null'::jsonb)
$$;

-- ───────── salvar / carregar na nuvem ─────────
-- Regra: aceita se o save enviado for mais novo que o da nuvem; senão devolve o da nuvem.
create or replace function public.save_push(p_save jsonb, p_at bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); cur bigint; prog int; milestones int;
begin
  if u is null then raise exception 'login necessário'; end if;
  if not exists (select 1 from profiles where user_id = u) then return jsonb_build_object('ok', false, 'err', 'defina um apelido primeiro'); end if;
  if pg_column_size(p_save) > 200000 then return jsonb_build_object('ok', false, 'err', 'save grande demais'); end if;
  select save_at into cur from profiles where user_id = u;
  if p_at <= cur then
    return jsonb_build_object('ok', true, 'newer', true, 'save', (select save from profiles where user_id = u), 'save_at', cur);
  end if;
  milestones := coalesce((select count(*) from jsonb_object_keys(coalesce(p_save->'milestones', '{}'::jsonb))), 0);
  prog := least(2000000, greatest(0,
      coalesce((p_save->>'cinzas')::int, 0) * 100
    + coalesce((p_save->>'wins')::int, 0) * 10
    + milestones * 25
    + coalesce((p_save->>'rebirths')::int, 0) * 200));
  update profiles set save = p_save, save_at = p_at, progress = prog where user_id = u;
  return jsonb_build_object('ok', true, 'newer', false, 'save_at', p_at, 'progress', prog);
end $$;

create or replace function public.save_pull()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('save', save, 'save_at', save_at) from profiles where user_id = auth.uid()), 'null'::jsonb)
$$;

-- ───────── enviar run ─────────
create or replace function public.submit_run(p_biome text, p_diff text, p_depth int, p_secs int, p_kills int, p_lvl int, p_combo int, p_victory boolean, p_daily boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); lastrun timestamptz; v_pts int; d jsonb := public.daily_info(); rank_ int;
begin
  if u is null then raise exception 'login necessário'; end if;
  if not exists (select 1 from profiles where user_id = u) then return jsonb_build_object('ok', false, 'err', 'defina um apelido primeiro'); end if;
  if p_biome not in ('ruinas','pantano','deserto','tundra') or p_diff not in ('normal','pesadelo','calamidade','abissal') then return jsonb_build_object('ok', false, 'err', 'dados inválidos'); end if;
  -- plausibilidade: limites generosos, só barram números impossíveis
  if p_secs < 20 or p_secs > 5400 or p_kills < 0 or p_kills > p_secs * 25 + 50 or p_lvl < 1 or p_lvl > 150 or p_combo < 0 or p_combo > p_kills
     or p_depth < 1 or p_depth > 30 or (p_victory and p_secs < 280) or p_lvl > 1 + p_secs / 3 + 5 then
    return jsonb_build_object('ok', false, 'err', 'run rejeitada'); end if;
  select last_run_at into lastrun from profiles where user_id = u;
  if lastrun is not null and now() - lastrun < interval '20 seconds' then return jsonb_build_object('ok', false, 'err', 'calma aí: envios rápidos demais'); end if;
  if p_daily and (d->>'biome' <> p_biome or d->>'diff' <> p_diff) then return jsonb_build_object('ok', false, 'err', 'não é o desafio de hoje'); end if;
  v_pts := public.ub_points(p_secs, p_kills, p_lvl, p_victory, p_diff);
  insert into runs (user_id, biome, diff, depth, secs, kills, lvl, combo, victory, pts, daily)
    values (u, p_biome, p_diff, p_depth, p_secs, p_kills, p_lvl, p_combo, p_victory, v_pts, case when p_daily then (d->>'day')::date end);
  update profiles set last_run_at = now() where user_id = u;
  select count(*) + 1 into rank_ from (select user_id, max(pts) m from runs where biome = p_biome and diff = p_diff group by user_id) t where t.m > v_pts;
  return jsonb_build_object('ok', true, 'pts', v_pts, 'rank', rank_);
end $$;

-- ───────── rankings ─────────
-- scope: 'all' | 'week' | 'day' (desafio diário) ; board: 'run' | 'progress'
create or replace function public.leaderboard(p_scope text, p_biome text default null, p_diff text default null, p_board text default 'run', p_limit int default 50)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare res jsonb; lim int := least(greatest(p_limit, 1), 100); me uuid := auth.uid(); d jsonb := public.daily_info();
begin
  if p_board = 'progress' then
    select coalesce(jsonb_agg(x order by (x->>'rank')::int), '[]'::jsonb) into res from (
      select jsonb_build_object('rank', row_number() over (order by progress desc, created_at), 'nick', nick, 'pts', progress, 'me', user_id = me) x
      from profiles where progress > 0 order by progress desc, created_at limit lim) q;
    return res;
  end if;
  select coalesce(jsonb_agg(x order by (x->>'rank')::int), '[]'::jsonb) into res from (
    select jsonb_build_object('rank', row_number() over (order by b.pts desc, b.created_at), 'nick', p.nick, 'pts', b.pts, 'secs', b.secs, 'kills', b.kills, 'lvl', b.lvl, 'victory', b.victory, 'me', b.user_id = me) x
    from (
      select distinct on (r.user_id) r.* from runs r
      where (p_scope <> 'day' and (p_biome is null or r.biome = p_biome) and (p_diff is null or r.diff = p_diff)
             and (p_scope <> 'week' or r.created_at >= date_trunc('week', now())))
         or (p_scope = 'day' and r.daily = (d->>'day')::date)
      order by r.user_id, r.pts desc, r.created_at
    ) b join profiles p on p.user_id = b.user_id
    order by b.pts desc, b.created_at limit lim) q;
  return res;
end $$;

grant usage on schema public to anon, authenticated;
revoke all on public.profiles, public.runs from anon, authenticated;
grant execute on function public.daily_info() to anon, authenticated;
grant execute on function public.leaderboard(text, text, text, text, int) to anon, authenticated;
grant execute on function public.set_nick(text), public.my_profile(), public.save_push(jsonb, bigint), public.save_pull(),
  public.submit_run(text, text, int, int, int, int, int, boolean, boolean) to authenticated;
