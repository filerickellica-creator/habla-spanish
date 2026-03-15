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

export default function PaywallModule({ userData }) {
  const [hover, setHover]   = useState(null);
  const [plans, setPlans]   = useState(null); // null = loading

  const name = userData?.name || "there";

  useEffect(() => {
    async function fetchPlans() {
      try {
        const snap = await getDoc(doc(db, "appConfig", "pricing"));
        if (snap.exists()) {
          setPlans(snap.data().plans ?? []);
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
          Better your Spanish by unlocking all features.
          Subscribe to keep improving — cancel anytime.
        </p>
      </div>

      {/* Pricing cards */}
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

      {/* Features */}
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
