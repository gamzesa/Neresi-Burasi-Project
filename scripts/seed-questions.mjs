// data/questions/*.json dosyalarını Supabase `questions` tablosuna yükler (tekrar çalıştırılabilir).
// Kullanım: npm run seed:questions   (.env içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY dolu olmalı)
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(".env içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY dolu olmalı.");
  process.exit(1);
}

/** Aynı soru her çalıştırmada aynı kimliği alır; böylece betik tekrar çalıştırılınca yinelenme olmaz. */
function stableId(map, label) {
  const h = createHash("sha256").update(`${map}|${label}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

for (const file of ["world", "turkey"]) {
  const { map, questions } = JSON.parse(readFileSync(`data/questions/${file}.json`, "utf8"));
  const rows = questions.map((q) => ({
    id: stableId(map, q.answer_label),
    map,
    difficulty: q.difficulty,
    answer_lat: q.answer_lat,
    answer_lng: q.answer_lng,
    region_code: q.region_code,
    answer_label: q.answer_label,
    hints: q.hints,
    is_active: true,
  }));
  const { error } = await supabase.from("questions").upsert(rows, { onConflict: "id" });
  if (error) {
    console.error(`${map}: yükleme başarısız:`, error.message);
    process.exit(1);
  }
  console.log(`${map}: ${rows.length} soru yüklendi`);
}
