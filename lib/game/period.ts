export type LeaderboardPeriod = "all" | "week";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Sıralama için dönem başlangıcı (ISO). Tüm zamanlar için null; "bu hafta" son 7 gündür. */
export function periodStart(period: LeaderboardPeriod, now: Date = new Date()): string | null {
  return period === "week" ? new Date(now.getTime() - WEEK_MS).toISOString() : null;
}
