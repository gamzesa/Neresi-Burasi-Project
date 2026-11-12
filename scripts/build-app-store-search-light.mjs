// App Store Connect arama sonuçları görseli için açık (krem-yeşil) tema seçenekleri: 3840x2560, üç farklı düzen.
// Kullanım: node scripts/build-app-store-search-light.mjs
// Yerel Chrome'u başsız çalıştırır; ortam değişkeni CHROME_PATH ile yol verilebilir.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SITE = (process.argv[2] ?? process.env.SITE_URL ?? "https://neresi-burasi-project.vercel.app").replace(/\/$/, "");
const OUT = path.resolve("docs/app-store");

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const CHROME = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!CHROME) {
  console.error("Chrome bulunamadı. CHROME_PATH ortam değişkenini ayarla.");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Koşul sağlanana kadar bekler; sağlanmazsa hata verir (boş ekran görüntüsü kaydetmemek için). */
async function waitFor(browser, expression, label, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await browser.evaluate(expression)) return;
    await sleep(300);
  }
  throw new Error(`Zaman aşımı: ${label}`);
}

async function launch() {
  const profile = path.join(os.tmpdir(), `neresi-chrome-${Date.now()}`);
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(
    CHROME,
    ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--hide-scrollbars", "about:blank"],
    { stdio: "ignore" },
  );

  let target;
  for (let i = 0; i < 60 && !target; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === "page");
    } catch {
      // Chrome henüz hazır değil
    }
    if (!target) await sleep(250);
  }
  if (!target) throw new Error("Chrome'a bağlanılamadı.");

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const resolver = message.id ? pending.get(message.id) : null;
    if (resolver) {
      pending.delete(message.id);
      resolver(message);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (message) => (message.error ? reject(new Error(`${method}: ${message.error.message}`)) : resolve(message.result)));
      socket.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    return result.result?.value;
  };

  return {
    send,
    evaluate,
    async goto(url, waitMs = 2500) {
      await send("Page.navigate", { url });
      for (let i = 0; i < 80; i++) {
        if ((await evaluate("document.readyState")) === "complete") break;
        await sleep(250);
      }
      await sleep(waitMs);
    },
    async screenshot(file) {
      const { data } = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(file, Buffer.from(data, "base64"));
      console.log("yazıldı:", path.relative(process.cwd(), file));
    },
    async click(x, y) {
      for (const type of ["mousePressed", "mouseReleased"]) {
        await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
      }
    },
    async close() {
      try {
        socket.close();
      } catch {
        // yok say
      }
      proc.kill();
      await sleep(500);
      rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
    },
  };
}

const rawMap = readFileSync(path.resolve("public/hero-map.svg"), "utf8");
/** Harita yalnızca kara parçalarından oluşur; rengi değiştirilip veri adresi olarak verilir. */
const mapUri = (color) => `data:image/svg+xml;base64,${Buffer.from(rawMap.replace("#8da3bf", color)).toString("base64")}`;
const shot = (name) => pathToFileURL(path.join(OUT, "screenshots", name)).href;

const baseCss = `
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 100vw; height: 100vh; overflow: hidden; }
  body { position: relative; font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif; color: #0f2a24; }
  .map { position: absolute; left: 50%; top: 52%; height: 118vh; transform: translate(-50%, -50%); }
  .phone { border: .7vh solid #14243a; background: #000; overflow: hidden; box-shadow: 0 2.4vh 6vh rgba(15,42,36,.28); }
  .phone img { width: 100%; height: 100%; object-fit: cover; display: block; }
`;

