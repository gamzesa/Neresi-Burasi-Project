import { isNativeIosApp } from "@/lib/platform";

/** Google'ın yayımladığı test reklam kimliği; gerçek kimlik ortam değişkeniyle verilir. */
const TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/4411468910";

/**
 * Tam ekran reklamı iOS uygulamasında gösterir. Web ve Android'de hiçbir şey yapmaz
 * (AdMob eklentisi bile yüklenmez). Reklam yüklenemezse sessizce geçilir; oyun akışı asla bozulmaz.
 */
export async function showNativeInterstitial(): Promise<void> {
  if (!isNativeIosApp()) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.requestTrackingAuthorization();
    await AdMob.initialize();
    const adId = process.env.NEXT_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID || TEST_INTERSTITIAL_ID;
    await AdMob.prepareInterstitial({ adId, isTesting: adId === TEST_INTERSTITIAL_ID });
    await AdMob.showInterstitial();
  } catch {
    // Reklam gösterilemedi; devam.
  }
}
