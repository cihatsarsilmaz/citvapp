import React, { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { useAuth } from "./Auth";

export default function AdminSecure() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  const load = useCallback(() => {
    setError("");
    api("/admin/overview").then(setData).catch((reason) => setError(reason.message));
  }, []);

  useEffect(load, [load]);

  async function update(target, patch) {
    setSaving(target.id);
    setError("");
    try {
      const result = await api(`/admin/users/${target.id}`, {
        method: "PATCH",
        body: {
          balance: patch.balance ?? target.balance,
          role: patch.role ?? target.role,
          status: patch.status ?? target.status,
          expectedRevision: target.revision,
        },
      });
      setData((current) => ({
        ...current,
        users: current.users.map((item) => item.id === target.id ? result.user : item),
      }));
    } catch (reason) {
      setError(reason.message);
    } finally {
      setSaving("");
    }
  }

  if (user.role !== "admin") {
    return <section className="admin"><p className="kicker">erişim reddedildi</p><h1>Yönetici yetkisi gerekiyor</h1><a className="back" href="./" onClick={() => { location.hash = ""; }}>Lobiye dön</a></section>;
  }

  const rtp = data?.totals?.wagered > 0 ? Math.round((data.totals.paid / data.totals.wagered) * 100) : 0;

  return (
    <section className="admin">
      <header className="page-head">
        <div><p className="kicker">güvenli operasyon</p><h1>Yönetim paneli</h1></div>
        <div className="row"><button className="act ghost" onClick={load}>Yenile</button><a className="act ghost link-button" href="./" onClick={() => { location.hash = ""; }}>Lobi</a></div>
      </header>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!data ? <p className="result">Veriler yükleniyor…</p> : (
        <>
          <div className="ledger admin-kpis">
            <div><span>Kullanıcı</span><b>{data.totals.users}</b></div>
            <div><span>Aktif</span><b>{data.totals.activeUsers}</b></div>
            <div><span>Spin</span><b>{data.totals.spins}</b></div>
            <div><span>RTP</span><b>{rtp}%</b></div>
            <div><span>Bahis</span><b>{data.totals.wagered}</b></div>
            <div><span>Ödeme</span><b>{data.totals.paid}</b></div>
          </div>
          <div className="panel">
            <h2>Kullanıcılar</h2>
            <div className="table-wrap">
              <table className="data-table admin-users">
                <thead><tr><th>Kullanıcı</th><th>Bakiye</th><th>Rol</th><th>Durum</th><th>İşlem</th></tr></thead>
                <tbody>{data.users.map((item) => (
                  <AdminUserRow key={item.id} item={item} saving={saving === item.id} onSave={update} />
                ))}</tbody>
              </table>
            </div>
          </div>
          <div className="panel activity">
            <h2>Son spinler</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Oyuncu</th><th>Oyun</th><th>Bahis</th><th>Kazanç</th><th>Zaman</th></tr></thead>
                <tbody>{data.recent.map((spin) => (
                  <tr key={spin.id}><td>{spin.displayName}<small>{spin.email}</small></td><td>{spin.gameId}</td><td>{spin.bet}</td><td>{spin.win}</td><td>{new Date(spin.createdAt).toLocaleString("tr-TR")}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function AdminUserRow({ item, saving, onSave }) {
  const [balance, setBalance] = useState(item.balance);
  const [role, setRole] = useState(item.role);
  const [status, setStatus] = useState(item.status);
  useEffect(() => { setBalance(item.balance); setRole(item.role); setStatus(item.status); }, [item]);
  return (
    <tr>
      <td>{item.displayName}<small>{item.email}</small></td>
      <td><input className="table-input" type="number" min="0" max="10000000" step="1" value={balance} onChange={(e) => setBalance(e.target.value)} /></td>
      <td><select value={role} onChange={(e) => setRole(e.target.value)}><option value="player">Oyuncu</option><option value="admin">Yönetici</option></select></td>
      <td><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="active">Aktif</option><option value="suspended">Askıda</option></select></td>
      <td><button className="act mini" disabled={saving} onClick={() => onSave(item, { balance: Number(balance), role, status })}>{saving ? "…" : "Kaydet"}</button></td>
    </tr>
  );
}