/** A: solda başlık, sağda üç telefon. */
function designA() {
  return `<!doctype html><html lang="tr"><meta charset="utf-8"><style>${baseCss}
    body { background: linear-gradient(150deg, #f8f5e9 0%, #e9f3e6 50%, #d4eadc 100%); }
    .map { opacity: .6; }
    .row { position: relative; height: 100%; display: flex; align-items: center; justify-content: center; gap: 9vh; }
    .text { width: 64vh; }
    .badge { display: inline-block; padding: 1.2vh 2.8vh; border-radius: 999px; background: #fff; color: #0f6b4b; font-weight: 700; font-size: 2.8vh; box-shadow: 0 .8vh 2.4vh rgba(15,42,36,.12); }
    h1 { margin-top: 3vh; font-size: 14vh; font-weight: 800; letter-spacing: -.02em; line-height: 1.02; }
    h1 span { color: #17a673; }
    .sub { margin-top: 3.2vh; font-size: 3.7vh; line-height: 1.3; color: #3f5a52; text-wrap: balance; }
    .meta { margin-top: 4vh; display: flex; align-items: center; gap: 2vh; font-size: 3vh; font-weight: 700; }
    .meta i { width: 1.1vh; height: 1.1vh; border-radius: 50%; background: #17a673; }
    .phones { display: flex; align-items: center; }
    .phone { width: 24vh; height: 52.2vh; border-radius: 3.2vh; }
  </style>
  <img class="map" src="${mapUri("#9ec5ad")}" alt="">
  <div class="row">
    <div class="text">
      <span class="badge">Coğrafya bilgi oyunu</span>
      <h1>Bu yer<br><span>neresi?</span></h1>
      <p class="sub">İpucunu oku,<br>haritada işaretle,<br>puanı kap.</p>
      <div class="meta">Dünya <i></i> Türkiye <i></i> Arkadaşınla</div>
    </div>
    <div class="phones">
      <div class="phone" style="margin-right:-3.6vh; transform: rotate(-4deg) translateY(2vh);"><img src="${shot("01-ana-sayfa.png")}" alt=""></div>
      <div class="phone" style="position:relative; z-index:2; transform: translateY(-2vh) scale(1.08);"><img src="${shot("02-dunya-oyun.png")}" alt=""></div>
      <div class="phone" style="margin-left:-3.6vh; transform: rotate(4deg) translateY(2vh);"><img src="${shot("03-turkiye-oyun.png")}" alt=""></div>
    </div>
  </div>`;
}

/** B: solda telefonlar (arkada büyük daire), sağda başlık. */
function designB() {
  return `<!doctype html><html lang="tr"><meta charset="utf-8"><style>${baseCss}
    body { background: linear-gradient(160deg, #e6f3e8 0%, #d3eadb 55%, #bfe0cd 100%); }
    .map { opacity: .55; }
    .circle { position: absolute; left: 6vh; top: 50%; width: 112vh; height: 112vh; transform: translateY(-50%); border-radius: 50%; background: rgba(255,255,255,.55); }
    .row { position: relative; height: 100%; display: flex; align-items: center; justify-content: center; gap: 6vh; }
    .phones { display: flex; align-items: center; margin-left: 3vh; }
    .phone { width: 24vh; height: 52.2vh; border-radius: 3.2vh; }
    .text { width: 66vh; }
    .eyebrow { font-size: 3vh; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #17a673; }
    h1 { margin-top: 2.4vh; font-size: 9.6vh; font-weight: 800; letter-spacing: -.02em; line-height: 1.05; }
    h1 span { color: #17a673; }
    .rule { margin-top: 3.4vh; width: 12vh; height: 1vh; border-radius: 1vh; background: #17a673; }
    .sub { margin-top: 3.2vh; font-size: 3.7vh; line-height: 1.32; color: #3f5a52; }
  </style>
  <img class="map" src="${mapUri("#8fbea5")}" alt="">
  <div class="circle"></div>
  <div class="row">
    <div class="phones">
      <div class="phone" style="margin-right:-3.6vh; transform: rotate(-4deg) translateY(2vh);"><img src="${shot("01-ana-sayfa.png")}" alt=""></div>
      <div class="phone" style="position:relative; z-index:2; transform: translateY(-2vh) scale(1.08);"><img src="${shot("03-turkiye-oyun.png")}" alt=""></div>
      <div class="phone" style="margin-left:-3.6vh; transform: rotate(4deg) translateY(2vh);"><img src="${shot("02-dunya-oyun.png")}" alt=""></div>
    </div>
    <div class="text">
      <p class="eyebrow">Neresi Burası?</p>
      <h1>Ne kadar<br><span>yakınsan,</span><br>o kadar puan</h1>
      <div class="rule"></div>
      <p class="sub">Dünya ve Türkiye haritalarında ipuçlarından yeri bul.</p>
    </div>
  </div>`;
}

