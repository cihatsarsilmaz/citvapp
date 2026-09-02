import React, { useState } from "react";
import { DEMO, LIVE, getMode, setMode, getWallet, setWallet, liveUrl, fetchLiveBalance } from "./coin";

const PIN = "CITV2026";

export default function Admin({ session, setSession, balance, setBalance, emptySession }) {
  const [pin, setPin] = useState("");
  const [ok, setOk] = useState(sessionStorage.getItem("citv-admin") === "1");
  const [err, setErr] = useState("");
  const [mode, setModeUi] = useState(getMode());
  const [wallet, setWalletUi] = useState(getWallet());
  const [liveMsg, setLiveMsg] = useState("");

  function login(e) {
    e.preventDefault();
    if (pin.trim() === PIN) {
      sessionStorage.setItem("citv-admin", "1");
      setOk(true);
      setErr("");
    } else setErr("PIN hatalı");
  }

  function toggleLive() {
    const next = mode === LIVE ? DEMO : LIVE;
    setMode(next);
    setModeUi(next);
    setLiveMsg(next === LIVE ? "LIVE açık. Musluk kapalı. API yoksa bakiye yerel kalır." : "DEMO. Yerel fiş.");
  }

  async function pullLive() {
    setWallet(wallet);
    const r = await fetchLiveBalance(wallet);
    if (r.ok) {
      setBalance(r.balance);
      setLiveMsg("API bakiyesi alındı: " + r.balance);
    } else {
      setLiveMsg("API yok veya hata: " + r.reason + (liveUrl() ? "" : " — VITE_CITV_BALANCE_URL boş"));
    }
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
        <p className="notes">İstemci önizleme. Üretim sırrı koyma.</p>
        <a className="back" href="./" onClick={() => { location.hash = ""; }}>Lobiye dön</a>
      </section>
    );
  }

  return (
    <section className="admin">
      <p className="kicker">kasa kontrol</p>
      <h1>Admin</h1>
      <div className="ledger">
        <div><span>Mod</span><b>{mode}</b></div>
        <div><span>Oyuncu</span><b>{balance}</b></div>
        <div><span>Kasa</span><b className="hot">{session.vault}</b></div>
        <div><span>Spin</span><b>{session.spins}</b></div>
      </div>
      <p className="notes">LIVE ray: dağıtım bitince VITE_CITV_BALANCE_URL. Şu an sunucu spin yok.</p>
      <div className="row">
        <button className={"act " + (mode === LIVE ? "" : "ghost")} onClick={toggleLive}>{mode === LIVE ? "LIVE AÇIK" : "LIVE AÇ"}</button>
        <input
          value={wallet}
          onChange={(e) => setWalletUi(e.target.value)}
          onBlur={() => setWallet(wallet)}
          placeholder="cüzdan"
          style={{ minWidth: 180, padding: "8px 10px", borderRadius: 8, border: "1px solid #4a3418", background: "#120c08", color: "#f6edd8" }}
        />
        <button className="act ghost" onClick={pullLive}>API ÇEK</button>
      </div>
      {liveMsg && <p className="result">{liveMsg}</p>}
      <div className="row">
        {mode === DEMO && <button className="act" onClick={() => setBalance((n) => n + 1000)}>+1000 oyuncu</button>}
        <button className="act ghost" onClick={() => setBalance(0)}>Oyuncuyu sıfırla</button>
        <button className="act ghost" onClick={() => setSession(emptySession())}>Oturumu sıfırla</button>
        <button className="act ghost" onClick={() => setSession((s) => ({ ...s, cool: 0 }))}>Soğumayı aç</button>
        <button className="act ghost" onClick={() => { sessionStorage.removeItem("citv-admin"); setOk(false); }}Çık</button>
        <a className="act ghost" href="./" style={{ display: "inline-block", textDecoration: "none" }} onClick={() => { location.hash = ""; }}>Lobi</a>
      </div>
    </section>
  );
}
