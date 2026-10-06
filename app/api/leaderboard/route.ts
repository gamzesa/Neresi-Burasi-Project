import { getRoute } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/server";
import { getLeaderboard } from "@/lib/game/leaderboard";
import { leaderboardQuerySchema } from "@/lib/validation";

export const GET = getRoute(leaderboardQuerySchema, async (input) => {
  const user = await getCurrentUser();
  return getLeaderboard({ ...input, userId: user?.id });
});
