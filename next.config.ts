import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sunucudaki bölge kontrolü bu dosyaları çalışma zamanında okur; yayın paketine dahil edilmeleri gerekir.
  outputFileTracingIncludes: {
    "/api/game/guess": ["./data/geo/**/*"],
  },
};

export default nextConfig;
