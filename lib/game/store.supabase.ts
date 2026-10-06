import "server-only";
import { createServerClient } from "@/lib/supabase/server";
import type { GameStore, GuessRow, QuestionRow, SessionRow } from "./types";

const UNIQUE_VIOLATION = "23505";

function fail(action: string, message: string): never {
  throw new Error(`Veritabanı hatası (${action}): ${message}`);
}

export function createSupabaseStore(): GameStore {
  const db = createServerClient();

  return {
    async listQuestionIds(map, difficulty) {
      const { data, error } = await db
        .from("questions")
        .select("id")
        .eq("map", map)
        .eq("difficulty", difficulty)
        .eq("is_active", true);
      if (error) fail("listQuestionIds", error.message);
      return (data ?? []).map((row) => row.id as string);
    },

    async createSession(input) {
      const { data, error } = await db.from("game_sessions").insert(input).select().single();
      if (error) fail("createSession", error.message);
      return data as SessionRow;
    },

    async getSession(id) {
      const { data, error } = await db.from("game_sessions").select("*").eq("id", id).maybeSingle();
      if (error) fail("getSession", error.message);
      return (data as SessionRow | null) ?? null;
    },

    async getQuestion(id) {
      const { data, error } = await db.from("questions").select("*").eq("id", id).maybeSingle();
      if (error) fail("getQuestion", error.message);
      return (data as QuestionRow | null) ?? null;
    },

    async getGuess(sessionId, questionId) {
      const { data, error } = await db
        .from("guesses")
        .select("*")
        .eq("session_id", sessionId)
        .eq("question_id", questionId)
        .maybeSingle();
      if (error) fail("getGuess", error.message);
      return (data as GuessRow | null) ?? null;
    },

    async listGuesses(sessionId) {
      const { data, error } = await db.from("guesses").select("*").eq("session_id", sessionId);
      if (error) fail("listGuesses", error.message);
      return (data ?? []) as GuessRow[];
    },

    async insertGuess(row) {
      const { error } = await db.from("guesses").insert(row);
      if (error?.code === UNIQUE_VIOLATION) return "duplicate";
      if (error) fail("insertGuess", error.message);
      return "ok";
    },

    async updateSession(id, expect, patch) {
      let query = db.from("game_sessions").update(patch).eq("id", id);
      for (const [column, value] of Object.entries(expect)) query = query.eq(column, value);
      const { data, error } = await query.select("id");
      if (error) fail("updateSession", error.message);
      return (data ?? []).length > 0;
    },
  };
}
