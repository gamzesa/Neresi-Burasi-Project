import { useEffect } from "react";

/**
 * iOS Safari, iki parmakla sıkıştırma hareketinde haritanın değil sayfanın tamamını yakınlaştırabilir ve
 * sayfa yanlardan kesik kalır. Safari'ye özgü `gesture*` olaylarını engelleyerek bunu önler; haritanın
 * kendi yakınlaştırması (MapLibre) etkilenmez.
 */
export function useDisablePageZoom() {
  useEffect(() => {
    const block = (event: Event) => event.preventDefault();
    const events = ["gesturestart", "gesturechange", "gestureend"] as const;
    for (const name of events) document.addEventListener(name, block);
    return () => {
      for (const name of events) document.removeEventListener(name, block);
    };
  }, []);
}
