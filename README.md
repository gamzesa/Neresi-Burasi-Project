# Neresi Burası?

Verilen ipuçlarıyla **dünya** veya **Türkiye** haritası üzerinde bir konumu bulmaya çalıştığın web tabanlı bir coğrafya oyunu. Her oyun 5 sorudan oluşur; ipuçlarını oku, haritaya dokunarak tahminini işaretle, ne kadar yakınsan o kadar puan kazan.

Arayüz Türkçedir. İleride mobil uygulamaya (iOS/Android) dönüştürülecek şekilde, mobil öncelikli tasarlanmıştır.

## Nasıl oynanır

1. Ana sayfada **Dünya** veya **Türkiye** haritasını seç, sonra **Kolay / Orta / Zor** zorluğunu seç. Hesap açmadan da oynayabilirsin.
2. Her soruda ilk ipucu otomatik gösterilir. İstersen sonraki ipuçlarını aç; ama her ipucu puanını düşürür.
3. Haritaya dokunarak tahminini işaretle, ardından **Tahmini onayla** düğmesine bas.
4. Sonuç ekranında doğru konumu, aranızdaki mesafeyi ve kazandığın puanı gör.
5. 5 soru sonunda toplam puanın gösterilir. **Hesabı olan oyuncuların skoru otomatik sıralamaya girer.** Misafir olarak oynadıysan, oyun sonunda kayıt olursan o oyunun skoru hesabına eklenir.

### İpuçları

| Zorluk | Toplam ipucu | Zorluk katsayısı |
|---|---|---|
| Kolay | 4 | ×1,0 |
| Orta | 3 | ×1,5 |
| Zor | 2 | ×2,0 |

İpuçları genelden özele doğru sıralanır. Dünya haritasında ipuçlarında ülkenin adı, başkenti ya da ülkeyi doğrudan ele veren sıfatlar geçmez; Türkiye haritasında il adı geçmez (ilçe adı geçebilir).

### Puanlama

```
mesafePuanı = 1000 × e^(−mesafe_km / ölçek)       ölçek: Dünya 1500 km, Türkiye 75 km
bölgeBonusu = tahmin doğru ülke/il içindeyse 500, değilse 0
soruPuanı   = yuvarla((mesafePuanı + bölgeBonusu) × ipucuKatsayısı × zorlukKatsayısı)
```

İpucu katsayıları (açılan ipucu sayısına göre; ilk ipucu dahil):

| Zorluk | 1 ipucu | 2 ipucu | 3 ipucu | 4 ipucu |
|---|---|---|---|---|
| Kolay | 1,00 | 0,80 | 0,60 | 0,40 |
| Orta | 1,00 | 0,70 | 0,45 | – |
| Zor | 1,00 | 0,60 | – | – |

Tüm sabitler tek dosyada tutulur: [`lib/game/scoring.ts`](lib/game/scoring.ts).

## Teknoloji

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript (strict) |
| Harita | MapLibre GL JS (altlık harita yok; yalnızca kendi GeoJSON katmanlarımız) |
| Coğrafi hesaplar | Turf.js |
| Veritabanı ve kimlik doğrulama | Supabase (PostgreSQL + Auth) |
| Stil | Tailwind CSS 4 |
| Doğrulama | Zod |
| Test | Vitest |
| Barındırma (planlanan) | Vercel |
| Mobil (planlanan) | Capacitor |

