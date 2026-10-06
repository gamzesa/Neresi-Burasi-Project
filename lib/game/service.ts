import { randomInt } from "node:crypto";
import { distanceKm, type LatLng } from "./geo";
import { QUESTIONS_PER_GAME, calculateScore, totalHints, type Difficulty, type GameMap } from "./scoring";
import type { GameStore, QuestionRow, SessionRow } from "./types";

/** `message` istemciye gösterilir; `status` HTTP durum koduna çevrilir. */
export class GameError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type RegionChecker = (map: GameMap, point: LatLng, regionCode: string) => boolean;

export function pickRandom<T>(items: readonly T[], count: number, rand: (max: number) => number = randomInt): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

async function loadSession(store: GameStore, sessionId: string): Promise<SessionRow> {
  const session = await store.getSession(sessionId);
  if (!session) throw new GameError(404, "Oturum bulunamadı.");
  return session;
}

function requireActive(session: SessionRow): void {
  if (session.status !== "active") throw new GameError(409, "Bu oyun zaten bitti.");
}

async function loadCurrentQuestion(store: GameStore, session: SessionRow): Promise<QuestionRow> {
  const question = await store.getQuestion(session.question_ids[session.current_index]);
  if (!question) throw new GameError(500, "Soru bulunamadı.");
  return question;
}

export interface QuestionView {
  questionNumber: number;
  totalQuestions: number;
  /** Şu ana kadar açılmış ipuçları; açılmamış ipuçları asla gönderilmez. */
  hints: string[];
  hintsOpened: number;
  totalHints: number;
}

function questionView(session: SessionRow, question: QuestionRow): QuestionView {
  return {
    questionNumber: session.current_index + 1,
    totalQuestions: session.question_ids.length,
    hints: question.hints.slice(0, session.current_hints_opened),
    hintsOpened: session.current_hints_opened,
    totalHints: totalHints(session.difficulty),
  };
}

export async function startGame(
  store: GameStore,
  input: { map: GameMap; difficulty: Difficulty; userId?: string | null },
) {
  const ids = await store.listQuestionIds(input.map, input.difficulty);
  if (ids.length < QUESTIONS_PER_GAME) throw new GameError(503, "Bu seçim için yeterli soru yok.");
  const session = await store.createSession({
    map: input.map,
    difficulty: input.difficulty,
    user_id: input.userId ?? null,
    question_ids: pickRandom(ids, QUESTIONS_PER_GAME),
  });
  const question = await loadCurrentQuestion(store, session);
  return { sessionId: session.id, map: session.map, difficulty: session.difficulty, ...questionView(session, question) };
}

export async function openHint(store: GameStore, input: { sessionId: string }) {
  const session = await loadSession(store, input.sessionId);
  requireActive(session);
  const question = await loadCurrentQuestion(store, session);
  if (await store.getGuess(session.id, question.id)) throw new GameError(409, "Bu soru zaten cevaplandı.");
  if (session.current_hints_opened >= totalHints(session.difficulty)) {
    throw new GameError(409, "Tüm ipuçları zaten açıldı.");
  }
  const opened = session.current_hints_opened + 1;
  const ok = await store.updateSession(
    session.id,
    { current_index: session.current_index, current_hints_opened: session.current_hints_opened, status: "active" },
    { current_hints_opened: opened },
  );
  if (!ok) throw new GameError(409, "İstek çakıştı, tekrar dene.");
  return { hint: question.hints[opened - 1], hintsOpened: opened, totalHints: totalHints(session.difficulty) };
}

export async function submitGuess(
  store: GameStore,
  checkRegion: RegionChecker,
  input: { sessionId: string; lat: number; lng: number },
) {
  const session = await loadSession(store, input.sessionId);
  requireActive(session);
  const question = await loadCurrentQuestion(store, session);
  if (await store.getGuess(session.id, question.id)) throw new GameError(409, "Bu soru için zaten tahmin yapıldı.");

  const guess: LatLng = { lat: input.lat, lng: input.lng };
  const distance = distanceKm(guess, { lat: question.answer_lat, lng: question.answer_lng });
  const regionHit = checkRegion(session.map, guess, question.region_code);
  const score = calculateScore({
    map: session.map,
    difficulty: session.difficulty,
    distanceKm: distance,
    regionHit,
    hintsOpened: session.current_hints_opened,
  });

  const inserted = await store.insertGuess({
    session_id: session.id,
    question_id: question.id,
    hints_opened: session.current_hints_opened,
    guess_lat: guess.lat,
    guess_lng: guess.lng,
    distance_km: distance,
    region_hit: regionHit,
    score,
  });
  if (inserted === "duplicate") throw new GameError(409, "Bu soru için zaten tahmin yapıldı.");

  const totalScore = (await store.listGuesses(session.id)).reduce((sum, g) => sum + g.score, 0);
  await store.updateSession(session.id, { current_index: session.current_index }, { total_score: totalScore });

  return {
    distanceKm: Math.round(distance * 10) / 10,
    regionHit,
    score,
    totalScore,
    answer: { lat: question.answer_lat, lng: question.answer_lng, label: question.answer_label },
    questionNumber: session.current_index + 1,
    isLastQuestion: session.current_index + 1 >= session.question_ids.length,
  };
}

/** Sonraki soruya geçer veya oyunu bitirir. */
export async function nextStep(store: GameStore, input: { sessionId: string }) {
  const session = await loadSession(store, input.sessionId);

  if (session.status === "finished") {
    return { finished: true as const, totalScore: session.total_score, ranked: session.user_id !== null };
  }

  const question = await loadCurrentQuestion(store, session);
  if (!(await store.getGuess(session.id, question.id))) {
    throw new GameError(409, "Sonraki soruya geçmek için önce tahmin yapmalısın.");
  }

  const expect = { current_index: session.current_index, status: "active" as const };
  if (session.current_index + 1 >= session.question_ids.length) {
    const ok = await store.updateSession(session.id, expect, {
      status: "finished",
      finished_at: new Date().toISOString(),
    });
    if (!ok) throw new GameError(409, "İstek çakıştı, tekrar dene.");
    return { finished: true as const, totalScore: session.total_score, ranked: session.user_id !== null };
  }

  const ok = await store.updateSession(session.id, expect, {
    current_index: session.current_index + 1,
    current_hints_opened: 1,
  });
  if (!ok) throw new GameError(409, "İstek çakıştı, tekrar dene.");
  const advanced: SessionRow = { ...session, current_index: session.current_index + 1, current_hints_opened: 1 };
  return { finished: false as const, ...questionView(advanced, await loadCurrentQuestion(store, advanced)) };
}

/**
 * Misafir olarak biten bir oyunu, giriş yapmış kullanıcıya bağlar; böylece skor sıralamaya girer.
 * Yalnızca bitmiş ve henüz kimseye ait olmayan oyun sahiplenilebilir.
 */
export async function claimSession(store: GameStore, input: { sessionId: string; userId: string }) {
  const session = await loadSession(store, input.sessionId);
  if (session.status !== "finished") throw new GameError(409, "Yalnızca biten bir oyun hesabına eklenebilir.");
  if (session.user_id === input.userId) return { totalScore: session.total_score };
  if (session.user_id !== null) throw new GameError(409, "Bu oyun başka bir hesaba ait.");
  const ok = await store.updateSession(session.id, { status: "finished", user_id: null }, { user_id: input.userId });
  if (!ok) throw new GameError(409, "İstek çakıştı, tekrar dene.");
  return { totalScore: session.total_score };
}
