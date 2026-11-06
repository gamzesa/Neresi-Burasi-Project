import type { CapacitorConfig } from "@capacitor/cli";

// API route'ları sunucuda çalıştığı için iOS kabuğu canlı siteyi yükler (Android TWA ile aynı mantık).
const config: CapacitorConfig = {
  appId: "com.neresiburasi.app",
  appName: "Neresi Burası?",
  webDir: "public",
  server: {
    url: "https://neresi-burasi-project.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
