import { useState, useEffect } from "react";
import { initializeApp, getApps }   from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAWHZYkRMqwLM5NLxfna_4HcKru2P1Gzm0",
  authDomain:        "habla-espanyol.firebaseapp.com",
  projectId:         "habla-espanyol",
  storageBucket:     "habla-espanyol.firebasestorage.app",
  messagingSenderId: "92424848474",
  appId:             "1:92424848474:web:80612d9b22f0f391ba4463",
};

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const db = getFirestore(firebaseApp);

export default function PaywallModule({ userData, onClose }) {
  const [hover, setHover]   = useState(null);
  const [plans, setPlans]   = useState(null);

  const name = userData?.name || "there";

  useEffect(() => {
    async function fetchPlans() {
      try {
        const snap = await getDoc(doc(db, "config", "pricing"));
        if (snap.exists()) {
          const d = snap.data();
          if (d.plans) {
            setPlans(d.plans);
          } else {
            const built = [];
            if (d.monthly_price) built.push({
              id: "monthly",
              title: "Monthly",
              price: `$${d.monthly_price}`,
              period: "/mo",
              note: d.monthly_note || "",
              stripeUrl: d.monthly_stripe_url || d.stripeUrl || "",
              highlight: false,
            });
            if (d.annual_price) built.push({
              id: "annual",
              title: "Annual",
              price: `$${d.annual_price}`,
              period: "/yr",
              note: d.annual_note || "",
              stripeUrl: d.annual_stripe_url || d.stripeUrl || "",
              highlight: true,
              badge: d.annual_badge || "Best Value",
            });
            setPlans(built);
          }
        } else {
          setPlans([]);
        }
      } catch {
        setPlans([]);
      }
    }
    fetchPlans();
  }, []);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1100,
      background:"#0e0c0a", overflow:"auto",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:"sans-serif", padding:"40px 20px",
    }}>
      {onClose && (
        <button onClick={onClose} style={{
          position:"absolute", top:20, left:20,
          background:"#1a1410", border:"1px solid #2a2018",
          color:"#8a7a6a", borderRadius:8, padding:"6px 14px",
          fontSize:13, cursor:"pointer",
        }}>← Back</button>
      )}

      <div style={{marginBottom:8}}>
        <svg width="44" height="44" viewBox="0 0 92 92" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 8 C4 8 0 12 0 18 L0 54 C0 60 4 64 10 64 L28 64 L22 80 L40 64 L82 64 C88 64 92 60 92 54 L92 18 C92 12 88 8 82 8 Z" fill="#c8956c"/>
          <rect x="14" y="30" width="8" height="16" rx="4" fill="#2a1a0a"/>
          <rect x="26" y="22" width="8" height="32" rx="4" fill="#2a1a0a"/>
          <rect x="38" y="16" width="8" height="40" rx="4" fill="#2a1a0a"/>
          <rect x="50" y="22" width="8" height="32" rx="4" fill="#2a1a0a"/>
          <rect x="62" y="28" width="8" height="16" rx="4" fill="#2a1a0a"/>
        </svg>
      </div>
      <h1 style={{
        color:"#f0e6d3", fontSize:32, fontWeight:800,
        letterSpacing:2, margin:"0 0 4px", fontFamily:"Georgia, serif",
      }}>Habla</h1>
      <p style={{
        color:"#8a7a6a", fontSize:12, letterSpacing:4,
        textTransform:"uppercase", margin:"0 0 32px",
      }}>Voice Spanish Practice</p>

      <div style={{
        background:"#1a1410", border:"1px solid #2a2018",
        borderRadius:16, padding:"24px 32px", maxWidth:420,
        textAlign:"center", marginBottom:32,
      }}>
        <p style={{color:"#c8b896", fontSize:16, margin:"0 0 8px"}}>
          Hey {name} 👋
        </p>
        <p style={{color:"#8a7a6a", fontSize:14, margin:0, lineHeight:1.7}}>
          Better your Spanish by unlocking all features.
          Subscribe to keep improving — cancel anytime.
        </p>
      </div>

      <div style={{
        display:"flex", gap:16, flexWrap:"wrap",
        justifyContent:"center", marginBottom:24,
        minHeight:200,
      }}>
        {plans === null ? (
          <p style={{color:"#8a7a6a", fontSize:13, alignSelf:"center"}}>Loading plans…</p>
        ) : plans.length === 0 ? (
          <p style={{color:"#8a7a6a", fontSize:13, alignSelf:"center"}}>No plans available right now.</p>
        ) : (
          plans.map(plan => (
            <PricingCard
              key={plan.id}
              badge={plan.badge}
              title={plan.title}
              price={plan.price}
              period={plan.period}
              note={plan.note}
              url={plan.stripeUrl}
              highlight={plan.highlight ?? false}
              hover={hover === plan.id}
              onHover={setHover}
              id={plan.id}
            />
          ))
        )}
      </div>

      <div style={{
        background:"#12100e", border:"1px solid #1e1a14",
        borderRadius:12, padding:"16px 28px", maxWidth:380,
        marginBottom:24,
      }}>
        {[
          "✓  Unlimited AI conversations",
          "✓  All scenarios",
          "✓  Translate English to Spanish",
          "✓  Grammar feedback",
          "✓  Vocabulary modules",
          "✓  Hints & coaching",
        ].map(f => (
          <p key={f} style={{color:"#8a7a6a", fontSize:13, margin:"4px 0"}}>{f}</p>
        ))}
      </div>

      <p style={{color:"#3a3530", fontSize:11}}>
        Secure payment via Stripe · Cancel anytime
      </p>
    </div>
  );
}

function PricingCard({ badge, title, price, period, note, url, highlight, hover, onHover, id }) {
  return (
    <div
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      style={{
        background: highlight ? "#1e1408" : "#141210",
        border: `2px solid ${highlight ? (hover ? "#c86c3a" : "#c86c3a88") : (hover ? "#c8956c66" : "#2a2018")}`,
        borderRadius:16, padding:"24px 28px", minWidth:180,
        textAlign:"center", position:"relative",
        transition:"all 0.2s", cursor:"pointer",
        transform: hover ? "translateY(-2px)" : "none",
        boxShadow: hover ? `0 8px 32px ${highlight ? "#c86c3a33" : "#00000033"}` : "none",
      }}
      onClick={() => window.open(url, "_blank")}
    >
      {badge && (
        <div style={{
          position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)",
          background:"#c86c3a", color:"#fff", fontSize:11, fontWeight:700,
          padding:"3px 14px", borderRadius:20, whiteSpace:"nowrap", letterSpacing:1,
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
