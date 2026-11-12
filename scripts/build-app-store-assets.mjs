// App Store ekran görüntülerini üretir: iPhone 6.9" (1320x2868). Canlı siteyi başsız Chrome ile açıp çeker.
// Kullanım: node scripts/build-app-store-assets.mjs [siteAdresi]
// Ortam değişkenleri: CHROME_PATH (Chrome yolu), SITE_URL (varsayılan canlı adres).
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const SITE = (process.argv[2] ?? process.env.SITE_URL ?? "https://neresi-burasi-project.vercel.app").replace(/\/$/, "");
const OUT = path.resolve("docs/app-store");
const SHOTS = path.join(OUT, "screenshots");

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

mkdirSync(SHOTS, { recursive: true });
const browser = await launch();

try {
  // iPhone 6.9": 440x956 görünüm, 3x yoğunluk = 1320x2868
  await browser.send("Emulation.setDeviceMetricsOverride", { width: 440, height: 956, deviceScaleFactor: 3, mobile: true });
  await browser.send("Emulation.setTouchEmulationEnabled", { enabled: true });

  await browser.goto(`${SITE}/`);
  await browser.screenshot(path.join(SHOTS, "01-ana-sayfa.png"));

  await browser.goto(`${SITE}/play/world?difficulty=easy`, 500);
  await waitFor(browser, `document.body.innerText.includes("İpucu 1")`, "Dünya oyunu yüklenmedi");
  await sleep(7000); // dünya haritası verisi büyük; çizilmesini bekle
  await browser.screenshot(path.join(SHOTS, "02-dunya-oyun.png"));

  await browser.goto(`${SITE}/play/turkey?difficulty=medium`, 500);
  await waitFor(browser, `document.body.innerText.includes("İpucu 1")`, "Türkiye oyunu yüklenmedi");
  await sleep(2500);
  await browser.screenshot(path.join(SHOTS, "03-turkiye-oyun.png"));

  // Haritada bir nokta işaretle, onayla, sonucu göster.
  const rect = await browser.evaluate(
    `(() => { const r = document.querySelector("canvas").getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`,
  );
  await browser.click(rect.x + rect.w * 0.45, rect.y + rect.h * 0.55);
  await waitFor(
    browser,
    `[...document.querySelectorAll("button")].some((b) => b.textContent.includes("Tahmini onayla") && !b.disabled)`,
    "Tahmini onayla düğmesi etkinleşmedi",
  );
  await browser.evaluate(
    `[...document.querySelectorAll("button")].find((b) => b.textContent.includes("Tahmini onayla"))?.click()`,
  );
  await waitFor(browser, `document.body.innerText.includes("Doğru cevap")`, "Sonuç ekranı açılmadı");
  // Kenar çubuğunu sonuç kartına kaydır, harita ve cevap noktası da görünsün.
  await browser.evaluate(
    `(() => { const a = document.querySelector("aside"); const r = a.querySelector('section[aria-label="Sonuç"]'); if (a && r) a.scrollTop = r.offsetTop - 12; })()`,
  );
  await sleep(1500);
  await browser.screenshot(path.join(SHOTS, "04-sonuc.png"));

  await browser.goto(`${SITE}/oda`);
  await browser.screenshot(path.join(SHOTS, "05-arkadasla-yaris.png"));

} finally {
  await browser.close();
}
