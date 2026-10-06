-- Hesap sistemi: sıralamaya yalnızca kayıtlı kullanıcılar girer; sıralamada kullanıcı adı görünür.
-- Kimlik doğrulama Supabase Auth'ta (auth.users) tutulur; kullanıcı adı `profiles` tablosundadır.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

-- Kullanıcı adı büyük/küçük harf fark etmeksizin benzersizdir.
create unique index profiles_username_lower_idx on public.profiles (lower(username));

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;

-- Eski serbest takma ad sistemi kalkıyor.
drop view if exists public.leaderboard;
drop index if exists public.game_sessions_leaderboard_idx;
alter table public.game_sessions drop column nickname;

-- Oyun, başlatıldığında girişli kullanıcıya bağlanır (misafir oyunlarda boştur; sonradan sahiplenilebilir).
alter table public.game_sessions
  add column user_id uuid references auth.users (id) on delete set null;

create index game_sessions_leaderboard_idx
  on public.game_sessions (map, difficulty, total_score desc)
  where status = 'finished' and user_id is not null;

-- Sıralama: her kullanıcının filtreye uyan EN İYİ oyunu sayılır. İlk `p_limit` kayıt ile birlikte,
-- `p_user` verilmişse o kullanıcının kendi derecesi de (ilk `p_limit` dışında olsa bile) döner.
create or replace function public.get_leaderboard(
  p_map text,
  p_difficulty text,
  p_since timestamptz,
  p_limit int,
  p_user uuid
)
returns table (
  rank bigint,
  username text,
  difficulty text,
  total_score int,
  finished_at timestamptz,
  is_me boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  with best as (
    select distinct on (s.user_id)
      s.user_id, p.username, s.difficulty, s.total_score, s.finished_at
    from public.game_sessions s
    join public.profiles p on p.user_id = s.user_id
    where s.status = 'finished'
      and s.map = p_map
      and (p_difficulty is null or s.difficulty = p_difficulty)
      and (p_since is null or s.finished_at >= p_since)
    order by s.user_id, s.total_score desc, s.finished_at asc
  ),
  ranked as (
    select
      row_number() over (order by total_score desc, finished_at asc) as rank,
      user_id, username, difficulty, total_score, finished_at,
      (p_user is not null and user_id = p_user) as is_me
    from best
  )
  select rank, username, difficulty, total_score, finished_at, is_me
  from ranked
  where rank <= p_limit or is_me
  order by rank;
$$;

revoke all on function public.get_leaderboard(text, text, timestamptz, int, uuid) from public, anon, authenticated;
grant execute on function public.get_leaderboard(text, text, timestamptz, int, uuid) to service_role;
