# CITV Slot — yalnız web yayını

Play Store / App Store **yok**. Dağıtım kanalı tarayıcı + PWA.
Canlı: https://cihatsarsilmaz.github.io/citvapp/

## Şu an çalışan yol

1. Dal `Kryptocasino` → `deploy-pages.yml` → GitHub Pages.
2. Node 20, `npm run build`, artifact = `dist/`.
3. Vite `base: "./"` — alt yol (`/citvapp/`) kırılmaz.

## Yayına alma checklist

- [x] Pages workflow (Kryptocasino push)
- [x] PWA manifest + theme-color
- [ ] Özel alan (CNAME): örn. `play.citv.app` → Pages custom domain + HTTPS
- [ ] `index.html` içine `<link rel="canonical">` ve og:image
- [ ] Yaş / bölge uyarısı (yasal metin, sen yazarsın)
- [ ] Dağıtım bitince Admin → LIVE aç + cüzdan + bakiye endpoint
- [ ] Netlify/Vercel yedek: `netlify.toml` / `vercel.json` hazır (NODE 20)

## Özel alan (sen yaparsın)

Repo → Settings → Pages → Custom domain.
DNS:

```
CNAME  play   cihatsarsilmaz.github.io
```

`public/CNAME` dosyasını domain netleşince ekle; aksi halde Pages kökü ezilir.

## Mağaza / APK

`build-apk.yml` artık yalnızca **manuel** (`workflow_dispatch`).
Store paket bu ürünün dağıtımı değil. Capacitor klasörü arşiv; silme, çalıştırma.

## Yerel

```bash
npm install
npm run dev
npm run build && npm run preview
```
