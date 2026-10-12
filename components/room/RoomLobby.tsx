"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inputClass, primaryButtonClass } from "@/components/auth/AuthShell";
import { DIFFICULTIES, MAPS, type Difficulty, type GameMap } from "@/lib/game/scoring";
import { ApiError, roomApi } from "@/lib/gameApi";
import { DIFFICULTY_LABELS, MAP_LABELS } from "@/lib/labels";
import { saveRoomToken } from "@/lib/roomSession";
import { NICKNAME_MAX } from "@/lib/validation";

const chipBase = "min-h-11 flex-1 rounded-xl border px-3 text-sm font-semibold transition";
const chipOn = "border-accent bg-accent/15 text-accent";
const chipOff = "border-line bg-surface text-muted hover:text-ink";

/** Arkadaşla oynamak için oda kurma ve koda katılma ekranı. */
export default function RoomLobby({ user }: { user: { username: string } | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [map, setMap] = useState<GameMap>("world");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsNickname = user === null;
  const nicknameInput = needsNickname ? nickname.trim() : undefined;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const joined =
        mode === "create"
          ? await roomApi.create({ map, difficulty, nickname: nicknameInput })
          : await roomApi.join({ code: code.trim().toUpperCase(), nickname: nicknameInput });
      saveRoomToken(joined.code, joined.playerToken);
      router.push(`/oda/${joined.code}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.");
      setBusy(false);
    }
  }

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
          onClick={() => setMode("create")}
          className={`${chipBase} ${mode === "create" ? chipOn : chipOff}`}
        >
          Oda kur
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "join"}
          onClick={() => setMode("join")}
          className={`${chipBase} ${mode === "join" ? chipOn : chipOff}`}
        >
          Koda katıl
        </button>
      </div>

      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        {user === null ? (
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
            Takma adın
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={NICKNAME_MAX}
              placeholder="Örn. Ayşe"
              autoComplete="nickname"
              className={inputClass}
            />
          </label>
        ) : (
          <p className="text-sm text-muted">
            <strong className="text-ink">{user.username}</strong> olarak oynayacaksın.
          </p>
        )}

        {mode === "create" ? (
          <>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-sm font-semibold text-muted">Harita</legend>
              <div className="flex gap-2">
                {MAPS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={map === m}
                    onClick={() => setMap(m)}
                    className={`${chipBase} ${map === m ? chipOn : chipOff}`}
                  >
                    {MAP_LABELS[m]}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-sm font-semibold text-muted">Zorluk</legend>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={difficulty === d}
                    onClick={() => setDifficulty(d)}
                    className={`${chipBase} ${difficulty === d ? chipOn : chipOff}`}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-muted">
            Oda kodu
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={5}
              placeholder="ABCDE"
              autoCapitalize="characters"
              autoComplete="off"
              className={`${inputClass} text-center text-2xl font-bold tracking-[0.3em]`}
            />
          </label>
        )}

        {error ? (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || (needsNickname && nickname.trim().length < 2) || (mode === "join" && code.trim().length !== 5)}
          className={primaryButtonClass}
        >
          {busy ? "Bekle…" : mode === "create" ? "Odayı kur" : "Odaya katıl"}
        </button>
      </form>
    </main>
  );
}
