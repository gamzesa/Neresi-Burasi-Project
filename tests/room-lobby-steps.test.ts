import { describe, expect, it } from "vitest";
import { isCodeValid, isNicknameValid, lobbySteps, maxGameMinutes } from "@/lib/roomLobbySteps";

describe("arkadaşla oyun adımları", () => {
  it("giriş yapmamışsa önce takma ad sorulur, diğer sorular ondan sonra gelir", () => {
    expect(lobbySteps("create", true)).toEqual(["nickname", "map", "difficulty", "seconds", "count", "review"]);
    expect(lobbySteps("join", true)).toEqual(["nickname", "code"]);
  });

  it("giriş yapmışsa takma ad adımı atlanır", () => {
    expect(lobbySteps("create", false)).toEqual(["map", "difficulty", "seconds", "count", "review"]);
    expect(lobbySteps("join", false)).toEqual(["code"]);
  });

  it("takma ad ve oda kodu doğrulaması", () => {
    expect(isNicknameValid("")).toBe(false);
    expect(isNicknameValid(" A ")).toBe(false);
    expect(isNicknameValid("Ay")).toBe(true);
    expect(isCodeValid("ABCD")).toBe(false);
    expect(isCodeValid(" ABCDE ")).toBe(true);
  });

  it("en uzun oyun süresi dakikaya yukarı yuvarlanır", () => {
    // 5 soru × (30 + 2 + 8) sn = 200 sn → 4 dk
    expect(maxGameMinutes(30, 5)).toBe(4);
    // 15 soru × (90 + 2 + 8) sn = 1500 sn → 25 dk
    expect(maxGameMinutes(90, 15)).toBe(25);
  });
});
