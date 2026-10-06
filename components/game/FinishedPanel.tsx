"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { NICKNAME_MAX, NICKNAME_MIN } from "@/lib/validation";
import { ApiError, gameApi } from "@/lib/gameApi";
import type { GameMap } from "@/lib/game/scoring";

interface FinishedPanelProps {
  sessionId: string;
  map: GameMap;
  totalScore: number;
  onPlayAgain: () => void;
}

export default function FinishedPanel({ sessionId, map, totalScore, onPlayAgain }: FinishedPanelProps) {
  const [nickname, setNickname] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await gameApi.next(sessionId, nickname);
      setSaved(result.nickname ?? nickname.trim());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Kaydedilemedi, tekrar dene.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-label="Oyun bitti" className="flex flex-col gap-4">
      <div className="rounded-xl border border-gold/50 bg-gold/10 p-4 text-center">
        <p className="text-sm text-muted">Oyun bitti! Toplam puanın</p>
        <p className="text-5xl font-extrabold text-gold">{totalScore.toLocaleString("tr-TR")}</p>
      </div>

      {saved ? (
        <p className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm">
          Skorun <strong className="text-accent">{saved}</strong> adıyla sıralamaya eklendi.
        </p>
      ) : (
        <form onSubmit={save} className="flex flex-col gap-2">
          <label htmlFor="nickname" className="text-sm font-semibold">
            Skorunu sıralamaya eklemek ister misin?
          </label>
          <input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            minLength={NICKNAME_MIN}
            maxLength={NICKNAME_MAX}
            placeholder={`Takma ad (${NICKNAME_MIN}–${NICKNAME_MAX} karakter)`}
            className="min-h-11 rounded-xl border border-line bg-surface-2 px-3 text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button
            type="submit"
            disabled={saving || nickname.trim().length < NICKNAME_MIN}
            className="min-h-11 rounded-xl bg-accent px-4 font-semibold text-accent-ink transition hover:bg-accent-strong disabled:bg-surface-2 disabled:text-muted"
          >
            {saving ? "Kaydediliyor…" : "Sıralamaya ekle"}
          </button>
          <p className="text-xs text-muted">İstemezsen atlayabilirsin; ad girmezsen skorun sıralamaya girmez.</p>
        </form>
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
          href={`/leaderboard?map=${map}${saved ? `&sessionId=${sessionId}` : ""}`}
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
