import type { MetadataRoute } from "next";

/** Uygulama olarak kurulabilirlik (PWA) ve Android mağaza paketi (TWA) için web uygulama bildirimi. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Neresi Burası?",
    short_name: "Neresi Burası?",
    description: "İpuçlarını oku, haritada yeri bul. Dünya ve Türkiye coğrafya oyunu.",
    lang: "tr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#050b16",
    theme_color: "#050b16",
    categories: ["games", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
