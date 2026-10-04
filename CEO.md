# CITV Slot CEO — web + CITV coin

Canlı: https://cihatsarsilmaz.github.io/citvapp/
Kanal: **yalnız web**. Play Store / App Store yok.
Birim: **CITV** (dağıtım bitince LIVE rayı).
Sürüm: 1.2.0 · PWA citv-pwa-v23

## Bitti
- 5x3 + 5 hat
- Keçe salon, jackpot rayı, WIN
- Kasa %32 / tavan 8x / soğuma
- AUTO abort + Space
- Saatlik tur yalnız Slot
- 18 sahne / canlı karakter
- Oyuna girişte kısa kapı (dokunarak geç)
- 18 yükleme hareketi + 18 lüks kit
- Profesyonel dock: well / key / plunger
- iOS ses uyanışı (ilk dokunuş + spin)
- AUTO zinciri AbortController — stop mevcut spin'i asmaz
- Ödeme şeridi sahneye (3 / 4 / 5, okunur)
- CITV ticker + DEMO/LIVE kapısı (`src/coin.js`)
- APK workflow manuel; Pages asıl yayın
- WEB.md + ECONOMY.md

## Tetikçi
`npm run tetikci` — kendini, kasa/kit, AUTO abort, art parçalarını tarar; TETIKCI.json yeniler.

## Şimdi değil (bilinçli)
- Store paket / IAP
- İstemcide gerçek para çıkışı
- 243-way / scatter bonus
- Harici ses paketi
- Zincir sözleşmesi (senin dağıtımın)

## Dağıtım sonrası ilk iş
1. Admin → LIVE
2. Cüzdan + bakiye endpoint
3. Spin'i sunucuya al
4. Özel alan + yaş metni
