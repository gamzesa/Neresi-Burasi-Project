import { postRoute } from "@/lib/api";
import { joinRoom } from "@/lib/room/service";
import { resolvePlayer } from "@/lib/room/nickname";
import { createSupabaseRoomStore } from "@/lib/room/store.supabase";
import { joinRoomRequestSchema } from "@/lib/validation";

export const POST = postRoute(joinRoomRequestSchema, async ({ code, nickname }) => {
  const player = await resolvePlayer(nickname);
  return joinRoom(createSupabaseRoomStore(), { code, ...player });
});
