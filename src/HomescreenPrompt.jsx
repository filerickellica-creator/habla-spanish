import { useState } from "react";

export default function HomescreenPrompt({ onClose }) {
  const [tab, setTab] = useState("ios");

  // Don't show if already added to homescreen (standalone mode) or previously dismissed permanently
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  const permanentlyDismissed = localStorage.getItem("habla_hs_dismissed");
  if (isStandalone || permanentlyDismissed) { onClose(); return null; }

  const handleDone = () => {
    localStorage.setItem("habla_hs_dismissed", "1");
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, animation: "fadeIn 0.3s ease",
    }} onClick={onClose}>
      <style>{`@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }`}</style>
      <div style={{
        background: "#14110e", border: "1px solid #2a2018",
        borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 380,
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>📲</span>
            <h3 style={{ color: "#f0e6d3", fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "sans-serif" }}>Add to Home Screen</h3>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#3a3530",
            cursor: "pointer", fontSize: 20, lineHeight: 1,
          }}>×</button>
        </div>

        <p style={{ color: "#8a7a6a", fontSize: 13, margin: "0 0 18px", lineHeight: 1.6, fontFamily: "sans-serif" }}>
          Add to home screen for best experience.
        </p>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[
            { id: "ios", label: "iPhone / iPad" },
            { id: "android", label: "Android" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
              fontFamily: "sans-serif", cursor: "pointer", transition: "all 0.2s",
              background: tab === t.id ? "#c8956c22" : "#0e0c0a",
              border: `1.5px solid ${tab === t.id ? "#c8956c" : "#2a2018"}`,
              color: tab === t.id ? "#c8956c" : "#5a5050",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Instructions */}
        <div style={{
          background: "#0e0c0a", border: "1px solid #1e1a14",
          borderRadius: 12, padding: "16px 18px",
        }}>
          {tab === "ios" ? (
            <ol style={{ margin: 0, paddingLeft: 20, color: "#c8b896", fontSize: 13, lineHeight: 2, fontFamily: "sans-serif" }}>
              <li>Open Habla in <strong style={{ color: "#f0e6d3" }}>Safari</strong></li>
              <li>Tap the <strong style={{ color: "#f0e6d3" }}>Share</strong> button <span style={{ color: "#4a9eff" }}>⬆</span> at the bottom</li>
              <li>Scroll down and tap <strong style={{ color: "#f0e6d3" }}>"Add to Home Screen"</strong></li>
              <li>Tap <strong style={{ color: "#f0e6d3" }}>"Add"</strong> in the top right</li>
            </ol>
          ) : (
            <ol style={{ margin: 0, paddingLeft: 20, color: "#c8b896", fontSize: 13, lineHeight: 2, fontFamily: "sans-serif" }}>
              <li>Open Habla in <strong style={{ color: "#f0e6d3" }}>Chrome</strong></li>
              <li>Tap the <strong style={{ color: "#f0e6d3" }}>three dots</strong> <span style={{ color: "#8a8075" }}>⋮</span> menu (top right)</li>
              <li>Tap <strong style={{ color: "#f0e6d3" }}>"Add to Home screen"</strong></li>
              <li>Tap <strong style={{ color: "#f0e6d3" }}>"Add"</strong> to confirm</li>
            </ol>
          )}
        </div>

        {/* Buttons */}
        <button onClick={handleDone} style={{
          width: "100%", marginTop: 16, padding: "11px 0",
          background: "linear-gradient(135deg, #c8956c, #a87040)",
          border: "none", color: "#0e0e14", borderRadius: 12, fontSize: 13,
          fontWeight: 700, fontFamily: "sans-serif", cursor: "pointer", transition: "all 0.2s",
        }}>I've added it!</button>
        <button onClick={onClose} style={{
          width: "100%", marginTop: 8, padding: "11px 0",
          background: "none", border: "1px solid #2a2018",
          color: "#5a5050", borderRadius: 12, fontSize: 13,
          fontFamily: "sans-serif", cursor: "pointer", transition: "all 0.2s",
        }}>Remind me later</button>
      </div>
    </div>
  );
}
