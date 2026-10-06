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
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-500">Doğru cevap</p>
        <p className="text-lg font-bold">{result.answer.label}</p>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl border border-slate-200 p-3">
          <dt className="text-xs text-slate-500">Mesafe</dt>
          <dd className="font-semibold">{formatKm(result.distanceKm)}</dd>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <dt className="text-xs text-slate-500">Doğru {regionNoun}</dt>
          <dd className={result.regionHit ? "font-semibold text-emerald-700" : "font-semibold text-rose-600"}>
            {result.regionHit ? "Evet (+500)" : "Hayır"}
          </dd>
        </div>
      </dl>
      <div className="rounded-xl bg-emerald-600 p-3 text-center text-white">
        <p className="text-xs opacity-90">Bu sorudan kazandığın puan</p>
        <p className="text-3xl font-bold">{result.score.toLocaleString("tr-TR")}</p>
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={busy}
        className="min-h-11 rounded-xl bg-slate-900 px-4 font-semibold text-white disabled:bg-slate-400"
      >
        {result.isLastQuestion ? "Oyunu bitir" : "Sonraki soru"}
      </button>
    </section>
  );
}
