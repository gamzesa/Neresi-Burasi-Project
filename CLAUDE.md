# Neresi Burası?

Verilen ipuçlarıyla dünya veya Türkiye haritası üzerinde bir konumu bulmaya çalışılan web tabanlı bir coğrafya oyunu. İleride mobil uygulamaya dönüştürülecek; bu yüzden tüm kararlar mobil uyumluluk göz önünde tutularak alınır.

Arayüz dili Türkçedir. Kod (değişken, fonksiyon, dosya adları) İngilizce yazılır; kullanıcıya görünen tüm metinler Türkçe olur.

## Teknoloji yığını

| Katman | Teknoloji | Neden |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Hem arayüz hem API tek projede; Vercel'de sıfır ayarla yayın |
| Harita | MapLibre GL JS | Açık kaynak, ücretsiz, mobilde akıcı zoom/kaydırma, katmanları (sınır, etiket) tamamen biz kontrol ederiz |
| Coğrafi hesaplar | Turf.js | Mesafe (haversine) ve "nokta hangi ülkenin/ilin içinde" kontrolü |
| Veritabanı | Supabase (PostgreSQL) | Sorular, oyun oturumları ve sıralama tablosu |
| Stil | Tailwind CSS | Hızlı, mobil öncelikli arayüz |
| Test | Vitest | Puanlama ve coğrafi hesap fonksiyonları için birim testleri |
| Barındırma | Vercel | Next.js için doğal ortam |
| Mobil (ileride) | Capacitor | Aynı web kodunu iOS/Android uygulamasına sarar |

### Harita verisi
- **Dünya:** Natural Earth ülke sınırları (kamu malı), GeoJSON. Ülke adları Türkçe etiketlenir. Kıta adları ayrı bir nokta GeoJSON katmanında tutulur.
- **Türkiye:** 81 il sınırları GeoJSON; kaynak Natural Earth Admin-1 (1:10m, kamu malı). **Etiket katmanı yoktur**, yalnızca il sınırları çizilir.
- Altlık (tile) harita kullanılmaz; stil yalnızca arka plan + GeoJSON dolgu/çizgi (+ dünya için etiket) katmanlarından oluşur. Bu sayede ücretli harita servisine gerek kalmaz ve etiketler tamamen kontrol altında olur.
- Etiket fontları (glyph) kendi sunucumuzda barındırılır ve Türkçe karakterleri (ç, ğ, ı, İ, ö, ş, ü) desteklemelidir.
- Dosyalar `public/geo/` altında durur ve boyutları küçük tutulur (gerekirse mapshaper ile sadeleştirilir).
- Sunucudaki bölge kontrolü (nokta-çokgen) için sadeleştirilmemiş sınırlar `data/geo/*.full.geojson` dosyalarında tutulur ve istemciye gönderilmez; sadeleştirilmiş `public/geo/` dosyaları yalnızca çizim içindir. İkisi de `scripts/build-geo.mjs` ile üretilir.

## Oyun kuralları

### Akış
1. Ana sayfa: kullanıcı harita seçer (Dünya / Türkiye).
2. Zorluk seçer (Kolay / Orta / Zor). Takma ad başta sorulmaz.
3. Oyun 5 sorudan oluşur. Her soruda ilk ipucu otomatik gösterilir; kullanıcı isterse sonraki ipuçlarını açar.
4. Kullanıcı haritaya dokunarak/tıklayarak tahminini yapar ve onaylar.
5. Sonuç ekranı: doğru konum, tahmin ile arasındaki çizgi, mesafe ve kazanılan puan gösterilir.
6. Oyun sonunda toplam puan gösterilir; oyuncu isterse takma adını girerek skorunu sıralama tablosuna ekler (zorunlu değil, hesap gerekmez). Ad girmeyen oyuncunun skoru sıralamaya girmez.

### İpucu sayısı
| Zorluk | Toplam ipucu |
|---|---|
| Kolay | 4 |
| Orta | 3 |
| Zor | 2 |

İpuçları genelden özele doğru sıralanır (ilk ipucu en belirsiz olanı).

