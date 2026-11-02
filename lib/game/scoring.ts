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

// --- Çok oyunculu (arkadaşla karşılıklı) mod ---

export const DUEL_MAX_PLAYERS = 2;
/** Odayı kuran, soru başına süreyi bu seçeneklerden seçer (sn). Süre dolunca tahmin etmeyen 0 alır. */
export const DUEL_SECONDS_OPTIONS = [30, 60, 90] as const;
export type DuelSeconds = (typeof DUEL_SECONDS_OPTIONS)[number];
/** Varsayılan soru başına süre (sn). */
export const DUEL_QUESTION_SECONDS: DuelSeconds = 30;
/** Odayı kuran, oyundaki soru sayısını bu seçeneklerden seçer. */
export const DUEL_QUESTION_COUNT_OPTIONS = [5, 10, 15] as const;
export type DuelQuestionCount = (typeof DUEL_QUESTION_COUNT_OPTIONS)[number];
/** Varsayılan oyun uzunluğu (soru sayısı). */
export const DUEL_DEFAULT_QUESTION_COUNT: DuelQuestionCount = QUESTIONS_PER_GAME;
/** Ağ gecikmesi payı (sn): süre bittikten sonra bu kadar süre içinde gelen tahmin hâlâ kabul edilir. */
export const DUEL_GRACE_SECONDS = 2;
/** Oda başladıktan sonra ilk sorunun açılmasına kadar geri sayım (sn). */
export const DUEL_LEAD_IN_SECONDS = 3;
/** Soru bittikten sonra sonuçların ekranda kalma süresi (sn); sonra sonraki soru kendiliğinden açılır. */
export const DUEL_RESULT_SECONDS = 8;
/** Son saniyede verilen tahminin hız katsayısı; anında verilen tahmin 1.00 alır. */
export const DUEL_SPEED_MIN = 0.75;

/**
 * Hız katsayısı: DUEL_SPEED_MIN (süre sonu) ile 1.00 (anında) arasında doğrusal.
 * Süre seçilen soru süresine göre ölçeklenir; yani 90 sn'lik bir soruda 45. saniye tam ortadır.
 */
export function speedMultiplier(elapsedSeconds: number, questionSeconds: number = DUEL_QUESTION_SECONDS): number {
  const ratio = Math.min(1, Math.max(0, elapsedSeconds / questionSeconds));
  return DUEL_SPEED_MIN + (1 - DUEL_SPEED_MIN) * (1 - ratio);
}

/**
 * Çok oyunculuda ipuçları, seçilen sürenin içinde eşit aralıklarla kendiliğinden açılır (ilk ipucu 0. saniyede).
 * Süre uzadıkça aralık da orantılı uzar.
 */
export function duelHintsOpened(
  difficulty: Difficulty,
  elapsedSeconds: number,
  questionSeconds: number = DUEL_QUESTION_SECONDS,
): number {
  const total = totalHints(difficulty);
  const elapsed = Math.max(0, elapsedSeconds);
  return Math.min(total, 1 + Math.floor((elapsed * total) / questionSeconds));
}

export interface DuelScoreInput {
  map: GameMap;
  difficulty: Difficulty;
  distanceKm: number;
  regionHit: boolean;
  elapsedSeconds: number;
  /** Soru süresi (sn); verilmezse varsayılan 30. */
  questionSeconds?: number;
}

/**
 * Çok oyunculu puan: mesafe + bölge bonusu, zorluk, **ipucu** ve **hız** katsayılarıyla çarpılır.
 * İpuçları süreyle kendiliğinden açıldığı için tahmin anında açık olan ipucu sayısı geçen süreden bulunur;
 * daha az ipucuyla (ve daha hızlı, daha yakın) tahmin eden daha çok puan alır.
 */
export function calculateDuelScore(input: DuelScoreInput): number {
  const seconds = input.questionSeconds ?? DUEL_QUESTION_SECONDS;
  const base = distanceScore(input.distanceKm, input.map) + (input.regionHit ? REGION_BONUS : 0);
  const hints = hintMultiplier(input.difficulty, duelHintsOpened(input.difficulty, input.elapsedSeconds, seconds));
  return Math.round(
    base * DIFFICULTY_MULTIPLIER[input.difficulty] * hints * speedMultiplier(input.elapsedSeconds, seconds),
  );
}
