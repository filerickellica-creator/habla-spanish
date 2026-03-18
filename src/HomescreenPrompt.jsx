import { useState, useEffect } from "react";

const DISMISSED_KEY = "habla_homescreen_dismissed";
const SHOWN_KEY = "habla_homescreen_shown_session";

export default function HomescreenPrompt() {
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState("ios");

  useEffect(() => {
    // Don't show if already running as standalone (installed)
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) return;
    // Don't show if permanently dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return;
    // Don't show if already shown this session
    if (sessionStorage.getItem(SHOWN_KEY)) return;

    const timer = setTimeout(() => {
      sessionStorage.setItem(SHOWN_KEY, "1");
      setVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => setVisible(false);
  const dismissForever = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "20px 16px",
    }} onClick={dismiss}>
      <div style={{
        background: "#14110e", border: "1px solid #2a2018",
        borderRadius: 20, padding: "28px 24px 20px", width: "100%", maxWidth: 380,
        boxShadow: "0 -8px 40px rgba(0,0,0,0.5)", animation: "fadeUp 0.3s ease",
      }} onClick={e => e.stopPropagation()}>
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
          <h3 style={{ color: "#f0e6d3", fontSize: 17, fontWeight: 700, margin: "0 0 6px", fontFamily: "sans-serif" }}>
            Add Habla to your home screen
          </h3>
          <p style={{ color: "#6b6560", fontSize: 13, margin: 0, fontFamily: "sans-serif", lineHeight: 1.5 }}>
            Open Habla instantly — just like a native app.
          </p>
        </div>

        {/* Tab buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[{id:"ios",label:"iPhone (Safari)"},{id:"android",label:"Android (Chrome)"}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 600,
              fontFamily: "sans-serif", cursor: "pointer", transition: "all 0.2s",
              background: tab === t.id ? "#c8956c22" : "#0e0e14",
              border: `1.5px solid ${tab === t.id ? "#c8956c" : "#1e1e2a"}`,
              color: tab === t.id ? "#c8956c" : "#4a4540",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Instructions */}
        <div style={{ background: "#0e0e14", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          {tab === "ios" ? (
            <ol style={{ margin: 0, paddingLeft: 20, color: "#8a8075", fontSize: 13, fontFamily: "sans-serif", lineHeight: 2 }}>
              <li>Tap the <strong style={{ color: "#c8956c" }}>Share</strong> button (box with arrow)</li>
              <li>Scroll down and tap <strong style={{ color: "#c8956c" }}>Add to Home Screen</strong></li>
              <li>Tap <strong style={{ color: "#c8956c" }}>Add</strong></li>
            </ol>
          ) : (
            <ol style={{ margin: 0, paddingLeft: 20, color: "#8a8075", fontSize: 13, fontFamily: "sans-serif", lineHeight: 2 }}>
              <li>Tap the <strong style={{ color: "#c8956c" }}>three dots</strong> menu (top right)</li>
              <li>Tap <strong style={{ color: "#c8956c" }}>Add to Home screen</strong></li>
              <li>Tap <strong style={{ color: "#c8956c" }}>Add</strong></li>
            </ol>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={dismissForever} style={{
            width: "100%", padding: "12px", borderRadius: 12,
            background: "linear-gradient(135deg, #c8956c, #a87040)",
            border: "none", color: "#0e0e14", fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "sans-serif",
          }}>I've added it!</button>
          <button onClick={dismiss} style={{
            width: "100%", padding: "10px", borderRadius: 12,
            background: "none", border: "1px solid #2a2018",
            color: "#4a4540", fontSize: 13, cursor: "pointer", fontFamily: "sans-serif",
          }}>Remind me later</button>
        </div>
      </div>
    </div>
  );
}
