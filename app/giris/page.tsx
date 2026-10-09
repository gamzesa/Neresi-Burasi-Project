import { redirect } from "next/navigation";
import { z } from "zod";
import AuthForm from "@/components/auth/AuthForm";
import { safeNextPath } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/server";

export const metadata = { title: "Giriş yap · Neresi Burası?" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; claim?: string; hata?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  if (await getCurrentUser()) redirect(next);
  const claim = z.uuid().safeParse(params.claim);
  return (
    <AuthForm
      mode="login"
      next={next}
      claimSessionId={claim.success ? claim.data : undefined}
      googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "true"}
      initialError={
        params.hata === "baglanti"
          ? "Giriş tamamlanamadı: bağlantının süresi dolmuş ya da farklı bir tarayıcıda açılmış olabilir. Tekrar dene."
          : undefined
      }
    />
  );
}
