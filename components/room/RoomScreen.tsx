"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { inputClass, primaryButtonClass } from "@/components/auth/AuthShell";
import { useDisablePageZoom } from "@/components/game/useDisablePageZoom";
import GameMapLoader from "@/components/map/GameMapLoader";
import type { LatLng } from "@/lib/game/geo";
import { DUEL_QUESTION_SECONDS, HINT_MULTIPLIERS } from "@/lib/game/scoring";
import { ApiError, roomApi, type RoomState } from "@/lib/gameApi";
import { DIFFICULTY_LABELS, MAP_LABELS } from "@/lib/labels";
import { clearRoomToken, loadRoomToken, saveRoomToken } from "@/lib/roomSession";
import { NICKNAME_MAX } from "@/lib/validation";

const POLL_MS = 1000;
/** Oyun bittikten sonra yalnızca "tekrar oyna" isteğini beklerken daha seyrek sorgulanır. */
const FINISHED_POLL_MS = 2000;
const TICK_MS = 200;

interface RoomScreenProps {
  code: string;
  /** Girişli kullanıcı; misafirde null. */
  user: { username: string } | null;
}

const subscribeNever = () => () => {};

function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : "Beklenmeyen bir hata oluştu.";
}

function formatKm(km: number): string {
  return `${km.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} km`;
}

function seconds(ms: number): number {
  return Math.max(0, Math.ceil(ms / 1000));
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-6 px-6 py-10">
      <header className="text-center">
        <Link href="/" className="text-3xl font-extrabold tracking-tight">
          Neresi <span className="text-accent">Burası?</span>
        </Link>
      </header>
      {children}
    </main>
  );
}

/** Odanın bağlantısını açan ama anahtarı olmayan kişi (arkadaş) için katılma formu. */
function JoinPanel({
  code,
  user,
  onJoined,
}: {
  code: string;
  user: { username: string } | null;
  onJoined: (token: string) => void;
}) {
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const joined = await roomApi.join({ code, nickname: user ? undefined : nickname.trim() });
      saveRoomToken(joined.code, joined.playerToken);
      onJoined(joined.playerToken);
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="text-center">
        <h1 className="text-xl font-bold">Odaya katıl</h1>
        <p className="mt-2 text-sm text-muted">Oda kodu</p>
        <p className="text-3xl font-extrabold tracking-[0.3em]">{code}</p>
      </div>
      <form onSubmit={(e) => void join(e)} className="flex flex-col gap-4">
        {user ? (
          <p className="text-center text-sm text-muted">
            <strong className="text-ink">{user.username}</strong> olarak katılacaksın.
          </p>
        ) : (
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
            Takma adın
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={NICKNAME_MAX}
              placeholder="Örn. Mehmet"
              className={inputClass}
            />
          </label>
        )}
        {error ? (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={busy || (!user && nickname.trim().length < 2)} className={primaryButtonClass}>
          {busy ? "Bekle…" : "Odaya katıl"}
        </button>
      </form>
    </Shell>
  );
}

/** Oyun sonunda "tekrar oyna" isteğinin durumuna göre düğmeler ve bilgi mesajı. */
function RematchPanel({
  rematch,
  mySeat,
  opponentName,
  onAnswer,
}: {
  rematch: RoomState["rematch"];
  mySeat: number;
  opponentName: string;
  onAnswer: (action: "request" | "accept" | "decline") => void;
}) {
  const box = "flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3 text-sm";
  const iRequested = rematch.requestedBySeat === mySeat;

  if (rematch.status === "none") {
    return (
      <button type="button" onClick={() => onAnswer("request")} className={primaryButtonClass}>
        Tekrar oyna
      </button>
    );
  }
  if (rematch.status === "accepted") {
    return (
      <p className={`${box} text-center font-semibold text-accent`} role="status">
        Yeni oyun başlıyor…
      </p>
    );
  }
  if (rematch.status === "declined") {
    return (
      <p className={`${box} text-center text-danger`} role="status">
        {iRequested ? `${opponentName} tekrar oyun isteğini reddetti.` : "Tekrar oyun isteğini reddettin."}
      </p>
    );
  }
  if (iRequested) {
    return (
      <p className={`${box} text-center text-muted`} role="status">
        Tekrar oyun isteği gönderildi, {opponentName} bekleniyor…
      </p>
    );
  }
  return (
    <div className={box} role="status">
      <p className="text-center font-semibold">{opponentName} tekrar oynamak istiyor.</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onAnswer("accept")} className={primaryButtonClass}>
          Kabul et
        </button>
        <button
          type="button"
          onClick={() => onAnswer("decline")}
          className="min-h-11 rounded-xl border border-danger/60 px-4 font-semibold text-danger transition hover:bg-danger/10"
        >
          Reddet
        </button>
      </div>
    </div>
  );
}

