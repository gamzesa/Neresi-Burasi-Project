import { postRoute } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/server";
import { GameError, claimSession } from "@/lib/game/service";
import { createSupabaseStore } from "@/lib/game/store.supabase";
import { claimRequestSchema } from "@/lib/validation";

export const POST = postRoute(claimRequestSchema, async (input) => {
  const user = await getCurrentUser();
  if (!user) throw new GameError(401, "Skoru hesabına eklemek için giriş yapmalısın.");
  return claimSession(createSupabaseStore(), { sessionId: input.sessionId, userId: user.id });
});
