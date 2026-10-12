import { describe, expect, it } from "vitest";
import {
  DUEL_GRACE_SECONDS,
  DUEL_LEAD_IN_SECONDS,
  DUEL_QUESTION_SECONDS,
  DUEL_RESULT_SECONDS,
  calculateDuelScore,
  duelHintsOpened,
  speedMultiplier,
} from "@/lib/game/scoring";
import { GameError, type RegionChecker } from "@/lib/game/service";
import { createRoom, getRoomState, joinRoom, startRoom, submitRoomGuess } from "@/lib/room/service";
import { createMemoryRoomStore } from "./helpers/memoryRoomStore";
import { makeQuestions } from "./helpers/memoryStore";

const alwaysHit: RegionChecker = () => true;
const neverHit: RegionChecker = () => false;
const T0 = new Date("2026-10-12T12:00:00.000Z");
const at = (seconds: number) => new Date(T0.getTime() + seconds * 1000);
/** Soru açıldıktan sonraki saniye (ilk soru geri sayımdan sonra açılır). */
const q1 = (seconds: number) => at(DUEL_LEAD_IN_SECONDS + seconds);

async function expectGameError(promise: Promise<unknown>, status: number) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(GameError);
  expect((error as GameError).status).toBe(status);
}

async function setup() {
  const questions = makeQuestions("world", "easy", 8);
  const mem = createMemoryRoomStore(questions, T0);
  const host = await createRoom(mem.store, { map: "world", difficulty: "easy", nickname: "Ayşe" });
  const guest = await joinRoom(mem.store, { code: host.code, nickname: "Mehmet", now: T0 });
  await startRoom(mem.store, { code: host.code, playerToken: host.playerToken, now: T0 });
  const state = (who: { playerToken: string }, now: Date) =>
    getRoomState(mem.store, { code: host.code, playerToken: who.playerToken, now });
  const guess = (who: { playerToken: string }, now: Date, lat = 10, lng = 20, check = alwaysHit) =>
    submitRoomGuess(mem.store, check, { code: host.code, playerToken: who.playerToken, lat, lng, now });
  /** Odanın index. sorusunun cevabı (sorular rastgele seçildiği için testte buradan okunur). */
  const answerAt = (index: number) => {
    const room = [...mem.rooms.values()][0];
    return questions.find((q) => q.id === room.question_ids[index])!;
  };
  return { ...mem, questions, host, guest, state, guess, answerAt };
}

describe("çok oyunculu puanlama", () => {
  it("hız katsayısı anında 1.00, süre sonunda 0.75 olur", () => {
    expect(speedMultiplier(0)).toBe(1);
    expect(speedMultiplier(DUEL_QUESTION_SECONDS)).toBeCloseTo(0.75);
    expect(speedMultiplier(DUEL_QUESTION_SECONDS / 2)).toBeCloseTo(0.875);
    expect(speedMultiplier(999)).toBeCloseTo(0.75);
    expect(speedMultiplier(-5)).toBe(1);
  });

  it("aynı tahmin daha hızlıysa daha çok puan alır; mesafe baskın kalır", () => {
    const base = { map: "world", difficulty: "easy", regionHit: true } as const;
    const fast = calculateDuelScore({ ...base, distanceKm: 500, elapsedSeconds: 2 });
    const slow = calculateDuelScore({ ...base, distanceKm: 500, elapsedSeconds: 28 });
    const farFast = calculateDuelScore({ ...base, distanceKm: 3000, elapsedSeconds: 0 });
    expect(fast).toBeGreaterThan(slow);
    expect(slow).toBeGreaterThan(farFast);
  });

  it("tam isabet ve anında cevap 1000 + bölge bonusu verir (kolay)", () => {
    const score = calculateDuelScore({
      map: "world",
      difficulty: "easy",
      distanceKm: 0,
      regionHit: true,
      elapsedSeconds: 0,
    });
    expect(score).toBe(1500);
  });

  it("ipuçları süre içinde eşit aralıklarla açılır", () => {
    expect([0, 7, 7.6, 15, 22.4, 22.5, 30].map((s) => duelHintsOpened("easy", s))).toEqual([1, 1, 2, 3, 3, 4, 4]);
    expect([0, 14.9, 15, 30].map((s) => duelHintsOpened("hard", s))).toEqual([1, 1, 2, 2]);
  });
});

