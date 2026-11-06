import { useSyncExternalStore } from "react";

/** Önizleme: adrese `?ios=1` eklenince (oturum boyunca) iOS uygulaması gibi davranılır. */
const PREVIEW_KEY = "nb_ios_preview";

interface CapacitorGlobal {
  getPlatform?: () => string;
}

function readPreviewFlag(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get("ios") === "1") {
      window.sessionStorage.setItem(PREVIEW_KEY, "1");
    }
    return window.sessionStorage.getItem(PREVIEW_KEY) === "1";
  } catch {
    return false;
  }
}

/** Gerçek iOS uygulaması (Capacitor kabuğu) mu? Web ve Android'de her zaman false. */
export function isNativeIosApp(): boolean {
  if (typeof window === "undefined") return false;
  const capacitor = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  return capacitor?.getPlatform?.() === "ios";
}

/** iOS uygulaması ya da önizleme modu. */
export function isIosContext(): boolean {
  return isNativeIosApp() || readPreviewFlag();
}

const subscribeNothing = () => () => {};

/** Sunucuda ve ilk çizimde false; yalnızca iOS uygulamasında/önizlemede sonradan true olur. */
export function useIsIosContext(): boolean {
  return useSyncExternalStore(subscribeNothing, isIosContext, () => false);
}
