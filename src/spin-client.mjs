// A pending operation survives a lost HTTP response/reload in this tab.
// Never generate a new key while its settlement is uncertain.
export function createSpinClient(request, storage, newKey = () => crypto.randomUUID()) {
  const memory = new Map();
  const storageKey = (userId) => `citv-pending-spin:${userId}`;
  const load = (key) => {
    if (memory.has(key)) return memory.get(key);
    try { return JSON.parse(storage?.getItem(key) || "null"); } catch { return null; }
  };
  const save = (key, value) => {
    if (value) memory.set(key, value);
    else memory.delete(key);
    try {
      if (value) storage?.setItem(key, JSON.stringify(value));
      else storage?.removeItem(key);
    } catch { /* In-memory recovery remains available when storage is blocked. */ }
  };
  async function settle(userId, operation) {
    const key = storageKey(userId);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await request("/spins", {
          method: "POST",
          headers: { "Idempotency-Key": operation.key },
          body: operation.body,
        });
        save(key, null);
        return result;
      } catch (error) {
        const definitive = error.status >= 400 && error.status < 500 && error.status !== 429;
        if (definitive) save(key, null);
        if (definitive || attempt === 1 || error.status === 429) throw error;
      }
    }
  }
  async function submit(userId, body) {
    const key = storageKey(userId);
    let operation = load(key);
    if (operation && JSON.stringify(operation.body) !== JSON.stringify(body)) {
      throw new Error("Önceki dönüşün sonucu belirsiz. Sayfayı yenileyerek sonucu doğrulayın; yeni bahis alınmadı.");
    }
    operation ||= { key: newKey(), body };
    save(key, operation);
    return settle(userId, operation);
  }
  submit.recover = async (userId) => {
    const operation = load(storageKey(userId));
    return operation ? settle(userId, operation) : null;
  };
  return submit;
}
