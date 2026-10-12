-- Eski odaların temizliği (created_at'e göre silme) için indeks.
create index rooms_created_at_idx on public.rooms (created_at);
