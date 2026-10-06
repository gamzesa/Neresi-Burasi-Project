import { getRoute } from "@/lib/api";
import { getLeaderboard } from "@/lib/game/leaderboard";
import { leaderboardQuerySchema } from "@/lib/validation";

export const GET = getRoute(leaderboardQuerySchema, (input) => getLeaderboard(input));
