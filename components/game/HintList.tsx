import { HINT_MULTIPLIERS, type Difficulty } from "@/lib/game/scoring";

interface HintListProps {
  hints: string[];
  totalHints: number;
  difficulty: Difficulty;
  /** İpucu açılabilir mi (tahmin yapılmadıysa ve açılmamış ipucu varsa). */
  canOpen: boolean;
  opening: boolean;
  onOpen: () => void;
}

function formatMultiplier(value: number): string {
  return `×${value.toFixed(2).replace(".", ",")}`;
}

export default function HintList({ hints, totalHints, difficulty, canOpen, opening, onOpen }: HintListProps) {
  const multipliers = HINT_MULTIPLIERS[difficulty];
  const hasMore = hints.length < totalHints;

  return (
    <section aria-label="İpuçları" className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2">
        {hints.map((hint, index) => (
          <li key={index} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-relaxed">
            <span className="mb-1 block text-xs font-semibold text-emerald-700">İpucu {index + 1}</span>
            {hint}
          </li>
        ))}
      </ol>
      <p className="text-xs text-slate-500">
        İpucu katsayısı şu an <strong>{formatMultiplier(multipliers[hints.length - 1])}</strong>
        {hasMore ? `; sonraki ipucunda ${formatMultiplier(multipliers[hints.length])} olur.` : "; tüm ipuçları açık."}
      </p>
      {hasMore ? (
        <button
          type="button"
          onClick={onOpen}
          disabled={!canOpen || opening}
          className="min-h-11 rounded-xl border border-emerald-600 px-4 font-semibold text-emerald-700 disabled:border-slate-300 disabled:text-slate-400"
        >
          {opening ? "Açılıyor…" : `Sonraki ipucunu aç (${hints.length}/${totalHints})`}
        </button>
      ) : null}
    </section>
  );
}