### İpucu kuralları
- **Dünya haritası:** Ülke adları haritada yazdığı için ipuçlarında **cevabın ülke adı asla geçmez**. Başkent adı, ülkeye ait sıfat ("X'li", "X dili") gibi ülkeyi doğrudan ele veren ifadeler de kullanılmaz.
- **Türkiye haritası:** Haritada isim yoktur; ipuçları bölge, coğrafi özellik, tarih, kültür, yemek vb. üzerinden verilir. **İl adı ipucunda geçmez; ilçe adı geçebilir.**

### Puanlama
Her soru için:

```
mesafePuanı   = 1000 * e^(-mesafe_km / ölçek)
bölgeBonusu   = tahmin doğru ülke/il içindeyse 500, değilse 0
soruPuanı     = round((mesafePuanı + bölgeBonusu) * ipucuKatsayısı * zorlukKatsayısı)
```

- **Temel kural:** Tahmin doğru yere ne kadar yakınsa puan o kadar yüksektir. Tam isabette mesafe puanı 1000'dir, uzaklaştıkça sıfıra doğru azalır.
- **Ölçek:** Dünya = 1500 km, Türkiye = 75 km

Örnek mesafe puanları (bonus ve katsayılar hariç):

| Dünya mesafe | Puan | Türkiye mesafe | Puan |
|---|---|---|---|
| 0 km | 1000 | 0 km | 1000 |
| 100 km | 936 | 10 km | 875 |
| 500 km | 717 | 50 km | 513 |
| 1500 km | 368 | 100 km | 264 |
| 3000 km | 135 | 200 km | 69 |
- **Bölge bonusu:** Dünya'da doğru ülke, Türkiye'de doğru il
- **İpucu katsayısı** (açılan ipucu sayısına göre; ilk ipucu dahil):

| Zorluk | 1 ipucu | 2 ipucu | 3 ipucu | 4 ipucu |
|---|---|---|---|---|
| Kolay | 1.00 | 0.80 | 0.60 | 0.40 |
| Orta | 1.00 | 0.70 | 0.45 | – |
| Zor | 1.00 | 0.60 | – | – |

- **Zorluk katsayısı:** Kolay 1.0, Orta 1.5, Zor 2.0

Tüm sabitler tek dosyada (`lib/game/scoring.ts`) tutulur; başka yerde sabit sayı yazılmaz. Puanlama fonksiyonu saf (pure) olmalı ve testleri yazılmalıdır.

### Hile önleme
- Doğru cevabın koordinatları ve bölge kodu **tahmin yapılmadan önce istemciye asla gönderilmez**.
- Henüz açılmamış ipuçları istemciye gönderilmez; her ipucu ayrı istekle sunucudan alınır ve sunucu kaç ipucu açıldığını kaydeder.
- Mesafe, bölge kontrolü ve puan **yalnızca sunucuda** hesaplanır. İstemcinin gönderdiği puana asla güvenilmez.
- Oturum kimliği olmadan veya bitmiş bir oturuma tahmin gönderilemez; aynı soruya ikinci tahmin kabul edilmez.

## Sıralama (rank) sistemi
- Kullanıcı hesabı yok; takma ad ile oynanır, ad oyun sonunda isteğe bağlı sorulur (2–20 karakter, boşluk kırpılır, küfür filtresi uygulanır).
- Sıralama harita bazlıdır (Dünya / Türkiye), zorluğa göre filtrelenebilir.
- İlk 100 gösterilir. Kullanıcının kendi derecesi, ilk 100'de olmasa da gösterilir.
- Zaman filtresi: Tüm zamanlar / Bu hafta.

## Veritabanı şeması (Supabase)

```
questions
  id uuid pk
  map text            -- 'world' | 'turkey'
  difficulty text     -- 'easy' | 'medium' | 'hard'
  answer_lat double
  answer_lng double
  region_code text    -- ISO ülke kodu (dünya) veya il plaka kodu (Türkiye)
  answer_label text   -- sonuç ekranında gösterilecek ad
  hints text[]        -- uzunluğu zorluğun ipucu sayısına eşit olmalı
  is_active boolean

game_sessions
  id uuid pk
  nickname text
  map text
  difficulty text
  question_ids uuid[]
  current_index int
  total_score int
  status text         -- 'active' | 'finished'
  created_at, finished_at timestamptz

guesses
  id uuid pk
  session_id uuid fk
  question_id uuid fk
  hints_opened int
  guess_lat, guess_lng double
  distance_km double
  region_hit boolean
  score int
  unique (session_id, question_id)
```

