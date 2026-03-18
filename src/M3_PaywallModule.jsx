import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";

// ─── LEMON SQUEEZY VARIANT IDS ─────────────────────────────────────────────
// Replace these with your actual Lemon Squeezy variant IDs from your dashboard
const LS_MONTHLY_VARIANT_ID = "REPLACE_WITH_MONTHLY_VARIANT_ID";
const LS_ANNUAL_VARIANT_ID  = "REPLACE_WITH_ANNUAL_VARIANT_ID";
// ────────────────────────────────────────────────────────────────────────────

export default function PaywallModule({ userData }) {
  const [hover, setHover] = useState(null);
  const [loading, setLoading] = useState(null); // "monthly" | "annual" | null

  const name = userData?.name || "there";

  const handleCheckout = async (variantId, planId) => {
    setLoading(planId);
    try {
      const functions = getFunctions();
      const createCheckout = httpsCallable(functions, "createCheckout");
      const result = await createCheckout({ variantId });
      window.open(result.data.url, "_blank");
    } catch (err) {
      alert("Could not start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

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
          onClick={() => handleCheckout(LS_ANNUAL_VARIANT_ID, "annual")}
          highlight={true}
          hover={hover === "annual"}
          onHover={setHover}
          id="annual"
          loading={loading === "annual"}
        />
        {/* Monthly */}
        <PricingCard
          title="Monthly"
          price="$7.99"
          period="/ month"
          note="Cancel anytime"
          onClick={() => handleCheckout(LS_MONTHLY_VARIANT_ID, "monthly")}
          highlight={false}
          hover={hover === "monthly"}
          onHover={setHover}
          id="monthly"
          loading={loading === "monthly"}
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

function PricingCard({ badge, title, price, period, note, onClick, highlight, hover, onHover, id, loading }) {
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
        transition:"all 0.2s", cursor: loading ? "wait" : "pointer",
        transform: active ? "translateY(-2px)" : "none",
        boxShadow: active ? `0 8px 32px ${highlight ? "#c86c3a33" : "#00000033"}` : "none",
        opacity: loading ? 0.7 : 1,
      }}
      onClick={loading ? undefined : onClick}
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
        {loading ? "Loading..." : "Get Started →"}
      </div>
    </div>
  );
}
