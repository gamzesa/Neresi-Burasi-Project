import Link from "next/link";

export const metadata = { title: "Gizlilik ve KVKK · Neresi Burası?" };

/** Verilerle ilgili talepler için herkese açık iletişim adresi. */
const CONTACT_EMAIL = "neresiburasiapp@gmail.com";
const UPDATED = "12 Ekim 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  const p = "text-sm leading-relaxed text-muted";
  const list = "flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-muted";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-7 px-6 py-10">
      <header>
        <Link href="/" className="text-sm text-muted underline">
          Ana sayfa
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Gizlilik ve KVKK Aydınlatma Metni</h1>
        <p className="mt-2 text-xs text-muted">Son güncelleme: {UPDATED}</p>
      </header>

      <Section title="Kısaca">
        <p className={p}>
          Neresi Burası?, hesapsız (misafir) da oynanabilen bir coğrafya oyunudur. Yalnızca oyunun çalışması ve
          sıralama için gereken en az veriyi tutarız. Verini satmaz, reklam için kullanmaz ve üçüncü kişilerle
          paylaşmayız (aşağıda sayılan hizmet sağlayıcılar hariç).
        </p>
      </Section>

      <Section title="Veri sorumlusu ve iletişim">
        <p className={p}>
          Veri sorumlusu, Neresi Burası? uygulamasının geliştiricisidir. Verilerinle ilgili her türlü soru ve talep
          için:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>

      <Section title="Hangi verileri topluyoruz?">
        <ul className={list}>
          <li>
            <strong className="text-ink">Hesap bilgileri:</strong> e-posta adresi, kullanıcı adı ve şifren. Şifren
            düz metin olarak değil, geri döndürülemez biçimde (özet olarak) saklanır; biz görmeyiz.
          </li>
          <li>
            <strong className="text-ink">Google ile giriş:</strong> Google ile giriş yaparsan Google’ın verdiği
            e-posta adresin ve temel profil bilgilerin (ad, profil fotoğrafı) giriş sırasında alınır; oyunda
            yalnızca seçtiğin kullanıcı adı görünür.
          </li>
          <li>
            <strong className="text-ink">Oyun verileri:</strong> oynadığın oyunlar, tahminlerin, puanların ve
            tarihleri. Giriş yaptıysan bunlar hesabına bağlanır ve sıralamada kullanıcı adınla görünür.
          </li>
          <li>
            <strong className="text-ink">Arkadaşla oyun:</strong> odaya katılırken yazdığın takma ad (veya kullanıcı
            adın), oda kodu ve o odadaki tahminlerin. Oda kayıtları 24 saat sonra otomatik silinir.
          </li>
          <li>
            <strong className="text-ink">Teknik veri:</strong> isteklerin hız sınırı için IP adresin kısa süreliğine
            sunucu belleğinde tutulur; kalıcı olarak kaydedilmez.
          </li>
        </ul>
      </Section>

      <Section title="Verileri neden kullanıyoruz?">
        <ul className={list}>
          <li>Oyunu sunmak, puanı hesaplamak ve sıralamayı göstermek,</li>
          <li>Hesabına giriş yapmanı ve şifreni sıfırlamanı sağlamak (e-posta yalnızca bunun için kullanılır),</li>
          <li>Hileyi ve kötüye kullanımı önlemek.</li>
        </ul>
      </Section>

      <Section title="Çerezler ve tarayıcı depolaması">
        <p className={p}>
          Giriş yaptığında oturumunu sürdürmek için gerekli çerezler kullanılır. Arkadaşla oyunda sayfayı yenilediğinde
          odaya geri dönebilmen için tarayıcında bir oda anahtarı saklanır. Reklam veya izleme çerezi kullanmıyoruz.
        </p>
      </Section>

      <Section title="Verilerin işlendiği hizmetler">
        <ul className={list}>
          <li>
            <strong className="text-ink">Supabase</strong> (veritabanı ve kimlik doğrulama; sunucular Avrupa’da),
          </li>
          <li>
            <strong className="text-ink">Vercel</strong> (siteyi barındırma),
          </li>
          <li>
            <strong className="text-ink">Google</strong> (yalnızca “Google ile giriş”i kullanırsan).
          </li>
        </ul>
        <p className={p}>
          Bu hizmet sağlayıcılar verileri yurt dışındaki sunucularda işleyebilir. Hesap açıp giriş yaparak veya
          oyunu kullanarak bu işlemeyi kabul etmiş olursun.
        </p>
      </Section>

      <Section title="Verileri ne kadar saklıyoruz?">
        <ul className={list}>
          <li>Hesap ve oyun verileri, hesabını silmeni isteyene kadar,</li>
          <li>Arkadaşla oyun odaları 24 saat,</li>
          <li>
            Hesabını istediğin an{" "}
            <Link href="/hesabi-sil" className="font-semibold text-accent underline">
              Hesabımı sil
            </Link>{" "}
            sayfasından silebilirsin. Silinince e-posta ve kullanıcı adın kaldırılır; geçmiş oyun kayıtları kimliksiz
            kalır ve sıralamadan düşer.
          </li>
        </ul>
      </Section>

      <Section title="Haklarınız">
        <p className={p}>
          6698 sayılı KVKK’nın 11. maddesi uyarınca; verilerinin işlenip işlenmediğini öğrenme, işlenmişse bilgi
          isteme, düzeltilmesini veya silinmesini isteme ve işlemeye itiraz etme haklarına sahipsin. Bunun için{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent underline">
            {CONTACT_EMAIL}
          </a>{" "}
          adresine kayıtlı e-posta adresinden yazman yeterlidir; makul süre içinde yanıtlarız.
        </p>
      </Section>

      <Section title="Çocuklar">
        <p className={p}>
          Oyun genel kitleye yöneliktir. 18 yaşından küçükler için ebeveyn gözetiminde kullanım önerilir.
        </p>
      </Section>

      <Section title="Değişiklikler">
        <p className={p}>
          Bu metin zaman zaman güncellenebilir; güncel sürüm her zaman bu sayfadadır ve üstteki tarih değişir.
        </p>
      </Section>

      <footer className="border-t border-line pt-4 text-xs text-muted">
        Bu sayfa bilgilendirme amaçlıdır ve hukuki danışmanlık değildir.
      </footer>
    </main>
  );
}
