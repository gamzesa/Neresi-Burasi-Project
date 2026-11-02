import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CITY_LABELS, TURKEY_PROVINCE_LABELS, buildMapStyle } from "@/components/map/mapStyle";
import { DIFFICULTIES } from "@/lib/game/scoring";
import { labelNote } from "@/lib/labels";

const layerIds = (map: "world" | "turkey", difficulty?: (typeof DIFFICULTIES)[number]) =>
  buildMapStyle(map, "", difficulty).layers.map((layer) => layer.id);

describe("Türkiye il etiketleri", () => {
  it("yalnızca Kolay seviyede görünür", () => {
    expect(layerIds("turkey", "easy")).toContain("province-labels");
    expect(layerIds("turkey", "medium")).not.toContain("province-labels");
    expect(layerIds("turkey", "hard")).not.toContain("province-labels");
    expect(layerIds("turkey")).not.toContain("province-labels");
  });

  it("dünya haritasına il etiketi eklenmez; Türkiye'ye dünya şehir etiketi eklenmez", () => {
    for (const difficulty of DIFFICULTIES) {
      expect(layerIds("world", difficulty)).not.toContain("province-labels");
      expect(layerIds("turkey", difficulty).some((id) => id.startsWith("city-labels"))).toBe(false);
    }
  });

  it("ayar tablosu her zorluğu kapsar", () => {
    expect(Object.keys(TURKEY_PROVINCE_LABELS).sort()).toEqual([...DIFFICULTIES].sort());
    expect(TURKEY_PROVINCE_LABELS.easy).toBe(true);
  });

  it("etiket dosyası 81 ili, benzersiz adlarla içerir", () => {
    const file = path.resolve("public/geo/turkey-labels.geojson");
    const data = JSON.parse(readFileSync(file, "utf8")) as {
      features: { properties: { name: string; code: string; areaKm2: number } }[];
    };
    expect(data.features).toHaveLength(81);
    expect(new Set(data.features.map((f) => f.properties.name)).size).toBe(81);
    expect(new Set(data.features.map((f) => f.properties.code)).size).toBe(81);
    expect(data.features.every((f) => f.properties.areaKm2 > 0)).toBe(true);
  });
});

describe("Dünya şehir etiketleri (değişmedi)", () => {
  it("Kolay'da açık, Orta'da kısıtlı, Zor'da kapalı", () => {
    expect(CITY_LABELS.easy).not.toBeNull();
    expect(CITY_LABELS.medium).not.toBeNull();
    expect(CITY_LABELS.hard).toBeNull();
    expect(layerIds("world", "hard").some((id) => id.startsWith("city-labels"))).toBe(false);
    expect(layerIds("world", "easy").some((id) => id.startsWith("city-labels"))).toBe(true);
  });
});

describe("zorluk seçimindeki etiket notu", () => {
  it("Türkiye: il adları yalnızca Kolay'da görünür", () => {
    expect(labelNote("turkey", "easy")).toBe("İl adları haritada görünür");
    expect(labelNote("turkey", "medium")).toBe("İl adları haritada görünmez");
    expect(labelNote("turkey", "hard")).toBe("İl adları haritada görünmez");
  });

  it("Dünya: Kolay'da tüm şehirler, Orta'da büyük şehirler, Zor'da hiçbiri", () => {
    expect(labelNote("world", "easy")).toBe("Şehir adları haritada görünür");
    expect(labelNote("world", "medium")).toBe("Yalnızca büyük şehirlerin adları görünür");
    expect(labelNote("world", "hard")).toBe("Şehir adları haritada görünmez");
  });

  it("not, harita stilindeki gerçek ayarla çelişmez", () => {
    for (const difficulty of DIFFICULTIES) {
      const shown = layerIds("turkey", difficulty).includes("province-labels");
      expect(labelNote("turkey", difficulty).endsWith("görünür")).toBe(shown);
    }
  });
});
