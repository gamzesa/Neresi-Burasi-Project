import "server-only";
import { createServerClient as createSsrClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { supabaseEnv } from "@/lib/supabase/env";

export interface CurrentUser {
  id: string;
  username: string;
}

/** Çerezlerdeki oturumu okuyan/yazan Supabase Auth istemcisi (yalnızca sunucuda). */
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createSsrClient(supabaseEnv.url(), supabaseEnv.anonKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          for (const { name, value, options } of items) cookieStore.set(name, value, options);
        } catch {
          // Sunucu bileşeninden çağrıldığında çerez yazılamaz; oturum yenilemesi bir sonraki API isteğinde olur.
        }
      },
    },
  });
}

/** Giriş yapmış kullanıcıyı (kimliği sunucuda doğrulanarak) ve kullanıcı adını döner; misafirde null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const auth = await createAuthClient();
  const { data, error } = await auth.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await createServerClient()
    .from("profiles")
    .select("username")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!profile) return null;
  return { id: data.user.id, username: profile.username as string };
}
