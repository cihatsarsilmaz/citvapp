# CITV Slot 2.0

CITV Slot; mevcut 18 oyun, karakter sahneleri ve görsel dili korunmuş, kullanıcı hesabı, rol tabanlı yönetim paneli ve sunucu tarafından yönetilen sanal bakiye/spin sistemi olan tam yığın bir uygulamadır.

Uygulama yalnızca eğlence amaçlı sanal CITV kredisi kullanır. Gerçek para yatırma, çekme veya kripto cüzdan işlemi içermez.

## 2.0 kapsamı

- GitHub’daki güncel giriş sahnesi, bonus sahnesi ve oyun hissi korunur.
- Mevcut 18 oyunun ödeme tablosu, bonus, karakter bağı, günlük defter, hediye ve jackpot kuralları istemciyle aynı paylaşılan motoru kullanır.
- Oyuncu kaydı, girişi, profili ve oyun geçmişi sunucu oturumuna bağlıdır.
- Bakiye, bonus kilidi, oyun istatistikleri ve spin geçmişi SQLite üzerinde tutulur.
- Yenilenen sayfa bonus oyununu ve bahis seviyesini geri yükler.
- Kaybolan HTTP yanıtlarında aynı spin `Idempotency-Key` ile güvenle yeniden denenir.
- Admin paneli sabit PIN yerine sunucu tarafındaki yönetici oturumunu ve revision tabanlı çakışma kontrolünü kullanır.

## Teknoloji

- React 18 + Vite
- Node.js 22 HTTP sunucusu
- Node.js `node:sqlite` ile SQLite
- Capacitor 6 Android kabuğu
- Scrypt parola hashleme
- Hashlenmiş, süreli ve HttpOnly oturum çerezleri
- CSRF, origin, hız sınırlama ve rol tabanlı erişim kontrolleri

## Yerel kurulum

Node.js 22.5 veya üzeri gerekir.

```bash
npm install
npm run build
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='en-az-12-karakter-2026' \
npm start
```

Uygulama varsayılan olarak `http://127.0.0.1:8787` adresinde açılır. İlk yönetici yalnızca `ADMIN_EMAIL` ve `ADMIN_PASSWORD` birlikte verilirse oluşturulur.

## Geliştirme

İki terminal kullanın:

```bash
npm run dev:server
```

```bash
npm run dev:web
```

Vite, `/api` isteklerini yerel backend’e yönlendirir.

## Test ve derleme

```bash
npm test
npm run build
```

Testler kayıt/giriş, CSRF ve origin kontrolü, admin yetkisi ve çakışma denetimi, düşük bakiye tamamlaması, bonus geri yükleme, idempotent spin, parola güvenliği, kriptografik makara üretimi ve atomik bakiye güncellemesini kapsar. Mevcut 18 oyun/kart bütünlüğünü denetleyen CITV Tetikçi de test zincirinde çalışır.

## Üretim

- HTTPS ve `COOKIE_SECURE=true` kullanın.
- Harici API origin’i kullanıyorsanız `API_ORIGIN` değerini CSP için aynı origin ile ayarlayın.
- SQLite dosyasını kalıcı ve yedeklenen bir volume’da tutun.
- Yönetici parolasını yalnızca secret manager üzerinden sağlayın.
- Capacitor farklı bir API origin’ine bağlanacaksa `.env.example` içindeki ayarları uygulayın.

Android paketini uzak bir backend’e bağlamak için web derlemesinden önce API adresini verin:

```bash
VITE_CITV_API_URL=https://api.example.com npm run android:sync
```

Backend’de `APP_ORIGIN`, Android WebView origin’lerini ve varsa web uygulaması origin’ini virgülle ayrılmış biçimde içermelidir. Cross-origin güvenli çerez için HTTPS, `COOKIE_SECURE=true` ve `COOKIE_SAME_SITE=None` gerekir.

Android derlemesi için JDK 17+ ve Android SDK gerekir:

```bash
npm run android:build
```

REST sözleşmesi için `docs/API.md`, güvenlik modeli için `SECURITY.md` dosyasına bakın.

## Bilinen sınırlar

- Bu ortamda JDK ve Android SDK bulunmadığı için APK/AAB derlemesi ve gerçek cihaz testi yapılmamıştır.
- Uygulama canlı bir üretim sunucusuna dağıtılmamış; alan adı, HTTPS sertifikası, yedekleme ve izleme yapılandırılmamıştır.
- Otomatik testler ve derleme başarılı olsa da bağımsız güvenlik denetimi, yük testi veya erişilebilirlik sertifikasyonu yapılmamıştır.
- Sanal kredi sistemi ve demo bakiye tamamlaması gerçek para ekonomisi için tasarlanmamıştır.
