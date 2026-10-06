import { createClient } from "@supabase/supabase-js";

/**
 * Tarayıcı istemcisi (anon anahtar). Tablolara erişimi RLS kapattığı için oyun verisi yalnızca API üzerinden alınır.
 * NEXT_PUBLIC_ değişkenleri tarayıcı paketine yalnızca doğrudan `process.env.ADI` yazımıyla gömülür.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase ortam değişkenleri eksik (.env dosyasını kontrol et)");
  return createClient(url, anonKey);
}
