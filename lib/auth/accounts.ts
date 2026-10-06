import "server-only";
import { GameError } from "@/lib/game/service";
import { createServerClient } from "@/lib/supabase/server";
import { createAuthClient } from "./server";

const UNIQUE_VIOLATION = "23505";

/**
 * Hesap açar: kullanıcı adı benzersizliğini denetler, kullanıcıyı e-posta doğrulaması istemeden
 * (doğrulanmış olarak) oluşturur, profili yazar ve oturumu çerezle başlatır.
 */
export async function registerAccount(input: { email: string; username: string; password: string }) {
  const admin = createServerClient();

  const { data: taken } = await admin
    .from("profiles")
    .select("user_id")
    .ilike("username", input.username.replace(/[\%_]/g, "\$&"))
    .maybeSingle();
  if (taken) throw new GameError(409, "Bu kullanıcı adı alınmış.");

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    if (createError?.code === "email_exists") throw new GameError(409, "Bu e-posta ile zaten bir hesap var.");
    if (createError?.code === "weak_password") throw new GameError(400, "Şifre çok zayıf, daha güçlü bir şifre seç.");
    console.error("createUser", createError);
    throw new GameError(500, "Hesap oluşturulamadı.");
  }

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ user_id: created.user.id, username: input.username });
  if (profileError) {
    // Yarım hesap kalmasın.
    await admin.auth.admin.deleteUser(created.user.id);
    if (profileError.code === UNIQUE_VIOLATION) throw new GameError(409, "Bu kullanıcı adı alınmış.");
    console.error("profile insert", profileError);
    throw new GameError(500, "Hesap oluşturulamadı.");
  }

  const auth = await createAuthClient();
  const { error: signInError } = await auth.auth.signInWithPassword({ email: input.email, password: input.password });
  if (signInError) throw new GameError(500, "Hesap açıldı ama giriş yapılamadı. Giriş sayfasından dene.");
  return { username: input.username };
}

export async function loginAccount(input: { email: string; password: string }) {
  const auth = await createAuthClient();
  const { data, error } = await auth.auth.signInWithPassword(input);
  if (error || !data.user) throw new GameError(401, "E-posta veya şifre hatalı.");

  const { data: profile } = await createServerClient()
    .from("profiles")
    .select("username")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!profile) throw new GameError(403, "Bu hesabın profili bulunamadı.");
  return { username: profile.username as string };
}

export async function logoutAccount() {
  const auth = await createAuthClient();
  await auth.auth.signOut();
  return { ok: true as const };
}
