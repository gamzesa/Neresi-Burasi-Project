"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import GameMapLoader from "@/components/map/GameMapLoader";
import type { LatLng } from "@/lib/game/geo";
import type { Difficulty, GameMap } from "@/lib/game/scoring";
import { ApiError, gameApi, type GuessResponse } from "@/lib/gameApi";
import { DIFFICULTY_LABELS, MAP_LABELS } from "@/lib/labels";
import FinishedPanel from "./FinishedPanel";
import HintList from "./HintList";
import ResultPanel from "./ResultPanel";

interface GameScreenProps {
  map: GameMap;
  difficulty: Difficulty;
}

interface QuestionState {
  questionNumber: number;
  totalQuestions: number;
  hints: string[];
  totalHints: number;
}

type Phase = "loading" | "playing" | "submitting" | "result" | "finished" | "error";

function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : "Beklenmeyen bir hata oluştu.";
}

export default function GameScreen({ map, difficulty }: GameScreenProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<QuestionState | null>(null);
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [result, setResult] = useState<GuessResponse | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const startedRef = useRef(false);

  const start = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setGuess(null);
    setResult(null);
    setTotalScore(0);
    try {
      const started = await gameApi.start(map, difficulty);
      setSessionId(started.sessionId);
      setQuestion(started);
      setPhase("playing");
    } catch (e) {
      setError(messageOf(e));
      setPhase("error");
    }
  }, [map, difficulty]);

  useEffect(() => {
    // Geliştirme modunda efekt iki kez çalışır; gereksiz ikinci oturum açılmasın.
    if (startedRef.current) return;
    startedRef.current = true;
    void start();
  }, [start]);

  async function openHint() {
    if (!sessionId || !question) return;
    setBusy(true);
    setError(null);
    try {
      const opened = await gameApi.hint(sessionId);
      setQuestion({ ...question, hints: [...question.hints, opened.hint] });
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  async function confirmGuess() {
    if (!sessionId || !guess) return;
    setPhase("submitting");
    setError(null);
    try {
      const response = await gameApi.guess(sessionId, guess.lat, guess.lng);
      setResult(response);
      setTotalScore(response.totalScore);
      setPhase("result");
    } catch (e) {
      setError(messageOf(e));
      setPhase("playing");
    }
  }

  async function goNext() {
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      const next = await gameApi.next(sessionId);
      if (next.finished) {
        setTotalScore(next.totalScore);
        setPhase("finished");
      } else {
        setQuestion(next);
        setGuess(null);
        setResult(null);
        setPhase("playing");
      }
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  const canGuess = phase === "playing" && guess !== null;
  const mapLocked = phase !== "playing";

  return (
    <div className="flex h-dvh flex-col md:grid md:grid-cols-3">
      <aside className="flex max-h-[50dvh] flex-col gap-4 overflow-y-auto border-b border-slate-200 bg-white p-4 md:col-span-1 md:max-h-none md:border-r md:border-b-0">
        <header className="flex items-center justify-between gap-2">
          <div>
            <Link href="/" className="text-xs text-slate-500 underline">
              Ana sayfa
            </Link>
            <h1 className="text-lg font-bold">
              {MAP_LABELS[map]} · {DIFFICULTY_LABELS[difficulty]}
            </h1>
          </div>
          {question && phase !== "finished" ? (
            <div className="text-right text-sm">
              <p className="font-semibold">
                Soru {question.questionNumber}/{question.totalQuestions}
              </p>
              <p className="text-slate-600">Puan: {totalScore.toLocaleString("tr-TR")}</p>
            </div>
          ) : null}
        </header>

        {phase === "loading" ? <p className="text-slate-600">Oyun hazırlanıyor…</p> : null}

        {phase === "error" ? (
          <div className="flex flex-col gap-2">
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => void start()}
              className="min-h-11 rounded-xl bg-slate-900 px-4 font-semibold text-white"
            >
              Tekrar dene
            </button>
          </div>
        ) : null}

        {question && (phase === "playing" || phase === "submitting" || phase === "result") ? (
          <HintList
            hints={question.hints}
            totalHints={question.totalHints}
            difficulty={difficulty}
            canOpen={phase === "playing"}
            opening={busy && phase === "playing"}
            onOpen={() => void openHint()}
          />
        ) : null}

        {phase === "result" && result ? (
          <ResultPanel
            result={result}
            regionNoun={map === "world" ? "ülke" : "il"}
            busy={busy}
            onNext={() => void goNext()}
          />
        ) : null}

        {phase === "finished" && sessionId ? (
          <FinishedPanel
            sessionId={sessionId}
            map={map}
            totalScore={totalScore}
            onPlayAgain={() => void start()}
          />
        ) : null}

        {error && phase !== "error" ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {phase === "playing" || phase === "submitting" ? (
          <div className="mt-auto flex flex-col gap-2">
            <p className="text-center text-xs text-slate-500">
              {guess ? "Tahminini değiştirmek için haritaya tekrar dokun." : "Haritaya dokunarak tahminini işaretle."}
            </p>
            <button
              type="button"
              disabled={!canGuess}
              onClick={() => void confirmGuess()}
              className="min-h-11 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:bg-slate-300"
            >
              {phase === "submitting" ? "Gönderiliyor…" : "Tahmini onayla"}
            </button>
          </div>
        ) : null}
      </aside>

      <main className="relative min-h-0 flex-1 md:col-span-2">
        <GameMapLoader
          map={map}
          guess={guess}
          answer={result ? { lat: result.answer.lat, lng: result.answer.lng } : null}
          disabled={mapLocked}
          onGuessChange={setGuess}
        />
      </main>
    </div>
  );
}
