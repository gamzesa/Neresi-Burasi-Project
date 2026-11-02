import { readFileSync } from "node:fs";
import path from "node:path";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { describe, expect, it } from "vitest";
import { containsWord, questionFileSchema, validateQuestionSet } from "@/lib/game/questions";

const root = process.cwd();
const readJson = <T>(file: string): T => JSON.parse(readFileSync(path.join(root, file), "utf8")) as T;

const sets = [
  { map: "world", questions: "data/questions/world.json", geo: "data/geo/world-countries.full.geojson" },
  { map: "turkey", questions: "data/questions/turkey.json", geo: "data/geo/turkey-provinces.full.geojson" },
] as const;

describe.each(sets)("$map soru havuzu", ({ map, questions, geo }) => {
  const file = questionFileSchema.parse(readJson(questions));
  const regions = readJson<FeatureCollection<Polygon | MultiPolygon>>(geo);

  it("dosyadaki harita adı doğru", () => {
    expect(file.map).toBe(map);
  });

  it("kuralları sağlar (ipucu sayısı, bölge kodu, koordinat, yasaklı kelime)", () => {
    expect(validateQuestionSet(map, file.questions, regions)).toEqual([]);
  });
});

describe("bölge tekrarı", () => {
  const regions = readJson<FeatureCollection<Polygon | MultiPolygon>>("data/geo/turkey-provinces.full.geojson");
  const sample = questionFileSchema.parse(readJson("data/questions/turkey.json")).questions;
  const once = new Map<string, number>();
  for (const q of sample) once.set(q.region_code, (once.get(q.region_code) ?? 0) + 1);
  const first = sample.find((q) => once.get(q.region_code) === 1) ?? sample[0];

  it("Türkiye'de aynı il farklı yer/konuyla en fazla iki soruda kullanılabilir", () => {
    const twice = [...sample, { ...first, answer_label: `${first.answer_label} 2` }];
    expect(validateQuestionSet("turkey", twice, regions).some((e) => e.includes("en fazla 2 soruda"))).toBe(false);
    const thrice = [...twice, { ...first, answer_label: `${first.answer_label} 3` }];
    expect(validateQuestionSet("turkey", thrice, regions).some((e) => e.includes("en fazla 2 soruda"))).toBe(true);
  });

  it("Dünya'da bir ülke yalnızca bir soruda kullanılabilir", () => {
    const world = questionFileSchema.parse(readJson("data/questions/world.json")).questions;
    const worldRegions = readJson<FeatureCollection<Polygon | MultiPolygon>>("data/geo/world-countries.full.geojson");
    const twice = [...world, { ...world[0], answer_label: `${world[0].answer_label} 2` }];
    expect(validateQuestionSet("world", twice, worldRegions).some((e) => e.includes("en fazla 1 soruda"))).toBe(true);
  });
});

describe("containsWord", () => {
  it("kısa kelimeyi yalnızca bütün sözcük olarak arar", () => {
    expect(containsWord("Van Gölü kıyısında", "Van")).toBe(true);
    expect(containsWord("Savanlar ve karavan", "Van")).toBe(false);
  });

  it("şapka ve Türkçe harf farklarını yok sayar", () => {
    expect(containsWord("hakkari'nin dağları", "Hakkâri")).toBe(true);
    expect(containsWord("İZMİR körfezi", "İzmir")).toBe(true);
  });
});
