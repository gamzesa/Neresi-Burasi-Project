// Natural Earth şehir verisinden public/geo/world-cities.geojson üretir (dünya haritası şehir etiketleri).
// Kullanım: node scripts/build-cities.mjs <ne_50m_populated_places.geojson>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("Kullanım: node scripts/build-cities.mjs <ne_50m_populated_places.geojson>");
  process.exit(1);
}

// RANK_MAX büyüdükçe şehir büyür (14 = en büyük). Büyük şehirler uzaktan, küçükler yakınlaştıkça görünür.
const minZoomForRank = (rank) => (rank >= 13 ? 3 : rank === 12 ? 4 : rank === 11 ? 5 : 6);
const round = (n) => Math.round(n * 100) / 100;

const data = JSON.parse(readFileSync(input, "utf8"));
const features = data.features.map((f) => {
  const p = f.properties;
  const rank = p.RANK_MAX;
  return {
    type: "Feature",
    properties: { name: p.NAME_TR || p.NAME_EN || p.NAME, rank, minZoom: minZoomForRank(rank) },
    geometry: { type: "Point", coordinates: f.geometry.coordinates.map(round) },
  };
});

const out = path.resolve("public/geo/world-cities.geojson");
writeFileSync(out, JSON.stringify({ type: "FeatureCollection", features }));
console.log("Tamam:", features.length, "şehir");
