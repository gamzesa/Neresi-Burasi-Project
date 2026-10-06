// Çalışan sunucuya (varsayılan http://localhost:3000) karşı uçtan uca API denemesi: hesap, oyun, hile senaryoları, sıralama.
// Kullanım: node scripts/smoke-api.mjs [adres]
// Not: Veritabanında "smoke-...@example.com" e-postalı deneme hesapları ve oyunları bırakır; işin bitince silin.
const base = process.argv[2] ?? "http://localhost:3000";
let failed = 0;

/** Çerezleri tutan basit bir istemci (tarayıcı gibi). */
function createClient() {
  const jar = new Map();
  return async function call(method, path, body) {
    const headers = { "Content-Type": "application/json" };
    if (jar.size) headers.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    for (const line of res.headers.getSetCookie()) {
      const [pair] = line.split(";");
      const index = pair.indexOf("=");
      const name = pair.slice(0, index);
      const value = pair.slice(index + 1);
      if (value === "" || /max-age=0/i.test(line)) jar.delete(name);
      else jar.set(name, value);
    }
    return { status: res.status, body: await res.json().catch(() => null) };
  };
}

function check(name, condition, detail) {
  console.log(`${condition ? "OK  " : "HATA"} ${name}${condition ? "" : ` -> ${JSON.stringify(detail)}`}`);
  if (!condition) failed++;
}

async function playFullGame(call, { map = "turkey", difficulty = "easy" } = {}) {
  const start = await call("POST", "/api/game/start", { map, difficulty });
  const sessionId = start.body?.sessionId;
  let last;
  for (let i = 1; i <= 5; i++) {
    const guess = await call("POST", "/api/game/guess", { sessionId, lat: 39, lng: 35 });
    if (guess.status !== 200) return { sessionId, start, error: guess };
    last = await call("POST", "/api/game/next", { sessionId });
  }
  return { sessionId, start, last };
}

const suffix = Date.now().toString(36);
const email = `smoke-${suffix}@example.com`;
const username = `Smoke${suffix}`.slice(0, 20);
const password = "deneme-sifre-123";

// ---- Oyun kuralları (misafir) ----
const guest = createClient();
check("geçersiz harita 400", (await guest("POST", "/api/game/start", { map: "mars", difficulty: "easy" })).status === 400);

const start = await guest("POST", "/api/game/start", { map: "turkey", difficulty: "easy" });
check("start 200", start.status === 200, start);
const gid = start.body.sessionId;
check("yalnızca ilk ipucu gelir", start.body.hints?.length === 1, start.body);
check("cevap alanı sızmaz", !/answer|region|lat|lng/i.test(JSON.stringify(start.body)), start.body);
check("tahminsiz next 409", (await guest("POST", "/api/game/next", { sessionId: gid })).status === 409);
check("bilinmeyen oturum 404", (await guest("POST", "/api/game/hint", { sessionId: "00000000-0000-4000-8000-000000000000" })).status === 404);
const hint = await guest("POST", "/api/game/hint", { sessionId: gid });
check("ikinci ipucu açılır", hint.status === 200 && hint.body.hintsOpened === 2, hint);
const g1 = await guest("POST", "/api/game/guess", { sessionId: gid, lat: 39, lng: 35 });
check("tahmin 200", g1.status === 200 && typeof g1.body.score === "number", g1);
check("aynı soruya ikinci tahmin 409", (await guest("POST", "/api/game/guess", { sessionId: gid, lat: 39, lng: 35 })).status === 409);
check("tahminden sonra ipucu 409", (await guest("POST", "/api/game/hint", { sessionId: gid })).status === 409);

// ---- Hesap ----
const user = createClient();
check("kayıt: küfürlü kullanıcı adı 400", (await user("POST", "/api/auth/register", { email, username: "siktir", password })).status === 400);
check("kayıt: Türkçe karakterli ad 400", (await user("POST", "/api/auth/register", { email, username: "şükrü", password })).status === 400);
check("kayıt: kısa şifre 400", (await user("POST", "/api/auth/register", { email, username, password: "kisa" })).status === 400);
const reg = await user("POST", "/api/auth/register", { email, username, password });
check("kayıt 200 ve giriş yapılır", reg.status === 200 && reg.body.username === username, reg);
const me = await user("GET", "/api/auth/me");
check("me: giriş yapılmış", me.body?.user?.username === username, me);
check("aynı e-posta 409", (await createClient()("POST", "/api/auth/register", { email, username: `${username}x`.slice(0, 20), password })).status === 409);
check("aynı kullanıcı adı (büyük/küçük harf farkıyla) 409", (await createClient()("POST", "/api/auth/register", { email: `b-${email}`, username: username.toUpperCase(), password })).status === 409);
check("misafir me null", (await createClient()("GET", "/api/auth/me")).body?.user === null);

// ---- Girişli oyun ve sıralama ----
const played = await playFullGame(user);
check("girişli oyun bitti ve sıralamada (ranked)", played.last?.body?.finished === true && played.last.body.ranked === true, played);
const board = await user("GET", "/api/leaderboard?map=turkey&difficulty=easy&period=all");
const mine = board.body?.entries?.find((e) => e.isMe);
check("sıralamada kendi derecem var", mine?.username === username, board);
const guestBoard = await createClient()("GET", "/api/leaderboard?map=turkey&difficulty=easy&period=all");
check("misafir sıralamayı görür ama isMe yok", guestBoard.status === 200 && !guestBoard.body.entries.some((e) => e.isMe), guestBoard);

// ---- Misafir skorunu sahiplenme ----
const guestGame = await playFullGame(createClient());
check("misafir oyunu bitti, ranked=false", guestGame.last?.body?.finished === true && guestGame.last.body.ranked === false, guestGame);
check("girişsiz claim 401", (await createClient()("POST", "/api/game/claim", { sessionId: guestGame.sessionId })).status === 401);
const claim = await user("POST", "/api/game/claim", { sessionId: guestGame.sessionId });
check("girişli claim 200", claim.status === 200, claim);
const other = createClient();
const otherEmail = `smoke-b-${suffix}@example.com`;
await other("POST", "/api/auth/register", { email: otherEmail, username: `SmokeB${suffix}`.slice(0, 20), password });
check("başkasının oyununu claim 409", (await other("POST", "/api/game/claim", { sessionId: guestGame.sessionId })).status === 409);

// ---- Çıkış / giriş ----
await user("POST", "/api/auth/logout", {});
check("çıkıştan sonra me null", (await user("GET", "/api/auth/me")).body?.user === null);
check("yanlış şifre 401", (await user("POST", "/api/auth/login", { email, password: "yanlis-sifre-1" })).status === 401);
const login = await user("POST", "/api/auth/login", { email, password });
check("giriş 200", login.status === 200 && login.body.username === username, login);

console.log(failed === 0 ? "\nTüm kontroller geçti." : `\n${failed} kontrol başarısız.`);
console.log(`Not: Deneme hesapları bıraktı (${email} ve smoke-b-...); işin bitince silin.`);
process.exit(failed === 0 ? 0 : 1);
