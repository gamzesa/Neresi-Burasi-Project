import "server-only";
import { createServerClient } from "@/lib/supabase/server";
import { periodStart } from "./period";
import type { Difficulty, GameMap } from "./scoring";
import { GameError } from "./service";

export const LEADERBOARD_LIMIT = 100;

export interface LeaderboardEntry {
  rank: number;
  nickname: string;
  totalScore: number;
  difficulty: Difficulty;
  finishedAt: string;
}

interface LeaderboardRow {
  id: string;
  nickname: string;
  total_score: number;
  difficulty: Difficulty;
  finished_at: string;
}

interface LeaderboardInput {
  map: GameMap;
  difficulty?: Difficulty;
  period: "all" | "week";
  sessionId?: string;
}

/**
 * İlk 100 kayıt (puan azalan, eşitlikte önce bitiren üstte). `sessionId` verilirse ve o oyun
 * (takma adı olduğu için) sıralamadaysa, ilk 100'de olmasa da oyuncunun kendi derecesi `me` olarak döner.
 */
export async function getLeaderboard(input: LeaderboardInput) {
  const db = createServerClient();
  const since = periodStart(input.period);

  const filtered = () => {
    let query = db.from("leaderboard").select("id, nickname, total_score, difficulty, finished_at", { count: "exact" }).eq("map", input.map);
    if (input.difficulty) query = query.eq("difficulty", input.difficulty);
    if (since) query = query.gte("finished_at", since);
    return query;
  };

  const { data, error } = await filtered()
    .order("total_score", { ascending: false })
    .order("finished_at", { ascending: true })
    .limit(LEADERBOARD_LIMIT);
  if (error) throw new Error(`Veritabanı hatası (leaderboard): ${error.message}`);

  const rows = (data ?? []) as LeaderboardRow[];
  const toEntry = (row: LeaderboardRow, rank: number): LeaderboardEntry => ({
    rank,
    nickname: row.nickname,
    totalScore: row.total_score,
    difficulty: row.difficulty,
    finishedAt: row.finished_at,
  });
  const entries = rows.map((row, index) => toEntry(row, index + 1));

  let me: LeaderboardEntry | null = null;
  if (input.sessionId) {
    const inTop = rows.findIndex((row) => row.id === input.sessionId);
    if (inTop >= 0) {
      me = entries[inTop];
    } else {
      const { data: own, error: ownError } = await filtered().eq("id", input.sessionId).maybeSingle();
      if (ownError) throw new GameError(500, "Sıralama okunamadı.");
      if (own) {
        const mine = own as LeaderboardRow;
        const { count, error: countError } = await filtered()
          .or(`total_score.gt.${mine.total_score},and(total_score.eq.${mine.total_score},finished_at.lt."${mine.finished_at}")`)
          .limit(1);
        if (countError) throw new GameError(500, "Sıralama okunamadı.");
        me = toEntry(mine, (count ?? 0) + 1);
      }
    }
  }

  return { entries, me };
}
