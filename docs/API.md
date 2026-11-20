# CITV REST API

Tüm yollar `/api` önekini kullanır ve JSON döndürür. Değişiklik yapan isteklerde önce `GET /auth/csrf` ile belirteç alınır; değer `X-CSRF-Token` başlığında gönderilir. Oturum çerezleri istemci tarafından okunmaz.

## Kimlik doğrulama

### `GET /auth/csrf`

CSRF çerezini ve istemcinin başlıkta geri göndereceği belirteci üretir.

### `POST /auth/register`

```json
{
  "displayName": "Oyuncu",
  "email": "oyuncu@example.com",
  "password": "EnAz12Karakter2026"
}
```

Yeni oyuncuya 12.500 sanal CITV kredisi verir ve oturum açar.

### `POST /auth/login`

```json
{
  "email": "oyuncu@example.com",
  "password": "EnAz12Karakter2026"
}
```

### `POST /auth/logout`

Mevcut oturumu veritabanından siler ve çerezleri sonlandırır.

### `GET /auth/me`

Oturumdaki güvenli kullanıcı görünümünü döndürür.

### `GET /game-state`

Sunucudaki oyun oturumunu, bonus kilidini ve son spin sonucunu döndürür.
Oyuncunun bakiyesi 20 CITV’nin altındaysa eğlence amaçlı 2.500 sanal kredi
tamamlanır; bu işlem audit log’a yazılır.

## Oyuncu

### `PATCH /account`

```json
{ "displayName": "Yeni Ad" }
```

### `GET /account/activity`

Kullanıcının son 25 spin kaydını döndürür.

### `POST /spins`

İstemci, 8-128 karakterlik benzersiz `Idempotency-Key` başlığı göndermek
zorundadır. Eksik veya geçersiz anahtar `400 invalid_idempotency_key` döndürür.
Aynı kullanıcı ve anahtar daha önce işlendiğinde sunucu ilk sonucu tekrar
döndürür; aynı anahtar farklı oyun/ante/turbo gövdesiyle kullanılırsa
`409 idempotency_conflict` döner.

```json
{
  "gameId": "sweet",
  "ante": 1,
  "turbo": false
}
```

Oyun düzenine uygun makara sonucunu kriptografik rastgelelikle sunucuda üretir;
ödeme, bonus, karakter bağı, günlük defter ve bakiye güncellemesini tek SQLite
işlemiyle kaydeder. Bonus sürerken yalnızca aynı oyun ve bahis seviyesi kabul
edilir; aksi durumda `409 bonus_locked` döner.

## Yönetim

Bu uçlar `admin` rolü gerektirir.

### `GET /admin/overview`

Kullanıcı/spin toplamlarını, en fazla 100 kullanıcıyı ve son 50 spin kaydını döndürür.

### `PATCH /admin/users/:id`

```json
{
  "balance": 15000,
  "role": "player",
  "status": "active",
  "expectedRevision": 4
}
```

Bakiyeyi, rolü ve hesap durumunu günceller. Güncel tam sayı `expectedRevision`
değeri zorunludur; eşleşmeyen değişiklikler `409 stale_user` ile reddedilir. Bu,
paneldeki eski bakiyenin yeni bakiyeyi ezmesini önler. Yönetici kendi
yönetici/aktif erişimini kaldıramaz. Askıya alınan kullanıcının tüm oturumları
sonlandırılır.

### Hız sınırları

- Kayıt ve giriş: IP başına 15 dakikada 8 deneme
- Spin: IP başına dakikada 180 istek

## Hata biçimi

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "E-posta veya parola hatalı.",
    "requestId": "..."
  }
}
```

Kimlik doğrulama için `401`, yetki için `403`, doğrulama için `400`, çakışma için `409`, hız sınırı için `429` kullanılır.
