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
  sessionId?: string;
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
    <div role="group" aria-label={label} className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={option.value === value}
          className={`min-h-11 flex-1 whitespace-nowrap rounded-lg px-3 text-sm font-semibold ${
            option.value === value ? "bg-white shadow-sm" : "text-slate-600"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function LeaderboardView({ initialMap, sessionId }: LeaderboardViewProps) {
  const [map, setMap] = useState<GameMap>(initialMap);
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [period, setPeriod] = useState<Period>("all");
  // Yanıt, hangi filtreyle istendiğini taşır; filtre değişince `loading` kendiliğinden true olur.
  const [loaded, setLoaded] = useState<{ key: string; data: LeaderboardResponse | null; error: string | null } | null>(
    null,
  );
  const requestKey = `${map}|${difficulty}|${period}|${sessionId ?? ""}`;
  const loading = loaded?.key !== requestKey;
  const data = loaded?.key === requestKey ? loaded.data : null;
  const error = loaded?.key === requestKey ? loaded.error : null;

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard({ map, period, sessionId, difficulty: difficulty === "all" ? undefined : difficulty })
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
  }, [map, difficulty, period, sessionId, requestKey]);

  const me = data?.me ?? null;
  const meOutsideTop = me !== null && !data?.entries.some((e) => e.rank === me.rank && e.nickname === me.nickname);

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

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-slate-600">Yükleniyor…</p> : null}

      {!loading && data && data.entries.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-center text-slate-600">
          Bu filtrede henüz skor yok. İlk sen ol!
        </p>
      ) : null}

      {data && data.entries.length > 0 ? (
        <ol className="flex flex-col gap-1">
          {data.entries.map((entry) => {
            const isMe = me !== null && entry.rank === me.rank && entry.nickname === me.nickname;
            return (
              <li
                key={`${entry.rank}-${entry.nickname}-${entry.finishedAt}`}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  isMe ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"
                }`}
              >
                <span className="w-8 text-right font-bold text-slate-500">{entry.rank}</span>
                <span className="flex-1 truncate font-semibold">{entry.nickname}</span>
                <span className="text-xs text-slate-500">{DIFFICULTY_LABELS[entry.difficulty]}</span>
                <span className="font-bold">{entry.totalScore.toLocaleString("tr-TR")}</span>
              </li>
            );
          })}
        </ol>
      ) : null}

      {meOutsideTop && me ? (
        <div className="rounded-xl border border-emerald-500 bg-emerald-50 p-3">
          <p className="mb-1 text-xs font-semibold text-emerald-700">Senin derecen</p>
          <div className="flex items-center gap-3">
            <span className="w-8 text-right font-bold">{me.rank}</span>
            <span className="flex-1 truncate font-semibold">{me.nickname}</span>
            <span className="font-bold">{me.totalScore.toLocaleString("tr-TR")}</span>
          </div>
        </div>
      ) : null}
    </main>
  );
}
