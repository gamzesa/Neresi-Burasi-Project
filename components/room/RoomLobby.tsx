"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputClass, primaryButtonClass } from "@/components/auth/AuthShell";
import {
  DIFFICULTIES,
  DUEL_DEFAULT_QUESTION_COUNT,
  DUEL_QUESTION_COUNT_OPTIONS,
  DUEL_QUESTION_SECONDS,
  DUEL_SECONDS_OPTIONS,
  MAPS,
  type Difficulty,
  type GameMap,
} from "@/lib/game/scoring";
import { ApiError, roomApi } from "@/lib/gameApi";
import { DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS, MAP_DESCRIPTIONS, MAP_LABELS } from "@/lib/labels";
import {
  isCodeValid,
  isNicknameValid,
  lobbySteps,
  maxGameMinutes,
  type LobbyMode,
  type LobbyStep,
} from "@/lib/roomLobbySteps";
import { saveRoomToken } from "@/lib/roomSession";
import { NICKNAME_MAX } from "@/lib/validation";

const tabBase = "min-h-11 flex-1 rounded-xl border px-3 text-sm font-semibold transition";
const tabOn = "border-accent bg-accent/15 text-accent";
const tabOff = "border-line bg-surface text-muted hover:text-ink";

const optionBase =
  "flex min-h-14 w-full flex-col items-start justify-center rounded-xl border px-4 py-2.5 text-left transition active:scale-[0.99]";
const optionOn = "border-accent bg-accent/15";
const optionOff = "border-line bg-surface hover:border-accent/60";

const STEP_TITLES: Record<LobbyStep, { title: string; hint?: string }> = {
  nickname: { title: "Takma adın ne olsun?", hint: "Arkadaşın seni bu adla görecek." },
  map: { title: "Hangi haritada yarışacaksınız?" },
  difficulty: { title: "Zorluk seviyesi?", hint: "Zorlaştıkça ipucu azalır, puan katsayısı artar." },
  seconds: { title: "Soru başına kaç saniye?", hint: "Süre, ipuçlarının açılma hızını da belirler." },
  count: { title: "Kaç soru olsun?" },
  code: { title: "Oda kodunu gir", hint: "Arkadaşının sana gönderdiği 5 harfli kod." },
  review: { title: "Her şey hazır mı?", hint: "İstediğini değiştirebilirsin." },
};

interface OptionProps {
  selected: boolean;
  label: string;
  description?: string;
  onSelect: () => void;
}

function Option({ selected, label, description, onSelect }: OptionProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`${optionBase} ${selected ? optionOn : optionOff}`}
    >
      <span className={`text-base font-bold ${selected ? "text-accent" : "text-ink"}`}>{label}</span>
      {description ? <span className="text-xs text-muted">{description}</span> : null}
    </button>
  );
}

