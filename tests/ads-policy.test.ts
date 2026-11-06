import { describe, expect, it } from "vitest";
import { AD_EVERY_N_GAMES, shouldShowAd } from "@/lib/ads/policy";

describe("shouldShowAd", () => {
  it("2 oyunda bir reklam gösterir", () => {
    expect(AD_EVERY_N_GAMES).toBe(2);
    expect(shouldShowAd(1)).toBe(false);
    expect(shouldShowAd(2)).toBe(true);
    expect(shouldShowAd(3)).toBe(false);
    expect(shouldShowAd(4)).toBe(true);
  });

  it("sıfır veya negatif sayıda reklam göstermez", () => {
    expect(shouldShowAd(0)).toBe(false);
    expect(shouldShowAd(-2)).toBe(false);
  });
});
