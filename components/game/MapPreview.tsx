"use client";

import { useState } from "react";
import GameMapLoader from "@/components/map/GameMapLoader";
import type { LatLng } from "@/lib/game/geo";
import type { GameMap } from "@/lib/game/scoring";

/**
 * Geçici oyun ekranı: düzeni (solda sorular 1/3, sağda harita 2/3) ve tahmin işaretlemeyi denemek içindir.
 * Soru ve ipuçları Faz 4'te API'den, Faz 5'te gerçek bileşenlerle gelecek.
 */
export default function MapPreview({ map }: { map: GameMap }) {
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [confirmed, setConfirmed] = useState<LatLng | null>(null);

  return (
    <div className="flex h-dvh flex-col md:grid md:grid-cols-3">
      <aside className="flex max-h-[40dvh] flex-col gap-3 overflow-y-auto border-b border-slate-200 bg-white p-4 md:col-span-1 md:max-h-none md:border-r md:border-b-0">
        <h1 className="text-lg font-bold">{map === "world" ? "Dünya" : "Türkiye"} haritası</h1>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          Soru 1 / 5 — ipuçları burada görünecek.
        </div>
        <div className="mt-auto flex flex-col gap-2">
          {confirmed ? (
            <p className="text-center text-sm text-slate-600">
              Onaylandı: {confirmed.lat.toFixed(3)}, {confirmed.lng.toFixed(3)}
            </p>
          ) : null}
          <button
            type="button"
            disabled={!guess || confirmed !== null}
            onClick={() => setConfirmed(guess)}
            className="min-h-11 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:bg-slate-300"
          >
            Tahmini onayla
          </button>
        </div>
      </aside>
      <main className="relative min-h-0 flex-1 md:col-span-2">
        <GameMapLoader map={map} guess={guess} disabled={confirmed !== null} onGuessChange={setGuess} />
      </main>
    </div>
  );
}
