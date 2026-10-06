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
