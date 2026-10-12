import { createHash, randomBytes, randomInt } from "node:crypto";
import { distanceKm, type LatLng } from "@/lib/game/geo";
import {
  DUEL_GRACE_SECONDS,
  DUEL_LEAD_IN_SECONDS,
  DUEL_MAX_PLAYERS,
  DUEL_QUESTION_SECONDS,
  DUEL_RESULT_SECONDS,
  QUESTIONS_PER_GAME,
  calculateDuelScore,
  duelHintsOpened,
  totalHints,
  type Difficulty,
  type GameMap,
} from "@/lib/game/scoring";
import { GameError, pickRandom, type RegionChecker } from "@/lib/game/service";
import type { RoomGuessRow, RoomPlayerRow, RoomRow, RoomStore } from "./types";

/** Karıştırılan harfler (0/O, 1/I) yoktur; kod elle yazılıp telefonda okunabilsin diye. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;
const CODE_ATTEMPTS = 8;
/** Bu süreden eski oda artık kullanılmaz. */
const ROOM_TTL_MS = 3 * 60 * 60 * 1000;

const SECOND = 1000;

export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}

function generateCode(): string {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

interface Clock {
  /** Testlerde sabit zaman vermek için; üretimde verilmez. */
  now?: Date;
}

const nowOf = (clock: Clock) => (clock.now ?? new Date()).getTime();

// ---------------------------------------------------------------------------
// Zaman çizelgesi
// ---------------------------------------------------------------------------

export type RoomPhase = "waiting" | "countdown" | "answering" | "results" | "finished";

interface QuestionTimeline {
  /** Sorunun açıldığı an (ms). */
  startedAt: number;
  /** Tahminin kabul edildiği son an (süre + ağ payı). */
  closesAt: number;
  /** Soru gerçekte ne zaman bitti: herkes tahmin ettiyse son tahminin anı, aksi halde `closesAt`. */
  closedAt: number;
  /** Sonraki sorunun (veya oyun sonunun) başlayacağı an. */
  nextAt: number;
}

function timeline(room: RoomRow, guesses: RoomGuessRow[], playerCount: number): QuestionTimeline {
  const startedAt = new Date(room.question_started_at as string).getTime();
  const closesAt = startedAt + (DUEL_QUESTION_SECONDS + DUEL_GRACE_SECONDS) * SECOND;
  const questionId = room.question_ids[room.current_index];
  const current = guesses.filter((g) => g.question_id === questionId);
  const allGuessed = playerCount >= DUEL_MAX_PLAYERS && current.length >= playerCount;
  const lastGuessAt = Math.max(0, ...current.map((g) => new Date(g.guessed_at).getTime()));
  const closedAt = allGuessed ? Math.min(lastGuessAt, closesAt) : closesAt;
  return { startedAt, closesAt, closedAt, nextAt: closedAt + DUEL_RESULT_SECONDS * SECOND };
}

function phaseOf(room: RoomRow, tl: QuestionTimeline | null, now: number): RoomPhase {
  if (room.status === "waiting") return "waiting";
  if (room.status === "finished" || !tl) return "finished";
  if (now < tl.startedAt) return "countdown";
  return now < tl.closedAt ? "answering" : "results";
}

/**
 * Zamana göre sıradaki soruya geçer ya da oyunu bitirir. Arka plan işlemi olmadığı için ilerleme,
 * her istekte tembelce hesaplanır; yeni sorunun açılış zamanı "şimdi" değil sonuç süresinin bitiş anıdır,
 * böylece eşzamanlı istekler aynı değeri yazar.
 */
async function advanceRoom(store: RoomStore, initial: RoomRow, players: RoomPlayerRow[], now: number) {
  let room = initial;
  for (let step = 0; step <= QUESTIONS_PER_GAME; step++) {
    if (room.status !== "active" || !room.question_started_at) return room;
    const tl = timeline(room, await store.listGuesses(room.id), players.length);
    if (now < tl.nextAt) return room;

    const expect = { status: "active" as const, current_index: room.current_index };
    const patch =
      room.current_index + 1 >= room.question_ids.length
        ? { status: "finished" as const, finished_at: new Date(tl.nextAt).toISOString() }
        : { current_index: room.current_index + 1, question_started_at: new Date(tl.nextAt).toISOString() };
    await store.updateRoom(room.id, expect, patch);
    room = { ...room, ...patch };
  }
  return room;
}

// ---------------------------------------------------------------------------
// Oda kurma, katılma, başlatma
// ---------------------------------------------------------------------------

export async function createRoom(
  store: RoomStore,
  input: { map: GameMap; difficulty: Difficulty; nickname: string; userId?: string | null },
) {
  const ids = await store.listQuestionIds(input.map, input.difficulty);
  if (ids.length < QUESTIONS_PER_GAME) throw new GameError(503, "Bu seçim için yeterli soru yok.");
  const questionIds = pickRandom(ids, QUESTIONS_PER_GAME);

  let room: RoomRow | null = null;
  for (let attempt = 0; attempt < CODE_ATTEMPTS && !room; attempt++) {
    const created = await store.createRoom({
      code: generateCode(),
      map: input.map,
      difficulty: input.difficulty,
      question_ids: questionIds,
    });
    if (created !== "code_taken") room = created;
  }
  if (!room) throw new GameError(503, "Oda kodu üretilemedi, tekrar dene.");

  const token = randomBytes(24).toString("hex");
  const player = await store.addPlayer({
    room_id: room.id,
    seat: 0,
    user_id: input.userId ?? null,
    token_hash: hashToken(token),
    nickname: input.nickname,
  });
  if (player === "seat_taken") throw new GameError(500, "Oda kurulamadı.");
  return { code: room.code, playerToken: token, seat: 0 };
}

function requireFresh(room: RoomRow, now: number) {
  if (now - new Date(room.created_at).getTime() > ROOM_TTL_MS) {
    throw new GameError(410, "Bu odanın süresi doldu. Yeni bir oda kur.");
  }
}

export async function joinRoom(
  store: RoomStore,
  input: { code: string; nickname: string; userId?: string | null } & Clock,
) {
  const room = await store.getRoomByCode(normalizeRoomCode(input.code));
  if (!room) throw new GameError(404, "Oda bulunamadı. Kodu kontrol et.");
  requireFresh(room, nowOf(input));
  if (room.status !== "waiting") throw new GameError(409, "Bu oyun zaten başladı.");

  const players = await store.listPlayers(room.id);
  if (players.length >= DUEL_MAX_PLAYERS) throw new GameError(409, "Oda dolu.");
  if (input.userId && players.some((p) => p.user_id === input.userId)) {
    throw new GameError(409, "Kendi kurduğun odaya ikinci kez katılamazsın.");
  }

  const token = randomBytes(24).toString("hex");
  const player = await store.addPlayer({
    room_id: room.id,
    seat: players.length,
    user_id: input.userId ?? null,
    token_hash: hashToken(token),
    nickname: input.nickname,
  });
  if (player === "seat_taken") throw new GameError(409, "Oda dolu.");
  return { code: room.code, playerToken: token, seat: player.seat };
}

async function authenticate(store: RoomStore, code: string, playerToken: string, clock: Clock) {
  const room = await store.getRoomByCode(normalizeRoomCode(code));
  if (!room) throw new GameError(404, "Oda bulunamadı.");
  requireFresh(room, nowOf(clock));
  const players = await store.listPlayers(room.id);
  const hash = hashToken(playerToken);
  const me = players.find((p) => p.token_hash === hash);
  if (!me) throw new GameError(403, "Bu odada oyuncu değilsin.");
  return { room, players, me };
}

/** Yalnızca odayı kuran başlatır ve rakip katılmış olmalıdır. İlk soru kısa bir geri sayımdan sonra açılır. */
export async function startRoom(store: RoomStore, input: { code: string; playerToken: string } & Clock) {
  const { room, players, me } = await authenticate(store, input.code, input.playerToken, input);
  if (me.seat !== 0) throw new GameError(403, "Oyunu yalnızca odayı kuran başlatabilir.");
  if (room.status !== "waiting") return { started: true as const };
  if (players.length < DUEL_MAX_PLAYERS) throw new GameError(409, "Başlatmak için rakibin katılmasını bekle.");

  const startsAt = new Date(nowOf(input) + DUEL_LEAD_IN_SECONDS * SECOND).toISOString();
  await store.updateRoom(
    room.id,
    { status: "waiting" },
    { status: "active", current_index: 0, question_started_at: startsAt },
  );
  return { started: true as const };
}

// ---------------------------------------------------------------------------
// Tahmin
// ---------------------------------------------------------------------------

export async function submitRoomGuess(
  store: RoomStore,
  checkRegion: RegionChecker,
  input: { code: string; playerToken: string; lat: number; lng: number } & Clock,
) {
  const now = nowOf(input);
  const auth = await authenticate(store, input.code, input.playerToken, input);
  const room = await advanceRoom(store, auth.room, auth.players, now);
  if (room.status !== "active" || !room.question_started_at) throw new GameError(409, "Bu oyun aktif değil.");

  const guesses = await store.listGuesses(room.id);
  const tl = timeline(room, guesses, auth.players.length);
  const phase = phaseOf(room, tl, now);
  if (phase === "countdown") throw new GameError(409, "Soru henüz açılmadı.");
  if (phase !== "answering") throw new GameError(409, "Bu soru için süre doldu.");

  const questionId = room.question_ids[room.current_index];
  if (guesses.some((g) => g.player_id === auth.me.id && g.question_id === questionId)) {
    throw new GameError(409, "Bu soru için zaten tahmin yaptın.");
  }
  const question = await store.getQuestion(questionId);
  if (!question) throw new GameError(500, "Soru bulunamadı.");

  const guess: LatLng = { lat: input.lat, lng: input.lng };
  const distance = distanceKm(guess, { lat: question.answer_lat, lng: question.answer_lng });
  const regionHit = checkRegion(room.map, guess, question.region_code);
  // Hız, soru açıldığından beri geçen süredir; ağ payında gelen tahmin son saniye sayılır.
  const elapsedMs = Math.min(Math.max(0, now - tl.startedAt), DUEL_QUESTION_SECONDS * SECOND);
  const score = calculateDuelScore({
    map: room.map,
    difficulty: room.difficulty,
    distanceKm: distance,
    regionHit,
    elapsedSeconds: elapsedMs / SECOND,
  });

  const inserted = await store.insertGuess({
    room_id: room.id,
    player_id: auth.me.id,
    question_id: questionId,
    guess_lat: guess.lat,
    guess_lng: guess.lng,
    distance_km: distance,
    region_hit: regionHit,
    score,
    elapsed_ms: Math.round(elapsedMs),
    guessed_at: new Date(now).toISOString(),
  });
  if (inserted === "duplicate") throw new GameError(409, "Bu soru için zaten tahmin yaptın.");

  // Cevap ve puan, soru bitene kadar gösterilmez (rakibe sözlü aktarılmasın diye).
  return { accepted: true as const };
}

// ---------------------------------------------------------------------------
// Durum
// ---------------------------------------------------------------------------

export interface RoomPlayerView {
  seat: number;
  nickname: string;
  isYou: boolean;
  /** Yalnızca biten soruların toplamı; geçerli soru bitene kadar yansımaz. */
  totalScore: number;
  /** Geçerli soruda bu oyuncu tahmin etti mi (tahminin kendisi gösterilmez). */
  hasGuessed: boolean;
}

export interface RoomResultView {
  answer: { lat: number; lng: number; label: string };
  guesses: {
    seat: number;
    lat: number;
    lng: number;
    distanceKm: number;
    regionHit: boolean;
    score: number;
    elapsedSeconds: number;
  }[];
  /** Soruyu kazanan oyuncunun koltuğu; berabere veya kimse tahmin etmediyse null. */
  winnerSeat: number | null;
}

export interface RoomState {
  code: string;
  map: GameMap;
  difficulty: Difficulty;
  phase: RoomPhase;
  /** İstemci saatinin sunucudan farkını düzeltebilmesi için (ms). */
  serverNow: number;
  you: { seat: number };
  players: RoomPlayerView[];
  questionNumber: number;
  totalQuestions: number;
  /** Yalnızca açılmış ipuçları gönderilir; geri sayımda ve bekleme odasında null. */
  question: { hints: string[]; hintsOpened: number; totalHints: number } | null;
  /** Geçerli sorunun açılış ve bitiş anı (ms, sunucu saati); geri sayım çubuğu içindir. */
  startsAt: number | null;
  endsAt: number | null;
  /** Sonuçların biteceği, sonraki sorunun açılacağı an; yalnızca sonuç aşamasında. */
  nextAt: number | null;
  result: RoomResultView | null;
  /** Oyun bitince: kazanan koltuk (berabere ise null). */
  winnerSeat: number | null;
}

function leaderSeat(entries: { seat: number; score: number }[]): number | null {
  if (entries.length === 0) return null;
  const best = Math.max(...entries.map((e) => e.score));
  const leaders = entries.filter((e) => e.score === best);
  return leaders.length === 1 ? leaders[0].seat : null;
}

export async function getRoomState(
  store: RoomStore,
  input: { code: string; playerToken: string } & Clock,
): Promise<RoomState> {
  const now = nowOf(input);
  const auth = await authenticate(store, input.code, input.playerToken, input);
  const room = await advanceRoom(store, auth.room, auth.players, now);
  const guesses = room.status === "waiting" ? [] : await store.listGuesses(room.id);

  const tl = room.question_started_at !== null ? timeline(room, guesses, auth.players.length) : null;
  const phase = phaseOf(room, room.status === "active" ? tl : null, now);
  const questionId = room.question_ids[room.current_index];
  const currentGuesses = guesses.filter((g) => g.question_id === questionId);
  const resultsVisible = phase === "results" || phase === "finished";

  // Geçerli soru bitmeden onun puanı toplama yansımaz.
  const countedGuesses = resultsVisible ? guesses : guesses.filter((g) => g.question_id !== questionId);
  const players: RoomPlayerView[] = auth.players.map((p) => ({
    seat: p.seat,
    nickname: p.nickname,
    isYou: p.id === auth.me.id,
    totalScore: countedGuesses.filter((g) => g.player_id === p.id).reduce((sum, g) => sum + g.score, 0),
    hasGuessed: currentGuesses.some((g) => g.player_id === p.id),
  }));

  let question: RoomState["question"] = null;
  let result: RoomResultView | null = null;
  if (phase === "answering" || resultsVisible) {
    const row = await store.getQuestion(questionId);
    if (!row) throw new GameError(500, "Soru bulunamadı.");
    const elapsed = phase === "answering" && tl ? (now - tl.startedAt) / SECOND : DUEL_QUESTION_SECONDS;
    const opened = duelHintsOpened(room.difficulty, elapsed);
    question = { hints: row.hints.slice(0, opened), hintsOpened: opened, totalHints: totalHints(room.difficulty) };

    if (resultsVisible) {
      const rows = currentGuesses.map((g) => ({
        seat: auth.players.find((p) => p.id === g.player_id)?.seat ?? 0,
        lat: g.guess_lat,
        lng: g.guess_lng,
        distanceKm: Math.round(g.distance_km * 10) / 10,
        regionHit: g.region_hit,
        score: g.score,
        elapsedSeconds: Math.round(g.elapsed_ms / 100) / 10,
      }));
      result = {
        answer: { lat: row.answer_lat, lng: row.answer_lng, label: row.answer_label },
        guesses: rows,
        winnerSeat: leaderSeat(rows.map((r) => ({ seat: r.seat, score: r.score }))),
      };
    }
  }

  return {
    code: room.code,
    map: room.map,
    difficulty: room.difficulty,
    phase,
    serverNow: now,
    you: { seat: auth.me.seat },
    players,
    questionNumber: room.current_index + 1,
    totalQuestions: room.question_ids.length,
    question,
    startsAt: tl ? tl.startedAt : null,
    endsAt: tl ? tl.startedAt + DUEL_QUESTION_SECONDS * SECOND : null,
    nextAt: phase === "results" && tl ? tl.nextAt : null,
    result,
    winnerSeat: phase === "finished" ? leaderSeat(players.map((p) => ({ seat: p.seat, score: p.totalScore }))) : null,
  };
}
