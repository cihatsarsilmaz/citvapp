import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2015",
    minify: "terser",
    cssMinify: true,
    // Android WebView uyumluluğu için:
    modulePreload: false,
    rollupOptions: {
      output: {
        format: "iife",
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  esbuild: {
    target: "es2015",
    jsxInject: `import React from 'react'`,
  },
});
