// Ana sayfa başlığının arkasındaki şeffaf dünya haritası silüetini (public/hero-map.svg) üretir.
// public/geo/world-countries.geojson dosyasını çok sadeleştirip Mercator izdüşümüyle tek bir SVG yoluna çevirir.
// Kullanım: node scripts/build-hero-map.mjs   (önce `node scripts/build-geo.mjs <hamVeri>` ile geo dosyaları üretilmiş olmalı)
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const WIDTH = 1000;
const LAT_MIN = -58; // Antarktika'nın büyük kısmı hariç
const LAT_MAX = 80;
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const yTop = merc(LAT_MAX);
const yBottom = merc(LAT_MIN);
const scale = WIDTH / (2 * Math.PI);
const height = Math.round((yTop - yBottom) * scale);

const tmp = mkdtempSync(path.join(tmpdir(), "hero-"));
const simplified = path.join(tmp, "simple.json");
execSync(
  `npx mapshaper "public/geo/world-countries.geojson" -dissolve -simplify 6% keep-shapes -o "${simplified}" format=geojson force`,
  { stdio: "inherit" },
);

const collection = JSON.parse(readFileSync(simplified, "utf8"));
const project = ([lng, lat]) => {
  const clamped = Math.max(LAT_MIN, Math.min(LAT_MAX, lat));
  const x = ((lng + 180) / 360) * WIDTH;
  const y = (yTop - merc(clamped)) * scale;
  return `${x.toFixed(1)} ${y.toFixed(1)}`;
};

const ringToPath = (ring) => `M${ring.map(project).join("L")}Z`;
// Mapshaper tek bir bileşik şekil verdiğinde çıktı FeatureCollection, Feature ya da GeometryCollection olabilir.
const geometries = (node) => {
  if (node.type === "FeatureCollection") return node.features.flatMap(geometries);
  if (node.type === "Feature") return geometries(node.geometry);
  if (node.type === "GeometryCollection") return node.geometries.flatMap(geometries);
  return [node];
};

let d = "";
for (const geometry of geometries(collection)) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) d += polygon.map(ringToPath).join("");
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}"><path fill="#8da3bf" fill-rule="evenodd" d="${d}"/></svg>\n`;
writeFileSync("public/hero-map.svg", svg);
console.log(`public/hero-map.svg yazıldı (${(svg.length / 1024).toFixed(1)} KB, ${WIDTH}x${height})`);
