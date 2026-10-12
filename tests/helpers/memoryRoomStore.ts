import { randomUUID } from "node:crypto";
import type { QuestionRow } from "@/lib/game/types";
import type { RoomGuessRow, RoomPlayerRow, RoomRow, RoomStore } from "@/lib/room/types";

/** Testler için bellek içi RoomStore; Supabase'in benzersizlik ve iyimser kilit davranışını taklit eder. */
export function createMemoryRoomStore(questions: QuestionRow[], createdAt = new Date()) {
  const rooms = new Map<string, RoomRow>();
  const players: RoomPlayerRow[] = [];
  const guesses: RoomGuessRow[] = [];

  const store: RoomStore = {
    async listQuestionIds(map, difficulty) {
      return questions.filter((q) => q.map === map && q.difficulty === difficulty && q.is_active).map((q) => q.id);
    },
    async getQuestion(id) {
      return questions.find((q) => q.id === id) ?? null;
    },
    async createRoom(input) {
      if ([...rooms.values()].some((r) => r.code === input.code)) return "code_taken";
      const row: RoomRow = {
        id: randomUUID(),
        ...input,
        status: "waiting",
        current_index: 0,
        question_started_at: null,
        created_at: createdAt.toISOString(),
        finished_at: null,
      };
      rooms.set(row.id, row);
      return { ...row };
    },
    async getRoomByCode(code) {
      const row = [...rooms.values()].find((r) => r.code === code);
      return row ? { ...row } : null;
    },
    async updateRoom(id, expect, patch) {
      const row = rooms.get(id);
      if (!row) return false;
      for (const [key, value] of Object.entries(expect)) {
        if (row[key as keyof RoomRow] !== value) return false;
      }
      Object.assign(row, patch);
      return true;
    },
    async listPlayers(roomId) {
      return players.filter((p) => p.room_id === roomId).map((p) => ({ ...p }));
    },
    async addPlayer(input) {
      if (players.some((p) => p.room_id === input.room_id && p.seat === input.seat)) return "seat_taken";
      const row: RoomPlayerRow = { id: randomUUID(), ...input };
      players.push(row);
      return { ...row };
    },
    async listGuesses(roomId) {
      return guesses.filter((g) => g.room_id === roomId).map((g) => ({ ...g }));
    },
    async insertGuess(row) {
      if (guesses.some((g) => g.player_id === row.player_id && g.question_id === row.question_id)) return "duplicate";
      guesses.push({ ...row });
      return "ok";
    },
  };

  return { store, rooms, players, guesses };
}
