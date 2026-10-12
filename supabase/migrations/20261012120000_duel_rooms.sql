-- Çok oyunculu (arkadaşla karşılıklı) mod: oda, oyuncular ve tahminler.
-- Row Level Security açıktır ve politika tanımlanmaz; tüm erişim API route'larından service role ile yapılır.

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  -- Arkadaşa verilen kısa oda kodu (belirsiz harfler yok: 0/O, 1/I).
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{5}$'),
  map text not null check (map in ('world', 'turkey')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  question_ids uuid[] not null check (array_length(question_ids, 1) = 5),
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  current_index int not null default 0 check (current_index between 0 and 4),
  -- Geçerli sorunun açılış zamanı; gelecekte olabilir (geri sayım). Bekleme odasında boştur.
  question_started_at timestamptz,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  -- 0 = odayı kuran, 1 = katılan.
  seat int not null check (seat in (0, 1)),
  -- Girişli kullanıcıysa hesabı; misafirde boş.
  user_id uuid references auth.users (id) on delete set null,
  -- Oyuncunun gizli anahtarının SHA-256 özeti; anahtarın kendisi saklanmaz.
  token_hash text not null,
  nickname text not null check (char_length(nickname) between 2 and 20),
  created_at timestamptz not null default now(),
  unique (room_id, seat)
);

create table public.room_guesses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  player_id uuid not null references public.room_players (id) on delete cascade,
  question_id uuid not null references public.questions (id),
  guess_lat double precision not null check (guess_lat between -90 and 90),
  guess_lng double precision not null check (guess_lng between -180 and 180),
  distance_km double precision not null check (distance_km >= 0),
  region_hit boolean not null,
  score int not null check (score >= 0),
  elapsed_ms int not null check (elapsed_ms >= 0),
  guessed_at timestamptz not null,
  unique (player_id, question_id)
);

create index room_guesses_room_idx on public.room_guesses (room_id);

alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.room_guesses enable row level security;
revoke all on public.rooms, public.room_players, public.room_guesses from anon, authenticated;
