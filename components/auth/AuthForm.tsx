"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, authApi, gameApi } from "@/lib/gameApi";
import { PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from "@/lib/validation";
import AuthShell, { inputClass, primaryButtonClass } from "./AuthShell";
import GoogleButton from "./GoogleButton";

interface AuthFormProps {
  mode: "login" | "register";
  /** Başarılı girişten sonra gidilecek, site içi yol. */
  next: string;
  /** Misafir olarak bitirilen oyunun kimliği; varsa hesaba bağlanır ve skor sıralamaya girer. */
  claimSessionId?: string;
  /** Google ile giriş yapılandırıldıysa "Google ile devam et" düğmesi gösterilir. */
  googleEnabled?: boolean;
  /** Başka bir sayfadan gelen hata (ör. Google dönüşü başarısız). */
  initialError?: string;
}

export default function AuthForm({ mode, next, claimSessionId, googleEnabled = false, initialError }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [busy, setBusy] = useState(false);

  // Kayıt/giriş sayfaları arasında geçerken oyun bağlantısı ve yönlendirme korunur.
  const otherQuery = new URLSearchParams({ next });
  if (claimSessionId) otherQuery.set("claim", claimSessionId);
  const otherHref = `${isRegister ? "/giris" : "/kayit"}?${otherQuery}`;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isRegister) await authApi.register({ email, username, password });
      else await authApi.login({ email, password });
      if (claimSessionId) {
        // Skor bağlanamazsa (ör. oyun zaten başkasına ait) giriş yine de başarılıdır.
        await gameApi.claim(claimSessionId).catch(() => undefined);
      }
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.");
      setBusy(false);
    }
  }

  const description = claimSessionId
    ? `${isRegister ? "Kayıt olunca" : "Giriş yapınca"} az önce bitirdiğin oyunun skoru hesabına eklenir ve sıralamaya girer.`
    : "Sıralamaya girmek için bir hesabın olmalı. Hesapsız da oynayabilirsin.";

  return (
    <AuthShell title={isRegister ? "Kayıt ol" : "Giriş yap"} description={description}>
      {googleEnabled ? (
        <>
          <GoogleButton next={next} claimSessionId={claimSessionId} />
          <div className="flex items-center gap-3 text-xs text-muted" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            veya e-posta ile
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      ) : null}

      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          E-posta
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        {isRegister ? (
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Kullanıcı adı
            <input
              required
              autoComplete="username"
              minLength={USERNAME_MIN}
              maxLength={USERNAME_MAX}
              pattern="[A-Za-z0-9_]+"
              title="Yalnızca harf, rakam ve alt çizgi (Türkçe karakter olmadan)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
            />
            <span className="text-xs font-normal text-muted">
              {USERNAME_MIN}–{USERNAME_MAX} karakter; harf, rakam ve alt çizgi. Sıralamada bu ad görünür.
            </span>
          </label>
        ) : null}
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Şifre
          <input
            type="password"
            required
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={isRegister ? PASSWORD_MIN : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          {isRegister ? (
            <span className="text-xs font-normal text-muted">En az {PASSWORD_MIN} karakter.</span>
          ) : (
            <Link href="/sifremi-unuttum" className="self-end text-xs font-normal text-accent underline">
              Şifremi unuttum
            </Link>
          )}
        </label>

        {error ? (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? "Lütfen bekle…" : isRegister ? "Kayıt ol" : "Giriş yap"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        {isRegister ? "Zaten hesabın var mı?" : "Hesabın yok mu?"}{" "}
        <Link href={otherHref} className="font-semibold text-accent underline">
          {isRegister ? "Giriş yap" : "Kayıt ol"}
        </Link>
      </p>
      <Link href={next} className="text-center text-sm text-muted underline hover:text-ink">
        Hesapsız devam et
      </Link>
    </AuthShell>
  );
}
