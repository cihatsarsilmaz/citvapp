# CITVAPP 2.0.0 Teslimi

## Tamamlanan kapsam

- Mevcut 18 oyun, oyun kimlikleri, karakterler, sesler ve salon tasarımı korundu.
- GitHub’daki güncel giriş sahnesi ve bonus sahnesi korundu.
- Paylaşılan oyun motoru ödeme tablosu, bonus, bağ, hediye, jackpot ve günlük defter davranışını istemciyle eşitledi.
- Oyuncu kayıt, giriş, güvenli çıkış ve profil güncelleme akışları eklendi.
- Sanal CITV bakiyesi ve spin sonucu backend otoritesine taşındı.
- Kriptografik rastgelelik kullanan sunucu tarafı makara üretimi eklendi.
- Bakiye, oyun oturumu ve spin geçmişi tek SQLite işlemiyle güncelleniyor.
- Rol tabanlı yönetim paneli eklendi.
- Yönetici; kullanıcı bakiyesi, rolü ve hesap durumunu yönetebiliyor.
- Askıya alınan kullanıcının aktif oturumları kapatılıyor.
- Admin işlemleri audit log’a yazılıyor.
- Kullanıcı oyun geçmişi ekranı eklendi.
- Bonus durumu sayfa yenilendiğinde sunucudan geri yükleniyor.
- Belirsiz ağ hatalarında aynı spin anahtarıyla güvenli yeniden deneme yapılıyor.
- PWA ve Capacitor Android içerikleri güncellendi.

## Güvenlik

- Scrypt parola hashleme ve kullanıcıya özel salt
- Veritabanında yalnızca hashlenmiş oturum anahtarı
- Süreli HttpOnly oturum çerezi
- CSRF belirtecinin hem çerez hem aktif oturum ile doğrulanması
- Origin kontrolü ve güvenli CORS allowlist
- Giriş/kayıt ve spin hız sınırı
- CSP, MIME sniffing, referrer ve permissions güvenlik başlıkları
- İstek gövdesi boyut sınırı ve tutarlı JSON hata biçimi
- Üretim bağımlılıklarında yüksek/kritik açık bulunmadı

## Doğrulama sonuçları

- `npm test`: 17/17 test başarılı
- CITV Tetikçi: 18 oyun/kit bütünlüğü başarılı
- `npm run build`: başarılı
- `npm run android:sync`: başarılı
- `npm audit --omit=dev --audit-level=high`: 0 açık
- API testi: kayıt, etkin oturum, spin, tekrar oynatma, düşük bakiye, admin revizyonu, CORS ve CSRF başarılı

## Android ve R8 durumu

- Gradle 8.7 wrapper JAR’ı resmi Gradle kaynağından eklendi ve JAR bütünlüğü doğrulandı.
- Android web varlıkları Capacitor ile senkronize edildi.
- APK/AAB derlemesi bu teslim ortamında Java/JDK bulunmadığı için çalıştırılamadı. JDK 17+ ve Android SDK olan ortamda `npm run android:build` kullanılabilir.
- Mevcut Android Gradle Plugin sürümü 8.2.1’dir. R8 Full Mode’u kapatan bir bayrak yoktur.
- Release yapılandırmasında `minifyEnabled false` olduğu için R8 küçültme/optimizasyon aktif değildir.
- `proguard-rules.pro` içinde geniş veya gereksiz keep kuralı yoktur.
- R8’i etkinleştirmek için ayrı bir Android sürümleme çalışmasında `minifyEnabled true`, `shrinkResources true` ve `proguard-android-optimize.txt` kullanılmalı; ardından gerçek cihaz smoke testleri ve UI Automator/Macrobenchmark regresyonları çalıştırılmalıdır.
- AGP 9 yükseltmesi, Capacitor uyumluluğu doğrulanarak ayrı bir değişiklik setinde yapılmalıdır.

## Doğrulanamayan noktalar

- Gerçek APK/AAB derlemesi ve cihaz üzerinde kurulum testi yapılmadı.
- Canlı sunucu, alan adı, HTTPS, yedekleme ve izleme yapılandırılmadı.
- Tarayıcı tabanlı Lighthouse/Core Web Vitals ölçümü ve ekran okuyucu testi yapılmadı.
- Geliştirme bağımlılığı zincirinde (`vite`, `@capacitor/cli` ve geçişli
  paketler) audit uyarıları bulunabilir; üretim bağımlılığı taraması temizdir.
  Bu araçlar sunucuda çalışmaz, ancak derleme makinelerinde güncel tutulmalıdır.
- Otomatik testler, bağımsız güvenlik denetiminin veya üretim yük testinin yerini tutmaz.

## Çalıştırma

```bash
npm install
npm run build
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='EnAz12Karakter2026' \
npm start
```

Varsayılan adres: `http://127.0.0.1:8787`

Üretimde HTTPS, `COOKIE_SECURE=true`, kalıcı SQLite volume’u ve secret manager kullanılması gerekir.
