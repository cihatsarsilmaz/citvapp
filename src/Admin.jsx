import React, { useState } from "react";
import { DEMO, LIVE, saveMode, loadWallet, saveWallet, loadClaim, saveClaim, TICKER } from "./coin";

const PIN = "CITV2026";

export default function Admin({
  session, setSession, balance, setBalance, emptySession, mode, setMode,
}) {
  const [pin, setPin] = useState("");
  const [ok, setOk] = useState(sessionStorage.getItem("citv-admin") === "1");
  const [err, setErr] = useState("");
  const [wallet, setWallet] = useState(loadWallet());
  const [claim, setClaim] = useState(loadClaim());

  function login(e) {
    e.preventDefault();
    if (pin.trim() === PIN) {
      sessionStorage.setItem("citv-admin", "1");
      setOk(true);
      setErr("");
    } else setErr("PIN hatalı");
  }

  function goLive() {
    setMode(LIVE);
    saveMode(LIVE);
  }

  function goDemo() {
    setMode(DEMO);
    saveMode(DEMO);
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
        <p className="notes">İstemci önizleme. Üretim sırrı koyma. Store yok — yalnız web.</p>
        <a className="back" href="./" onClick={() => { location.hash = ""; }}>Lobiye dön</a>
      </section>
    );
  }

  return (
    <section className="admin">
      <p className="kicker">kasa kontrol · {mode === LIVE ? "LIVE" : "DEMO"}</p>
      <h1>Admin</h1>
      <div className="ledger">
        <div><span>Oyuncu {TICKER}</span><b>{balance.toLocaleString("tr-TR")}</b></div>
        <div><span>Kasa</span><b className="hot">{session.vault}</b></div>
        <div><span>Spin</span><b>{session.spins}</b></div>
        <div><span>Soğuma</span><b>{session.cool}</b></div>
      </div>
      <p className="notes">Dağıtım bitince LIVE aç. Cüzdan ve claim burada durur; zincir sözleşmesi bu repoda yok.</p>
      <div className="row">
        <button className="act" onClick={goLive}>LIVE aç</button>
        <button className="act ghost" onClick={goDemo}>DEMO’ya dön</button>
      </div>
      <form className="admin-form" onSubmit={(e) => { e.preventDefault(); saveWallet(wallet); saveClaim(claim); }}>
        <input placeholder="cüzdan adresi" value={wallet} onChange={(e) => setWallet(e.target.value)} />
        <input placeholder="dağıtım claim kodu" value={claim} onChange={(e) => setClaim(e.target.value)} />
        <button className="act" type="submit">Kaydet</button>
      </form>
      <div className="row">
        {mode !== LIVE && <button className="act" onClick={() => setBalance((n) => n + 1000)}>+1000 DEMO</button>}
        <button className="act ghost" onClick={() => setBalance(0)}>Oyuncuyu sıfırla</button>
        <button className="act ghost" onClick={() => setSession(emptySession())}>Oturumu sıfırla</button>
        <button className="act ghost" onClick={() => setSession((s) => ({ ...s, cool: 0 }))}>Soğumayı aç</button>
        <button className="act ghost" onClick={() => { sessionStorage.removeItem("citv-admin"); setOk(false); }}Çık</button>
        <a className="act ghost" href="./" style={{ display: "inline-block", textDecoration: "none" }} onClick={() => { location.hash = ""; }}>Lobi</a>
      </div>
    </section>
  );
}
