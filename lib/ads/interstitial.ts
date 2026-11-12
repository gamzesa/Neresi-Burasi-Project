import { isNativeIosApp } from "@/lib/platform";

/** Google'ın yayımladığı test reklam kimliği; `NEXT_PUBLIC_ADMOB_TEST=true` iken kullanılır. */
const TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/4411468910";
/** iOS uygulamasının oyun sonu reklam birimi (AdMob; herkese açık bir kimliktir). */
const IOS_INTERSTITIAL_ID = "ca-app-pub-9146906439631630/9672228389";

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
    // Kendi cihazında denerken gerçek reklama dokunma (AdMob geçersiz tıklama sayar); test modunu aç.
    const useTestAds = process.env.NEXT_PUBLIC_ADMOB_TEST === "true";
    const adId = useTestAds ? TEST_INTERSTITIAL_ID : process.env.NEXT_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID || IOS_INTERSTITIAL_ID;
    await AdMob.prepareInterstitial({ adId, isTesting: useTestAds });
    await AdMob.showInterstitial();
  } catch {
    // Reklam gösterilemedi; devam.
  }
}
