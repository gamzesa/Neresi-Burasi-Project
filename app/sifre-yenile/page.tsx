import Link from "next/link";
import AuthShell, { primaryButtonClass } from "@/components/auth/AuthShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { getAuthUser } from "@/lib/auth/server";

export const metadata = { title: "Yeni şifre · Neresi Burası?" };

export default async function ResetPasswordPage() {
  // Sıfırlama e-postasındaki bağlantı /auth/callback üzerinden oturum açar; oturum yoksa bağlantı geçersizdir.
  if (!(await getAuthUser())) {
    return (
      <AuthShell title="Bağlantı geçersiz" description="Şifre sıfırlama bağlantısının süresi dolmuş ya da bağlantı bu tarayıcıda açılmamış olabilir.">
        <Link href="/sifremi-unuttum" className={`${primaryButtonClass} flex items-center justify-center`}>
          Yeni bağlantı iste
        </Link>
      </AuthShell>
    );
  }
  return <ResetPasswordForm />;
}
