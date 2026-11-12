// App Store Connect başlık (header) görselini üretir: 5244x2950 ve 3840x1646.
// Kullanım: node scripts/build-app-store-header.mjs
// Yerel Chrome'u başsız çalıştırır; ortam değişkeni CHROME_PATH ile yol verilebilir.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
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

/**
 * Başlık görseli. App Store telefonda yalnızca orta-üst bölgeyi gösterir (yaklaşık ortadaki %50 genişlik,
 * üstteki %45 yükseklik); bu yüzden yazı küçük ve bu güvenli alanın içinde tutulur.
 * Boyutlar vh ile verildiği için her en-boy oranında aynı görünür.
 */
function headerHtml(mapUrl) {
  return `<!doctype html><html lang="tr"><meta charset="utf-8"><style>
    * { box-sizing: border-box; margin: 0; }
    html, body { width: 100vw; height: 100vh; overflow: hidden; background: #050b16; }
    body { position: relative; font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif; color: #e9eff8; }
    .map { position: absolute; left: 50%; top: 50%; height: 130vh; transform: translate(-50%, -50%); opacity: .24;
      -webkit-mask-image: radial-gradient(closest-side, #000 55%, transparent); mask-image: radial-gradient(closest-side, #000 55%, transparent); }
    .glow { position: absolute; inset: 0; background: radial-gradient(60% 70% at 50% 50%, rgba(52,211,153,.10), transparent 70%); }
    .content { position: relative; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding-bottom: 22vh; }
    .pin { width: 8vh; height: 8vh; fill: #34d399; margin-bottom: 1.6vh; }
    h1 { font-size: 9.5vh; font-weight: 800; letter-spacing: -.02em; line-height: 1; }
    h1 span { color: #34d399; }
    p { margin-top: 1.8vh; font-size: 3.6vh; color: #a9bdd6; }
    .chips { margin-top: 6vh; display: flex; gap: 2.8vh; }
    .chip { padding: 1.8vh 4.4vh; border: .3vh solid #213a5a; border-radius: 999px; background: rgba(12,25,43,.85); font-size: 4.4vh; font-weight: 600; color: #dbe7f5; }
  </style>
  <img class="map" src="${mapUrl}" alt="">
  <div class="glow"></div>
  <div class="content">
    <svg class="pin" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>
    <h1>Neresi <span>Burası?</span></h1>
    <p>İpuçlarını oku, haritada yeri bul.</p>
  </div>`;
}

mkdirSync(OUT, { recursive: true });
const browser = await launch();

try {
  const htmlFile = path.join(os.tmpdir(), "neresi-header.html");
  writeFileSync(htmlFile, headerHtml(pathToFileURL(path.resolve("public/hero-map.svg")).href));
  // App Store Connect'in kabul ettiği boyutlar: görünüm boyutu x yoğunluk 2.
  const sizes = [
    { css: [2622, 1475], file: "header-5244x2950.png" },
    { css: [1920, 823], file: "header-3840x1646.png" },
  ];
  for (const { css, file } of sizes) {
    await browser.send("Emulation.setDeviceMetricsOverride", { width: css[0], height: css[1], deviceScaleFactor: 2, mobile: false });
    await browser.goto(pathToFileURL(htmlFile).href, 800);
    await browser.screenshot(path.join(OUT, file));
  }
} finally {
  await browser.close();
}
