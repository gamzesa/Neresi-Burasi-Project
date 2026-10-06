"use client";

import Link from "next/link";
import { useState } from "react";
import { DIFFICULTIES, MAPS, type GameMap } from "@/lib/game/scoring";
import { DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS, MAP_DESCRIPTIONS, MAP_LABELS } from "@/lib/labels";

const cardClass =
  "flex min-h-11 w-full flex-col items-start gap-1 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] hover:border-emerald-500";

export default function HomeMenu() {
  const [map, setMap] = useState<GameMap | null>(null);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 p-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold">Neresi Burası?</h1>
        <p className="mt-2 text-slate-600">İpuçlarını oku, haritada yeri bul.</p>
      </header>

      {map === null ? (
        <section aria-label="Harita seç" className="flex flex-col gap-3">
          <h2 className="font-semibold">Bir harita seç</h2>
          {MAPS.map((m) => (
            <button key={m} type="button" onClick={() => setMap(m)} className={cardClass}>
              <span className="text-lg font-bold">{MAP_LABELS[m]}</span>
              <span className="text-sm text-slate-600">{MAP_DESCRIPTIONS[m]}</span>
            </button>
          ))}
        </section>
      ) : (
        <section aria-label="Zorluk seç" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{MAP_LABELS[map]} için zorluk seç</h2>
            <button type="button" onClick={() => setMap(null)} className="min-h-11 px-2 text-sm text-slate-600 underline">
              Geri
            </button>
          </div>
          {DIFFICULTIES.map((d) => (
            <Link key={d} href={`/play/${map}?difficulty=${d}`} className={cardClass}>
              <span className="text-lg font-bold">{DIFFICULTY_LABELS[d]}</span>
              <span className="text-sm text-slate-600">{DIFFICULTY_DESCRIPTIONS[d]}</span>
            </Link>
          ))}
        </section>
      )}

      <Link href="/leaderboard" className="flex min-h-11 items-center justify-center text-sm font-semibold text-emerald-700 underline">
        Sıralamayı gör
      </Link>
    </main>
  );
}
