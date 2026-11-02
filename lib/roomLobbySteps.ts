import { DUEL_GRACE_SECONDS, DUEL_RESULT_SECONDS } from "@/lib/game/scoring";
import { NICKNAME_MIN } from "@/lib/validation";

export type LobbyMode = "create" | "join";
export type LobbyStep = "nickname" | "map" | "difficulty" | "seconds" | "count" | "code" | "review";

/**
 * Arkadaşla oyun ekranının adımları: her adımda tek soru sorulur.
 * Giriş yapmamış kullanıcıya önce takma adı sorulur (kullanıcı adı olanda bu adım atlanır).
 */
export function lobbySteps(mode: LobbyMode, isGuest: boolean): LobbyStep[] {
  const nickname: LobbyStep[] = isGuest ? ["nickname"] : [];
  if (mode === "join") return [...nickname, "code"];
  return [...nickname, "map", "difficulty", "seconds", "count", "review"];
}

/** Takma ad geçerli mi (en az 2 karakter; ayrıntılı doğrulama sunucuda). */
export function isNicknameValid(nickname: string): boolean {
  return nickname.trim().length >= NICKNAME_MIN;
}

/** Oda kodu 5 karakterli olmalı. */
export function isCodeValid(code: string): boolean {
  return code.trim().length === 5;
}

/** Bir oyunun en fazla süreceği dakika (her soru: süre + ağ payı + sonuç ekranı); özet ekranında gösterilir. */
export function maxGameMinutes(secondsPerQuestion: number, questionCount: number): number {
  const seconds = questionCount * (secondsPerQuestion + DUEL_GRACE_SECONDS + DUEL_RESULT_SECONDS);
  return Math.ceil(seconds / 60);
}
