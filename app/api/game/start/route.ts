import { postRoute } from "@/lib/api";
import { startGame } from "@/lib/game/service";
import { createSupabaseStore } from "@/lib/game/store.supabase";
import { startRequestSchema } from "@/lib/validation";

export const POST = postRoute(startRequestSchema, (input) => startGame(createSupabaseStore(), input));
