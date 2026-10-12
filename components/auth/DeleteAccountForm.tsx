"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, authApi } from "@/lib/gameApi";
import AuthShell, { inputClass } from "./AuthShell";

/** Hesabı kalıcı silmeden önce kullanıcı adını yazdırarak onay alır. */
export default function DeleteAccountForm({ confirmWord }: { confirmWord: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const matches = value.trim().toLowerCase() === confirmWord.toLowerCase();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!matches) return;
    setBusy(true);
    setError(null);
    try {
      await authApi.deleteAccount(value);
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.");
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Hesabını sil"
      description="Bu işlem geri alınamaz. E-postan ve kullanıcı adın silinir, sıralamadan düşersin; geçmiş oyunların kimliksiz kalır."
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Onaylamak için <span className="text-danger">{confirmWord}</span> yaz
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            className={inputClass}
          />
        </label>
        {error ? (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={!matches || busy}
          className="min-h-11 rounded-xl bg-danger-strong px-4 font-semibold text-white transition hover:bg-danger disabled:bg-surface-2 disabled:text-muted"
        >
          {busy ? "Siliniyor…" : "Hesabımı kalıcı olarak sil"}
        </button>
        <Link
          href="/"
          className="flex min-h-11 items-center justify-center rounded-xl border border-line px-4 font-semibold hover:bg-surface-2"
        >
          Vazgeç
        </Link>
      </form>
    </AuthShell>
  );
}
