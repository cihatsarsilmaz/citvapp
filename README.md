# AstrogameWAR — Kurulum ve Deploy Rehberi

## Bu Proje İçinde Ne Var

```
citvapp/
├── src/                    ← Oyun kodu (burada React bileşeni oluştur)
├── android/                ← Capacitor Android projesi
├── public/                 ← Statik dosyalar (ikonlar, resimler)
├── dist/                   ← Build çıktısı (APK/Web için)
├── .github/workflows/       ← GitHub Actions (otomatik build)
├── vite.config.js          ← Vite yapılandırması
├── capacitor.config.json   ← Capacitor/Android ayarları
├── package.json            ← Proje bağımlılıkları
├── index.html              ← Ana HTML sayfası
├── manifest.json           ← PWA manifestosu
├── vercel.json             ← Vercel deploy ayarları
├── netlify.toml            ← Netlify deploy ayarları
└── README.md               ← Bu dosya
```

---

## Hızlı Başlangıç

### 1️⃣ Bağımlılıkları Yükle

```bash
npm install
```

### 2️⃣ Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Browser: http://localhost:5173

### 3️⃣ Web Sürümünü Build Et

```bash
npm run build
```

→ `dist/` klasöründe optimize edilmiş dosyalar oluşur.

---

## Android APK Oluşturma

### A) GitHub Actions ile (Otomatik — Tavsiye edilir)

1. **Bu repoyu GitHub'a push et:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin Kryptocasino
   ```

2. **GitHub repo → Actions sekmesine git**
   - Workflow: "Build Android APK" gözükecek
   - Tamamlanınca **Artifacts** bölümünden `app-debug.apk` indir

### B) Lokal Olarak (Manuel)

**Gereklilikler:**
- Java Development Kit (JDK) 11+
- Android SDK
- Gradle

**Adımlar:**

```bash
# 1. Android projesi ekle (bir kez)
npm run android:add

# 2. Web kodunu build et ve Android'e sync et
npm run android:sync

# 3. Android Studio'da açabilir veya CLI ile build et
npm run android:build

# Veya doğrudan:
cd android
./gradlew assembleDebug
```

→ APK: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## APK'yı Telefona Yükle

1. **Android Ayarları → Güvenlik → Bilinmeyen Kaynaklar** ✓
2. APK dosyasını telefonuna aktar (USB/email/WhatsApp)
3. Dosyaya dokun → **Yükle**
4. Uygulamayı aç

---

## Web Deploy

### Vercel (En Kolay)

```bash
npm run deploy:vercel
```

### Netlify (Sürükle-Bırak)

```bash
npm run deploy:netlify
```

### GitHub Pages (Ücretsiz Hosting)

```bash
npm run deploy:gh
```

→ GitHub → Settings → Pages → Source: GitHub Actions seç

---

## Dosya Yapısı Detaylı

| Dosya | Amaç |
|-------|------|
| `vite.config.js` | Vite build ayarları (React, base path vs.) |
| `capacitor.config.json` | Android app ID, icon, splash screen |
| `package.json` | Dependencies ve script komutları |
| `index.html` | Ana HTML, PWA linkler |
| `manifest.json` | PWA metadata (Ana ekrana ekle) |
| `src/main.jsx` | React giriş noktası |
| `android/` | Capacitor tarafından oluşturulan Android projesi |
| `.github/workflows/` | GitHub Actions CI/CD yapılandırması |

---

## Yaygın Sorunlar

| ❌ Sorun | ✅ Çözüm |
|--------|----------|
| **APK'da beyaz ekran** | `vite.config.js`'de `base: "./"` kontrolü |
| **npm install başarısız** | Node.js 16+ ile dene, `npm cache clean --force` |
| **GitHub Actions hatası** | Actions loguna bak, genelde JDK/SDK eksik |
| **Telefonda yüklenmiyor** | "Bilinmeyen kaynaklar" iznini aç |
| **Android Studio projesi açılmıyor** | `npm run android:sync` ile sync et |

---

## İleri Ayarlar

### Release APK (Play Store Için)

**Gerekli:** Keystore dosyası

```bash
keytool -genkey -v -keystore release.keystore -keyalg RSA -keysize 2048 -validity 10000
```

Sonra GitHub Secrets'e ekle:
- `KEYSTORE_BASE64`
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`

---

## Kaynaklar

- [Vite Dokumentasyon](https://vitejs.dev)
- [Capacitor Docs](https://capacitorjs.com)
- [React Docs](https://react.dev)
- [PWA Basics](https://web.dev/progressive-web-apps/)

---

**Sorular?** Lütfen Issues aç! 🚀
