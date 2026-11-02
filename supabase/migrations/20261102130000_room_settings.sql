-- Çok oyunculu oda ayarları: soru başına süre (30/60/90 sn) ve soru sayısı (5/10/15).
-- Soru sayısı ayrı bir sütun değil, question_ids dizisinin uzunluğudur. Değişiklikler mevcut odaları bozmaz:
-- yeni sütun varsayılan 30 sn alır, kısıtlar yalnızca gevşetilir.

alter table public.rooms
  add column seconds_per_question int not null default 30
    check (seconds_per_question in (30, 60, 90));

alter table public.rooms drop constraint rooms_question_ids_check;
alter table public.rooms
  add constraint rooms_question_ids_check check (array_length(question_ids, 1) in (5, 10, 15));

alter table public.rooms drop constraint rooms_current_index_check;
alter table public.rooms
  add constraint rooms_current_index_check check (current_index between 0 and 14);
