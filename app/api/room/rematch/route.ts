import { postRoute } from "@/lib/api";
import { respondRematch } from "@/lib/room/service";
import { createSupabaseRoomStore } from "@/lib/room/store.supabase";
import { rematchRequestSchema } from "@/lib/validation";

export const POST = postRoute(rematchRequestSchema, (input) => respondRematch(createSupabaseRoomStore(), input));
