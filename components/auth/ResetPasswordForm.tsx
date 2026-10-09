"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, authApi } from "@/lib/gameApi";
import { PASSWORD_MIN } from "@/lib/validation";
import AuthShell, { inputClass, primaryButtonClass } from "./AuthShell";

/** Sıfırlama bağlantısıyla gelen kullanıcı yeni şifresini burada belirler. */
export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== again) {
      setError("Şifreler aynı değil.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await authApi.resetPassword(password);
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.");
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Yeni şifre belirle" description="Hesabın için yeni bir şifre seç.">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Yeni şifre
          <input
            type="password"
            required
            minLength={PASSWORD_MIN}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <span className="text-xs font-normal text-muted">En az {PASSWORD_MIN} karakter.</span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Yeni şifre (tekrar)
          <input
            type="password"
            required
            minLength={PASSWORD_MIN}
            autoComplete="new-password"
            value={again}
            onChange={(e) => setAgain(e.target.value)}
            className={inputClass}
          />
        </label>
        {error ? (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? "Kaydediliyor…" : "Şifreyi kaydet"}
        </button>
      </form>
    </AuthShell>
  );
}
