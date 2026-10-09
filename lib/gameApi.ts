import type { getLeaderboard } from "@/lib/game/leaderboard";
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
  next: (sessionId: string) => post<NextResponse>("/api/game/next", { sessionId }),
  claim: (sessionId: string) => post<{ totalScore: number }>("/api/game/claim", { sessionId }),
};

export const authApi = {
  register: (input: { email: string; username: string; password: string }) =>
    post<{ username: string }>("/api/auth/register", input),
  login: (input: { email: string; password: string }) => post<{ username: string }>("/api/auth/login", input),
  logout: () => post<{ ok: true }>("/api/auth/logout", {}),
  forgotPassword: (email: string) => post<{ ok: true }>("/api/auth/forgot", { email }),
  resetPassword: (password: string) => post<{ ok: true }>("/api/auth/reset", { password }),
  chooseUsername: (username: string) => post<{ username: string }>("/api/auth/username", { username }),
};

export interface LeaderboardParams {
  map: GameMap;
  difficulty?: Difficulty;
  period: "all" | "week";
}

export async function fetchLeaderboard(params: LeaderboardParams): Promise<LeaderboardResponse> {
  const query = new URLSearchParams({ map: params.map, period: params.period });
  if (params.difficulty) query.set("difficulty", params.difficulty);
  try {
    return await parse<LeaderboardResponse>(await fetch(`/api/leaderboard?${query}`));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.");
  }
}
