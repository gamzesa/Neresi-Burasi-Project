"use client";

import dynamic from "next/dynamic";

/** MapLibre yalnızca istemcide çalışır; SSR kapalı dinamik içe aktarma. */
const GameMapLoader = dynamic(() => import("./GameMap"), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-muted">Harita yükleniyor…</div>,
});

export default GameMapLoader;
