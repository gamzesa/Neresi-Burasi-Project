// Türkiye il etiketleri için nokta dosyası üretir: public/geo/turkey-labels.geojson
// Kullanım: node scripts/build-turkey-labels.mjs
// Kaynak: data/geo/turkey-provinces.full.geojson (il sınırları). Etiket noktası ilin ağırlık merkezidir;
// merkez ilin dışına düşerse (hilal biçimli iller) il içinde garantili bir nokta kullanılır.
// `rank`, ilin yüzölçümüne göredir: büyük iller önce etiketlenir (çakışmada küçükler gizlenir).
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { area, booleanPointInPolygon, centerOfMass, pointOnFeature } from "@turf/turf";

const input = path.resolve("data/geo/turkey-provinces.full.geojson");
const output = path.resolve("public/geo/turkey-labels.geojson");

const provinces = JSON.parse(readFileSync(input, "utf8"));
if (provinces.features.length !== 81) throw new Error(`81 il bekleniyordu, ${provinces.features.length} bulundu`);

const round = (n) => Math.round(n * 1000) / 1000;

const features = provinces.features.map((province) => {
  let point = centerOfMass(province);
  if (!booleanPointInPolygon(point, province)) point = pointOnFeature(province);
  const [lng, lat] = point.geometry.coordinates;
  return {
    type: "Feature",
    properties: { code: province.properties.code, name: province.properties.name, areaKm2: Math.round(area(province) / 1e6) },
    geometry: { type: "Point", coordinates: [round(lng), round(lat)] },
  };
});

writeFileSync(output, JSON.stringify({ type: "FeatureCollection", features }));
console.log(`Tamam: ${features.length} il etiketi → ${path.relative(process.cwd(), output)}`);
console.log("En büyük 3:", features.toSorted((a, b) => b.properties.areaKm2 - a.properties.areaKm2).slice(0, 3).map((f) => `${f.properties.name} (${f.properties.areaKm2} km²)`).join(", "));