- Sıralama bir view veya sorgu ile `game_sessions` (status = 'finished') üzerinden üretilir.
- Row Level Security açık olur; istemci tablolara doğrudan yazamaz. Tüm yazmalar Next.js API route'ları üzerinden, sunucudaki service role anahtarıyla yapılır.
- Şema değişiklikleri `supabase/migrations/` altında migration dosyası olarak yazılır.

## API
Mobil uygulama da aynı uç noktaları kullanacağı için oyun mantığı API'de, arayüz istemcide durur.

| Uç nokta | İş |
|---|---|
| `POST /api/game/start` | Harita, zorluk alır; oturum açar, rastgele 5 soru seçer, ilk soruyu ve ilk ipucunu döner |
| `POST /api/game/hint` | Sıradaki ipucunu döner, açılan ipucu sayısını artırır |
| `POST /api/game/guess` | Koordinatı alır; mesafe, bölge, puan hesaplar; doğru konumu ve sonucu döner |
| `POST /api/game/next` | Sonraki soruya geçer veya oyunu bitirir |
| `GET /api/leaderboard` | `map`, `difficulty`, `period` parametreleriyle sıralama |

Tüm girdiler Zod ile doğrulanır.

## Klasör yapısı

```
app/
  page.tsx                  -- harita seçimi
  play/[map]/page.tsx       -- oyun ekranı
  leaderboard/page.tsx
  api/game/...              -- yukarıdaki uç noktalar
  api/leaderboard/route.ts
components/
  map/GameMap.tsx           -- MapLibre sarmalayıcı (client component)
  game/                     -- ipucu kartı, sonuç ekranı, skor göstergesi
lib/
  game/scoring.ts           -- puanlama sabitleri ve fonksiyonları
  game/geo.ts               -- mesafe, nokta-çokgen kontrolü (Turf)
  supabase/                 -- sunucu ve istemci bağlantıları
  validation.ts             -- Zod şemaları
public/geo/                 -- GeoJSON ve font dosyaları
supabase/migrations/
data/questions/             -- soru tohum (seed) dosyaları
tests/
```

## Komutlar

```
npm run dev         # geliştirme sunucusu
npm run build       # üretim derlemesi
npm run lint
npm run typecheck   # tsc --noEmit
npm run test        # Vitest
```

Bir değişiklik bitmiş sayılmadan önce `lint`, `typecheck` ve `test` geçmelidir.

## Ortam değişkenleri

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # yalnızca sunucuda, asla istemciye sızmamalı
```

`.env.local` git'e eklenmez; `.env.example` güncel tutulur.

## Kodlama kuralları
- TypeScript `strict` modda; `any` kullanılmaz.
- Harita bileşeni yalnızca istemcide çalışır (`"use client"`, gerekirse dinamik import ile SSR kapatılır).
- Mobil öncelikli tasarım: dokunmatik hedefler en az 44px, tahmin bir dokunuşla işaretlenir, ayrı "Tahmini onayla" butonuyla gönderilir (yanlışlıkla dokunmaya karşı).
- Tarayıcıya özgü API'lere (ör. `window`) bağımlılık bileşenlerde izole tutulur ki Capacitor'a geçiş kolay olsun.
- Soru eklerken: ipucu sayısı zorlukla eşleşmeli, dünya sorularında ülke adı geçmemeli, `region_code` GeoJSON'daki kodla birebir aynı olmalı.

## Yol haritası
1. **MVP:** Harita seçimi, Dünya haritası, tek zorluk, puanlama, sıralama
2. Türkiye haritası, üç zorluk seviyesi
3. Soru havuzu: ilk sürümde her harita için 30 soru (10 kolay / 10 orta / 10 zor), Claude yazar; sonra büyütülür (hedef: harita × zorluk başına 50)
4. Capacitor ile iOS/Android paketleri

## Açık kararlar
- İleride kullanıcı hesabı (Supabase Auth) eklenecek mi? (İlk sürümde yok, sonra netleşecek.)
