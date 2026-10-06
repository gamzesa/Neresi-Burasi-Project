import { REGION_BONUS } from "@/lib/game/scoring";
import type { GuessResponse } from "@/lib/gameApi";

interface ResultPanelProps {
  result: GuessResponse;
  /** Bölge bonusunun adı: dünyada "ülke", Türkiye'de "il". */
  regionNoun: "ülke" | "il";
  busy: boolean;
  onNext: () => void;
}

function formatKm(km: number): string {
  return `${km.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} km`;
}

export default function ResultPanel({ result, regionNoun, busy, onNext }: ResultPanelProps) {
  return (
    <section aria-label="Sonuç" className="flex flex-col gap-3">
      <div className="rounded-xl border border-line bg-surface-2 p-3">
        <p className="text-xs font-semibold text-muted">Doğru cevap</p>
        <p className="text-lg font-bold">{result.answer.label}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl border border-line bg-surface-2 p-3">
          <p className="text-xs text-muted">Mesafe</p>
          <p className="text-lg font-bold">{formatKm(result.distanceKm)}</p>
        </div>
        {/* Doğru ülke/il bulunduysa tamamen yeşil (+500), bulunamadıysa tamamen kırmızı (+0). */}
        <div
          className={`rounded-xl p-3 ${
            result.regionHit ? "bg-accent text-accent-ink" : "bg-danger-strong text-white"
          }`}
        >
          <p className="text-xs font-semibold opacity-90">Doğru {regionNoun}</p>
          <p className="text-lg font-bold">+{result.regionHit ? REGION_BONUS : 0}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gold/50 bg-gold/10 p-3 text-center">
        <p className="text-xs text-muted">Bu sorudan kazandığın puan</p>
        <p className="text-4xl font-extrabold text-gold">{result.score.toLocaleString("tr-TR")}</p>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={busy}
        className="min-h-11 rounded-xl bg-ink px-4 font-semibold text-bg transition hover:bg-white disabled:bg-surface-2 disabled:text-muted"
      >
        {result.isLastQuestion ? "Oyunu bitir" : "Sonraki soru"}
      </button>
    </section>
  );
}
