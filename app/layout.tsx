import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neresi Burası?",
  description: "İpuçlarından konumu bul: Dünya ve Türkiye coğrafya oyunu.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Oyun ekranı tam ekran bir harita olduğu için sayfanın kendiliğinden yakınlaşması engellenir
  // (haritanın kendi yakınlaştırması çalışmaya devam eder).
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050b16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-dvh bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
