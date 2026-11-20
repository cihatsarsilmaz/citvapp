# Security Policy

## Güvenlik modeli

- Parolalar scrypt ile benzersiz salt kullanılarak hashlenir.
- Oturum anahtarının kendisi veritabanına yazılmaz; SHA-256 özeti saklanır.
- Oturum çerezi HttpOnly ve SameSite özelliklidir; üretimde Secure zorunludur.
- Tüm değişiklik istekleri CSRF belirteci ve origin kontrolü gerektirir.
- Giriş/kayıt ve spin uçları IP bazlı hız sınırına sahiptir.
- Bakiye ve spin kaydı tek SQLite işlemi içinde güncellenir.
- Admin uçları hem arayüzde hem backend’de `admin` rolüyle korunur.
- Yönetici eylemleri IP ve zaman bilgisiyle audit log’a yazılır.
- Yönetici güncellemeleri sürüm numarasıyla iyimser kilitleme kullanır.
- Spin istekleri kimlik ve gövde parmak iziyle idempotenttir.
- Yenilenen sayfa bonus oyununu kaybetmeden sunucu durumundan devam eder.
- Statik sunucu CSP, MIME sniffing, referrer ve izin politikası başlıkları gönderir.

## Operasyonel gereksinimler

- Üretimde HTTPS ve `COOKIE_SECURE=true` kullanın.
- `ADMIN_PASSWORD` değerini repoya yazmayın.
- Veritabanı ile yedeklerini erişim kontrollü, şifreli bir volume’da saklayın.
- Reverse proxy üzerinde de istek gövdesi, bağlantı ve hız limitleri uygulayın.
- Düzenli Node.js güvenlik güncellemeleri ve bağımlılık taraması yapın.

## Sınırlar

Bu sürüm gerçek para, ödeme, para yatırma/çekme veya kripto cüzdan entegrasyonu içermez. Böyle bir özellik eklenmeden önce lisans, KYC/AML, yaş doğrulama, bölgesel uygunluk ve bağımsız oyun matematiği denetimi gerekir.

Otomatik testler ve güvenlik başlıkları üretim güvenliğinin yalnızca bir
parçasıdır. Bu teslim bağımsız sızma testi, denetim sertifikası, yük testi,
gerçek cihaz testi veya canlı ortam operasyon doğrulaması içermez. Sanal
krediler gerçek değer taşımamalıdır.

## Zafiyet bildirimi

Depodaki özel güvenlik bildirimi kanalını kullanın. Açık issue içinde istismar adımlarını veya kişisel verileri paylaşmayın.
