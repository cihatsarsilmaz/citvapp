import React, { useState } from "react";

const PIN = "CITV2026";

export default function Admin({ session, setSession, balance, setBalance, emptySession }) {
  const [pin, setPin] = useState("");
  const [ok, setOk] = useState(sessionStorage.getItem("citv-admin") === "1");
  const [err, setErr] = useState("");

  function login(e) {
    e.preventDefault();
    if (pin.trim() === PIN) {
      sessionStorage.setItem("citv-admin", "1");
      setOk(true);
      setErr("");
    } else setErr("PIN hatalı");
  }

  if (!ok) {
    return (
      <section className="admin">
        <p className="kicker">CITV Slot · kasa kontrol</p>
        <h1>Admin giriş</h1>
        <form onSubmit={login} className="admin-form">
          <input type="password" inputMode="text" autoComplete="off" placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
          <button className="act" type="submit">GİR</button>
        </form>
        {err && <p className="result">{err}</p>}
        <p className="notes">İstemci önizleme. Sunucu yok. Üretim sırrı koyma.</p>
        <a className="back" href="./" onClick={() => { location.hash = ""; }}>Lobiye dön</a>
      </section>
    );
  }

  return (
    <section className="admin">
      <p className="kicker">kasa kontrol</p>
      <h1>Admin</h1>
      <div className="ledger">
        <div><span>Oyuncu</span><b>{balance}</b></div>
        <div><span>Kasa</span><b className="hot">{session.vault}</b></div>
        <div><span>Spin</span><b>{session.spins}</b></div>
        <div><span>Soğuma</span><b>{session.cool}</b></div>
      </div>
      <div className="row">
        <button className="act" onClick={() => setBalance((n) => n + 1000)}>+1000 oyuncu</button>
        <button className="act ghost" onClick={() => setBalance(0)}>Oyuncuyu sıfırla</button>
        <button className="act ghost" onClick={() => setSession(emptySession())}>Oturumu sıfırla</button>
        <button className="act ghost" onClick={() => setSession((s) => ({ ...s, cool: 0 }))}>Soğumayı aç</button>
        <button className="act ghost" onClick={() => { sessionStorage.removeItem("citv-admin"); setOk(false); }}>Çık</button>
        <a className="act ghost" href="./" style={{ display: "inline-block", textDecoration: "none" }} onClick={() => { location.hash = ""; }}>Lobi</a>
      </div>
    </section>
  );
}
