import { postRoute } from "@/lib/api";
import { startRoom } from "@/lib/room/service";
import { createSupabaseRoomStore } from "@/lib/room/store.supabase";
import { roomStateRequestSchema } from "@/lib/validation";

export const POST = postRoute(roomStateRequestSchema, (input) => startRoom(createSupabaseRoomStore(), input));
