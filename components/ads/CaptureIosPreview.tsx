"use client";

import { useEffect } from "react";
import { isIosContext } from "@/lib/platform";

/** Her sayfada çalışır: adresteki `?ios=1` önizleme bayrağını ilk açılışta kaydeder. Başka bir şey yapmaz. */
export default function CaptureIosPreview() {
  useEffect(() => {
    isIosContext();
  }, []);
  return null;
}
