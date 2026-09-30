/** PWA servis çalıştırıcı kaydı.
 * Göreli yol: GitHub Pages alt klasör + Vite base ./ 
 * iOS Safari SW destekler (16.4+); ana ekrana ekle standalone açar.
 */
export function startPwa() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const run = () => {
    const url = new URL("sw.js", window.location.href);
    navigator.serviceWorker
      .register(url.href, { scope: new URL("./", window.location.href).href })
      .then((reg) => {
        reg.update().catch(() => {});
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP" });
      })
      .catch(() => {});
  };

  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
}
