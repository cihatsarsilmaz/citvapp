# CITV Slot

Slot lobisi ve karakter sahneleri. AstrogameWAR ile **aynı ürün değil**.
Dağıtım: **yalnız web**. Birim: **CITV coin**.

| Ürün | Repo | Ne iş yapar |
|---|---|---|
| **CITV Slot** | bu repo (`citvapp`) | 18 slot, 18 karakter, CITV masası |
| **AstrogameWAR** | `cihatsarsilmaz/astrowar-capacitor` | uzay strateji / filo savaşı |

## Canlı

https://cihatsarsilmaz.github.io/citvapp/

Dal: `Kryptocasino` → GitHub Pages (`deploy-pages.yml`).
Store yok. Ayrıntı: [WEB.md](WEB.md) · ekonomi: [ECONOMY.md](ECONOMY.md).

## Yerel

```bash
npm install
npm run dev
```

## Durum (2026-09-02)

- Lobi: 18 oyun kartı
- Sahne: spin / ante / hız, birim CITV
- DEMO kredi şimdi; LIVE rayı dağıtım sonrası Admin'den açılır
- Karakter Köşesi + WebAudio
- Sonraki: sunucu spin, cüzdan bakiyesi, özel alan