/** `showGuessed`: yalnızca soru sürerken "tahmin etti" bilgisi gösterilir; diğer zamanlarda alt yazı "skor"dur. */
function Scoreboard({ players, showGuessed = false }: { players: RoomState["players"]; showGuessed?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {players.map((p) => (
        <li
          key={p.seat}
          className={`rounded-xl border p-2.5 text-sm ${p.isYou ? "border-accent/50 bg-accent/10" : "border-sky/40 bg-sky/10"}`}
        >
          <p className="truncate font-semibold">
            {p.nickname}
            {p.isYou ? " (sen)" : ""}
          </p>
          <p className="text-lg font-extrabold">{p.totalScore.toLocaleString("tr-TR")}</p>
          <p className="text-xs text-muted">{showGuessed && p.hasGuessed ? "tahmin etti" : "skor"}</p>
        </li>
      ))}
    </ul>
  );
}

export default function RoomScreen({ code, user }: RoomScreenProps) {
  useDisablePageZoom();
  const router = useRouter();
  // Depolamadaki anahtar; sunucuda ve ilk çizimde undefined (henüz okunmadı), anahtar yoksa null.
  const storedToken = useSyncExternalStore(
    subscribeNever,
    () => loadRoomToken(code),
    () => undefined,
  );
  const [joinedToken, setJoinedToken] = useState<string | null>(null);
  const token = joinedToken ?? storedToken;
  const [view, setView] = useState<RoomState | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [connectionLost, setConnectionLost] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [guessState, setGuessState] = useState<{ question: number; point: LatLng } | null>(null);
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Sunucu saatinin istemci saatinden farkı (ms); geri sayımlar sunucu saatine göre gösterilir.
  const [clockOffset, setClockOffset] = useState(0);
  const sendingRef = useRef(false);

  // Durum sorgusu: önceki yanıt gelmeden yenisi gönderilmez; oyun bitince durur.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      try {
        const state = await roomApi.state(code, token);
        if (cancelled) return;
        setClockOffset(state.serverNow - Date.now());
        setView(state);
        setConnectionLost(false);
        // Biten oyunda yalnızca tekrar oyna isteği sonuçlanana kadar sorgulanır.
        const rematch = state.rematch.status;
        if (state.phase === "finished" && (rematch === "declined" || rematch === "accepted")) return;
        timer = setTimeout(() => void tick(), state.phase === "finished" ? FINISHED_POLL_MS : POLL_MS);
        return;
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && [403, 404, 410].includes(e.status)) {
          clearRoomToken(code);
          setFatal(e.message);
          return;
        }
        setConnectionLost(true);
      }
      timer = setTimeout(() => void tick(), POLL_MS);
    };
    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [code, token]);

  // Geri sayım göstergeleri için saat; yalnızca zamana bağlı aşamalarda çalışır.
  const timed = view?.phase === "countdown" || view?.phase === "answering" || view?.phase === "results";
  useEffect(() => {
    if (!timed) return;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [timed]);

  const serverNow = now + clockOffset;
  const me = view?.players.find((p) => p.isYou) ?? null;
  const opponent = view?.players.find((p) => !p.isYou) ?? null;
  const questionNumber = view?.questionNumber ?? 0;
  const guess = guessState?.question === questionNumber ? guessState.point : null;
  const hasGuessed = me?.hasGuessed ?? false;
  const answering = view?.phase === "answering";
  const remainingMs = view?.endsAt ? view.endsAt - serverNow : 0;

  async function submitGuess(point: LatLng) {
    if (!token || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setActionError(null);
    try {
      await roomApi.guess(code, token, point.lat, point.lng);
      // Sunucu durumu bir sonraki sorguda "tahmin etti" olarak döner; hemen güncelle.
      const state = await roomApi.state(code, token);
      setClockOffset(state.serverNow - Date.now());
      setView(state);
    } catch (e) {
      setActionError(messageOf(e));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  // Süre bitmeden işaretlenmiş ama onaylanmamış tahmin, süre dolarken kendiliğinden gönderilir.
  const autoSubmitRef = useRef<() => void>(() => {});
  useEffect(() => {
    autoSubmitRef.current = () => {
      if (answering && !hasGuessed && guess && remainingMs <= 300) void submitGuess(guess);
    };
  });
  useEffect(() => {
    if (!answering) return;
    const id = setInterval(() => autoSubmitRef.current(), TICK_MS);
    return () => clearInterval(id);
  }, [answering]);

  // Tekrar oyna kabul edilince aynı oyuncu anahtarıyla yeni odaya geçilir.
  const rematchCode = view?.rematch.status === "accepted" ? view.rematch.code : null;
  useEffect(() => {
    if (!rematchCode || !token) return;
    saveRoomToken(rematchCode, token);
    router.push(`/oda/${rematchCode}`);
  }, [rematchCode, token, router]);

  async function answerRematch(action: "request" | "accept" | "decline") {
    if (!token) return;
    setActionError(null);
    try {
      await roomApi.rematch(code, token, action);
      const state = await roomApi.state(code, token);
      setClockOffset(state.serverNow - Date.now());
      setView(state);
    } catch (e) {
      setActionError(messageOf(e));
    }
  }

  const resultGuesses = view?.result?.guesses ?? [];
  const myResult = resultGuesses.find((g) => g.seat === view?.you.seat) ?? null;
  const opponentResult = resultGuesses.find((g) => g.seat !== view?.you.seat) ?? null;
  const mapGuess: LatLng | null = view?.phase === "results" && myResult ? { lat: myResult.lat, lng: myResult.lng } : guess;
  const mapOpponent: LatLng | null =
    view?.phase === "results" && opponentResult ? { lat: opponentResult.lat, lng: opponentResult.lng } : null;
  const mapAnswer: LatLng | null = view?.result
    ? { lat: view.result.answer.lat, lng: view.result.answer.lng }
    : null;

  async function start() {
    if (!token) return;
    setActionError(null);
    try {
      await roomApi.start(code, token);
      const state = await roomApi.state(code, token);
      setClockOffset(state.serverNow - Date.now());
      setView(state);
    } catch (e) {
      setActionError(messageOf(e));
    }
  }

  async function share() {
    const url = `${window.location.origin}/oda/${code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Neresi Burası?", text: `Benimle yarış! Oda kodu: ${code}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Paylaşım iptal edildi ya da panoya yazılamadı; kod ekranda görünür durumda.
    }
  }

  if (fatal) {
    return (
      <Shell>
        <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-center text-sm text-danger">
          {fatal}
        </p>
        <Link href="/oda" className={`${primaryButtonClass} flex items-center justify-center`}>
          Yeni oda kur
        </Link>
      </Shell>
    );
  }

  if (token === undefined) {
    return (
      <Shell>
        <p className="text-center text-muted">Oda yükleniyor…</p>
      </Shell>
    );
  }

  if (token === null) return <JoinPanel code={code} user={user} onJoined={setJoinedToken} />;

  if (!view) {
    return (
      <Shell>
        <p className="text-center text-muted">Oda yükleniyor…</p>
      </Shell>
    );
  }

  if (view.phase === "waiting") {
    const isHost = view.you.seat === 0;
    const ready = view.players.length >= 2;
    return (
      <Shell>
        <section className="flex flex-col gap-5 text-center">
          <div>
            <p className="text-sm text-muted">
              {MAP_LABELS[view.map]} · {DIFFICULTY_LABELS[view.difficulty]}
            </p>
            <h1 className="mt-1 text-sm font-semibold text-muted">Oda kodu</h1>
            <p className="text-5xl font-extrabold tracking-[0.25em]">{view.code}</p>
          </div>
          <button
            type="button"
            onClick={() => void share()}
            className="min-h-11 rounded-xl border border-accent px-4 font-semibold text-accent hover:bg-accent/10"
          >
            {copied ? "Bağlantı kopyalandı" : "Arkadaşına gönder"}
          </button>
          <ul className="flex flex-col gap-2 text-left">
            {view.players.map((p) => (
              <li key={p.seat} className="rounded-xl border border-line bg-surface-2 p-3 text-sm font-semibold">
                {p.nickname}
                {p.isYou ? " (sen)" : ""}
              </li>
            ))}
            {!ready ? (
              <li className="rounded-xl border border-dashed border-line p-3 text-sm text-muted">
                Rakip bekleniyor…
              </li>
            ) : null}
          </ul>
          {isHost ? (
            <button type="button" disabled={!ready} onClick={() => void start()} className={primaryButtonClass}>
              {ready ? "Oyunu başlat" : "Rakip katılınca başlatabilirsin"}
            </button>
          ) : (
            <p className="text-sm text-muted">{ready ? "Odayı kuran oyunu başlatacak…" : "Rakip bekleniyor…"}</p>
          )}
          {actionError ? (
            <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {actionError}
            </p>
          ) : null}
        </section>
      </Shell>
    );
  }

  if (view.phase === "finished") {
    const won = view.winnerSeat === view.you.seat;
    const draw = view.winnerSeat === null;
    return (
      <Shell>
        <section className="flex flex-col gap-5 text-center">
          <div>
            <h1 className="text-2xl font-extrabold">
              {draw ? "Berabere!" : won ? "Kazandın!" : `${opponent?.nickname ?? "Rakip"} kazandı`}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {MAP_LABELS[view.map]} · {DIFFICULTY_LABELS[view.difficulty]}
            </p>
          </div>
          <Scoreboard players={view.players} />
          <RematchPanel
            rematch={view.rematch}
            mySeat={view.you.seat}
            opponentName={opponent?.nickname ?? "Rakip"}
            onAnswer={(action) => void answerRematch(action)}
          />
          {actionError ? (
            <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {actionError}
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            <Link
              href="/oda"
              className="flex min-h-11 items-center justify-center rounded-xl border border-line px-4 font-semibold hover:bg-surface-2"
            >
              Yeni oda kur
            </Link>
            <Link
              href="/"
              className="flex min-h-11 items-center justify-center rounded-xl border border-line px-4 font-semibold hover:bg-surface-2"
            >
              Ana sayfa
            </Link>
          </div>
        </section>
      </Shell>
    );
  }

  const countdown = view.phase === "countdown";
  const results = view.phase === "results";
  const timeLeft = seconds(remainingMs);
  const fraction = Math.min(1, Math.max(0, remainingMs / (DUEL_QUESTION_SECONDS * 1000)));
  const lowTime = timeLeft <= 5;
  const questionWinner = view.result?.winnerSeat ?? null;
  const nextIn = view.nextAt ? seconds(view.nextAt - serverNow) : 0;
  const lastQuestion = view.questionNumber >= view.totalQuestions;
  const canGuess = answering && !hasGuessed && guess !== null && !sending;

  return (
    <div className="flex h-dvh flex-col md:grid md:grid-cols-3">
      <aside className="flex max-h-[55dvh] flex-col gap-3 overflow-y-auto border-b border-line bg-surface p-4 md:col-span-1 md:max-h-none md:border-r md:border-b-0">
        <header className="flex items-center justify-between gap-2">
          <div>
            <Link href="/" className="text-xs text-muted underline">
              Ana sayfa
            </Link>
            <h1 className="text-lg font-bold">
              {MAP_LABELS[view.map]} · {DIFFICULTY_LABELS[view.difficulty]}
            </h1>
          </div>
          <p className="text-right text-sm font-semibold">
            Soru {view.questionNumber}/{view.totalQuestions}
          </p>
        </header>

        <Scoreboard players={view.players} showGuessed={answering} />

        {connectionLost ? <p className="text-xs text-danger">Bağlantı sorunu, yeniden deneniyor…</p> : null}

        {countdown ? (
          <div className="rounded-xl border border-gold/50 bg-gold/10 p-6 text-center">
            <p className="text-sm text-muted">Oyun başlıyor</p>
            <p className="text-6xl font-extrabold text-gold">{seconds((view.startsAt ?? serverNow) - serverNow)}</p>
          </div>
        ) : null}

        {answering ? (
          <div aria-label="Kalan süre" className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted">Kalan süre</span>
              <span className={`text-2xl font-extrabold tabular-nums ${lowTime ? "text-danger" : "text-ink"}`}>
                {timeLeft}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className={`h-full rounded-full transition-[width] duration-200 ease-linear ${lowTime ? "bg-danger" : "bg-accent"}`}
                style={{ width: `${fraction * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        {view.question && (answering || results) ? (
          <section aria-label="İpuçları">
            <ol className="flex flex-col gap-2">
              {view.question.hints.map((hint, index) => (
                <li key={index} className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm leading-relaxed">
                  <span className="mb-1 block text-xs font-semibold text-accent">İpucu {index + 1}</span>
                  {hint}
                </li>
              ))}
            </ol>
            {answering ? (
              <p className="mt-2 text-xs text-muted">
                {hasGuessed
                  ? `Tahminin ${view.question.hintsOpened} ipucuyla verildi; sonraki ipuçları sana gösterilmez.`
                  : `İpucu katsayısı şu an ×${HINT_MULTIPLIERS[view.difficulty][view.question.hintsOpened - 1]
                      .toFixed(2)
                      .replace(".", ",")}; ipuçları süre içinde kendiliğinden açılır, ne kadar az ipucuyla ve ne kadar hızlı bilirsen o kadar çok puan alırsın.`}
              </p>
            ) : null}
          </section>
        ) : null}

        {results && view.result ? (
          <section aria-label="Soru sonucu" className="flex flex-col gap-2">
            <div className="rounded-xl border border-line bg-surface-2 p-3">
              <p className="text-xs font-semibold text-muted">Doğru cevap</p>
              <p className="text-lg font-bold">{view.result.answer.label}</p>
            </div>
            {view.players.map((p) => {
              const g = view.result?.guesses.find((r) => r.seat === p.seat);
              return (
                <div
                  key={p.seat}
                  className={`rounded-xl border p-3 text-sm ${p.isYou ? "border-accent/50 bg-accent/10" : "border-sky/40 bg-sky/10"}`}
                >
                  <p className="font-semibold">
                    {p.nickname}
                    {p.isYou ? " (sen)" : ""}
                    {questionWinner === p.seat ? " · bu soruyu kazandı" : ""}
                  </p>
                  {g ? (
                    <p className="text-muted">
                      {formatKm(g.distanceKm)} · {g.elapsedSeconds.toLocaleString("tr-TR")} sn · {g.hintsOpened} ipucu ·{" "}
                      <strong className="text-ink">+{g.score.toLocaleString("tr-TR")}</strong>
                    </p>
                  ) : (
                    <p className="text-muted">Tahmin yapmadı · +0</p>
                  )}
                </div>
              );
            })}
            <p className="text-center text-sm text-muted">
              {lastQuestion ? "Final sonucu" : "Sonraki soru"} {nextIn} sn sonra…
            </p>
          </section>
        ) : null}

        {actionError ? (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {actionError}
          </p>
        ) : null}

        {answering ? (
          <div className="mt-auto flex flex-col gap-2">
            <p className="text-center text-xs text-muted">
              {hasGuessed
                ? opponent?.hasGuessed
                  ? "Sonuçlar hazırlanıyor…"
                  : "Tahminin gönderildi, rakip bekleniyor…"
                : guess
                  ? "Tahminini değiştirmek için haritaya tekrar dokun."
                  : "Haritaya dokunarak tahminini işaretle."}
            </p>
            <button
              type="button"
              disabled={!canGuess}
              onClick={() => guess && void submitGuess(guess)}
              className="min-h-11 rounded-xl bg-accent px-4 font-semibold text-accent-ink hover:bg-accent-strong disabled:bg-surface-2 disabled:text-muted"
            >
              {hasGuessed ? "Tahmin gönderildi" : sending ? "Gönderiliyor…" : "Tahmini onayla"}
            </button>
          </div>
        ) : null}
      </aside>

      <main className="relative min-h-0 flex-1 md:col-span-2">
        <GameMapLoader
          map={view.map}
          difficulty={view.difficulty}
          guess={mapGuess}
          answer={mapAnswer}
          opponentGuess={mapOpponent}
          disabled={!answering || hasGuessed}
          onGuessChange={(point) => setGuessState({ question: questionNumber, point })}
        />
      </main>
    </div>
  );
}
