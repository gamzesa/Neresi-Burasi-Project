import { randomUUID } from "node:crypto";
import type { GameStore, GuessRow, QuestionRow, SessionRow } from "@/lib/game/types";

/** Testler için bellek içi GameStore; Supabase'in iyimser kilit ve benzersizlik davranışını taklit eder. */
export function createMemoryStore(questions: QuestionRow[]) {
  const sessions = new Map<string, SessionRow>();
  const guesses: GuessRow[] = [];

  const store: GameStore = {
    async listQuestionIds(map, difficulty) {
      return questions.filter((q) => q.map === map && q.difficulty === difficulty && q.is_active).map((q) => q.id);
    },
    async createSession(input) {
      const row: SessionRow = {
        id: randomUUID(),
        ...input,
        current_index: 0,
        current_hints_opened: 1,
        total_score: 0,
        status: "active",
        created_at: new Date().toISOString(),
        finished_at: null,
      };
      sessions.set(row.id, row);
      return { ...row };
    },
    async getSession(id) {
      const row = sessions.get(id);
      return row ? { ...row } : null;
    },
    async getQuestion(id) {
      return questions.find((q) => q.id === id) ?? null;
    },
    async getGuess(sessionId, questionId) {
      return guesses.find((g) => g.session_id === sessionId && g.question_id === questionId) ?? null;
    },
    async listGuesses(sessionId) {
      return guesses.filter((g) => g.session_id === sessionId);
    },
    async insertGuess(row) {
      if (guesses.some((g) => g.session_id === row.session_id && g.question_id === row.question_id)) return "duplicate";
      guesses.push(row);
      return "ok";
    },
    async updateSession(id, expect, patch) {
      const row = sessions.get(id);
      if (!row) return false;
      for (const [key, value] of Object.entries(expect)) {
        if (row[key as keyof SessionRow] !== value) return false;
      }
      Object.assign(row, patch);
      return true;
    },
  };

  return { store, sessions, guesses };
}

export function makeQuestions(map: "world" | "turkey", difficulty: "easy" | "medium" | "hard", count: number): QuestionRow[] {
  const hintCount = { easy: 4, medium: 3, hard: 2 }[difficulty];
  return Array.from({ length: count }, (_, i) => ({
    id: randomUUID(),
    map,
    difficulty,
    answer_lat: 10 + i,
    answer_lng: 20 + i,
    region_code: `R${i}`,
    answer_label: `Cevap ${i}`,
    hints: Array.from({ length: hintCount }, (_, h) => `Soru ${i} ipucu ${h + 1}`),
    is_active: true,
  }));
}
