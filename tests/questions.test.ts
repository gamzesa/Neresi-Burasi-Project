import { readFileSync } from "node:fs";
import path from "node:path";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { describe, expect, it } from "vitest";
import { MAX_QUESTIONS_PER_REGION, containsWord, questionFileSchema, validateQuestionSet } from "@/lib/game/questions";

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
  const turkeyMax = MAX_QUESTIONS_PER_REGION.turkey;
  const worldMax = MAX_QUESTIONS_PER_REGION.world;

  it(`Türkiye'de aynı il farklı yer/konuyla en fazla ${turkeyMax} soruda kullanılabilir`, () => {
    const regions = readJson<FeatureCollection<Polygon | MultiPolygon>>("data/geo/turkey-provinces.full.geojson");
    const sample = questionFileSchema.parse(readJson("data/questions/turkey.json")).questions;
    const first = sample[0];
    const used = sample.filter((q) => q.region_code === first.region_code).length;
    const within = [...sample];
    for (let i = used; i < turkeyMax; i++) within.push({ ...first, answer_label: `${first.answer_label} ek${i}` });
    const message = `en fazla ${turkeyMax} soruda`;
    expect(validateQuestionSet("turkey", within, regions).some((e) => e.includes(message))).toBe(false);
    const over = [...within, { ...first, answer_label: `${first.answer_label} fazla` }];
    expect(validateQuestionSet("turkey", over, regions).some((e) => e.includes(message))).toBe(true);
  });

  it(`Dünya'da bir ülke en fazla ${worldMax} soruda kullanılabilir`, () => {
    const world = questionFileSchema.parse(readJson("data/questions/world.json")).questions;
    const worldRegions = readJson<FeatureCollection<Polygon | MultiPolygon>>("data/geo/world-countries.full.geojson");
    const first = world[0];
    const used = world.filter((q) => q.region_code === first.region_code).length;
    const over = [...world];
    for (let i = used; i <= worldMax; i++) over.push({ ...first, answer_label: `${first.answer_label} ek${i}` });
    expect(validateQuestionSet("world", over, worldRegions).some((e) => e.includes(`en fazla ${worldMax} soruda`))).toBe(true);
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
