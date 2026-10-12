/** PWA servis çalıştırıcı kaydı.
 * Göreli yol: GitHub Pages alt klasör + Vite base ./ 
 * iOS Safari SW destekler (16.4+); ana ekrana ekle standalone açar.
 */
export function startPwa() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const run = async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {}
    const url = new URL("sw.js?v=39", window.location.href);
    navigator.serviceWorker
      .register(url.href, { scope: new URL("./", window.location.href).href, updateViaCache: "none" })
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch(() => {});
  };

  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
}
