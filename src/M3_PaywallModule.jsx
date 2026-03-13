import { useState } from "react";

// ─── UPDATE THESE WHEN STRIPE IS READY ───────────────────────────────────────
const STRIPE_MONTHLY_URL = "https://buy.stripe.com/PLACEHOLDER_MONTHLY";
const STRIPE_ANNUAL_URL  = "https://buy.stripe.com/PLACEHOLDER_ANNUAL";
// ─────────────────────────────────────────────────────────────────────────────

export default function PaywallModule({ userData, onClose }) {
  const [hover, setHover] = useState(null);

  const name = userData?.name || "there";

  const content = (
    <div style={{
      minHeight: onClose ? "auto" : "100vh", background:"#0e0c0a",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:"sans-serif", padding:"40px 20px",
      position: "relative", borderRadius: onClose ? 20 : 0,
    }}>
      {onClose && (
        <button onClick={onClose} style={{
          position:"absolute", top:16, right:16,
          background:"none", border:"1px solid #2a2018",
          color:"#8a7a6a", borderRadius:8, width:32, height:32,
          cursor:"pointer", fontSize:16, display:"flex",
          alignItems:"center", justifyContent:"center",
          transition:"all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "#f0e6d3"; e.currentTarget.style.borderColor = "#8a7a6a"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#8a7a6a"; e.currentTarget.style.borderColor = "#2a2018"; }}
        >✕</button>
      )}

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
          {onClose
            ? "This feature is available for premium subscribers. Upgrade to unlock all levels, scenarios, and the Translate tool."
            : "Your free trial has ended. Upgrade to keep practicing your Spanish with your AI conversation partner."}
        </p>
      </div>

      {/* Pricing cards */}
      <div style={{
        display:"flex", gap:16, flexWrap:"wrap",
        justifyContent:"center", marginBottom:24,
      }}>
        {/* Annual — Best Value */}
        <PricingCard
          badge="Best Value"
          title="Annual"
          price="$39.99"
          period="/ year"
          note="Save 58% — just $3.33/mo"
          url={STRIPE_ANNUAL_URL}
          highlight={true}
          hover={hover === "annual"}
          onHover={setHover}
          id="annual"
        />
        {/* Monthly */}
        <PricingCard
          title="Monthly"
          price="$7.99"
          period="/ month"
          note="Cancel anytime"
          url={STRIPE_MONTHLY_URL}
          highlight={false}
          hover={hover === "monthly"}
          onHover={setHover}
          id="monthly"
        />
      </div>

      {/* Features */}
      <div style={{
        background:"#12100e", border:"1px solid #1e1a14",
        borderRadius:12, padding:"16px 28px", maxWidth:380,
        marginBottom:24,
      }}>
        {[
          "✓  Unlimited AI conversations",
          "✓  All 5 scenarios",
          "✓  All levels (Intermedio & Avanzado)",
          "✓  Translate tool",
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
        Secure payment via Stripe · Cancel anytime
      </p>
    </div>
  );

  if (onClose) {
    return (
      <div style={{
        position:"fixed", inset:0, zIndex:1000,
        background:"#000000cc", display:"flex",
        alignItems:"center", justifyContent:"center",
        padding:"20px", overflowY:"auto",
      }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={{ width:"100%", maxWidth:500, maxHeight:"90vh", overflowY:"auto", borderRadius:20 }}>
          {content}
        </div>
      </div>
    );
  }

  return content;
}

function PricingCard({ badge, title, price, period, note, url, highlight, hover, onHover, id }) {
  const active = hover;
  return (
    <div
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      style={{
        background: highlight ? "#1e1408" : "#141210",
        border: `2px solid ${highlight ? (active ? "#c86c3a" : "#c86c3a88") : (active ? "#c8956c66" : "#2a2018")}`,
        borderRadius:16, padding:"24px 28px", minWidth:180,
        textAlign:"center", position:"relative",
        transition:"all 0.2s", cursor:"pointer",
        transform: active ? "translateY(-2px)" : "none",
        boxShadow: active ? `0 8px 32px ${highlight ? "#c86c3a33" : "#00000033"}` : "none",
      }}
      onClick={() => window.open(url, "_blank")}
    >
      {badge && (
        <div style={{
          position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)",
          background:"#c86c3a", color:"#fff", fontSize:11, fontWeight:700,
          padding:"3px 14px", borderRadius:20, whiteSpace:"nowrap",
          letterSpacing:1,
        }}>{badge}</div>
      )}
      <p style={{color:"#8a7a6a", fontSize:12, letterSpacing:2, textTransform:"uppercase", margin:"0 0 8px"}}>{title}</p>
      <p style={{margin:"0 0 4px"}}>
        <span style={{color:"#f0e6d3", fontSize:36, fontWeight:800}}>{price}</span>
        <span style={{color:"#8a7a6a", fontSize:13}}>{period}</span>
      </p>
      <p style={{color:"#c8956c", fontSize:12, margin:"0 0 20px"}}>{note}</p>
      <div style={{
        background: highlight ? "#c86c3a" : "#1e1a14",
        border: `1px solid ${highlight ? "#c86c3a" : "#c8956c44"}`,
        color: highlight ? "#fff" : "#c8956c",
        borderRadius:24, padding:"10px 0", fontSize:14, fontWeight:700,
        transition:"all 0.2s",
      }}>
        Get Started →
      </div>
    </div>
  );
}
