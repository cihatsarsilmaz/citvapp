# CITV coin ekonomisi

Birim: **CITV**. Fiat (₺) yok. Store IAP yok.

## İki ray

| Ray | Ne zaman | Bakiye kaynağı |
|---|---|---|
| DEMO | dağıtım öncesi | `localStorage` kredi (başlangıç 2500, +500 doldurma) |
| LIVE | sen dağıtımı bitirdikten sonra | cüzdan + `fetchLiveBalance` endpoint |

Kapı: Admin panelinde **LIVE aç**. Varsayılan DEMO.
Kod: `src/coin.js`.

## Salon içi döngü (değişmez)

- Bahis = `UNIT * ante` CITV (`UNIT = 10`)
- Kasa payı %32, tavan 8x, 1 spin soğuma (`house.js`)
- Jackpot gösterimi kasa havuzundan türetilir, CITV cinsinden
- Kazanç / kayıp aynı bakiyeden döner

## Dağıtım sonrası takılacak parça

1. Cüzdan adresi (Admin veya lobi kutusu)
2. Salt-okunur bakiye API: `GET {endpoint}?wallet=` → `{ "balance": number }`
3. Spin mutasyonu **sunucuda** (istemci kasası canlıda geçersiz)
4. Claim kodu (`citv-claim`) airdrop eşlemesi için tutulur

Bu dosya sözleşme / token mint rehberi değil. Zincir seçimi ve sözleşme senin dağıtımın.

## Ürün yenilikleri (sıra)

1. Karakter masası: 18 karakter = 18 CITV masası, ayrı ante tavanı
2. Kasa şeffaflık şeridi: oturum wagered / paid / vault CITV
3. Günlük DEMO musluğu (canlıda kapalı)
4. Dağıtım claim → LIVE bakiyeye köprü
5. PWA “Ana ekrana ekle” mağaza yerine
