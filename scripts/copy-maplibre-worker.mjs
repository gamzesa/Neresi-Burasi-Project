// Turbopack MapLibre worker'ını paketleyemediği için worker dosyaları public/vendor altına kopyalanır.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public/vendor", { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(`node_modules/maplibre-gl/dist/${file}`, `public/vendor/${file}`);
}
