import { describe, expect, it } from "vitest";
import { periodStart } from "@/lib/game/period";
import {
  GameError,
  claimSession,
  nextStep,
  openHint,
  pickRandom,
  startGame,
  submitGuess,
  type RegionChecker,
} from "@/lib/game/service";
import type { QuestionRow } from "@/lib/game/types";
import { createMemoryStore, makeQuestions } from "./helpers/memoryStore";

const alwaysHit: RegionChecker = () => true;
const neverHit: RegionChecker = () => false;

function setup(difficulty: "easy" | "medium" | "hard" = "easy", questions = makeQuestions("world", difficulty, 8)) {
  return { ...createMemoryStore(questions), questions };
}

async function expectGameError(promise: Promise<unknown>, status: number) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(GameError);
  expect((error as GameError).status).toBe(status);
}

function answerOf(questions: QuestionRow[], id: string) {
  return questions.find((q) => q.id === id)!;
}

describe("startGame", () => {
  it("5 soruluk oturum açar; yalnızca ilk ipucunu ve hiç cevap bilgisi döner", async () => {
    const { store, sessions } = setup();
    const result = await startGame(store, { map: "world", difficulty: "easy" });

    expect(result.hints).toHaveLength(1);
    expect(result.hintsOpened).toBe(1);
    expect(result.totalHints).toBe(4);
    expect(result.questionNumber).toBe(1);
    expect(sessions.get(result.sessionId)?.question_ids).toHaveLength(5);

    const json = JSON.stringify(result);
    for (const forbidden of ["answer", "region", "lat", "lng", "ipucu 2"]) {
      expect(json).not.toContain(forbidden);
    }
  });

  it("yeterli soru yoksa 503 döner", async () => {
    const { store } = setup("easy", makeQuestions("world", "easy", 3));
    await expectGameError(startGame(store, { map: "world", difficulty: "easy" }), 503);
  });

  it("oturumdaki 5 soru birbirinden farklıdır", async () => {
    const { store, sessions } = setup();
    const { sessionId } = await startGame(store, { map: "world", difficulty: "easy" });
    expect(new Set(sessions.get(sessionId)!.question_ids).size).toBe(5);
  });
});

describe("openHint", () => {
  it("ipuçlarını sırayla açar ve sayıyı sunucuda tutar", async () => {
    const { store, sessions } = setup();
    const { sessionId } = await startGame(store, { map: "world", difficulty: "easy" });

    const second = await openHint(store, { sessionId });
    expect(second.hintsOpened).toBe(2);
    expect(second.hint).toMatch(/ipucu 2$/);
    expect(sessions.get(sessionId)!.current_hints_opened).toBe(2);
  });

  it("ipucu sayısını aşamaz", async () => {
    const { store } = setup("hard");
    const { sessionId } = await startGame(store, { map: "world", difficulty: "hard" });
    await openHint(store, { sessionId });
    await expectGameError(openHint(store, { sessionId }), 409);
  });

  it("bilinmeyen oturumda 404 döner", async () => {
    const { store } = setup();
    await expectGameError(openHint(store, { sessionId: "00000000-0000-4000-8000-000000000000" }), 404);
  });

  it("tahminden sonra ipucu açılamaz", async () => {
    const { store } = setup();
    const { sessionId } = await startGame(store, { map: "world", difficulty: "easy" });
    await submitGuess(store, alwaysHit, { sessionId, lat: 0, lng: 0 });
    await expectGameError(openHint(store, { sessionId }), 409);
  });
});

describe("submitGuess", () => {
  it("mesafe, bölge ve puanı sunucuda hesaplar; doğru konumu tahminden sonra döner", async () => {
    const { store, sessions, questions } = setup();
    const { sessionId } = await startGame(store, { map: "world", difficulty: "easy" });
    const target = answerOf(questions, sessions.get(sessionId)!.question_ids[0]);

    const result = await submitGuess(store, alwaysHit, { sessionId, lat: target.answer_lat, lng: target.answer_lng });
    expect(result.distanceKm).toBe(0);
    expect(result.regionHit).toBe(true);
    expect(result.score).toBe(1500);
    expect(result.answer).toEqual({ lat: target.answer_lat, lng: target.answer_lng, label: target.answer_label });
    expect(result.isLastQuestion).toBe(false);
  });

  it("açılan ipucu sayısı puanı düşürür", async () => {
    const { store, sessions, questions } = setup();
    const { sessionId } = await startGame(store, { map: "world", difficulty: "easy" });
    await openHint(store, { sessionId });
    await openHint(store, { sessionId });
    const target = answerOf(questions, sessions.get(sessionId)!.question_ids[0]);

    const result = await submitGuess(store, alwaysHit, { sessionId, lat: target.answer_lat, lng: target.answer_lng });
    expect(result.score).toBe(Math.round(1500 * 0.6));
  });

  it("bölge dışında bonus verilmez", async () => {
    const { store, sessions, questions } = setup();
    const { sessionId } = await startGame(store, { map: "world", difficulty: "easy" });
    const target = answerOf(questions, sessions.get(sessionId)!.question_ids[0]);

    const result = await submitGuess(store, neverHit, { sessionId, lat: target.answer_lat, lng: target.answer_lng });
    expect(result.score).toBe(1000);
  });

  it("aynı soruya ikinci tahmin kabul edilmez", async () => {
    const { store } = setup();
    const { sessionId } = await startGame(store, { map: "world", difficulty: "easy" });
    await submitGuess(store, alwaysHit, { sessionId, lat: 1, lng: 1 });
    await expectGameError(submitGuess(store, alwaysHit, { sessionId, lat: 2, lng: 2 }), 409);
  });

  it("bilinmeyen oturuma tahmin gönderilemez", async () => {
    const { store } = setup();
    await expectGameError(
      submitGuess(store, alwaysHit, { sessionId: "00000000-0000-4000-8000-000000000000", lat: 1, lng: 1 }),
      404,
    );
  });
});

