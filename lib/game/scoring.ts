export const MAPS = ["world", "turkey"] as const;
export type GameMap = (typeof MAPS)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const QUESTIONS_PER_GAME = 5;
export const MAX_DISTANCE_SCORE = 1000;
export const REGION_BONUS = 500;

/** Mesafe puanının üstel azalma ölçeği (km). */
export const DISTANCE_SCALE_KM: Record<GameMap, number> = {
  world: 1500,
  turkey: 75,
};

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.0,
};

/** Dizinin i. elemanı, (i + 1) ipucu açıldığındaki katsayıdır. Uzunluk = toplam ipucu sayısı. */
export const HINT_MULTIPLIERS: Record<Difficulty, readonly number[]> = {
  easy: [1.0, 0.8, 0.6, 0.4],
  medium: [1.0, 0.7, 0.45],
  hard: [1.0, 0.6],
};

export function totalHints(difficulty: Difficulty): number {
  return HINT_MULTIPLIERS[difficulty].length;
}

export function distanceScore(distanceKm: number, map: GameMap): number {
  const km = Math.max(0, distanceKm);
  return MAX_DISTANCE_SCORE * Math.exp(-km / DISTANCE_SCALE_KM[map]);
}

export function hintMultiplier(difficulty: Difficulty, hintsOpened: number): number {
  const table = HINT_MULTIPLIERS[difficulty];
  if (!Number.isInteger(hintsOpened) || hintsOpened < 1 || hintsOpened > table.length) {
    throw new RangeError(`Geçersiz ipucu sayısı: ${hintsOpened}`);
  }
  return table[hintsOpened - 1];
}

export interface ScoreInput {
  map: GameMap;
  difficulty: Difficulty;
  distanceKm: number;
  regionHit: boolean;
  hintsOpened: number;
}

export function calculateScore(input: ScoreInput): number {
  const base = distanceScore(input.distanceKm, input.map) + (input.regionHit ? REGION_BONUS : 0);
  return Math.round(
    base * hintMultiplier(input.difficulty, input.hintsOpened) * DIFFICULTY_MULTIPLIER[input.difficulty],
  );
}
