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
      <div className="rounded-xl bg-emerald-600 p-4 text-center text-white">
        <p className="text-sm opacity-90">Oyun bitti! Toplam puanın</p>
        <p className="text-4xl font-bold">{totalScore.toLocaleString("tr-TR")}</p>
      </div>

      {saved ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
          Skorun <strong>{saved}</strong> adıyla sıralamaya eklendi.
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
            className="min-h-11 rounded-xl border border-slate-300 px-3"
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={saving || nickname.trim().length < NICKNAME_MIN}
            className="min-h-11 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:bg-slate-300"
          >
            {saving ? "Kaydediliyor…" : "Sıralamaya ekle"}
          </button>
          <p className="text-xs text-slate-500">İstemezsen atlayabilirsin; ad girmezsen skorun sıralamaya girmez.</p>
        </form>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onPlayAgain}
          className="min-h-11 rounded-xl bg-slate-900 px-4 font-semibold text-white"
        >
          Tekrar oyna
        </button>
        <Link
          href={`/leaderboard?map=${map}${saved ? `&sessionId=${sessionId}` : ""}`}
          className="flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold"
        >
          Sıralamayı gör
        </Link>
        <Link href="/" className="flex min-h-11 items-center justify-center text-sm text-slate-600 underline">
          Ana sayfa
        </Link>
      </div>
    </section>
  );
}
