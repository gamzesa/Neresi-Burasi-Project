"use client";

import { useEffect } from "react";

/** Uygulama kurulabilirliği için servis işçisini kaydeder. Yalnızca üretimde çalışır (geliştirmede önbellek karışmasın). */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Kayıt başarısız olursa oyun yine normal çalışır; yalnızca kurulabilirlik etkilenir.
    });
  }, []);
  return null;
}
