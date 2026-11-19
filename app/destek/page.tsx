import Link from "next/link";

export const metadata = { title: "Destek ve İletişim · Neresi Burası?" };

/** Kullanıcıların soru sorup destek isteyebileceği herkese açık adres. */
const CONTACT_EMAIL = "neresiburasiapp@gmail.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function SupportPage() {
  const p = "text-sm leading-relaxed text-muted";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-7 px-6 py-10">
      <header>
        <Link href="/" className="text-sm text-muted underline">
          Ana sayfa
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Destek ve İletişim</h1>
        <p className="mt-2 text-sm text-muted">
          Neresi Burası? ile ilgili soru, öneri veya hata bildirimi için bize yazabilirsin.
        </p>
      </header>

      <Section title="Bize ulaş">
        <p className={p}>
          Sorularını, sorunlarını ve önerilerini e-posta ile gönder; genellikle birkaç iş günü içinde yanıtlarız.
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=Neresi%20Burası%3F%20destek`}
          className="flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-white"
        >
          {CONTACT_EMAIL}
        </a>
        <p className={p}>
          Hata bildirirken cihazını (ör. iPhone 15, iOS 18), ne yaparken sorun yaşadığını ve varsa ekran görüntüsünü
          eklersen daha hızlı yardımcı olabiliriz.
        </p>
      </Section>

      <Section title="Sık sorulan sorular">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold">Hesap açmak zorunda mıyım?</h3>
            <p className={p}>
              Hayır. Hesapsız (misafir) oynayabilirsin. Skorunun sıralamaya girmesi için hesap açıp giriş yapman
              gerekir.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold">Şifremi unuttum, ne yapmalıyım?</h3>
            <p className={p}>
              <Link href="/sifremi-unuttum" className="font-semibold text-accent underline">
                Şifremi unuttum
              </Link>{" "}
              sayfasına e-posta adresini yaz; sıfırlama bağlantısı gönderilir. Bağlantıyı isteği yaptığın tarayıcıda
              açman gerekir.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold">Arkadaşımla nasıl oynarım?</h3>
            <p className={p}>
              Ana sayfadan “Arkadaşınla yarış” ile oda kur, 5 karakterli oda kodunu arkadaşına gönder. O da aynı
              ekrandan kodu girerek katılır.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold">Hesabımı nasıl silerim?</h3>
            <p className={p}>
              Giriş yaptıktan sonra{" "}
              <Link href="/hesabi-sil" className="font-semibold text-accent underline">
                Hesabımı sil
              </Link>{" "}
              sayfasından istediğin an silebilirsin. Dilersen bize e-posta ile de bildirebilirsin.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold">Verilerimle ilgili bilgi almak istiyorum.</h3>
            <p className={p}>
              <Link href="/gizlilik" className="font-semibold text-accent underline">
                Gizlilik ve KVKK
              </Link>{" "}
              sayfasını incele veya yukarıdaki e-posta adresine yaz.
            </p>
          </div>
        </div>
      </Section>
    </main>
  );
}
