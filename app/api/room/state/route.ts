import { postRoute } from "@/lib/api";
import { getRoomState } from "@/lib/room/service";
import { createSupabaseRoomStore } from "@/lib/room/store.supabase";
import { roomStateRequestSchema } from "@/lib/validation";

// Oyuncu anahtarı gövdede taşındığı için durum sorgusu da POST'tur (adres günlüklerine sızmasın).
export const POST = postRoute(roomStateRequestSchema, (input) => getRoomState(createSupabaseRoomStore(), input));
