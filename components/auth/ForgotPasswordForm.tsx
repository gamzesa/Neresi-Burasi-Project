"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ApiError, authApi } from "@/lib/gameApi";
import AuthShell, { inputClass, primaryButtonClass } from "./AuthShell";

/** Şifremi unuttum: e-posta adresine sıfırlama bağlantısı gönderir. */
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Şifremi unuttum"
      description="E-posta adresini yaz, şifreni yenilemen için bir bağlantı gönderelim."
    >
      {sent ? (
        <div role="status" className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">
          <p className="font-semibold">E-postanı kontrol et</p>
          <p className="mt-1 text-muted">
            Bu adres kayıtlıysa şifre yenileme bağlantısını gönderdik. Gelmediyse spam klasörüne bak. Bağlantıyı bu
            isteği yaptığın tarayıcıda aç.
          </p>
        </div>
      ) : (
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
          {error ? (
            <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? "Gönderiliyor…" : "Bağlantı gönder"}
          </button>
        </form>
      )}
      <Link href="/giris" className="text-center text-sm text-muted underline hover:text-ink">
        Giriş sayfasına dön
      </Link>
    </AuthShell>
  );
}
