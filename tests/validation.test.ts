import { describe, expect, it } from "vitest";
import {
  ADJECTIVES,
  MAX_NAME_NUMBER,
  NOUNS,
  buildNickname,
  isValidNameParts,
  randomNameParts,
} from "@/lib/game/nicknames";
import {
  guessRequestSchema,
  leaderboardQuerySchema,
  nameSelectionSchema,
  nextRequestSchema,
  startRequestSchema,
} from "@/lib/validation";

const uuid = "123e4567-e89b-42d3-a456-426614174000";

describe("rastgele ad", () => {
  it("sözcüklerden ad kurar", () => {
    expect(buildNickname({ adjective: 0, noun: 0, number: 42 })).toBe(`${ADJECTIVES[0]} ${NOUNS[0]} 42`);
  });

  it("her kombinasyon veritabanındaki 2-20 karakter sınırına sığar", () => {
    const longestAdjective = Math.max(...ADJECTIVES.map((w) => w.length));
    const longestNoun = Math.max(...NOUNS.map((w) => w.length));
    const longest = longestAdjective + 1 + longestNoun + 1 + String(MAX_NAME_NUMBER).length;
    expect(longest).toBeLessThanOrEqual(20);
  });

  it("listelerde tekrar eden sözcük yok", () => {
    expect(new Set(ADJECTIVES).size).toBe(ADJECTIVES.length);
    expect(new Set(NOUNS).size).toBe(NOUNS.length);
  });

  it("aralık dışı parçaları reddeder", () => {
    expect(isValidNameParts({ adjective: ADJECTIVES.length, noun: 0, number: 0 })).toBe(false);
    expect(isValidNameParts({ adjective: 0, noun: -1, number: 0 })).toBe(false);
    expect(isValidNameParts({ adjective: 0, noun: 0, number: MAX_NAME_NUMBER + 1 })).toBe(false);
    expect(isValidNameParts({ adjective: 0.5, noun: 0, number: 0 })).toBe(false);
    expect(() => buildNickname({ adjective: 999, noun: 0, number: 0 })).toThrow(RangeError);
  });

  it("randomNameParts her zaman geçerli parça üretir", () => {
    for (let i = 0; i < 200; i++) expect(isValidNameParts(randomNameParts())).toBe(true);
    expect(isValidNameParts(randomNameParts(() => 0.999999))).toBe(true);
    expect(isValidNameParts(randomNameParts(() => 0))).toBe(true);
  });
});

describe("istek şemaları", () => {
  it("start geçerli girdiyi kabul eder", () => {
    expect(startRequestSchema.safeParse({ map: "world", difficulty: "easy" }).success).toBe(true);
  });

  it("start geçersiz harita/zorluğu reddeder", () => {
    expect(startRequestSchema.safeParse({ map: "mars", difficulty: "easy" }).success).toBe(false);
    expect(startRequestSchema.safeParse({ map: "world", difficulty: "x" }).success).toBe(false);
  });

  it("guess koordinat aralığını denetler", () => {
    expect(guessRequestSchema.safeParse({ sessionId: uuid, lat: 40, lng: 30 }).success).toBe(true);
    expect(guessRequestSchema.safeParse({ sessionId: uuid, lat: 91, lng: 30 }).success).toBe(false);
    expect(guessRequestSchema.safeParse({ sessionId: uuid, lat: 40, lng: 181 }).success).toBe(false);
    expect(guessRequestSchema.safeParse({ sessionId: "x", lat: 40, lng: 30 }).success).toBe(false);
  });

  it("next yalnızca ad parçalarını kabul eder; serbest metin ad yok sayılır", () => {
    const ok = nextRequestSchema.safeParse({ sessionId: uuid, name: { adjective: 1, noun: 2, number: 3 } });
    expect(ok.success).toBe(true);

    const free = nextRequestSchema.parse({ sessionId: uuid, nickname: "Serbest Yazi" });
    expect(free).toEqual({ sessionId: uuid });

    expect(nameSelectionSchema.safeParse({ adjective: 1000, noun: 0, number: 0 }).success).toBe(false);
    expect(nameSelectionSchema.safeParse({ adjective: "1", noun: 0, number: 0 }).success).toBe(false);
  });

  it("leaderboard period varsayılanı all", () => {
    const parsed = leaderboardQuerySchema.parse({ map: "turkey" });
    expect(parsed.period).toBe("all");
  });
});
