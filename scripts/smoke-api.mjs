// Çalışan sunucuya (varsayılan http://localhost:3000) karşı uçtan uca API denemesi; hile senaryolarını da dener.
// Kullanım: node scripts/smoke-api.mjs [adres]
const base = process.argv[2] ?? "http://localhost:3000";
let failed = 0;

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

function check(name, condition, detail) {
  console.log(`${condition ? "OK  " : "HATA"} ${name}${condition ? "" : ` -> ${JSON.stringify(detail)}`}`);
  if (!condition) failed++;
}

const bad = await call("POST", "/api/game/start", { map: "mars", difficulty: "easy" });
check("geçersiz harita 400", bad.status === 400, bad);

const start = await call("POST", "/api/game/start", { map: "turkey", difficulty: "easy" });
check("start 200", start.status === 200, start);
const sessionId = start.body.sessionId;
check("yalnızca ilk ipucu gelir", start.body.hints?.length === 1, start.body);
check("cevap alanı sızmaz", !/answer|region|lat|lng/i.test(JSON.stringify(start.body)), start.body);

check("tahminsiz next 409", (await call("POST", "/api/game/next", { sessionId })).status === 409);
check("bilinmeyen oturum 404", (await call("POST", "/api/game/hint", { sessionId: "00000000-0000-4000-8000-000000000000" })).status === 404);

const hint = await call("POST", "/api/game/hint", { sessionId });
check("ikinci ipucu açılır", hint.status === 200 && hint.body.hintsOpened === 2, hint);

let last;
for (let i = 1; i <= 5; i++) {
  const guess = await call("POST", "/api/game/guess", { sessionId, lat: 39, lng: 35 });
  check(`soru ${i}: tahmin 200`, guess.status === 200 && typeof guess.body.score === "number", guess);
  if (i === 1) {
    check("aynı soruya ikinci tahmin 409", (await call("POST", "/api/game/guess", { sessionId, lat: 39, lng: 35 })).status === 409);
    check("tahminden sonra ipucu 409", (await call("POST", "/api/game/hint", { sessionId })).status === 409);
  }
  last = await call("POST", "/api/game/next", { sessionId });
  check(`soru ${i}: next 200`, last.status === 200, last);
}
check("oyun bitti", last.body.finished === true, last);
check("bitmiş oyuna tahmin 409", (await call("POST", "/api/game/guess", { sessionId, lat: 39, lng: 35 })).status === 409);

const badName = await call("POST", "/api/game/next", { sessionId, name: { adjective: 999, noun: 0, number: 0 } });
check("geçersiz ad parçası 400", badName.status === 400, badName);
const freeText = await call("POST", "/api/game/next", { sessionId, nickname: "Serbest Yazi" });
check("serbest metin ad kaydedilmez", freeText.status === 200 && !freeText.body.nickname, freeText);
const named = await call("POST", "/api/game/next", { sessionId, name: { adjective: 0, noun: 0, number: 7 } });
check("takma ad kaydedilir", named.status === 200 && named.body.nickname === "Cesur Kartal 7", named);

const board = await fetch(`${base}/api/leaderboard?map=turkey&difficulty=easy&period=all&sessionId=${sessionId}`).then((r) => r.json());
check("sıralamada kendi derecem var", board.me?.nickname === "Cesur Kartal 7", board);

console.log(failed === 0 ? "\nTüm kontroller geçti." : `\n${failed} kontrol başarısız.`);
console.log("Not: Bu betik veritabanında 'Cesur Kartal 7' adlı gerçek bir kayıt bırakır; işin bitince silin.");
process.exit(failed === 0 ? 0 : 1);
