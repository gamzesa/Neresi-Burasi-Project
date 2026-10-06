import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { z } from "zod";
import { isRegionHit } from "./geo";
import { DIFFICULTIES, type Difficulty, type GameMap, totalHints } from "./scoring";

export const QUESTIONS_PER_DIFFICULTY = 10;

export const questionSeedSchema = z.object({
  difficulty: z.enum(DIFFICULTIES),
  answer_lat: z.number().min(-90).max(90),
  answer_lng: z.number().min(-180).max(180),
  region_code: z.string().min(1),
  answer_label: z.string().min(1),
  hints: z.array(z.string().trim().min(1)),
  /** Yalnızca doğrulama içindir (ör. başkent, sıfat); veritabanına yazılmaz. */
  banned_words: z.array(z.string().min(1)).default([]),
});

export const questionFileSchema = z.object({
  map: z.enum(["world", "turkey"]),
  questions: z.array(questionSeedSchema),
});

export type QuestionSeed = z.infer<typeof questionSeedSchema>;

type RegionCollection = FeatureCollection<Polygon | MultiPolygon>;

/** Küçük harfe çevirir, Türkçe harfleri ve şapkaları sadeleştirir (Hakkâri = Hakkari). */
export function normalizeText(text: string): string {
  return text
    .replace(/İ/g, "i")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}

const SHORT_WORD_LENGTH = 4;

/** Kısa kelimeler (Van, Çin, Rus) yalnızca bütün sözcük olarak aranır; uzunlar parça olarak. */
export function containsWord(text: string, word: string): boolean {
  const haystack = normalizeText(text);
  const needle = normalizeText(word);
  if (needle.length >= SHORT_WORD_LENGTH) return haystack.includes(needle);
  return haystack.split(/[^a-z0-9]+/).some((token) => token === needle);
}

export function validateQuestionSet(
  map: GameMap,
  questions: readonly QuestionSeed[],
  regions: RegionCollection,
): string[] {
  const errors: string[] = [];
  const names = new Map(regions.features.map((f) => [String(f.properties?.code), String(f.properties?.name)]));
  const labels = new Set<string>();
  const counts: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };

  questions.forEach((q, i) => {
    const id = `[${map} #${i + 1} ${q.answer_label}]`;
    counts[q.difficulty] += 1;

    if (labels.has(q.answer_label)) errors.push(`${id} aynı etiketli soru birden fazla`);
    labels.add(q.answer_label);

    if (q.hints.length !== totalHints(q.difficulty)) {
      errors.push(`${id} ${q.difficulty} için ${totalHints(q.difficulty)} ipucu gerekir, ${q.hints.length} var`);
    }
    if (new Set(q.hints).size !== q.hints.length) errors.push(`${id} yinelenen ipucu var`);

    const regionName = names.get(q.region_code);
    if (!regionName) {
      errors.push(`${id} region_code GeoJSON'da yok: ${q.region_code}`);
    } else {
      if (!isRegionHit({ lat: q.answer_lat, lng: q.answer_lng }, regions, "code", q.region_code)) {
        errors.push(`${id} cevap koordinatı ${regionName} sınırı içinde değil`);
      }
      const banned = [regionName, ...q.banned_words];
      q.hints.forEach((hint, h) => {
        for (const word of banned) {
          if (containsWord(hint, word)) errors.push(`${id} ipucu ${h + 1} yasaklı kelime içeriyor: ${word}`);
        }
      });
    }
  });

  for (const difficulty of DIFFICULTIES) {
    if (counts[difficulty] !== QUESTIONS_PER_DIFFICULTY) {
      errors.push(`[${map}] ${difficulty} için ${QUESTIONS_PER_DIFFICULTY} soru gerekir, ${counts[difficulty]} var`);
    }
  }
  return errors;
}
