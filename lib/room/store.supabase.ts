import "server-only";
import { createServerClient } from "@/lib/supabase/server";
import { createSupabaseStore } from "@/lib/game/store.supabase";
import type { RoomGuessRow, RoomPlayerRow, RoomRow, RoomStore } from "./types";

const UNIQUE_VIOLATION = "23505";

function fail(action: string, message: string): never {
  throw new Error(`Veritabanı hatası (${action}): ${message}`);
}

export function createSupabaseRoomStore(): RoomStore {
  const db = createServerClient();
  const questions = createSupabaseStore();

  return {
    listQuestionIds: questions.listQuestionIds,
    getQuestion: questions.getQuestion,

    async createRoom(input) {
      const { data, error } = await db.from("rooms").insert(input).select().single();
      if (error?.code === UNIQUE_VIOLATION) return "code_taken";
      if (error) fail("createRoom", error.message);
      return data as RoomRow;
    },

    async getRoomByCode(code) {
      const { data, error } = await db.from("rooms").select("*").eq("code", code).maybeSingle();
      if (error) fail("getRoomByCode", error.message);
      return (data as RoomRow | null) ?? null;
    },

    async deleteStaleRooms(olderThanIso) {
      const { data, error } = await db.from("rooms").delete().lt("created_at", olderThanIso).select("id");
      if (error) fail("deleteStaleRooms", error.message);
      return (data ?? []).length;
    },

    async updateRoom(id, expect, patch) {
      let query = db.from("rooms").update(patch).eq("id", id);
      for (const [column, value] of Object.entries(expect)) {
        query = value === null ? query.is(column, null) : query.eq(column, value);
      }
      const { data, error } = await query.select("id");
      if (error) fail("updateRoom", error.message);
      return (data ?? []).length > 0;
    },

    async listPlayers(roomId) {
      const { data, error } = await db
        .from("room_players")
        .select("id, room_id, seat, user_id, token_hash, nickname")
        .eq("room_id", roomId)
        .order("seat");
      if (error) fail("listPlayers", error.message);
      return (data ?? []) as RoomPlayerRow[];
    },

    async addPlayer(input) {
      const { data, error } = await db
        .from("room_players")
        .insert(input)
        .select("id, room_id, seat, user_id, token_hash, nickname")
        .single();
      if (error?.code === UNIQUE_VIOLATION) return "seat_taken";
      if (error) fail("addPlayer", error.message);
      return data as RoomPlayerRow;
    },

    async listGuesses(roomId) {
      const { data, error } = await db
        .from("room_guesses")
        .select(
          "room_id, player_id, question_id, guess_lat, guess_lng, distance_km, region_hit, score, elapsed_ms, guessed_at",
        )
        .eq("room_id", roomId);
      if (error) fail("listGuesses", error.message);
      return (data ?? []) as RoomGuessRow[];
    },

    async insertGuess(row) {
      const { error } = await db.from("room_guesses").insert(row);
      if (error?.code === UNIQUE_VIOLATION) return "duplicate";
      if (error) fail("insertGuess", error.message);
      return "ok";
    },
  };
}
