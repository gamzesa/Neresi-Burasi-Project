import { beforeEach, describe, expect, it } from "vitest";
import { RATE_LIMITS, checkRateLimit, clientKey, resetRateLimits } from "@/lib/rateLimit";

const RULE = { max: 3, windowSeconds: 60 };

describe("hız sınırı", () => {
  beforeEach(() => resetRateLimits());

  it("sınıra kadar izin verir, aşınca engeller ve kalan süreyi bildirir", () => {
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(checkRateLimit("1.1.1.1", "/x", RULE, t + i).allowed).toBe(true);
    const blocked = checkRateLimit("1.1.1.1", "/x", RULE, t + 10_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(50);
  });

  it("pencere bitince sayaç sıfırlanır", () => {
    const t = 1_000_000;
    for (let i = 0; i < 4; i++) checkRateLimit("1.1.1.1", "/x", RULE, t);
    expect(checkRateLimit("1.1.1.1", "/x", RULE, t + 60_001).allowed).toBe(true);
  });

  it("istemciler ve uç noktalar birbirinden bağımsızdır", () => {
    const t = 1_000_000;
    for (let i = 0; i < 4; i++) checkRateLimit("1.1.1.1", "/x", RULE, t);
    expect(checkRateLimit("2.2.2.2", "/x", RULE, t).allowed).toBe(true);
    expect(checkRateLimit("1.1.1.1", "/y", RULE, t).allowed).toBe(true);
  });

  it("istemci adresi x-forwarded-for'un ilk girdisidir", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("9.9.9.9");
    expect(clientKey(new Headers({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(clientKey(new Headers())).toBe("local");
  });

  it("normal oyun akışını engellemez: saniyede bir durum sorgusu dakikada 60'tır, sınır ondan çok yüksektir", () => {
    expect(RATE_LIMITS["/api/room/state"].max).toBeGreaterThanOrEqual(120);
    // Aynı Wi-Fi'daki iki oyuncu + tekrar oyna sonrası ekranlar için pay bırakılır.
    expect(RATE_LIMITS["/api/auth/login"].max).toBeLessThanOrEqual(10);
  });
});
