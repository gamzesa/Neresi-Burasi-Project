"use client";

import { useState } from "react";
import GameMapLoader from "@/components/map/GameMapLoader";
import type { LatLng } from "@/lib/game/geo";
import type { GameMap } from "@/lib/game/scoring";

/** Faz 2 geçici ekranı: haritayı ve tahmin işaretlemeyi denemek için. Faz 5'te oyun ekranıyla değişecek. */
export default function MapPreview({ map }: { map: GameMap }) {
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [confirmed, setConfirmed] = useState<LatLng | null>(null);

  return (
    <div className="flex h-dvh flex-col">
      <header className="px-4 py-3 text-center font-semibold">
        {map === "world" ? "Dünya" : "Türkiye"} haritası (önizleme)
      </header>
      <div className="relative min-h-0 flex-1">
        <GameMapLoader
          map={map}
          guess={guess}
          disabled={confirmed !== null}
          onGuessChange={setGuess}
        />
      </div>
      <footer className="flex flex-col gap-2 p-4">
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
      </footer>
    </div>
  );
}
