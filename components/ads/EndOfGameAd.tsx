"use client";

import { useEffect, useRef, useState } from "react";
import { shouldShowAd } from "@/lib/ads/policy";
import { showNativeInterstitial } from "@/lib/ads/interstitial";
import { isIosContext, isNativeIosApp } from "@/lib/platform";

const COUNT_KEY = "nb_finished_games";
const COUNTED_KEY = "nb_ad_counted";

/** Bu oyunu (gameKey) sayar ve 2 oyunda bir true döner. Aynı oyun iki kez sayılmaz. */
function countGameAndCheck(gameKey: string): boolean {
  try {
    if (window.sessionStorage.getItem(COUNTED_KEY) === gameKey) return false;
    window.sessionStorage.setItem(COUNTED_KEY, gameKey);
    const total = Number(window.localStorage.getItem(COUNT_KEY) ?? "0") + 1;
    window.localStorage.setItem(COUNT_KEY, String(total));
    return shouldShowAd(total);
  } catch {
    return false;
  }
}

/**
 * Oyun bitiş ekranında bir kez bağlanır. iOS uygulamasında 2 oyunda bir tam ekran reklam gösterir.
 * Web ve Android'de hiçbir şey çizmez ve hiçbir şey yapmaz. Önizleme modunda (`?ios=1`) örnek reklam çizer.
 */
export default function EndOfGameAd({ gameKey }: { gameKey: string }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const decision = useRef<boolean | null>(null);

  useEffect(() => {
    if (!isIosContext()) return;
    // Karar bir kez verilir (geliştirmedeki çift çalıştırma oyunu iki kez saymasın).
    decision.current ??= countGameAndCheck(gameKey);
    if (!decision.current) return;
    if (isNativeIosApp()) {
      decision.current = false;
      void showNativeInterstitial();
      return;
    }
    const timer = setTimeout(() => setPreviewOpen(true), 0);
    return () => clearTimeout(timer);
  }, [gameKey]);

  if (!previewOpen) return null;
  return (
    <div role="dialog" aria-label="Reklam önizlemesi" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90 p-6 text-center">
      <p className="text-xs uppercase tracking-widest text-muted">Reklam (önizleme)</p>
      <div className="flex aspect-[9/16] w-full max-w-xs items-center justify-center rounded-xl border border-line bg-surface-2 text-sm text-muted">
        Burada tam ekran reklam çıkar
      </div>
      <button
        type="button"
        onClick={() => setPreviewOpen(false)}
        className="min-h-11 rounded-xl bg-ink px-6 font-semibold text-bg"
      >
        Kapat
      </button>
    </div>
  );
}
