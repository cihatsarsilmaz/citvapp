import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Capacitor APK içinde dosyalar file:// üzerinden açılır, bu yüzden
  // mutlak yol (/) yerine göreli yol (./) kullanmak ZORUNLU.
  // Bunu atlarsan APK'da beyaz/boş ekran alırsın.
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
