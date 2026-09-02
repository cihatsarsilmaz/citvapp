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
    } else setErr("PIN hatali");
  }

  function toggleLive() {
    const next = mode === LIVE ? DEMO : LIVE;
    setMode(next);
    setModeUi(next);
    setLiveMsg(next === LIVE ? "LIVE acik. Musluk kapali." : "DEMO. Yerel fis.");
  }

  async function pullLive() {
    setWallet(wallet);
    const r = await fetchLiveBalance(wallet);
    if (r.ok) {
      setBalance(r.balance);
      setLiveMsg("API bakiyesi: " + r.balance);
    } else {
      setLiveMsg("API yok veya hata: " + r.reason + (liveUrl() ? "" : ""));
    }
  }

  function logout() {
    sessionStorage.removeItem("citv-admin");
    setOk(false);
  }

  if (!ok) {
    return (
      <section className="admin">
        <p className="kicker">CITV Slot - kasa kontrol</p>
        <h1>Admin giris</h1>
        <form onSubmit={login} className="admin-form">
          <input type="password" autoComplete="off" placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
          <button className="act" type="submit">GIR</button>
        </form>
        {err && <p className="result">{err}</p>}
        <a className="back" href="./" onClick={() => { location.hash = ""; }}>Lobiye don</a>
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
      <p className="notes">LIVE ray: dagitim bitince VITE_CITV_BALANCE_URL. Sunucu spin yok.</p>
      <div className="row">
        <button className={"act " + (mode === LIVE ? "" : "ghost")} onClick={toggleLive}>{mode === LIVE ? "LIVE ACIK" : "LIVE AC"}</button>
        <input value={wallet} onChange={(e) => setWalletUi(e.target.value)} onBlur={() => setWallet(wallet)} placeholder="cuzdan" />
        <button className="act ghost" onClick={pullLive}>API CEK</button>
      </div>
      {liveMsg && <p className="result">{liveMsg}</p>}
      <div className="row">
        {mode === DEMO && <button className="act" onClick={() => setBalance((n) => n + 1000)}>+1000</button>}
        <button className="act ghost" onClick={() => setBalance(0)}>Sifirla</button>
        <button className="act ghost" onClick={() => setSession(emptySession())}>Oturum</button>
        <button className="act ghost" onClick={logout}>Cik</button>
        <a className="act ghost" href="./" onClick={() => { location.hash = ""; }}>Lobi</a>
      </div>
    </section>
  );
}
