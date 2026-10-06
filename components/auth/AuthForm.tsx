"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, authApi, gameApi } from "@/lib/gameApi";
import { PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from "@/lib/validation";

interface AuthFormProps {
  mode: "login" | "register";
  /** Başarılı girişten sonra gidilecek, site içi yol. */
  next: string;
  /** Misafir olarak bitirilen oyunun kimliği; varsa hesaba bağlanır ve skor sıralamaya girer. */
  claimSessionId?: string;
}

const inputClass =
  "min-h-11 rounded-xl border border-line bg-surface-2 px-3 text-ink placeholder:text-muted focus:border-accent focus:outline-none";

export default function AuthForm({ mode, next, claimSessionId }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 pt-12 pb-8">
      <header className="text-center">
        <Link href="/" className="text-3xl font-extrabold tracking-tight">
          Neresi <span className="text-accent">Burası?</span>
        </Link>
        <h1 className="mt-6 text-xl font-bold">{isRegister ? "Kayıt ol" : "Giriş yap"}</h1>
        {claimSessionId ? (
          <p className="mt-2 text-sm text-muted">
            {isRegister ? "Kayıt olunca" : "Giriş yapınca"} az önce bitirdiğin oyunun skoru hesabına eklenir ve sıralamaya girer.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">Sıralamaya girmek için bir hesabın olmalı. Hesapsız da oynayabilirsin.</p>
        )}
      </header>

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
          {isRegister ? <span className="text-xs font-normal text-muted">En az {PASSWORD_MIN} karakter.</span> : null}
        </label>

        {error ? (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="min-h-11 rounded-xl bg-accent px-4 font-semibold text-accent-ink transition hover:bg-accent-strong disabled:bg-surface-2 disabled:text-muted"
        >
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
    </main>
  );
}
