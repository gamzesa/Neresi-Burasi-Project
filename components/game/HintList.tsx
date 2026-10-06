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
          <li key={index} className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm leading-relaxed">
            <span className="mb-1 block text-xs font-semibold text-accent">İpucu {index + 1}</span>
            {hint}
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">
        İpucu katsayısı şu an <strong className="text-ink">{formatMultiplier(multipliers[hints.length - 1])}</strong>
        {hasMore ? `; sonraki ipucunda ${formatMultiplier(multipliers[hints.length])} olur.` : "; tüm ipuçları açık."}
      </p>
      {hasMore ? (
        <button
          type="button"
          onClick={onOpen}
          disabled={!canOpen || opening}
          className="min-h-11 rounded-xl border border-accent px-4 font-semibold text-accent transition hover:bg-accent/10 disabled:border-line disabled:text-muted"
        >
          {opening ? "Açılıyor…" : `Sonraki ipucunu aç (${hints.length}/${totalHints})`}
        </button>
      ) : null}
    </section>
  );
}
