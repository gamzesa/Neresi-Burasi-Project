import { postRoute } from "@/lib/api";
import { nextStep } from "@/lib/game/service";
import { createSupabaseStore } from "@/lib/game/store.supabase";
import { nextRequestSchema } from "@/lib/validation";

export const POST = postRoute(nextRequestSchema, (input) => nextStep(createSupabaseStore(), input));
