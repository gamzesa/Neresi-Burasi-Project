// Natural Earth ham verisinden public/geo/ altındaki sadeleştirilmiş GeoJSON dosyalarını üretir.
// Kullanım: node scripts/build-geo.mjs <hamVeriKlasörü>
// Klasörde şunlar olmalı: ne_50m_admin_0_countries.geojson, ne_10m_admin_1_states_provinces.geojson
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const rawDir = process.argv[2];
if (!rawDir) {
  console.error("Kullanım: node scripts/build-geo.mjs <hamVeriKlasörü>");
  process.exit(1);
}
const outDir = path.resolve("public/geo");
// Sunucudaki bölge kontrolü için sadeleştirilmemiş sınırlar (istemciye gönderilmez).
const fullDir = path.resolve("data/geo");
const tmpDir = path.join(rawDir, "tmp");
mkdirSync(outDir, { recursive: true });
mkdirSync(fullDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

const readJson = (file) => JSON.parse(readFileSync(path.join(rawDir, file), "utf8"));
const writeJson = (file, data) => writeFileSync(file, JSON.stringify(data));

// Haritada gösterilmeyecek küçük/tartışmalı parçalar (ana ülke koduyla çakışıyorlar).
const SKIP_ADM0 = new Set(["IOA", "ATC", "KAS"]);

const countries = readJson("ne_50m_admin_0_countries.geojson");
const countryFeatures = [];
const labelFeatures = [];
for (const f of countries.features) {
  const p = f.properties;
  if (SKIP_ADM0.has(p.ADM0_A3)) continue;
  const code = p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : p.ADM0_A3;
  const name = p.NAME_TR || p.NAME;
  countryFeatures.push({ type: "Feature", properties: { code, name }, geometry: f.geometry });
  labelFeatures.push({
    type: "Feature",
    properties: { code, name, minZoom: Math.max(0, Math.round((p.MIN_LABEL ?? 3) - 2)) },
    geometry: { type: "Point", coordinates: [p.LABEL_X, p.LABEL_Y] },
  });
}
const codes = countryFeatures.map((f) => f.properties.code);
const dup = codes.filter((c, i) => codes.indexOf(c) !== i);
if (dup.length) throw new Error(`Yinelenen ülke kodu: ${dup.join(", ")}`);

const continents = [
  ["Avrupa", 15, 52],
  ["Asya", 90, 50],
  ["Afrika", 20, 5],
  ["Kuzey Amerika", -100, 48],
  ["Güney Amerika", -60, -15],
  ["Okyanusya", 135, -25],
  ["Antarktika", 0, -80],
].map(([name, lng, lat]) => ({
  type: "Feature",
  properties: { name },
  geometry: { type: "Point", coordinates: [lng, lat] },
}));

const provinces = readJson("ne_10m_admin_1_states_provinces.geojson");
const provinceFeatures = provinces.features
  .filter((f) => f.properties.iso_a2 === "TR")
  .map((f) => ({
    type: "Feature",
    properties: { code: f.properties.iso_3166_2.replace("TR-", ""), name: f.properties.name_tr },
    geometry: f.geometry,
  }));
if (provinceFeatures.length !== 81) throw new Error(`81 il bekleniyordu, ${provinceFeatures.length} bulundu`);

const fc = (features) => ({ type: "FeatureCollection", features });
writeJson(path.join(tmpDir, "world.json"), fc(countryFeatures));
writeJson(path.join(tmpDir, "turkey.json"), fc(provinceFeatures));

const simplify = (input, output, percent) =>
  execSync(
    `npx mapshaper "${path.join(tmpDir, input)}" -simplify ${percent}% keep-shapes -o "${path.join(outDir, output)}" format=geojson precision=0.001 force`,
    { stdio: "inherit" },
  );
const full = (input, output) =>
  execSync(`npx mapshaper "${path.join(tmpDir, input)}" -o "${path.join(fullDir, output)}" format=geojson precision=0.0001 force`, { stdio: "inherit" });
full("world.json", "world-countries.full.geojson");
full("turkey.json", "turkey-provinces.full.geojson");
simplify("world.json", "world-countries.geojson", 30);
simplify("turkey.json", "turkey-provinces.geojson", 25);

writeJson(path.join(outDir, "world-labels.geojson"), fc(labelFeatures));
writeJson(path.join(outDir, "world-continents.geojson"), fc(continents));
console.log("Tamam:", countryFeatures.length, "ülke,", provinceFeatures.length, "il");
