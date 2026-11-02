# Google Play Console: form cevapları

Play Console → Uygulaman → **Politika → Uygulama içeriği**. Soru metinleri zaman zaman değişir; aşağıdakiler uygulamanın **gerçek** davranışına göre hazırlandı. Bir soruyu anlamazsan ya da farklı ifade ederse ekran görüntüsünü paylaş, birlikte bakarız.

## 1) Gizlilik politikası
`https://neresi-burasi-project.vercel.app/gizlilik`

## 2) Veri güvenliği

### Genel sorular
| Soru | Cevap |
|---|---|
| Uygulama herhangi bir kullanıcı verisi topluyor mu / paylaşıyor mu? | **Evet, topluyor** |
| Toplanan tüm veriler aktarım sırasında şifreleniyor mu? | **Evet** (her şey HTTPS üzerinden) |
| Kullanıcılar verilerinin silinmesini isteyebiliyor mu? | **Evet** |
| Hesap silme adresi | `https://neresi-burasi-project.vercel.app/hesabi-sil` |
| Hesap oluşturma yöntemi | Kullanıcı adı + e-posta + şifre; ayrıca Google ile giriş. **Hesap isteğe bağlıdır** (misafir olarak da oynanır). |
| Veri üçüncü taraflarla **paylaşılıyor** mu? | **Hayır.** (Verileri barındıran Supabase ve Vercel "hizmet sağlayıcı"dır; Google'ın tanımına göre bunlarla paylaşım "paylaşma" sayılmaz.) |

### Toplanan veri türleri

| Kategori → Tür | Toplanıyor mu | Zorunlu mu | Amaç |
|---|---|---|---|
| Kişisel bilgiler → **E-posta adresi** | Evet (yalnızca hesap açanda) | **İsteğe bağlı** | Hesap yönetimi, uygulama işlevselliği |
| Kişisel bilgiler → **Ad** (takma ad / kullanıcı adı, Google ile girişte Google adı) | Evet | **İsteğe bağlı** | Uygulama işlevselliği (rakibe ve sıralamada gösterilir), hesap yönetimi |
| Kişisel bilgiler → **Kullanıcı kimlikleri** (hesap kimliği, kullanıcı adı) | Evet (yalnızca hesap açanda) | **İsteğe bağlı** | Hesap yönetimi, uygulama işlevselliği, sahtekârlığı önleme/güvenlik |
| Uygulama etkinliği → **Uygulama içi etkileşimler** (tahminler, puanlar, oyun geçmişi) | Evet | Zorunlu (oyun çalışması için) | Uygulama işlevselliği |

### Toplanmayan türler (hepsine "Hayır")
Konum (uygulama cihaz konumunu istemez/kullanmaz; haritada işaretlenen nokta kullanıcı seçimidir), finansal bilgi, sağlık, mesajlar, fotoğraf/video, ses, dosyalar, kişiler, takvim, web tarama geçmişi, cihaz veya diğer kimlikler, çökme günlükleri/tanılama (kendimiz toplamıyoruz).

### IP adresi hakkında not
IP adresi hız sınırı için yalnızca sunucu belleğinde, geçici olarak kullanılır ve kalıcı saklanmaz; barındırma hizmetinin (Vercel) kısa süreli istek günlükleri olabilir. Google'ın "geçici işleme" kuralına göre bu, beyan gerektirmeyen bir kullanımdır. Daha temkinli olmak istersen "Cihaz veya diğer kimlikler" altında IP'yi güvenlik amacıyla beyan edebilirsin; fazla beyan etmek, eksik beyan etmekten daha güvenlidir.

## 3) Hesap silme (Play'in ayrı sorusu)
- Uygulama içi silme yolu: **Ana sayfa → Hesabımı sil** (`/hesabi-sil`), kullanıcı adını yazarak onaylanır.
- Web adresi: `https://neresi-burasi-project.vercel.app/hesabi-sil`
- Neler silinir: e-posta, kullanıcı adı ve hesap. Geçmiş oyun kayıtları kimliksiz kalır ve sıralamadan düşer.
- Alternatif: `neresiburasiapp@gmail.com` adresine yazarak silme talebi.

## 4) İçerik derecelendirmesi (IARC anketi)
Kategori: **Oyun** (Bilgi yarışması).

| Soru | Cevap |
|---|---|
| Şiddet, kan, korku | **Hayır** |
| Cinsel içerik, çıplaklık | **Hayır** |
| Küfür / kaba dil | **Hayır** (uygulama içeriği yok; kullanıcı adı ve takma adlar küfür filtresinden geçer) |
| Uyuşturucu, alkol, tütün | **Hayır** |
| Kumar / simüle kumar | **Hayır** |
| Kullanıcılar birbiriyle sohbet / içerik paylaşabiliyor mu? | **Hayır** (mesajlaşma yok; çok oyunculuda yalnızca takma ad görünür) |
| Kullanıcı konumu paylaşılıyor mu? | **Hayır** |
| Dijital satın alma / reklam | **Hayır** |

Beklenen sonuç: tüm yaşlar için uygun bir derece (3+/PEGI 3 ya da muadili).

## 5) Hedef kitle ve içerik
| Soru | Cevap |
|---|---|
| Hedef yaş grubu | **13–15, 16–17, 18+** seç. **13 yaş altını seçme** (seçersen "Aileler politikası" kuralları devreye girer: ebeveyn onayı, ek denetimler vb.) |
| Uygulama çocukları cezbedebilir mi? | **Hayır** (tasarım ve içerik genel kitleye) |
| Reklam içeriyor mu? | **Hayır** |
| Uygulama içi satın alma | **Hayır** (ücretsiz, satın alma yok) |

## 6) Diğer beyanlar
| Başlık | Cevap |
|---|---|
| Uygulama erişimi | **Tüm işlevler özel erişim gerektirmeden kullanılabilir** (giriş zorunlu değil; misafir oynar). |
| Haber uygulaması | Hayır |
| Devlet uygulaması | Hayır |
| Finansal özellikler | Hayır |
| Sağlık uygulaması | Hayır |
| COVID-19 uygulaması | Hayır |
| Reklam kimliği (Advertising ID) | **Kullanmıyor** |

## 7) İlk sürüm notları (Türkçe)
```
İlk sürüm 🎉
• Dünya ve Türkiye haritaları, üç zorluk seviyesi
• 300 soru, ipuçlarıyla konum bulma
• Arkadaşınla çevrimiçi yarışma modu
• Hesap açarak sıralamaya gir veya misafir olarak oyna
```

## 8) Yayın öncesi kontrol listesi
- [ ] Uygulama adı, kısa ve uzun açıklama girildi
- [ ] Simge (512×512), öne çıkan görsel (1024×500) ve en az 2 telefon ekran görüntüsü yüklendi
- [ ] Gizlilik politikası adresi girildi
- [ ] Veri güvenliği, içerik derecelendirmesi, hedef kitle formları dolduruldu
- [ ] `.aab` paketi kapalı test kanalına yüklendi
- [ ] Test kullanıcıları (gerekliyse 12+) eklendi ve **14 gün** boyunca test sürdü
- [ ] `assetlinks.json` (imza parmak izi) siteye eklendi
- [ ] Supabase projesi aktif ve site açılıyor (inceleme sırasında!)
