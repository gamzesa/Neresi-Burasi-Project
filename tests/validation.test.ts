import { describe, expect, it } from "vitest";
import { containsProfanity } from "@/lib/game/profanity";
import {
  guessRequestSchema,
  leaderboardQuerySchema,
  nicknameSchema,
  startRequestSchema,
} from "@/lib/validation";

const uuid = "123e4567-e89b-42d3-a456-426614174000";

describe("nicknameSchema", () => {
  it("boşlukları kırpar", () => {
    expect(nicknameSchema.parse("  Gamze  ")).toBe("Gamze");
  });

  it("çok kısa ve çok uzun adı reddeder", () => {
    expect(nicknameSchema.safeParse("a").success).toBe(false);
    expect(nicknameSchema.safeParse(" a ").success).toBe(false);
    expect(nicknameSchema.safeParse("a".repeat(21)).success).toBe(false);
    expect(nicknameSchema.safeParse("a".repeat(20)).success).toBe(true);
  });

  it("küfürlü adı reddeder", () => {
    expect(nicknameSchema.safeParse("siktir").success).toBe(false);
  });
});

describe("containsProfanity", () => {
  it("harf değiştirmeyi yakalar", () => {
    expect(containsProfanity("s1kt1r")).toBe(true);
    expect(containsProfanity("S İ K T İ R")).toBe(true);
  });

  it("masum adları geçirir", () => {
    expect(containsProfanity("Ayşe")).toBe(false);
    expect(containsProfanity("Mehmet")).toBe(false);
    expect(containsProfanity("Sıla")).toBe(false);
    expect(containsProfanity("Kaşif42")).toBe(false);
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

  it("leaderboard period varsayılanı all", () => {
    const parsed = leaderboardQuerySchema.parse({ map: "turkey" });
    expect(parsed.period).toBe("all");
  });
});