describe("nextStep ve tam oyun", () => {
  it("tahmin yapılmadan sonraki soruya geçilemez", async () => {
    const { store } = setup();
    const { sessionId } = await startGame(store, { map: "world", difficulty: "easy" });
    await expectGameError(nextStep(store, { sessionId }), 409);
  });

  it("sonraki soruda yalnızca ilk ipucu görünür ve sayaç sıfırlanır", async () => {
    const { store } = setup();
    const { sessionId } = await startGame(store, { map: "world", difficulty: "easy" });
    await openHint(store, { sessionId });
    await submitGuess(store, alwaysHit, { sessionId, lat: 0, lng: 0 });

    const next = await nextStep(store, { sessionId });
    expect(next.finished).toBe(false);
    if (!next.finished) {
      expect(next.questionNumber).toBe(2);
      expect(next.hints).toHaveLength(1);
      expect(next.hintsOpened).toBe(1);
    }
  });

  it("5 soru sonunda oyun biter, toplam puan tahmin puanlarının toplamıdır; bitmiş oyuna tahmin gönderilemez", async () => {
    const { store, sessions } = setup();
    const { sessionId } = await startGame(store, { map: "world", difficulty: "easy" });

    let sum = 0;
    for (let i = 0; i < 5; i++) {
      const guess = await submitGuess(store, alwaysHit, { sessionId, lat: 0, lng: 0 });
      sum += guess.score;
      expect(guess.isLastQuestion).toBe(i === 4);
      const next = await nextStep(store, { sessionId });
      expect(next.finished).toBe(i === 4);
    }

    expect(sessions.get(sessionId)!.status).toBe("finished");
    expect(sessions.get(sessionId)!.total_score).toBe(sum);
    expect(sessions.get(sessionId)!.finished_at).not.toBeNull();
    await expectGameError(submitGuess(store, alwaysHit, { sessionId, lat: 0, lng: 0 }), 409);
    await expectGameError(openHint(store, { sessionId }), 409);
  });

  it("girişli oyuncunun oyunu hesabına bağlanır ve bitişte sıralamada sayılır", async () => {
    const { store, sessions } = setup();
    const started = await startGame(store, { map: "world", difficulty: "easy", userId: "user-1" });
    expect(sessions.get(started.sessionId)!.user_id).toBe("user-1");

    let last;
    for (let i = 0; i < 5; i++) {
      await submitGuess(store, alwaysHit, { sessionId: started.sessionId, lat: 0, lng: 0 });
      last = await nextStep(store, { sessionId: started.sessionId });
    }
    expect(last).toMatchObject({ finished: true, ranked: true });
  });

  it("misafir oyunu sıralamada sayılmaz (ranked=false)", async () => {
    const { store } = setup();
    const { sessionId } = await startGame(store, { map: "world", difficulty: "easy" });
    let last;
    for (let i = 0; i < 5; i++) {
      await submitGuess(store, alwaysHit, { sessionId, lat: 0, lng: 0 });
      last = await nextStep(store, { sessionId });
    }
    expect(last).toMatchObject({ finished: true, ranked: false });
  });
});

describe("claimSession", () => {
  async function finishedGuestGame() {
    const env = setup();
    const { sessionId } = await startGame(env.store, { map: "world", difficulty: "easy" });
    for (let i = 0; i < 5; i++) {
      await submitGuess(env.store, alwaysHit, { sessionId, lat: 0, lng: 0 });
      await nextStep(env.store, { sessionId });
    }
    return { ...env, sessionId };
  }

  it("biten misafir oyununu giriş yapan kullanıcıya bağlar", async () => {
    const { store, sessions, sessionId } = await finishedGuestGame();
    await claimSession(store, { sessionId, userId: "user-1" });
    expect(sessions.get(sessionId)!.user_id).toBe("user-1");
  });

  it("aynı kullanıcı tekrar bağlayabilir (idempotent); başka kullanıcı bağlayamaz", async () => {
    const { store, sessions, sessionId } = await finishedGuestGame();
    await claimSession(store, { sessionId, userId: "user-1" });
    await claimSession(store, { sessionId, userId: "user-1" });
    await expectGameError(claimSession(store, { sessionId, userId: "user-2" }), 409);
    expect(sessions.get(sessionId)!.user_id).toBe("user-1");
  });

  it("bitmemiş oyun bağlanamaz", async () => {
    const { store } = setup();
    const { sessionId } = await startGame(store, { map: "world", difficulty: "easy" });
    await expectGameError(claimSession(store, { sessionId, userId: "user-1" }), 409);
  });

  it("bilinmeyen oturumda 404 döner", async () => {
    const { store } = setup();
    await expectGameError(claimSession(store, { sessionId: "00000000-0000-4000-8000-000000000000", userId: "u" }), 404);
  });
});

describe("yardımcılar", () => {
  it("pickRandom benzersiz öğeler seçer ve girdiyi değiştirmez", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const picked = pickRandom(items, 5);
    expect(new Set(picked).size).toBe(5);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("periodStart: tüm zamanlar null, bu hafta son 7 gün", () => {
    const now = new Date("2026-10-08T12:00:00.000Z");
    expect(periodStart("all", now)).toBeNull();
    expect(periodStart("week", now)).toBe("2026-10-01T12:00:00.000Z");
  });
});
