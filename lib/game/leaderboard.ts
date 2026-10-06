import "server-only";
import { createServerClient } from "@/lib/supabase/server";
import { periodStart } from "./period";
import type { Difficulty, GameMap } from "./scoring";

export const LEADERBOARD_LIMIT = 100;

export interface LeaderboardEntry {
  rank: number;
  username: string;
  difficulty: Difficulty;
  totalScore: number;
  finishedAt: string;
  isMe: boolean;
}

interface LeaderboardRow {
  rank: number | string;
  username: string;
  difficulty: Difficulty;
  total_score: number;
  finished_at: string;
  is_me: boolean;
}

interface LeaderboardInput {
  map: GameMap;
  difficulty?: Difficulty;
  period: "all" | "week";
  /** Girişli kullanıcı; verilirse kendi derecesi ilk 100'de olmasa da listeye eklenir. */
  userId?: string;
}

/**
 * Her kullanıcının filtreye uyan en iyi oyunu sayılır (puan azalan, eşitlikte önce bitiren üstte).
 * İlk 100 kayıt döner; giriş yapmış kullanıcının kendi derecesi ilk 100'de olmasa da dahildir.
 */
export async function getLeaderboard(input: LeaderboardInput) {
  const { data, error } = await createServerClient().rpc("get_leaderboard", {
    p_map: input.map,
    p_difficulty: input.difficulty ?? null,
    p_since: periodStart(input.period),
    p_limit: LEADERBOARD_LIMIT,
    p_user: input.userId ?? null,
  });
  if (error) throw new Error(`Veritabanı hatası (leaderboard): ${error.message}`);

  const entries: LeaderboardEntry[] = ((data ?? []) as LeaderboardRow[]).map((row) => ({
    rank: Number(row.rank),
    username: row.username,
    difficulty: row.difficulty,
    totalScore: row.total_score,
    finishedAt: row.finished_at,
    isMe: row.is_me,
  }));
  return { entries };
}
