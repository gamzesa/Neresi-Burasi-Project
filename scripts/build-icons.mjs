// Uygulama simgelerini (PWA / Android) ana sayfadaki konum işaretinden üretir.
// Kullanım: node scripts/build-icons.mjs
// `sharp` Next.js ile birlikte gelir (node_modules/sharp); ayrıca kurulum gerekmez.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BG = "#050b16";
const PIN = "#34d399";
// Ana sayfadaki işaretle aynı yol (24x24 görünüm kutusu).
const PIN_PATH =
  "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z";

/** `scale`: işaretin tuvale göre yüksekliği. Maskeli (adaptif) simgede güvenli alan için daha küçüktür. */
function svg(size, scale) {
  const pinHeight = size * scale;
  const factor = pinHeight / 20; // işaret 24x24 kutuda 20 birim yüksekliğindedir (y: 2..22)
  const x = size / 2 - 12 * factor;
  const y = size / 2 - 12 * factor;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <g transform="translate(${x} ${y}) scale(${factor})"><path d="${PIN_PATH}" fill="${PIN}" fill-rule="evenodd"/></g>
</svg>`;
}

const targets = [
  { file: "public/icons/icon-192.png", size: 192, scale: 0.62 },
  { file: "public/icons/icon-512.png", size: 512, scale: 0.62 },
  // Maskeli simge: platform köşeleri keser; işaret güvenli alan (ortadaki %80) içinde kalmalı.
  { file: "public/icons/icon-maskable-512.png", size: 512, scale: 0.5 },
  { file: "app/icon.png", size: 512, scale: 0.62 },
  { file: "app/apple-icon.png", size: 180, scale: 0.62 },
];

for (const { file, size, scale } of targets) {
  const out = path.resolve(file);
  mkdirSync(path.dirname(out), { recursive: true });
  const png = await sharp(Buffer.from(svg(size, scale))).png().toBuffer();
  writeFileSync(out, png);
  console.log("yazıldı:", file);
}
