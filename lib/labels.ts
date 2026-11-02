import { CITY_LABELS, TURKEY_PROVINCE_LABELS } from "@/components/map/mapStyle";
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

/**
 * Zorluk seçerken gösterilen not: haritada şehir/il adlarının görünüp görünmediği.
 * Türkiye'de il adları yalnızca Kolay'da; Dünya'da Kolay'da tüm şehirler, Orta'da büyük şehirler, Zor'da hiçbiri.
 */
export function labelNote(map: GameMap, difficulty: Difficulty): string {
  if (map === "turkey") {
    return TURKEY_PROVINCE_LABELS[difficulty] ? "İl adları haritada görünür" : "İl adları haritada görünmez";
  }
  const cities = CITY_LABELS[difficulty];
  if (!cities) return "Şehir adları haritada görünmez";
  return cities.minRank === 0 ? "Şehir adları haritada görünür" : "Yalnızca büyük şehirlerin adları görünür";
}
