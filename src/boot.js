export function registerSw() {
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
  const sw = new URL("../public/sw.js", import.meta.url);
  navigator.serviceWorker.register(new URL("./sw.js", import.meta.url)).catch(() => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
  void sw;
}
