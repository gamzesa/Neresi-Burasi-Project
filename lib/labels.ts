import type { Difficulty, GameMap } from "@/lib/game/scoring";

export const MAP_LABELS: Record<GameMap, string> = {
  world: "Dünya",
  turkey: "Türkiye",
};

export const MAP_DESCRIPTIONS: Record<GameMap, string> = {
  world: "Ülkeleri tanı, kıtalar arası konumu bul.",
  turkey: "81 il arasından doğru yeri işaretle.",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: "4 ipucu, puan katsayısı ×1,0",
  medium: "3 ipucu, puan katsayısı ×1,5",
  hard: "2 ipucu, puan katsayısı ×2,0",
};
