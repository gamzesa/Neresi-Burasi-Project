import { postRoute } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/server";
import { startGame } from "@/lib/game/service";
import { createSupabaseStore } from "@/lib/game/store.supabase";
import { startRequestSchema } from "@/lib/validation";

export const POST = postRoute(startRequestSchema, async (input) => {
  const user = await getCurrentUser();
  return startGame(createSupabaseStore(), { ...input, userId: user?.id ?? null });
});
