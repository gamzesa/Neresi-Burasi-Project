import type { Difficulty, GameMap } from "./scoring";

export interface SessionRow {
  id: string;
  nickname: string | null;
  map: GameMap;
  difficulty: Difficulty;
  question_ids: string[];
  current_index: number;
  current_hints_opened: number;
  total_score: number;
  status: "active" | "finished";
  created_at: string;
  finished_at: string | null;
}

/** Cevap alanları içerir; istemciye doğrudan asla gönderilmez. */
export interface QuestionRow {
  id: string;
  map: GameMap;
  difficulty: Difficulty;
  answer_lat: number;
  answer_lng: number;
  region_code: string;
  answer_label: string;
  hints: string[];
  is_active: boolean;
}

export interface GuessRow {
  session_id: string;
  question_id: string;
  hints_opened: number;
  guess_lat: number;
  guess_lng: number;
  distance_km: number;
  region_hit: boolean;
  score: number;
}

/** `updateSession` yalnızca bu alanların beklenen değerleri hâlâ geçerliyse yazar (iyimser kilit). */
export type SessionExpectation = Partial<Pick<SessionRow, "current_index" | "current_hints_opened" | "status">>;
export type SessionPatch = Partial<
  Pick<SessionRow, "nickname" | "current_index" | "current_hints_opened" | "total_score" | "status" | "finished_at">
>;

/** Oyun mantığının veri erişim sınırı. Üretimde Supabase, testlerde bellek içi bir uygulama kullanılır. */
export interface GameStore {
  listQuestionIds(map: GameMap, difficulty: Difficulty): Promise<string[]>;
  createSession(input: Pick<SessionRow, "map" | "difficulty" | "question_ids">): Promise<SessionRow>;
  getSession(id: string): Promise<SessionRow | null>;
  getQuestion(id: string): Promise<QuestionRow | null>;
  getGuess(sessionId: string, questionId: string): Promise<GuessRow | null>;
  listGuesses(sessionId: string): Promise<GuessRow[]>;
  insertGuess(row: GuessRow): Promise<"ok" | "duplicate">;
  /** Beklenen değerler tutuyorsa günceller ve true döner; başka istek araya girdiyse false. */
  updateSession(id: string, expect: SessionExpectation, patch: SessionPatch): Promise<boolean>;
}
