import { postRoute } from "@/lib/api";
import { buildNickname } from "@/lib/game/nicknames";
import { nextStep } from "@/lib/game/service";
import { createSupabaseStore } from "@/lib/game/store.supabase";
import { nextRequestSchema } from "@/lib/validation";

export const POST = postRoute(nextRequestSchema, ({ sessionId, name }) =>
  nextStep(createSupabaseStore(), { sessionId, nickname: name ? buildNickname(name) : undefined }),
);
