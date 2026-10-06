"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DIFFICULTIES, MAPS, type Difficulty, type GameMap } from "@/lib/game/scoring";
import { ApiError, fetchLeaderboard, type LeaderboardResponse } from "@/lib/gameApi";
import { DIFFICULTY_LABELS, MAP_LABELS } from "@/lib/labels";

type Period = "all" | "week";

const PERIOD_LABELS: Record<Period, string> = { all: "Tüm zamanlar", week: "Bu hafta" };

interface LeaderboardViewProps {
  initialMap: GameMap;
  /** Girişli kullanıcı; misafirde null (sıralamaya girmek için kayıt olmaya davet edilir). */
  user: { username: string } | null;
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={option.value === value}
          className={`min-h-11 flex-1 whitespace-nowrap rounded-lg px-3 text-sm font-semibold ${
            option.value === value ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function LeaderboardView({ initialMap, user }: LeaderboardViewProps) {
  const [map, setMap] = useState<GameMap>(initialMap);
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [period, setPeriod] = useState<Period>("all");
  // Yanıt, hangi filtreyle istendiğini taşır; filtre değişince `loading` kendiliğinden true olur.
  const [loaded, setLoaded] = useState<{ key: string; data: LeaderboardResponse | null; error: string | null } | null>(
    null,
  );
  const requestKey = `${map}|${difficulty}|${period}`;
  const loading = loaded?.key !== requestKey;
  const data = loaded?.key === requestKey ? loaded.data : null;
  const error = loaded?.key === requestKey ? loaded.error : null;

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard({ map, period, difficulty: difficulty === "all" ? undefined : difficulty })
      .then((response) => {
        if (!cancelled) setLoaded({ key: requestKey, data: response, error: null });
      })
      .catch((e: unknown) => {
        const message = e instanceof ApiError ? e.message : "Sıralama yüklenemedi.";
        if (!cancelled) setLoaded({ key: requestKey, data: null, error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [map, difficulty, period, requestKey]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sıralama</h1>
        <Link href="/" className="flex min-h-11 items-center px-2 text-sm underline">
          Ana sayfa
        </Link>
      </header>

      <Segmented
        label="Harita"
        value={map}
        onChange={setMap}
        options={MAPS.map((m) => ({ value: m, label: MAP_LABELS[m] }))}
      />
      <Segmented
        label="Zorluk"
        value={difficulty}
        onChange={setDifficulty}
        options={[
          { value: "all" as const, label: "Hepsi" },
          ...DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_LABELS[d] })),
        ]}
      />
      <Segmented
        label="Dönem"
        value={period}
        onChange={setPeriod}
        options={(Object.keys(PERIOD_LABELS) as Period[]).map((p) => ({ value: p, label: PERIOD_LABELS[p] }))}
      />

      {error ? <p className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
      {loading ? <p className="text-muted">Yükleniyor…</p> : null}

      {!loading && data && data.entries.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-4 text-center text-muted">
          Bu filtrede henüz skor yok. İlk sen ol!
        </p>
      ) : null}

      {data && data.entries.length > 0 ? (
        <ol className="flex flex-col gap-1">
          {data.entries.map((entry, index) => {
            // Girişli oyuncunun kendi derecesi ilk 100 dışındaysa listenin sonunda, ayrı bir başlıkla gösterilir.
            const previous = data.entries[index - 1];
            const detached = entry.isMe && previous !== undefined && entry.rank > previous.rank + 1;
            return (
              <li key={`${entry.rank}-${entry.username}`} className="flex flex-col gap-1">
                {detached ? <p className="mt-2 text-xs font-semibold text-accent">Senin derecen</p> : null}
                <div
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    entry.isMe ? "border-accent bg-accent/10" : "border-line bg-surface"
                  }`}
                >
                  <span className="w-8 text-right font-bold text-muted">{entry.rank}</span>
                  <span className="flex-1 truncate font-semibold">{entry.username}</span>
                  <span className="text-xs text-muted">{DIFFICULTY_LABELS[entry.difficulty]}</span>
                  <span className="font-bold">{entry.totalScore.toLocaleString("tr-TR")}</span>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}

      {!user ? (
        <div className="rounded-xl border border-line bg-surface-2 p-3 text-sm">
          <p className="font-semibold">Sen de sıralamada yer almak ister misin?</p>
          <p className="mt-1 text-xs text-muted">Sıralamaya yalnızca hesabı olan oyuncuların skorları girer.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link
              href="/kayit?next=/leaderboard"
              className="flex min-h-11 items-center justify-center rounded-xl bg-accent px-3 font-semibold text-accent-ink hover:bg-accent-strong"
            >
              Kayıt ol
            </Link>
            <Link
              href="/giris?next=/leaderboard"
              className="flex min-h-11 items-center justify-center rounded-xl border border-line px-3 font-semibold hover:border-accent hover:text-accent"
            >
              Giriş yap
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}