describe("oda kurma ve katılma", () => {
  it("5 karakterli kod ve gizli anahtar döner; anahtar veritabanında düz saklanmaz", async () => {
    const mem = createMemoryRoomStore(makeQuestions("world", "easy", 8), T0);
    const host = await createRoom(mem.store, { map: "world", difficulty: "easy", nickname: "Ayşe" });
    expect(host.code).toMatch(/^[A-HJ-NP-Z2-9]{5}$/);
    expect(host.seat).toBe(0);
    expect(mem.players[0].token_hash).not.toBe(host.playerToken);
    expect(mem.rooms.size).toBe(1);
  });

  it("yeterli soru yoksa oda kurulamaz", async () => {
    const mem = createMemoryRoomStore(makeQuestions("world", "easy", 3), T0);
    await expectGameError(createRoom(mem.store, { map: "world", difficulty: "easy", nickname: "Ayşe" }), 503);
  });

  it("ikinci oyuncu katılır, üçüncü oyuncu odanın dolu olduğunu görür; kod küçük harfle de çalışır", async () => {
    const mem = createMemoryRoomStore(makeQuestions("world", "easy", 8), T0);
    const host = await createRoom(mem.store, { map: "world", difficulty: "easy", nickname: "Ayşe" });
    const guest = await joinRoom(mem.store, { code: host.code.toLowerCase(), nickname: "Mehmet", now: T0 });
    expect(guest.seat).toBe(1);
    await expectGameError(joinRoom(mem.store, { code: host.code, nickname: "Üçüncü", now: T0 }), 409);
  });

  it("olmayan oda 404; süresi dolmuş oda 410 döner", async () => {
    const mem = createMemoryRoomStore(makeQuestions("world", "easy", 8), T0);
    await expectGameError(joinRoom(mem.store, { code: "ZZZZZ", nickname: "Ali", now: T0 }), 404);
    const host = await createRoom(mem.store, { map: "world", difficulty: "easy", nickname: "Ayşe" });
    const later = new Date(T0.getTime() + 4 * 3600 * 1000);
    await expectGameError(joinRoom(mem.store, { code: host.code, nickname: "Ali", now: later }), 410);
  });

  it("aynı hesap kendi odasına ikinci kez katılamaz", async () => {
    const mem = createMemoryRoomStore(makeQuestions("world", "easy", 8), T0);
    const host = await createRoom(mem.store, { map: "world", difficulty: "easy", nickname: "Ayşe", userId: "u1" });
    await expectGameError(joinRoom(mem.store, { code: host.code, nickname: "Ayşe", userId: "u1", now: T0 }), 409);
  });

  it("yalnızca kuran ve rakip katıldıktan sonra başlatabilir", async () => {
    const mem = createMemoryRoomStore(makeQuestions("world", "easy", 8), T0);
    const host = await createRoom(mem.store, { map: "world", difficulty: "easy", nickname: "Ayşe" });
    await expectGameError(startRoom(mem.store, { code: host.code, playerToken: host.playerToken, now: T0 }), 409);
    const guest = await joinRoom(mem.store, { code: host.code, nickname: "Mehmet", now: T0 });
    await expectGameError(startRoom(mem.store, { code: host.code, playerToken: guest.playerToken, now: T0 }), 403);
    await expectGameError(startRoom(mem.store, { code: host.code, playerToken: "x".repeat(40), now: T0 }), 403);
    await startRoom(mem.store, { code: host.code, playerToken: host.playerToken, now: T0 });
  });
});

