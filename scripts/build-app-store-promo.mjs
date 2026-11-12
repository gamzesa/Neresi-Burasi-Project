// Play'deki tanıtım görsellerini (1080x1920, docs/play-store/tanitim/) App Store iPhone 6.9" boyutuna (1320x2868) uyarlar.
// Görsel genişliğe oturtulur; üst ve alttaki ek pay, kenarlarda yumuşakça karışan aynı açık yeşil degrade zeminle doldurulur.
// Kullanım: node scripts/build-app-store-promo.mjs
import { mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = path.resolve("docs/play-store/tanitim");
const OUT = path.resolve("docs/app-store/screenshots-tanitim");
const W = 1320;
const H = 2868;
const FEATHER = 160;
// Kaynak görselin üst ve alt kenarındaki zemin renkleri (degrade devam ettirilir).
const TOP = "rgb(244,252,249)";
const BOTTOM = "rgb(212,239,227)";

const background = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TOP}"/><stop offset="1" stop-color="${BOTTOM}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`,
);

mkdirSync(OUT, { recursive: true });
for (const file of readdirSync(SRC).filter((f) => f.endsWith(".png")).sort()) {
  const scaled = await sharp(path.join(SRC, file)).resize({ width: W }).removeAlpha().toBuffer({ resolveWithObject: true });
  const { width, height } = scaled.info;
  // Üst ve altta yumuşak geçiş için opaklık maskesi.
  const mask = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) {
    const alpha = Math.round(255 * Math.min(1, y / FEATHER, (height - 1 - y) / FEATHER));
    mask.fill(alpha, y * width, (y + 1) * width);
  }
  const faded = await sharp(scaled.data).joinChannel(mask, { raw: { width, height, channels: 1 } }).png().toBuffer();
  const top = Math.round((H - height) / 2);
  await sharp(background)
    .composite([{ input: faded, top, left: 0 }])
    .removeAlpha()
    .png()
    .toFile(path.join(OUT, file));
  console.log("yazıldı:", path.relative(process.cwd(), path.join(OUT, file)));
}