/** C: üstte ortalı başlık, altta büyük üç telefon (alt kenardan taşar). */
function designC() {
  return `<!doctype html><html lang="tr"><meta charset="utf-8"><style>${baseCss}
    body { background: linear-gradient(180deg, #f8f5e9 0%, #e8f3e6 55%, #d2e9db 100%); }
    .map { opacity: .5; top: 60%; }
    .top { position: absolute; top: 6.5vh; left: 0; right: 0; text-align: center; }
    .brand { display: inline-flex; align-items: center; gap: 1.6vh; font-size: 3.4vh; font-weight: 800; }
    .brand svg { width: 4.4vh; height: 4.4vh; fill: #17a673; }
    h1 { margin-top: 2.2vh; font-size: 9.6vh; font-weight: 800; letter-spacing: -.02em; line-height: 1.04; }
    h1 span { color: #17a673; }
    .pills { margin-top: 3.2vh; display: flex; justify-content: center; gap: 1.8vh; }
    .pill { padding: 1.2vh 3vh; border-radius: 999px; background: #fff; font-size: 3vh; font-weight: 700; color: #0f6b4b; box-shadow: 0 .8vh 2.4vh rgba(15,42,36,.12); }
    .phones { position: absolute; left: 0; right: 0; bottom: -21vh; display: flex; justify-content: center; align-items: flex-end; }
    .phone { width: 31vh; height: 67.4vh; border-radius: 4vh; }
  </style>
  <img class="map" src="${mapUri("#93c0a9")}" alt="">
  <div class="top">
    <div class="brand"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>Neresi Burası?</div>
    <h1>İpuçlarını oku,<br><span>haritada yeri bul</span></h1>
    <div class="pills"><span class="pill">Dünya haritası</span><span class="pill">Türkiye haritası</span><span class="pill">Arkadaşınla yarış</span></div>
  </div>
  <div class="phones">
    <div class="phone" style="margin-right:-5vh; transform: rotate(-5deg) translateY(4vh);"><img src="${shot("01-ana-sayfa.png")}" alt=""></div>
    <div class="phone" style="position:relative; z-index:2; transform: translateY(-3vh) scale(1.08);"><img src="${shot("02-dunya-oyun.png")}" alt=""></div>
    <div class="phone" style="margin-left:-5vh; transform: rotate(5deg) translateY(4vh);"><img src="${shot("03-turkiye-oyun.png")}" alt=""></div>
  </div>`;
}

mkdirSync(OUT, { recursive: true });
const browser = await launch();

try {
  const designs = [
    { name: "a", html: designA() },
    { name: "b", html: designB() },
    { name: "c", html: designC() },
  ];
  // 3840x2560: görünüm 1920x1280, yoğunluk 2.
  await browser.send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1280, deviceScaleFactor: 2, mobile: false });
  for (const { name, html } of designs) {
    const htmlPath = path.join(os.tmpdir(), `neresi-arama-acik-${name}.html`);
    writeFileSync(htmlPath, html);
    await browser.goto(pathToFileURL(htmlPath).href, 1800);
    await browser.screenshot(path.join(OUT, `arama-acik-${name}-3840x2560.png`));
  }
} finally {
  await browser.close();
}
