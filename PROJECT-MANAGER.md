# CITVAPP — AI Project Manager

Bu dosya yalnızca **CITVAPP / CITV Slot** deposunun yönetim kaydıdır. AstroWar ile görev, veri, oyun motoru veya yayın kapsamı paylaşılmaz.

## Yönetim ilkeleri
- Mevcut 18 oyun kartı, karakter sahneleri, ses tasarımı ve mevcut görsel dil korunur.
- Önce mevcut mimari ve testlerin gerçek durumu incelenir; sonra değişiklik yapılır.
- Oyun matematiği, oturum, sonuç ve ledger birbirinden ayrılır.
- İstemciden gelen bakiye, kazanç veya sonuç bilgisi güvenilir kabul edilmez.
- CITV Coin etkin ve yayımlanmış çalışan birim olmadan başka bakiye yükleme/gerçek para akışı açılmaz.
- Gerçek para, ödeme veya finansal işlem entegrasyonu bu aşamanın kapsamı değildir; ayrı hukuki/operasyonel onay gerektirir.
- CITVAPP bağımsız ürün olarak kalır.

## Proje profili
- Ürün: CITV Slot — 18 salon/oyun, karakter sahneleri ve ses
- Ön yüz: React + Vite
- Mobil: Capacitor 6 bağımlılıkları mevcut
- Kontroller: `scripts/audit.mjs`, `scripts/tetikci.mjs`, `src/audit.js`, `src/tetikci.js`
- Oyun çekirdeği: `engine`, `house`, `paytable`, `store`, `ledger` modülleri

## İlk denetimde görülenler
- `package.json` build komutu önce `scripts/tetikci.mjs` çalıştırıyor, ardından Vite build'e geçiyor.
- `test` komutu da aynı tetikçi denetimini çalıştırıyor; ayrı bir test runner komutu görünmüyor.
- Uygulama girişinde oyun bakiyesi/oturum durumu yerel store üzerinden yükleniyor ve kaydediliyor.
- `ledger` modülü istemci tarafında yükleniyor; bu nedenle tek başına güvenilir, sunucu otoriteli muhasebe kaydı olduğu varsayılamaz.
- `coin` modülü LIVE mod ayrımı sağlıyor; gerçek backend ve yetki kontrolleri ayrıca doğrulanmalı.
- Bu ilk kontrol statik dosya incelemesidir; audit, test, build, backend veya canlı sistem çalıştırılmış sayılmaz.

## Yönetim panosu

| Alan | Durum | Sonraki doğrulama |
|---|---|---|
| 18 oyun ve mevcut tasarım | Koruma kuralı | Görsel/işlev regresyonu |
| Oyun matematiği ve ödeme tablosu | Doğrulanmadı | RTP/paytable testleri |
| Game Session | Doğrulanmadı | Oturum yaşam döngüsü ve tekrar deneme |
| Result doğrulama | Doğrulanmadı | Sunucu otoritesi ve sahte sonuç engeli |
| Ledger bütünlüğü | İstemci modülü var | Sunucu tarafı kayıt ve idempotency |
| Auth / kullanıcı | Doğrulanmadı | Kayıt, giriş, oturum ve erişim |
| Admin / RBAC / audit log | Admin bileşeni var | Sunucu tarafı rol ve işlem izi |
| Backend | Doğrulanmadı | API, kurallar ve yetki sınırları |
| Build / audit | Komut mevcut | Komutları çalıştırıp logları kaydet |

## Uygulama aşamaları
1. **Baseline:** son commit, audit, test ve build sonuçlarını kaydet.
2. **Oyun çekirdeği:** oyun matematiği, spin/session/result akışlarını ayır ve doğrula.
3. **Ledger:** benzersiz işlem kimliği, idempotency, bakiye mutabakatı ve sunucu tarafı kayıt tasarla.
4. **Kullanıcı ve admin:** Auth, RBAC, admin işlemleri ve audit log'u doğrula.
5. **Backend güvenliği:** istemciye güvenmeyen sunucu doğrulaması ve veri erişim kuralları.
6. **Regresyon:** 18 oyun, karakter, ses, tema ve mobil/web görünümünü koruyarak test et.
7. **Rapor:** kanıtlanan işleri, kalan riskleri ve bir sonraki güvenli adımı raporla.

## Tamamlanma ölçütü
Her aşama için commit/PR bağlantısı, çalıştırılan komut veya workflow, test sonucu ve bilinen risk kaydı bulunmadan aşama tamamlandı sayılmaz.