/** Arkadaşla oynamak için oda kurma ve koda katılma: her adımda tek soru sorulur. */
export default function RoomLobby({ user }: { user: { username: string } | null }) {
  const router = useRouter();
  const isGuest = user === null;
  const [mode, setMode] = useState<LobbyMode>("create");
  const [stepIndex, setStepIndex] = useState(0);
  // Özet ekranından "Değiştir" ile bir adıma dönüldüyse, seçim yapınca doğrudan özete geri dönülür.
  const [editing, setEditing] = useState(false);
  const [map, setMap] = useState<GameMap>("world");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [secondsPerQuestion, setSecondsPerQuestion] = useState<number>(DUEL_QUESTION_SECONDS);
  const [questionCount, setQuestionCount] = useState<number>(DUEL_DEFAULT_QUESTION_COUNT);
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = lobbySteps(mode, isGuest);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const lastIndex = steps.length - 1;
  const nicknameInput = isGuest ? nickname.trim() : undefined;

  function switchMode(next: LobbyMode) {
    setMode(next);
    setStepIndex(0);
    setEditing(false);
    setError(null);
  }

  function goTo(target: LobbyStep) {
    const index = steps.indexOf(target);
    if (index >= 0) setStepIndex(index);
  }

  function next() {
    setError(null);
    if (editing) {
      setEditing(false);
      goTo("review");
      return;
    }
    setStepIndex((i) => Math.min(i + 1, lastIndex));
  }

  function back() {
    setError(null);
    if (editing) {
      setEditing(false);
      goTo("review");
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function edit(target: LobbyStep) {
    setEditing(true);
    goTo(target);
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const joined =
        mode === "create"
          ? await roomApi.create({ map, difficulty, secondsPerQuestion, questionCount, nickname: nicknameInput })
          : await roomApi.join({ code: code.trim().toUpperCase(), nickname: nicknameInput });
      saveRoomToken(joined.code, joined.playerToken);
      router.push(`/oda/${joined.code}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.");
      setBusy(false);
    }
  }

  const { title, hint } = STEP_TITLES[step];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-6 px-6 py-10">
      <header className="text-center">
        <Link href="/" className="text-3xl font-extrabold tracking-tight">
          Neresi <span className="text-accent">Burası?</span>
        </Link>
        <h1 className="mt-6 text-xl font-bold">Arkadaşınla yarış</h1>
        <p className="mt-2 text-sm text-muted">
          Aynı soruları aynı anda görürsünüz; daha yakın ve daha hızlı bilen kazanır.
        </p>
      </header>

      <div className="flex gap-2" role="tablist" aria-label="Oda işlemi">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "create"}
          onClick={() => switchMode("create")}
          className={`${tabBase} ${mode === "create" ? tabOn : tabOff}`}
        >
          Oda kur
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "join"}
          onClick={() => switchMode("join")}
          className={`${tabBase} ${mode === "join" ? tabOn : tabOff}`}
        >
          Koda katıl
        </button>
      </div>

      <section aria-live="polite" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted">
            {stepIndex > 0 || editing ? (
              <button type="button" onClick={back} className="min-h-11 pr-3 font-semibold underline hover:text-ink">
                Geri
              </button>
            ) : (
              <span className="min-h-11 leading-[2.75rem]">
                {!isGuest ? (
                  <>
                    <strong className="text-ink">{user.username}</strong> olarak oynayacaksın
                  </>
                ) : null}
              </span>
            )}
            <span>
              Adım {Math.min(stepIndex + 1, steps.length)} / {steps.length}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent transition-all duration-200"
              style={{ width: `${((Math.min(stepIndex, lastIndex) + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
        </div>

        {step === "nickname" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isNicknameValid(nickname)) next();
            }}
            className="flex flex-col gap-3"
          >
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={NICKNAME_MAX}
              placeholder="Örn. Ayşe"
              autoComplete="nickname"
              aria-label="Takma adın"
              autoFocus
              className={inputClass}
            />
            <button type="submit" disabled={!isNicknameValid(nickname)} className={primaryButtonClass}>
              İleri
            </button>
          </form>
        ) : null}

        {step === "map" ? (
          <div className="flex flex-col gap-2">
            {MAPS.map((m) => (
              <Option
                key={m}
                selected={map === m}
                label={MAP_LABELS[m]}
                description={MAP_DESCRIPTIONS[m]}
                onSelect={() => {
                  setMap(m);
                  next();
                }}
              />
            ))}
          </div>
        ) : null}

        {step === "difficulty" ? (
          <div className="flex flex-col gap-2">
            {DIFFICULTIES.map((d) => (
              <Option
                key={d}
                selected={difficulty === d}
                label={DIFFICULTY_LABELS[d]}
                description={DIFFICULTY_DESCRIPTIONS[d]}
                onSelect={() => {
                  setDifficulty(d);
                  next();
                }}
              />
            ))}
          </div>
        ) : null}

        {step === "seconds" ? (
          <div className="flex flex-col gap-2">
            {DUEL_SECONDS_OPTIONS.map((seconds) => (
              <Option
                key={seconds}
                selected={secondsPerQuestion === seconds}
                label={`${seconds} saniye`}
                onSelect={() => {
                  setSecondsPerQuestion(seconds);
                  next();
                }}
              />
            ))}
          </div>
        ) : null}

        {step === "count" ? (
          <div className="flex flex-col gap-2">
            {DUEL_QUESTION_COUNT_OPTIONS.map((count) => (
              <Option
                key={count}
                selected={questionCount === count}
                label={`${count} soru`}
                description={`En fazla yaklaşık ${maxGameMinutes(secondsPerQuestion, count)} dakika sürer`}
                onSelect={() => {
                  setQuestionCount(count);
                  next();
                }}
              />
            ))}
          </div>
        ) : null}

        {step === "code" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isCodeValid(code)) void submit();
            }}
            className="flex flex-col gap-3"
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={5}
              placeholder="ABCDE"
              aria-label="Oda kodu"
              autoCapitalize="characters"
              autoComplete="off"
              autoFocus
              className={`${inputClass} text-center text-2xl font-bold tracking-[0.3em]`}
            />
            <button type="submit" disabled={busy || !isCodeValid(code)} className={primaryButtonClass}>
              {busy ? "Bekle…" : "Odaya katıl"}
            </button>
          </form>
        ) : null}

        {step === "review" ? (
          <div className="flex flex-col gap-3">
            <dl className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
              {[
                ...(isGuest ? [{ key: "nickname" as const, label: "Takma ad", value: nickname.trim() }] : []),
                { key: "map" as const, label: "Harita", value: MAP_LABELS[map] },
                { key: "difficulty" as const, label: "Zorluk", value: DIFFICULTY_LABELS[difficulty] },
                { key: "seconds" as const, label: "Soru başına süre", value: `${secondsPerQuestion} saniye` },
                { key: "count" as const, label: "Soru sayısı", value: `${questionCount} soru` },
              ].map((row) => (
                <div key={row.key} className="flex min-h-12 items-center justify-between gap-3 px-4 py-2">
                  <div>
                    <dt className="text-xs text-muted">{row.label}</dt>
                    <dd className="text-sm font-bold">{row.value}</dd>
                  </div>
                  <button
                    type="button"
                    onClick={() => edit(row.key)}
                    className="min-h-11 px-2 text-sm font-semibold text-accent underline"
                  >
                    Değiştir
                  </button>
                </div>
              ))}
            </dl>
            <p className="text-center text-xs text-muted">
              Oyun en fazla yaklaşık {maxGameMinutes(secondsPerQuestion, questionCount)} dakika sürer.
            </p>
            <button type="button" disabled={busy} onClick={() => void submit()} className={primaryButtonClass}>
              {busy ? "Bekle…" : "Odayı kur"}
            </button>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
