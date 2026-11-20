# CITVAPP 2.0.0 teslim paketi — buradan başlayın

Bu dosya, kaynak kod paketinin nasıl açılıp çalıştırılacağını açıklar. Paket
hazır APK değildir; backend ve web uygulaması birlikte çalıştırılır. Sürüm
`2.0.0`; paket içinde güncel oyun/bonus sahneleri, sunucu oturumu, SQLite
oyun durumu ve güvenli yönetim paneli bulunur.

## Gereksinimler

- Node.js 22.5 veya üzeri
- npm 10 veya üzeri
- Android derlemesi için ayrıca JDK 17+ ve Android SDK

## Web + backend'i çalıştırma

```bash
npm install
npm run build

ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='EnAz12Karakter2026' \
npm start
```

Ardından `http://127.0.0.1:8787` adresini açın. İlk yönetici hesabı yalnızca
`ADMIN_EMAIL` ve `ADMIN_PASSWORD` birlikte verildiğinde oluşturulur.

Geliştirme sırasında backend ve Vite arayüzünü ayrı terminallerde çalıştırmak
için `npm run dev:server` ve `npm run dev:web` komutlarını kullanabilirsiniz.

## Doğrulama

```bash
npm test
npm run build
```

`npm test`, backend güvenlik ve oyun kurallarını; `scripts/tetikci.mjs` ise
mevcut oyun/kart bütünlüğünü kontrol eder.

## Android

Web varlıklarını senkronize etmek için:

```bash
npm run android:sync
```

APK üretmek için JDK 17+ ve Android SDK bulunan bir makinede:

```bash
npm run android:build
```

Bu teslim ortamında JDK/Android SDK bulunmadığından APK derlemesi burada
çalıştırılmamıştır.

## Paket kapsamı

- React + Vite web uygulaması
- Node.js HTTP backend'i ve SQLite veritabanı
- Kullanıcı, oturum, sanal bakiye/spin ve admin akışları
- Capacitor Android projesi
- Testler, API sözleşmesi ve güvenlik belgeleri

Gerçek para, kripto cüzdanı veya para çekme/yatırma akışı içermez.