describe("oyun akışı", () => {
  it("geri sayımda ipucu ve cevap yok; soru açılınca yalnızca ilk ipucu gelir", async () => {
    const { state, host } = await setup();
    const early = await state(host, at(1));
    expect(early.phase).toBe("countdown");
    expect(early.question).toBeNull();
    expect(early.result).toBeNull();

    const open = await state(host, q1(0));
    expect(open.phase).toBe("answering");
    expect(open.question?.hints).toHaveLength(1);
    const json = JSON.stringify(open);
    for (const forbidden of ["answer_lat", "region", "Cevap", "ipucu 2"]) expect(json).not.toContain(forbidden);
  });

  it("ipuçları süre geçtikçe açılır", async () => {
    const { state, host } = await setup();
    expect((await state(host, q1(8))).question?.hints).toHaveLength(2);
    expect((await state(host, q1(23))).question?.hints).toHaveLength(4);
  });

  it("tahminden sonra cevap ve rakibin tahmini, soru bitene kadar gizli kalır", async () => {
    const { state, guess, host, guest } = await setup();
    await guess(host, q1(5));
    const mine = await state(host, q1(6));
    expect(mine.phase).toBe("answering");
    expect(mine.result).toBeNull();
    expect(mine.players.find((p) => p.seat === 0)?.hasGuessed).toBe(true);
    expect(mine.players.find((p) => p.seat === 1)?.hasGuessed).toBe(false);
    expect(mine.players.find((p) => p.seat === 0)?.totalScore).toBe(0);
    expect(JSON.stringify(await state(guest, q1(6)))).not.toContain('"lat"');
  });

  it("ikisi de tahmin edince soru hemen biter; sonuçta iki tahmin ve kazanan görünür", async () => {
    const { state, guess, host, guest, answerAt } = await setup();
    const answer = answerAt(0);
    // Host tam isabet ve hızlı, misafir çok uzakta.
    await guess(host, q1(3), answer.answer_lat, answer.answer_lng);
    await guess(guest, q1(10), -60, -120);
    const s = await state(host, q1(10.5));
    expect(s.phase).toBe("results");
    expect(s.result?.answer).toMatchObject({
      lat: answer.answer_lat,
      lng: answer.answer_lng,
      label: answer.answer_label,
    });
    expect(s.result?.guesses).toHaveLength(2);
    expect(s.result?.winnerSeat).toBe(0);
    const mine = s.result!.guesses.find((g) => g.seat === 0)!;
    expect(mine.distanceKm).toBe(0);
    const expected = calculateDuelScore({
      map: "world",
      difficulty: "easy",
      distanceKm: 0,
      regionHit: true,
      elapsedSeconds: 3,
    });
    expect(mine.score).toBe(expected);
    expect(s.players[0].totalScore).toBe(mine.score);
    expect(s.nextAt).toBe(q1(10).getTime() + DUEL_RESULT_SECONDS * 1000);
  });

  it("süre dolunca tahmin etmeyen 0 alır, soru süre sonunda biter", async () => {
    const { state, guess, host } = await setup();
    await guess(host, q1(4));
    const during = await state(host, q1(DUEL_QUESTION_SECONDS));
    expect(during.phase).toBe("answering");
    const after = await state(host, q1(DUEL_QUESTION_SECONDS + DUEL_GRACE_SECONDS + 0.5));
    expect(after.phase).toBe("results");
    expect(after.result?.guesses).toHaveLength(1);
    expect(after.result?.winnerSeat).toBe(0);
    expect(after.players.find((p) => p.seat === 1)?.totalScore).toBe(0);
  });

  it("süre dolduktan sonra gelen tahmin reddedilir; ağ payındakine izin verilir ve son saniye sayılır", async () => {
    const { guess, host, guest, guesses } = await setup();
    await guess(guest, q1(DUEL_QUESTION_SECONDS + 1));
    expect(guesses[0].elapsed_ms).toBe(DUEL_QUESTION_SECONDS * 1000);
    await expectGameError(guess(host, q1(DUEL_QUESTION_SECONDS + DUEL_GRACE_SECONDS + 1)), 409);
  });

  it("geri sayımda ve aynı soruya ikinci kez tahmin reddedilir", async () => {
    const { guess, host } = await setup();
    await expectGameError(guess(host, at(1)), 409);
    await guess(host, q1(1));
    await expectGameError(guess(host, q1(2)), 409);
  });

  it("sonuç süresi bitince kendiliğinden sonraki soruya geçer ve yeni sorunun ipuçları sıfırlanır", async () => {
    const { state, guess, host, guest } = await setup();
    await guess(host, q1(2));
    await guess(guest, q1(3));
    const second = await state(host, q1(3 + DUEL_RESULT_SECONDS + 1));
    expect(second.questionNumber).toBe(2);
    expect(second.phase).toBe("answering");
    expect(second.question?.hints).toHaveLength(1);
    expect(second.result).toBeNull();
    // Önceki soruların puanı toplamda kalır.
    expect(second.players[0].totalScore).toBeGreaterThan(0);
  });

  it("5 soru bitince oyun biter ve kazanan toplam puana göre belirlenir", async () => {
    const { state, guess, host, guest } = await setup();
    let t = DUEL_LEAD_IN_SECONDS;
    for (let i = 0; i < 5; i++) {
      await guess(host, at(t + 2), 10 + i, 20 + i);
      await guess(guest, at(t + 3), 50, 90, neverHit);
      t += 3 + DUEL_RESULT_SECONDS;
    }
    const done = await state(host, at(t + 1));
    expect(done.phase).toBe("finished");
    expect(done.winnerSeat).toBe(0);
    expect(done.players[0].totalScore).toBeGreaterThan(done.players[1].totalScore);
    expect(done.result).not.toBeNull();
    await expectGameError(guess(host, at(t + 2)), 409);
  });

  it("iki oyuncu da hiç tahmin etmezse oyun yine zamanla biter ve berabere kalır", async () => {
    const { state, host } = await setup();
    const slot = DUEL_QUESTION_SECONDS + DUEL_GRACE_SECONDS + DUEL_RESULT_SECONDS;
    const done = await state(host, at(DUEL_LEAD_IN_SECONDS + slot * 5 + 1));
    expect(done.phase).toBe("finished");
    expect(done.winnerSeat).toBeNull();
  });

  it("odada olmayan anahtar durum okuyamaz", async () => {
    const { state } = await setup();
    await expectGameError(state({ playerToken: "y".repeat(40) }, at(5)), 403);
  });
});
