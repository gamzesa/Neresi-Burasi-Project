/** Reklam her bu kadar oyunda bir gösterilir. */
export const AD_EVERY_N_GAMES = 2;

/** Biten oyun sayısına (bu oyun dahil) göre reklam gösterilmeli mi? */
export function shouldShowAd(finishedGames: number): boolean {
  return finishedGames > 0 && finishedGames % AD_EVERY_N_GAMES === 0;
}
