/** PWA kaydı kapalı. Önbellek sorunu bitene kadar SW yok. */
export function startPwa() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  }).catch(() => {});
}
