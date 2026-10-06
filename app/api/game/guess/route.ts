import { postRoute } from "@/lib/api";
import { checkRegionHit } from "@/lib/game/regions";
import { submitGuess } from "@/lib/game/service";
import { createSupabaseStore } from "@/lib/game/store.supabase";
import { guessRequestSchema } from "@/lib/validation";

export const POST = postRoute(guessRequestSchema, (input) =>
  submitGuess(createSupabaseStore(), checkRegionHit, input),
);
