import React, { useEffect, useState } from "react";

export default function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    console.log("[AstrogameWAR] App mounted");
    setLoaded(true);
  }, []);

  return (
    <div
      style={{
        color: "#fff",
        textAlign: "center",
        paddingTop: "35vh",
        backgroundColor: "#020810",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>AstrogameWAR</h1>
      {loaded ? (
        <p style={{ opacity: 0.7, fontSize: "1.1rem" }}>Uygulama yüklendi ✅</p>
      ) : (
        <p style={{ opacity: 0.5, fontSize: "1rem" }}>Yükleniyor...</p>
      )}
      <div style={{ marginTop: "2rem", fontSize: "0.8rem", opacity: 0.4 }}>
        v1.0.0 Debug Build
      </div>
    </div>
  );
}
