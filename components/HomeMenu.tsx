"use client";

import Link from "next/link";
import { useState } from "react";
import AuthBar from "@/components/auth/AuthBar";
import { DIFFICULTIES, MAPS, type Difficulty, type GameMap } from "@/lib/game/scoring";
import { DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS, MAP_DESCRIPTIONS, MAP_LABELS } from "@/lib/labels";

const cardBase =
  "group flex min-h-11 w-full flex-col items-start gap-0.5 rounded-xl border border-line bg-surface px-4 py-3 text-left transition duration-150 hover:-translate-y-0.5 active:scale-[0.99]";

// Her seçeneğin fare/dokunma üstünde kendi rengi vardır (sınıflar Tailwind'in görebilmesi için tam yazılır).
const MAP_HOVER_CLASS =
  "hover:border-sky hover:bg-sky hover:text-bg focus-visible:border-sky focus-visible:bg-sky focus-visible:text-bg";
const MAP_HOVER: Record<GameMap, string> = {
  world: MAP_HOVER_CLASS,
  turkey: MAP_HOVER_CLASS,
};

const DIFFICULTY_HOVER: Record<Difficulty, string> = {
  easy: "hover:border-accent hover:bg-accent hover:text-accent-ink focus-visible:border-accent focus-visible:bg-accent focus-visible:text-accent-ink",
  medium: "hover:border-gold hover:bg-gold hover:text-bg focus-visible:border-gold focus-visible:bg-gold focus-visible:text-bg",
  hard: "hover:border-danger-strong hover:bg-danger-strong hover:text-white focus-visible:border-danger-strong focus-visible:bg-danger-strong focus-visible:text-white",
};

const descriptionClass = "text-xs text-muted group-hover:text-current group-hover:opacity-80 group-focus-visible:text-current";

export default function HomeMenu({ user }: { user: { username: string } | null }) {
  const [map, setMap] = useState<GameMap | null>(null);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-6 py-8">
      {/* Başlık ve menü dikeyde ortalanır; oturum alanı en altta kalır. */}
      <div className="my-auto flex flex-col gap-7">
        <header className="relative text-center">
          {/* Başlığın arkasında, kenarlara doğru silinen şeffaf dünya haritası. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 -z-10 aspect-[1000/587] w-[150%] max-w-[560px] -translate-x-1/2 -translate-y-1/2 bg-contain bg-center bg-no-repeat opacity-[0.22] [mask-image:radial-gradient(closest-side,black_55%,transparent)]"
            style={{ backgroundImage: "url(/hero-map.svg)" }}
          />
          <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto mb-2 size-8 text-accent" fill="currentColor">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
          </svg>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Neresi <span className="text-accent">Burası?</span>
          </h1>
          <p className="mt-2 text-sm text-muted">İpuçlarını oku, haritada yeri bul.</p>
        </header>

        {map === null ? (
          <section aria-label="Harita seç" className="flex flex-col gap-2.5">
            <h2 className="text-sm font-semibold text-muted">Bir harita seç</h2>
            {MAPS.map((m) => (
              <button key={m} type="button" onClick={() => setMap(m)} className={`${cardBase} ${MAP_HOVER[m]}`}>
                <span className="text-base font-bold">{MAP_LABELS[m]}</span>
                <span className={descriptionClass}>{MAP_DESCRIPTIONS[m]}</span>
              </button>
            ))}
          </section>
        ) : (
          <section aria-label="Zorluk seç" className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted">{MAP_LABELS[map]} için zorluk seç</h2>
              <button type="button" onClick={() => setMap(null)} className="min-h-11 px-2 text-sm text-muted underline hover:text-ink">
                Geri
              </button>
            </div>
            {DIFFICULTIES.map((d) => (
              <Link key={d} href={`/play/${map}?difficulty=${d}`} className={`${cardBase} ${DIFFICULTY_HOVER[d]}`}>
                <span className="text-base font-bold">{DIFFICULTY_LABELS[d]}</span>
                <span className={descriptionClass}>{DIFFICULTY_DESCRIPTIONS[d]}</span>
              </Link>
            ))}
          </section>
        )}
      </div>

      <footer className="flex flex-col gap-3 pt-6">
        <Link
          href="/leaderboard"
          className="flex min-h-11 items-center justify-center text-sm font-semibold text-accent underline hover:text-ink"
        >
          Sıralamayı gör
        </Link>
        <AuthBar user={user} />
      </footer>
    </main>
  );
}
