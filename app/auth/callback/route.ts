import { NextResponse } from "next/server";
import { z } from "zod";
import { safeNextPath } from "@/lib/auth/redirect";
import { createAuthClient, getAuthUser, getRequestOrigin } from "@/lib/auth/server";
import { claimSession } from "@/lib/game/service";
import { createSupabaseStore } from "@/lib/game/store.supabase";

/**
 * Google girişi ve şifre sıfırlama e-postası, kullanıcıyı buraya bir `code` ile döndürür.
 * Kod oturuma çevrilir; kullanıcının adı yoksa ad seçme sayfasına, varsa gideceği yere yönlendirilir.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const origin = await getRequestOrigin();
  const next = safeNextPath(params.get("next"));
  const claim = z.uuid().safeParse(params.get("claim"));
  const fail = () => NextResponse.redirect(`${origin}/giris?hata=baglanti`);

  const code = params.get("code");
  if (!code) return fail();
  const auth = await createAuthClient();
  const { error } = await auth.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("exchangeCodeForSession", error.code ?? error.message);
    return fail();
  }

  const user = await getAuthUser();
  if (!user) return fail();

  if (!user.username) {
    const query = new URLSearchParams({ next });
    if (claim.success) query.set("claim", claim.data);
    return NextResponse.redirect(`${origin}/kullanici-adi?${query}`);
  }

  // Misafir olarak biten oyun varsa hesaba bağlanır; başarısız olursa giriş yine de geçerlidir.
  if (claim.success) {
    await claimSession(createSupabaseStore(), { sessionId: claim.data, userId: user.id }).catch(() => undefined);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
