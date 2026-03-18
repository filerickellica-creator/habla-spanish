import { useState } from "react";

// ─── UPDATE WHEN LEMON SQUEEZY STORE IS APPROVED ────────────────────────────
const LEMONSQUEEZY_MONTHLY_URL = "https://YOUR_STORE.lemonsqueezy.com/checkout/PLACEHOLDER";
// ─────────────────────────────────────────────────────────────────────────────

export default function PaywallModule({ userData }) {
  const [hover, setHover] = useState(false);

  const name = userData?.name || "there";

  return (
    <div style={{
      minHeight:"100vh", background:"#0e0c0a",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:"sans-serif", padding:"40px 20px",
    }}>
      {/* Logo */}
      <div style={{marginBottom:8}}>
        <span style={{fontSize:36}}>🇪🇸</span>
      </div>
      <h1 style={{
        color:"#f0e6d3", fontSize:32, fontWeight:800,
        letterSpacing:2, margin:"0 0 4px",
      }}>Habla</h1>
      <p style={{
        color:"#8a7a6a", fontSize:12, letterSpacing:4,
        textTransform:"uppercase", margin:"0 0 32px",
      }}>Voice Spanish Practice</p>

      {/* Message */}
      <div style={{
        background:"#1a1410", border:"1px solid #2a2018",
        borderRadius:16, padding:"24px 32px", maxWidth:420,
        textAlign:"center", marginBottom:32,
      }}>
        <p style={{color:"#c8b896", fontSize:16, margin:"0 0 8px"}}>
          Hey {name} 👋
        </p>
        <p style={{color:"#8a7a6a", fontSize:14, margin:0, lineHeight:1.7}}>
          Your free trial has ended. Upgrade to keep practicing your Spanish
          with your AI conversation partner.
        </p>
      </div>

      {/* Single pricing card */}
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background:"#1e1408",
          border:`2px solid ${hover ? "#c86c3a" : "#c86c3a88"}`,
          borderRadius:16, padding:"28px 36px", minWidth:220,
          textAlign:"center", position:"relative",
          transition:"all 0.2s", cursor:"pointer",
          transform: hover ? "translateY(-2px)" : "none",
          boxShadow: hover ? "0 8px 32px #c86c3a33" : "none",
          marginBottom:24,
        }}
        onClick={() => window.open(LEMONSQUEEZY_MONTHLY_URL, "_blank")}
      >
        <p style={{color:"#8a7a6a", fontSize:12, letterSpacing:2, textTransform:"uppercase", margin:"0 0 8px"}}>Monthly</p>
        <p style={{margin:"0 0 4px"}}>
          <span style={{color:"#f0e6d3", fontSize:36, fontWeight:800}}>$6.99</span>
          <span style={{color:"#8a7a6a", fontSize:13}}>/ month</span>
        </p>
        <p style={{color:"#c8956c", fontSize:12, margin:"0 0 20px"}}>Cancel anytime</p>
        <div style={{
          background:"#c86c3a",
          border:"1px solid #c86c3a",
          color:"#fff",
          borderRadius:24, padding:"10px 0", fontSize:14, fontWeight:700,
          transition:"all 0.2s",
        }}>
          Get Started →
        </div>
      </div>

      {/* Features */}
      <div style={{
        background:"#12100e", border:"1px solid #1e1a14",
        borderRadius:12, padding:"16px 28px", maxWidth:380,
        marginBottom:24,
      }}>
        {[
          "✓  Unlimited AI conversations",
          "✓  All 6 scenarios",
          "✓  Grammar feedback",
          "✓  Vocabulary modules",
          "✓  Hints & coaching",
        ].map(f => (
          <p key={f} style={{
            color:"#8a7a6a", fontSize:13, margin:"4px 0",
          }}>{f}</p>
        ))}
      </div>

      <p style={{color:"#3a3530", fontSize:11}}>
        Secure payment via Lemon Squeezy · Cancel anytime
      </p>
    </div>
  );
}
