import "server-only";
import { createServerClient as createSsrClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
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

/**
 * Giriş yapmış kullanıcıyı (kimliği sunucuda doğrulanarak) döner; kullanıcı adı yoksa `username` null olur
 * (ör. Google ile yeni girmiş, henüz ad seçmemiş kullanıcı). Misafirde null.
 */
export async function getAuthUser(): Promise<{ id: string; username: string | null } | null> {
  const auth = await createAuthClient();
  const { data, error } = await auth.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await createServerClient()
    .from("profiles")
    .select("username")
    .eq("user_id", data.user.id)
    .maybeSingle();
  return { id: data.user.id, username: (profile?.username as string | undefined) ?? null };
}

/** Giriş yapmış ve kullanıcı adı olan kullanıcıyı döner; aksi halde (misafir ya da adsız) null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const user = await getAuthUser();
  if (!user || !user.username) return null;
  return { id: user.id, username: user.username };
}

/** İsteğin geldiği sitenin adresi (ör. https://site.com); e-posta ve giriş yönlendirmeleri için. */
export async function getRequestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}
