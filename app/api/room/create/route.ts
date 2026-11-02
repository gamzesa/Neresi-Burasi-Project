import { postRoute } from "@/lib/api";
import { createRoom } from "@/lib/room/service";
import { resolvePlayer } from "@/lib/room/nickname";
import { createSupabaseRoomStore } from "@/lib/room/store.supabase";
import { createRoomRequestSchema } from "@/lib/validation";

export const POST = postRoute(
  createRoomRequestSchema,
  async ({ map, difficulty, nickname, secondsPerQuestion, questionCount }) => {
    const player = await resolvePlayer(nickname);
    return createRoom(createSupabaseRoomStore(), { map, difficulty, secondsPerQuestion, questionCount, ...player });
  },
);
