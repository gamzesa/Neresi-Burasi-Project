import type { getLeaderboard } from "@/lib/game/leaderboard";
import type { NameParts } from "@/lib/game/nicknames";
import type { Difficulty, GameMap } from "@/lib/game/scoring";
import type { nextStep, openHint, startGame, submitGuess } from "@/lib/game/service";

export type StartResponse = Awaited<ReturnType<typeof startGame>>;
export type HintResponse = Awaited<ReturnType<typeof openHint>>;
export type GuessResponse = Awaited<ReturnType<typeof submitGuess>>;
export type NextResponse = Awaited<ReturnType<typeof nextStep>>;
export type LeaderboardResponse = Awaited<ReturnType<typeof getLeaderboard>>;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function parse<T>(response: Response): Promise<T> {
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Sunucuya ulaşılamadı. Tekrar dene.";
    throw new ApiError(response.status, message);
  }
  return data as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  try {
    return await parse<T>(
      await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.");
  }
}

export const gameApi = {
  start: (map: GameMap, difficulty: Difficulty) => post<StartResponse>("/api/game/start", { map, difficulty }),
  hint: (sessionId: string) => post<HintResponse>("/api/game/hint", { sessionId }),
  guess: (sessionId: string, lat: number, lng: number) => post<GuessResponse>("/api/game/guess", { sessionId, lat, lng }),
  next: (sessionId: string, name?: NameParts) => post<NextResponse>("/api/game/next", { sessionId, name }),
};

export interface LeaderboardParams {
  map: GameMap;
  difficulty?: Difficulty;
  period: "all" | "week";
  sessionId?: string;
}

export async function fetchLeaderboard(params: LeaderboardParams): Promise<LeaderboardResponse> {
  const query = new URLSearchParams({ map: params.map, period: params.period });
  if (params.difficulty) query.set("difficulty", params.difficulty);
  if (params.sessionId) query.set("sessionId", params.sessionId);
  try {
    return await parse<LeaderboardResponse>(await fetch(`/api/leaderboard?${query}`));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.");
  }
}
