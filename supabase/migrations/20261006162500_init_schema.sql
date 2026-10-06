-- Neresi Burası? başlangıç şeması.
-- Row Level Security açıktır ve hiçbir politika tanımlanmaz: istemci (anon/authenticated) tablolara erişemez.
-- Tüm okuma/yazma Next.js API route'larından, service role anahtarıyla yapılır.

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  map text not null check (map in ('world', 'turkey')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  answer_lat double precision not null check (answer_lat between -90 and 90),
  answer_lng double precision not null check (answer_lng between -180 and 180),
  region_code text not null,
  answer_label text not null,
  hints text[] not null,
  is_active boolean not null default true,
  -- İpucu sayısı zorlukla eşleşmeli: kolay 4, orta 3, zor 2.
  constraint questions_hints_match_difficulty check (
    array_length(hints, 1) = case difficulty when 'easy' then 4 when 'medium' then 3 else 2 end
  )
);

create index questions_pick_idx on public.questions (map, difficulty) where is_active;

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  nickname text check (nickname is null or char_length(nickname) between 2 and 20),
  map text not null check (map in ('world', 'turkey')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  question_ids uuid[] not null check (array_length(question_ids, 1) = 5),
  current_index int not null default 0 check (current_index between 0 and 5),
  -- Geçerli soruda şu ana kadar açılan ipucu sayısı (ilk ipucu otomatik açık olduğu için 1'den başlar).
  current_hints_opened int not null default 1 check (current_hints_opened >= 1),
  total_score int not null default 0 check (total_score >= 0),
  status text not null default 'active' check (status in ('active', 'finished')),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index game_sessions_leaderboard_idx
  on public.game_sessions (map, difficulty, total_score desc)
  where status = 'finished' and nickname is not null;

create table public.guesses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  question_id uuid not null references public.questions (id),
  hints_opened int not null check (hints_opened >= 1),
  guess_lat double precision not null check (guess_lat between -90 and 90),
  guess_lng double precision not null check (guess_lng between -180 and 180),
  distance_km double precision not null check (distance_km >= 0),
  region_hit boolean not null,
  score int not null check (score >= 0),
  unique (session_id, question_id)
);

alter table public.questions enable row level security;
alter table public.game_sessions enable row level security;
alter table public.guesses enable row level security;

-- Sıralama: biten ve takma adı olan oyunlar. Yalnızca sunucu (service role) okur.
create view public.leaderboard
  with (security_invoker = true) as
  select id, nickname, map, difficulty, total_score, finished_at
  from public.game_sessions
  where status = 'finished' and nickname is not null;

revoke all on public.questions, public.game_sessions, public.guesses, public.leaderboard
  from anon, authenticated;
