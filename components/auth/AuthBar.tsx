"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/gameApi";

interface AuthBarProps {
  user: { username: string } | null;
}

const linkClass = "flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold transition";

/** Sayfa üstündeki giriş durumu: misafire "Giriş yap / Kayıt ol", girişliye kullanıcı adı ve çıkış. */
export default function AuthBar({ user }: AuthBarProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await authApi.logout();
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  if (user) {
    return (
      <div className="flex items-center justify-end gap-2 text-sm">
        <span className="text-muted">
          Merhaba, <strong className="text-ink">{user.username}</strong>
        </span>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={busy}
          className={`${linkClass} border border-line text-muted hover:border-danger hover:text-danger`}
        >
          Çıkış yap
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link href="/giris" className={`${linkClass} border border-line hover:border-accent hover:text-accent`}>
        Giriş yap
      </Link>
      <Link href="/kayit" className={`${linkClass} bg-accent text-accent-ink hover:bg-accent-strong`}>
        Kayıt ol
      </Link>
    </div>
  );
}
