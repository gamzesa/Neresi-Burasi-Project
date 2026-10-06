import { postRoute } from "@/lib/api";
import { openHint } from "@/lib/game/service";
import { createSupabaseStore } from "@/lib/game/store.supabase";
import { hintRequestSchema } from "@/lib/validation";

export const POST = postRoute(hintRequestSchema, (input) => openHint(createSupabaseStore(), input));
