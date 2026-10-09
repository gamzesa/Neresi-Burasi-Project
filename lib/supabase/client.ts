import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";

/**
 * Tarayıcı istemcisi (anon anahtar); yalnızca Google ile giriş gibi tarayıcıda başlayan kimlik doğrulama için.
 * Oyun verisi tablolara değil API'ye bağlıdır (RLS tarayıcıyı tablolardan dışlar).
 * NEXT_PUBLIC_ değişkenleri tarayıcı paketine yalnızca doğrudan `process.env.ADI` yazımıyla gömülür.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase ortam değişkenleri eksik (.env dosyasını kontrol et)");
  return createSsrBrowserClient(url, anonKey);
}