Harita verisi [Natural Earth](https://www.naturalearthdata.com/) (kamu malı) kaynaklıdır: dünya için ülke sınırları, Türkiye için 81 il sınırı. Etiket fontları (Noto Sans) kendi sunucumuzdan verilir ve Türkçe karakterleri destekler.

## Kurulum

Gereksinimler: Node.js 24 ve bir [Supabase](https://supabase.com) projesi.

```bash
npm install
cp .env.example .env     # ardından .env dosyasını doldur
npm run dev              # http://localhost:3000
```

`.env` dosyası şu değişkenleri ister (Supabase paneli → Project Settings → API Keys):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

> `SUPABASE_SERVICE_ROLE_KEY` veritabanının tüm korumasını aşar. Yalnızca sunucuda kullanılır; asla istemciye sızdırma, kimseyle paylaşma ve git'e ekleme (`.env` dosyası zaten `.gitignore` içindedir).

### Veritabanını hazırlama

1. [`supabase/migrations/`](supabase/migrations) altındaki migration dosyalarını sırayla Supabase projene uygula (Supabase CLI ile ya da panelden SQL Editor ile).
2. Soruları yükle:

```bash
npm run seed:questions
```

Betik tekrar çalıştırılabilir; aynı soruyu iki kez eklemez.

## Komutlar

| Komut | İş |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run start` | Üretim sunucusu (önce `build`) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript denetimi |
| `npm run test` | Vitest birim testleri |
| `npm run seed:questions` | Soruları Supabase'e yükler |

Bir değişiklik bitmiş sayılmadan önce `lint`, `typecheck` ve `test` geçmelidir.

Ek betikler ([`scripts/`](scripts)):

- `node scripts/smoke-api.mjs [adres]`: çalışan sunucuya karşı uçtan uca API denemesi (kayıt, giriş, oyun, hile senaryoları, sıralama). Deneme hesapları bırakır; sonra silinmelidir.
- `node scripts/build-geo.mjs <hamVeriKlasörü>`: Natural Earth ham verisinden harita dosyalarını üretir.
- `node scripts/build-hero-map.mjs`: ana sayfadaki şeffaf dünya haritası silüetini üretir.

## Proje yapısı

```
app/                    Sayfalar ve API uç noktaları (App Router)
  page.tsx              Harita ve zorluk seçimi
  play/[map]/           Oyun ekranı
  leaderboard/          Sıralama
  giris/, kayit/        Giriş ve kayıt
  api/game/             start, hint, guess, next, claim
  api/auth/             register, login, logout, me
  api/leaderboard/      Sıralama
components/             Arayüz bileşenleri (harita, oyun, hesap, sıralama)
lib/
  game/                 Puanlama, mesafe/bölge hesabı, oyun kuralları, soru doğrulama
  auth/                 Hesap işlemleri ve oturum okuma (yalnızca sunucuda)
  supabase/             Sunucu ve istemci bağlantıları
  validation.ts         Zod şemaları
data/
  questions/            Soru dosyaları (world.json, turkey.json)
  geo/                  Sunucudaki bölge kontrolü için tam çözünürlüklü sınırlar
public/geo/             Haritada çizilen sadeleştirilmiş GeoJSON ve fontlar
supabase/migrations/    Veritabanı şeması
tests/                  Birim testleri
```

Proje kuralları, oyun kuralları ve kararların ayrıntıları için [`CLAUDE.md`](CLAUDE.md) dosyasına bak.

## API

Mobil uygulama da aynı uç noktaları kullanacağı için oyun mantığı API'de, arayüz istemcide durur.

| Uç nokta | İş |
|---|---|
| `POST /api/game/start` | Oturum açar, rastgele 5 soru seçer; ilk soruyu ve ilk ipucunu döner |
| `POST /api/game/hint` | Sıradaki ipucunu döner |
| `POST /api/game/guess` | Tahmini alır; mesafe, bölge ve puanı hesaplar; doğru konumu döner |
| `POST /api/game/next` | Sonraki soruya geçer veya oyunu bitirir |
| `POST /api/game/claim` | Misafir olarak biten oyunu girişli kullanıcının hesabına bağlar |
| `GET /api/leaderboard` | `map`, `difficulty`, `period` ile sıralama |
| `POST /api/auth/register`, `login`, `logout` · `GET /api/auth/me` | Hesap işlemleri |

Tüm girdiler Zod ile doğrulanır.

## Hile önleme

- Doğru cevabın koordinatları ve bölge kodu, **tahmin yapılmadan önce istemciye hiç gönderilmez**.
- Açılmamış ipuçları istemciye gönderilmez; her ipucu ayrı istekle alınır ve açılan sayı sunucuda tutulur.
- Mesafe, bölge kontrolü ve puan **yalnızca sunucuda** hesaplanır; istemcinin gönderdiği puana güvenilmez.
- Bitmiş bir oturuma ya da aynı soruya ikinci kez tahmin gönderilemez.
- Veritabanında Row Level Security açıktır; istemci tablolara doğrudan erişemez, tüm okuma ve yazmalar sunucudaki API'den yapılır.

## Hesaplar ve sıralama

- Supabase Auth ile e-posta + şifre. Kayıt olurken bir **kullanıcı adı** seçilir (3–20 karakter; harf, rakam, alt çizgi; benzersiz; küfür filtresinden geçer). Sıralamada bu ad görünür.
- Sıralamaya yalnızca hesabı olanların skorları girer; her kullanıcının filtreye uyan **en iyi** oyunu sayılır. Harita (Dünya / Türkiye), zorluk ve dönem (tüm zamanlar / son 7 gün) filtrelenebilir. İlk 100 gösterilir; girişli kullanıcının kendi derecesi ilk 100'de olmasa da gösterilir.
- Hesapsız (misafir) oynamak serbesttir.

## Yol haritası

- [x] Dünya ve Türkiye haritaları, üç zorluk, puanlama
- [x] Soru havuzu: harita ve zorluk başına 25 soru (toplam 150)
- [x] Hesaplar ve sıralama
- [ ] Vercel'e yayın, hız sınırı, e-posta doğrulaması ve şifre sıfırlama, gizlilik (KVKK) metni
- [ ] Soru havuzunu harita ve zorluk başına 50'ye çıkarma
- [ ] Capacitor ile iOS/Android paketleri

## Katkı

Soru eklerken: ipucu sayısı zorlukla eşleşmeli; dünya sorularında ülke adı (ve başkent/sıfat) geçmemeli; `region_code` GeoJSON'daki kodla birebir aynı olmalı; cevap koordinatı o ülkenin ya da ilin içinde olmalı; her ülke/il bir haritada yalnızca bir kez sorulabilir. Bu kuralların hepsi `npm run test` içinde otomatik denetlenir.

## Lisans ve veri kaynakları

Harita sınırları: Natural Earth (kamu malı). Harita etiket fontu: Noto Sans (SIL Open Font License).
