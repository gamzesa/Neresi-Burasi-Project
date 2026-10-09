import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/redirect";
import { containsProfanity } from "@/lib/game/profanity";
import {
  chooseUsernameRequestSchema,
  claimRequestSchema,
  forgotPasswordRequestSchema,
  guessRequestSchema,
  leaderboardQuerySchema,
  loginRequestSchema,
  registerRequestSchema,
  resetPasswordRequestSchema,
  startRequestSchema,
  usernameSchema,
} from "@/lib/validation";

const uuid = "123e4567-e89b-42d3-a456-426614174000";

describe("usernameSchema", () => {
  it("boşlukları kırpar ve geçerli adı kabul eder", () => {
    expect(usernameSchema.parse("  Gamze_42  ")).toBe("Gamze_42");
  });

  it("uzunluk sınırlarını denetler", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("abc").success).toBe(true);
    expect(usernameSchema.safeParse("a".repeat(20)).success).toBe(true);
    expect(usernameSchema.safeParse("a".repeat(21)).success).toBe(false);
  });

  it("yalnızca harf, rakam ve alt çizgi kabul eder", () => {
    expect(usernameSchema.safeParse("ali veli").success).toBe(false);
    expect(usernameSchema.safeParse("ali-veli").success).toBe(false);
    expect(usernameSchema.safeParse("şükrü").success).toBe(false);
    expect(usernameSchema.safeParse("ali.veli").success).toBe(false);
  });

  it("küfürlü ve ayrılmış adları reddeder", () => {
    expect(usernameSchema.safeParse("siktir").success).toBe(false);
    expect(usernameSchema.safeParse("s1kt1r_x").success).toBe(false);
    expect(usernameSchema.safeParse("Admin").success).toBe(false);
    expect(usernameSchema.safeParse("NeresiBurasi").success).toBe(false);
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

describe("kayıt ve giriş şemaları", () => {
  const valid = { email: " Gamze@Example.com ", username: "gamze_1", password: "sifre12345" };

  it("e-postayı kırpıp küçük harfe çevirir", () => {
    expect(registerRequestSchema.parse(valid).email).toBe("gamze@example.com");
  });

  it("geçersiz e-postayı ve kısa/uzun şifreyi reddeder", () => {
    expect(registerRequestSchema.safeParse({ ...valid, email: "gamze" }).success).toBe(false);
    expect(registerRequestSchema.safeParse({ ...valid, password: "kisa" }).success).toBe(false);
    expect(registerRequestSchema.safeParse({ ...valid, password: "a".repeat(73) }).success).toBe(false);
  });

  it("giriş şifre uzunluğunu denetlemez ama boş şifreyi reddeder", () => {
    expect(loginRequestSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(loginRequestSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("istek şemaları", () => {
  it("start geçerli girdiyi kabul eder; geçersiz harita/zorluğu reddeder", () => {
    expect(startRequestSchema.safeParse({ map: "world", difficulty: "easy" }).success).toBe(true);
    expect(startRequestSchema.safeParse({ map: "mars", difficulty: "easy" }).success).toBe(false);
    expect(startRequestSchema.safeParse({ map: "world", difficulty: "x" }).success).toBe(false);
  });

  it("guess koordinat aralığını denetler", () => {
    expect(guessRequestSchema.safeParse({ sessionId: uuid, lat: 40, lng: 30 }).success).toBe(true);
    expect(guessRequestSchema.safeParse({ sessionId: uuid, lat: 91, lng: 30 }).success).toBe(false);
    expect(guessRequestSchema.safeParse({ sessionId: uuid, lat: 40, lng: 181 }).success).toBe(false);
    expect(guessRequestSchema.safeParse({ sessionId: "x", lat: 40, lng: 30 }).success).toBe(false);
  });

  it("claim oturum kimliği ister", () => {
    expect(claimRequestSchema.safeParse({ sessionId: uuid }).success).toBe(true);
    expect(claimRequestSchema.safeParse({ sessionId: "x" }).success).toBe(false);
  });

  it("leaderboard period varsayılanı all", () => {
    expect(leaderboardQuerySchema.parse({ map: "turkey" }).period).toBe("all");
  });
});

describe("safeNextPath", () => {
  it("site içi yolları korur", () => {
    expect(safeNextPath("/leaderboard?map=turkey")).toBe("/leaderboard?map=turkey");
    expect(safeNextPath("/")).toBe("/");
  });

  it("dış adresleri ana sayfaya çevirir", () => {
    expect(safeNextPath("https://kotu.example")).toBe("/");
    expect(safeNextPath("//kotu.example")).toBe("/");
    expect(safeNextPath("/\\kotu.example")).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });
});

describe("hesap kurtarma şemaları", () => {
  it("şifre sıfırlama e-postayı kırpıp küçük harfe çevirir; geçersiz e-postayı reddeder", () => {
    expect(forgotPasswordRequestSchema.parse({ email: " Ali@Example.com " }).email).toBe("ali@example.com");
    expect(forgotPasswordRequestSchema.safeParse({ email: "ali" }).success).toBe(false);
  });

  it("yeni şifre en az 8 karakter olmalı", () => {
    expect(resetPasswordRequestSchema.safeParse({ password: "kisa" }).success).toBe(false);
    expect(resetPasswordRequestSchema.safeParse({ password: "yeterince-uzun" }).success).toBe(true);
  });

  it("kullanıcı adı seçimi kayıttaki kurallarla aynıdır", () => {
    expect(chooseUsernameRequestSchema.safeParse({ username: "Gezgin_42" }).success).toBe(true);
    expect(chooseUsernameRequestSchema.safeParse({ username: "siktir" }).success).toBe(false);
    expect(chooseUsernameRequestSchema.safeParse({ username: "ab" }).success).toBe(false);
    expect(chooseUsernameRequestSchema.safeParse({ username: "şükrü" }).success).toBe(false);
  });
});
