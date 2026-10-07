"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/gameApi";

interface AuthBarProps {
  user: { username: string } | null;
}

const buttonClass =
  "flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition active:scale-[0.98]";

/** Ana sayfanın altındaki giriş durumu: misafire yan yana "Giriş yap / Kayıt ol", girişliye kullanıcı adı ve çıkış. */
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
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted">
          <strong className="text-ink">{user.username}</strong> olarak giriş yaptın
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={busy}
          className={`${buttonClass} w-full border border-line text-muted hover:border-danger hover:text-danger`}
        >
          Çıkış yap
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Link href="/giris" className={`${buttonClass} border border-line bg-surface hover:border-accent hover:text-accent`}>
        Giriş yap
      </Link>
      <Link href="/kayit" className={`${buttonClass} bg-accent text-accent-ink hover:bg-accent-strong`}>
        Kayıt ol
      </Link>
    </div>
  );
}
