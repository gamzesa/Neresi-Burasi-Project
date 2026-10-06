import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/** Service role istemcisi: RLS'yi aşar. Yalnızca API route'larında/sunucuda kullanılır, asla istemciye gönderilmez. */
export function createServerClient() {
  return createClient(supabaseEnv.url(), supabaseEnv.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
