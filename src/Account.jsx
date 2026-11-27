import React, { useEffect, useState } from "react";
import { api } from "./api";
import { useAuth } from "./Auth";

export default function Account() {
  const auth = useAuth();
  const [displayName, setDisplayName] = useState(auth.user.displayName);
  const [spins, setSpins] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api("/account/activity").then((data) => setSpins(data.spins)).catch((error) => setMessage(error.message));
  }, []);

  async function save(event) {
    event.preventDefault();
    setMessage("");
    try {
      const data = await api("/account", { method: "PATCH", body: { displayName } });
      auth.setUser(data.user);
      setMessage("Profil kaydedildi.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="account-page">
      <header className="page-head">
        <div><p className="kicker">oyuncu hesabı</p><h1>{auth.user.displayName}</h1></div>
        <a className="act ghost link-button" href="./" onClick={() => { location.hash = ""; }}>Lobi</a>
      </header>
      <div className="account-grid">
        <form className="panel auth-form" onSubmit={save}>
          <h2>Profil</h2>
          <label>Görünen ad<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} maxLength={40} /></label>
          <label>E-posta<input value={auth.user.email} disabled /></label>
          <button className="act" type="submit">KAYDET</button>
          {message && <p className="result">{message}</p>}
        </form>
        <div className="panel">
          <h2>Hesap</h2>
          <div className="ledger account-ledger">
            <div><span>Bakiye</span><b>{auth.user.balance}</b></div>
            <div><span>Rol</span><b>{auth.user.role === "admin" ? "Yönetici" : "Oyuncu"}</b></div>
          </div>
          <button className="act ghost" onClick={auth.logout}>Güvenli çıkış</button>
        </div>
      </div>
      <div className="panel activity">
        <h2>Son oyunlar</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Oyun</th><th>Bahis</th><th>Kazanç</th><th>Bakiye</th><th>Zaman</th></tr></thead>
            <tbody>
              {spins.map((spin) => (
                <tr key={spin.id}><td>{spin.gameId}</td><td>{spin.bet}</td><td>{spin.win}</td><td>{spin.balanceAfter}</td><td>{new Date(spin.createdAt).toLocaleString("tr-TR")}</td></tr>
              ))}
              {!spins.length && <tr><td colSpan="5">Henüz oyun kaydı yok.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
