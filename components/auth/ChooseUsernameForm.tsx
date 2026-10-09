"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, authApi, gameApi } from "@/lib/gameApi";
import { USERNAME_MAX, USERNAME_MIN } from "@/lib/validation";
import AuthShell, { inputClass, primaryButtonClass } from "./AuthShell";

interface ChooseUsernameFormProps {
  next: string;
  claimSessionId?: string;
}

/** Google ile ilk kez giren kullanıcı, sıralamada görünecek kullanıcı adını burada seçer. */
export default function ChooseUsernameForm({ next, claimSessionId }: ChooseUsernameFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authApi.chooseUsername(username);
      if (claimSessionId) await gameApi.claim(claimSessionId).catch(() => undefined);
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.");
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Bir kullanıcı adı seç" description="Sıralamada bu adla görüneceksin.">
      <form onSubmit={submit} className="flex flex-col gap-3">
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
            {USERNAME_MIN}–{USERNAME_MAX} karakter; harf, rakam ve alt çizgi.
          </span>
        </label>
        {error ? (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? "Kaydediliyor…" : "Devam et"}
        </button>
      </form>
    </AuthShell>
  );
}
