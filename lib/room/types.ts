import type { Difficulty, GameMap } from "@/lib/game/scoring";
import type { GameStore } from "@/lib/game/types";

export type RoomStatus = "waiting" | "active" | "finished";

export interface RoomRow {
  id: string;
  code: string;
  map: GameMap;
  difficulty: Difficulty;
  question_ids: string[];
  status: RoomStatus;
  current_index: number;
  /** Geçerli sorunun açılış zamanı (ISO); gelecekte olabilir (geri sayım). Bekleme odasında null. */
  question_started_at: string | null;
  created_at: string;
  finished_at: string | null;
  /** "Tekrar oyna" isteğini yapan oyuncunun koltuğu. */
  rematch_by: number | null;
  rematch_status: RematchStatus | null;
  /** Kabul edilince açılan yeni odanın kodu. */
  rematch_code: string | null;
}

export type RematchStatus = "pending" | "declined" | "accepted";

export interface RoomPlayerRow {
  id: string;
  room_id: string;
  /** 0 = odayı kuran, 1 = katılan. */
  seat: number;
  user_id: string | null;
  token_hash: string;
  nickname: string;
}

export interface RoomGuessRow {
  room_id: string;
  player_id: string;
  question_id: string;
  guess_lat: number;
  guess_lng: number;
  distance_km: number;
  region_hit: boolean;
  score: number;
  elapsed_ms: number;
  guessed_at: string;
}

export type RoomExpectation = Partial<Pick<RoomRow, "status" | "current_index" | "rematch_status">>;
export type RoomPatch = Partial<
  Pick<
    RoomRow,
    "status" | "current_index" | "question_started_at" | "finished_at" | "rematch_by" | "rematch_status" | "rematch_code"
  >
>;

/** Çok oyunculu mantığın veri erişim sınırı. Soru okuma, tek oyunculu GameStore ile ortaktır. */
export interface RoomStore extends Pick<GameStore, "listQuestionIds" | "getQuestion"> {
  /** Oda kodu başka bir odada kullanılıyorsa "code_taken" döner. */
  createRoom(input: Pick<RoomRow, "code" | "map" | "difficulty" | "question_ids">): Promise<RoomRow | "code_taken">;
  getRoomByCode(code: string): Promise<RoomRow | null>;
  /** `olderThanIso`'dan eski odaları (oyuncu ve tahminleriyle birlikte) siler; silinen oda sayısını döner. */
  deleteStaleRooms(olderThanIso: string): Promise<number>;
  /** Beklenen değerler (null dahil) tutuyorsa günceller ve true döner; başka istek araya girdiyse false. */
  updateRoom(id: string, expect: RoomExpectation, patch: RoomPatch): Promise<boolean>;
  listPlayers(roomId: string): Promise<RoomPlayerRow[]>;
  /** Koltuk doluysa "seat_taken" döner. */
  addPlayer(input: Omit<RoomPlayerRow, "id">): Promise<RoomPlayerRow | "seat_taken">;
  listGuesses(roomId: string): Promise<RoomGuessRow[]>;
  insertGuess(row: RoomGuessRow): Promise<"ok" | "duplicate">;
}
