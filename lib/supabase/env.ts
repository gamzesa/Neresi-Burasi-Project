function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Ortam değişkeni eksik: ${name} (.env dosyasını kontrol et)`);
  return value;
}

/** Sunucu tarafı ortam değişkenleri. */
export const supabaseEnv = {
  anonKey: () => requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  url: () => requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  serviceRoleKey: () => requireEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
};
