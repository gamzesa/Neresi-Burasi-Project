// İstek hız sınırı. Sabit pencereli sayaç, istemci (IP) ve uç nokta başına tutulur.
//
// Önemli sınır: sayaçlar işlem belleğinde durur. Vercel'de her sunucusuz örneğin kendi sayacı vardır; yani sınır
// "tek örnek başına" geçerlidir. Gerçek bir saldırıya karşı koruma değil, kazara/basit kötüye kullanımı (parola
// denemesi, e-posta bombalama, döngüye girmiş istemci) ve veritabanı yükünü sınırlamak içindir. Daha sıkı koruma
// için Vercel Firewall'da hız sınırı kuralı ya da paylaşılan bir depo (ör. Upstash) gerekir.

export interface RateLimitRule {
  /** Pencere başına izin verilen istek sayısı. */
  max: number;
  /** Pencere uzunluğu (sn). */
  windowSeconds: number;
}

const MINUTE = 60;

/** Uç nokta yoluna göre sınırlar (istemci başına, dakikada). Listede olmayan yollar `DEFAULT_RULE` alır. */
export const RATE_LIMITS: Record<string, RateLimitRule> = {
  // Parola denemesi ve e-posta bombalamasına karşı sıkı.
  "/api/auth/login": { max: 10, windowSeconds: MINUTE },
  "/api/auth/register": { max: 5, windowSeconds: MINUTE },
  "/api/auth/forgot": { max: 3, windowSeconds: MINUTE },
  "/api/auth/reset": { max: 5, windowSeconds: MINUTE },
  "/api/auth/username": { max: 10, windowSeconds: MINUTE },
  "/api/auth/me": { max: 120, windowSeconds: MINUTE },
  "/api/auth/logout": { max: 30, windowSeconds: MINUTE },
  // Tek oyunculu oyun.
  "/api/game/start": { max: 20, windowSeconds: MINUTE },
  "/api/game/hint": { max: 60, windowSeconds: MINUTE },
  "/api/game/guess": { max: 60, windowSeconds: MINUTE },
  "/api/game/next": { max: 60, windowSeconds: MINUTE },
  "/api/game/claim": { max: 20, windowSeconds: MINUTE },
  "/api/leaderboard": { max: 60, windowSeconds: MINUTE },
  // Çok oyunculu: durum sorgusu saniyede bir gelir; aynı Wi-Fi'daki birkaç cihaz aynı IP'yi paylaşabilir.
  "/api/room/create": { max: 10, windowSeconds: MINUTE },
  "/api/room/join": { max: 20, windowSeconds: MINUTE },
  "/api/room/start": { max: 20, windowSeconds: MINUTE },
  "/api/room/guess": { max: 60, windowSeconds: MINUTE },
  "/api/room/rematch": { max: 30, windowSeconds: MINUTE },
  "/api/room/state": { max: 300, windowSeconds: MINUTE },
};

export const DEFAULT_RULE: RateLimitRule = { max: 60, windowSeconds: MINUTE };

interface Bucket {
  count: number;
  resetAt: number;
}

/** Bellek şişmesin diye bu kadar kayda ulaşınca süresi dolanlar temizlenir. */
const SWEEP_THRESHOLD = 5000;
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  client: string,
  route: string,
  rule: RateLimitRule,
  now: number = Date.now(),
): RateLimitResult {
  if (buckets.size > SWEEP_THRESHOLD) {
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  }

  const key = `${route}|${client}`;
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  existing.count += 1;
  if (existing.count > rule.max) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** İsteği yapanın adresi. Vercel `x-forwarded-for` başlığını kendisi yazar; yerelde başlık yoksa tek istemci sayılır. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "local";
}

/** Yalnızca testler için. */
export function resetRateLimits(): void {
  buckets.clear();
}
