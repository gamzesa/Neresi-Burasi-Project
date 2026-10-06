"use client";

import Link from "next/link";
import type { GameMap } from "@/lib/game/scoring";

interface FinishedPanelProps {
  sessionId: string;
  map: GameMap;
  totalScore: number;
  /** Oyun bir hesaba bağlıysa (girişli oynandıysa) skor sıralamadadır. */
  ranked: boolean;
  username: string | null;
  onPlayAgain: () => void;
}

export default function FinishedPanel({ sessionId, map, totalScore, ranked, username, onPlayAgain }: FinishedPanelProps) {
  const leaderboardPath = `/leaderboard?map=${map}`;
  // Misafir giriş yaparsa/kayıt olursa bu oyun hesabına bağlanır ve sıralamaya girer.
  const authQuery = new URLSearchParams({ next: leaderboardPath, claim: sessionId });

  return (
    <section aria-label="Oyun bitti" className="flex flex-col gap-4">
      <div className="rounded-xl border border-gold/50 bg-gold/10 p-4 text-center">
        <p className="text-sm text-muted">Oyun bitti! Toplam puanın</p>
        <p className="text-5xl font-extrabold text-gold">{totalScore.toLocaleString("tr-TR")}</p>
      </div>

      {ranked ? (
        <p className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm">
          Skorun <strong className="text-accent">{username}</strong> adıyla sıralamaya eklendi.
        </p>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3">
          <p className="text-sm font-semibold">Skorunu sıralamaya eklemek ister misin?</p>
          <p className="text-xs text-muted">Sıralamaya girmek için hesabın olmalı. Bu oyunun skoru hesabına eklenir.</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/kayit?${authQuery}`}
              className="flex min-h-11 items-center justify-center rounded-xl bg-accent px-3 text-sm font-semibold text-accent-ink transition hover:bg-accent-strong"
            >
              Kayıt ol
            </Link>
            <Link
              href={`/giris?${authQuery}`}
              className="flex min-h-11 items-center justify-center rounded-xl border border-line px-3 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Giriş yap
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onPlayAgain}
          className="min-h-11 rounded-xl bg-ink px-4 font-semibold text-bg transition hover:bg-white"
        >
          Tekrar oyna
        </button>
        <Link
          href={leaderboardPath}
          className="flex min-h-11 items-center justify-center rounded-xl border border-line px-4 font-semibold transition hover:border-accent hover:text-accent"
        >
          Sıralamayı gör
        </Link>
        <Link href="/" className="flex min-h-11 items-center justify-center text-sm text-muted underline hover:text-ink">
          Ana sayfa
        </Link>
      </div>
    </section>
  );
}
