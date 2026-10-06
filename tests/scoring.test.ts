import { describe, expect, it } from "vitest";
import {
  HINT_MULTIPLIERS,
  calculateScore,
  distanceScore,
  hintMultiplier,
  totalHints,
} from "@/lib/game/scoring";

describe("distanceScore", () => {
  it.each([
    [0, 1000],
    [100, 936],
    [500, 717],
    [1500, 368],
    [3000, 135],
  ])("dünya %i km -> %i", (km, expected) => {
    expect(Math.round(distanceScore(km, "world"))).toBe(expected);
  });

  it.each([
    [0, 1000],
    [10, 875],
    [50, 513],
    [100, 264],
    [200, 69],
  ])("türkiye %i km -> %i", (km, expected) => {
    expect(Math.round(distanceScore(km, "turkey"))).toBe(expected);
  });

  it("negatif mesafeyi 0 sayar", () => {
    expect(distanceScore(-5, "world")).toBe(1000);
  });
});

describe("hintMultiplier", () => {
  it("tablodaki değerleri döner", () => {
    expect(hintMultiplier("easy", 4)).toBe(0.4);
    expect(hintMultiplier("medium", 3)).toBe(0.45);
    expect(hintMultiplier("hard", 2)).toBe(0.6);
  });

  it("geçersiz ipucu sayısında hata fırlatır", () => {
    expect(() => hintMultiplier("hard", 0)).toThrow(RangeError);
    expect(() => hintMultiplier("hard", 3)).toThrow(RangeError);
    expect(() => hintMultiplier("easy", 1.5)).toThrow(RangeError);
  });

  it("ipucu sayıları zorlukla eşleşir", () => {
    expect(totalHints("easy")).toBe(4);
    expect(totalHints("medium")).toBe(3);
    expect(totalHints("hard")).toBe(2);
    expect(HINT_MULTIPLIERS.easy[0]).toBe(1);
  });
});

describe("calculateScore", () => {
  it("tam isabet, bölge içinde, kolay, 1 ipucu: 1500", () => {
    expect(
      calculateScore({ map: "world", difficulty: "easy", distanceKm: 0, regionHit: true, hintsOpened: 1 }),
    ).toBe(1500);
  });

  it("tam isabet, zor, 1 ipucu: 3000", () => {
    expect(
      calculateScore({ map: "turkey", difficulty: "hard", distanceKm: 0, regionHit: true, hintsOpened: 1 }),
    ).toBe(3000);
  });

  it("bölge dışında bonus yok", () => {
    expect(
      calculateScore({ map: "world", difficulty: "easy", distanceKm: 1500, regionHit: false, hintsOpened: 1 }),
    ).toBe(368);
  });

  it("katsayıları birlikte uygular", () => {
    const expected = Math.round((1000 * Math.exp(-1) + 500) * 0.7 * 1.5);
    expect(
      calculateScore({ map: "world", difficulty: "medium", distanceKm: 1500, regionHit: true, hintsOpened: 2 }),
    ).toBe(expected);
  });

  it("daha yakın tahmin daha çok puan verir", () => {
    const near = calculateScore({ map: "turkey", difficulty: "easy", distanceKm: 20, regionHit: false, hintsOpened: 1 });
    const far = calculateScore({ map: "turkey", difficulty: "easy", distanceKm: 200, regionHit: false, hintsOpened: 1 });
    expect(near).toBeGreaterThan(far);
  });

  it("daha çok ipucu açmak puanı düşürür", () => {
    const base = { map: "world", difficulty: "easy", distanceKm: 300, regionHit: true } as const;
    expect(calculateScore({ ...base, hintsOpened: 1 })).toBeGreaterThan(calculateScore({ ...base, hintsOpened: 4 }));
  });
});
