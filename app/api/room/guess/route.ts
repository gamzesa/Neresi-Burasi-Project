import { postRoute } from "@/lib/api";
import { checkRegionHit } from "@/lib/game/regions";
import { submitRoomGuess } from "@/lib/room/service";
import { createSupabaseRoomStore } from "@/lib/room/store.supabase";
import { roomGuessRequestSchema } from "@/lib/validation";

export const POST = postRoute(roomGuessRequestSchema, (input) =>
  submitRoomGuess(createSupabaseRoomStore(), checkRegionHit, input),
);
