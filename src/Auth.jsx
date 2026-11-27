import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, resetCsrf } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    async login(email, password) {
      const data = await api("/auth/login", { method: "POST", body: { email, password } });
      setUser(data.user);
      return data.user;
    },
    async register(displayName, email, password) {
      const data = await api("/auth/register", {
        method: "POST",
        body: { displayName, email, password },
      });
      setUser(data.user);
      return data.user;
    },
    async logout() {
      await api("/auth/logout", { method: "POST" });
      resetCsrf();
      setUser(null);
      location.hash = "";
    },
    async refresh() {
      const data = await api("/auth/me");
      setUser(data.user);
      return data.user;
    },
    setUser,
  }), [user, ready]);

  if (!ready) {
    return (
      <main className="auth-shell">
        <section className="auth-card"><p className="kicker">CITV</p><h1>Salon hazırlanıyor</h1></section>
      </main>
    );
  }
  return <AuthContext.Provider value={value}>{user ? children : <AuthScreen />}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider gerekli");
  return value;
}

function AuthScreen() {
  const auth = useContext(AuthContext);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ displayName: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") await auth.login(form.email, form.password);
      else await auth.register(form.displayName, form.email, form.password);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card lux">
        <p className="kicker">CITV • sanal kredi salonu</p>
        <h1>{mode === "login" ? "Masaya dön" : "Oyuncu hesabı aç"}</h1>
        <p className="sub">18 oyun, tek güvenli hesap. Gerçek para yatırma veya çekme yoktur.</p>
        <div className="auth-tabs" role="group" aria-label="Hesap işlemi">
          <button type="button" aria-pressed={mode === "login"} className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>Giriş</button>
          <button type="button" aria-pressed={mode === "register"} className={mode === "register" ? "on" : ""} onClick={() => setMode("register")}>Kayıt</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <label>Görünen ad<input autoComplete="nickname" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required minLength={2} maxLength={40} /></label>
          )}
          <label>E-posta<input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Parola<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={12} maxLength={128} /></label>
          {mode === "register" && <p className="form-help">En az 12 karakter, bir harf ve bir rakam.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="act" type="submit" disabled={busy}>{busy ? "Bekleyin…" : mode === "login" ? "GİRİŞ YAP" : "HESAP AÇ"}</button>
        </form>
        <p className="age-note">18+ • Eğlence amaçlı sanal CITV kredileri kullanılır.</p>
      </section>
    </main>
  );
}
