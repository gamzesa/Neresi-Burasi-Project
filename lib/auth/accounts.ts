import "server-only";
import { GameError } from "@/lib/game/service";
import { createServerClient } from "@/lib/supabase/server";
import { createAuthClient, getAuthUser, getRequestOrigin } from "./server";

const UNIQUE_VIOLATION = "23505";

/** Kullanıcı adı benzersizliği büyük/küçük harf fark etmeksizin denetlenir; `_` ve `%` LIKE joker karakterleridir, kaçırılır. */
async function isUsernameTaken(username: string): Promise<boolean> {
  const pattern = username.replace(/[\\%_]/g, "\\$&");
  const { data } = await createServerClient().from("profiles").select("user_id").ilike("username", pattern).maybeSingle();
  return data !== null;
}

/**
 * Hesap açar: kullanıcı adı benzersizliğini denetler, kullanıcıyı e-posta doğrulaması istemeden
 * (doğrulanmış olarak) oluşturur, profili yazar ve oturumu çerezle başlatır.
 */
export async function registerAccount(input: { email: string; username: string; password: string }) {
  const admin = createServerClient();

  if (await isUsernameTaken(input.username)) throw new GameError(409, "Bu kullanıcı adı alınmış.");

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

/**
 * Şifre sıfırlama e-postası gönderir. E-postanın kayıtlı olup olmadığı ASLA belli edilmez
 * (hesap taramasını önlemek için); hata olsa bile aynı yanıt döner.
 */
export async function requestPasswordReset(email: string) {
  const auth = await createAuthClient();
  const origin = await getRequestOrigin();
  const { error } = await auth.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/sifre-yenile")}`,
  });
  if (error) console.error("resetPasswordForEmail", error.code ?? error.message);
  return { ok: true as const };
}

/** Sıfırlama bağlantısıyla (ya da girişli olarak) açılmış oturumda yeni şifreyi kaydeder. */
export async function resetPassword(password: string) {
  const auth = await createAuthClient();
  const { data } = await auth.auth.getUser();
  if (!data.user) throw new GameError(401, "Bağlantının süresi dolmuş. Şifre sıfırlamayı yeniden iste.");

  const { error } = await auth.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") throw new GameError(400, "Yeni şifre eskisiyle aynı olamaz.");
    if (error.code === "weak_password") throw new GameError(400, "Şifre çok zayıf, daha güçlü bir şifre seç.");
    console.error("updateUser", error);
    throw new GameError(500, "Şifre değiştirilemedi.");
  }
  return { ok: true as const };
}

/** Google ile ilk kez giren (profili olmayan) kullanıcı için kullanıcı adını kaydeder. */
export async function chooseUsername(username: string) {
  const authUser = await getAuthUser();
  if (!authUser) throw new GameError(401, "Önce giriş yapmalısın.");
  if (authUser.username) throw new GameError(409, "Bu hesabın zaten bir kullanıcı adı var.");
  if (await isUsernameTaken(username)) throw new GameError(409, "Bu kullanıcı adı alınmış.");

  const { error } = await createServerClient().from("profiles").insert({ user_id: authUser.id, username });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) throw new GameError(409, "Bu kullanıcı adı alınmış.");
    console.error("profile insert", error);
    throw new GameError(500, "Kullanıcı adı kaydedilemedi.");
  }
  return { username };
}
