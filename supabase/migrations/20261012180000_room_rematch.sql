-- Çok oyunculu mod: oyun bitince "tekrar oyna" isteği.
-- rematch_by: isteği yapan oyuncunun koltuğu; rematch_status: bekliyor / reddedildi / kabul edildi;
-- rematch_code: kabul edilince açılan yeni odanın kodu.

alter table public.rooms
  add column rematch_by int check (rematch_by in (0, 1)),
  add column rematch_status text check (rematch_status in ('pending', 'declined', 'accepted')),
  add column rematch_code text;
