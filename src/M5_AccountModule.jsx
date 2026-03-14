import { useState } from "react";

const UNSUB_REASONS = [
  "Too expensive",
  "Not using it enough",
  "Need a break",
  "Technical issues",
  "Other",
];

export default function AccountModule({ user, userData, controls, onClose, onSubscribe }) {
  const [signingOut, setSigningOut] = useState(false);
  const [unsubStep, setUnsubStep] = useState(null); // null | "confirm" | "done"
  const [unsubReason, setUnsubReason] = useState("");
  const [unsubFeedback, setUnsubFeedback] = useState("");

  const handleSignOut = async () => {
    setSigningOut(true);
    await controls.signOut();
  };

  const subStatus = userData?.subscriptionStatus;

  const statusConfig = {
    trial:   { label: "Trial",         color: "#c8956c", bg: "#1e1408" },
    active:  { label: "Active",        color: "#6cbf8a", bg: "#081a0e" },
    expired: { label: "Expired",       color: "#c86c3a", bg: "#1e0a04" },
  };
  const sub = statusConfig[subStatus] || statusConfig.trial;

  const trialDaysLeft = () => {
    if (subStatus !== "trial") return null;
    const startedAt = userData.trialStartedAt?.toDate?.()
      || new Date((userData.trialStartedAt?.seconds || 0) * 1000);
    const elapsed = (Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil((userData.trialDays || 10) - elapsed));
  };
  const daysLeft = trialDaysLeft();

  const modalInner = (
    <div style={{
      background:"#14110e", border:"1px solid #2a2018",
      borderRadius:20, padding:"32px 28px", width:"100%", maxWidth:380,
      boxShadow:"0 24px 64px rgba(0,0,0,0.6)",
    }} onClick={e => e.stopPropagation()}>

      {unsubStep === "confirm" ? (
        <UnsubscribeFlow
          reason={unsubReason}
          feedback={unsubFeedback}
          onReasonChange={setUnsubReason}
          onFeedbackChange={setUnsubFeedback}
          onKeep={() => setUnsubStep(null)}
          onConfirm={() => setUnsubStep("done")}
        />
      ) : unsubStep === "done" ? (
        <UnsubscribeDone onClose={onClose} />
      ) : (
        <>
          {/* Header */}
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28}}>
            <h2 style={{color:"#f0e6d3", fontSize:18, fontWeight:700, margin:0}}>My Account</h2>
            <button onClick={onClose} style={{
              background:"none", border:"none", color:"#3a3530",
              cursor:"pointer", fontSize:22, lineHeight:1,
            }}>×</button>
          </div>

          {/* Avatar + Name */}
          <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:24}}>
            <div style={{
              width:52, height:52, borderRadius:"50%",
              background:"#c86c3a22", border:"2px solid #c86c3a44",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22,
            }}>
              {(userData?.name || user?.email || "?")[0].toUpperCase()}
            </div>
            <div>
              <p style={{color:"#f0e6d3", fontSize:15, fontWeight:600, margin:"0 0 2px"}}>
                {userData?.name || "User"}
              </p>
              <p style={{color:"#5a5050", fontSize:12, margin:0}}>{user?.email}</p>
            </div>
          </div>

          {/* Divider */}
          <div style={{borderTop:"1px solid #1e1a14", marginBottom:20}} />

          {/* Subscription status */}
          <div style={{
            background: sub.bg, border:`1px solid ${sub.color}33`,
            borderRadius:12, padding:"14px 18px", marginBottom:20,
          }}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <span style={{color:"#8a7a6a", fontSize:12, letterSpacing:1, textTransform:"uppercase"}}>Subscription</span>
              <span style={{
                color: sub.color, fontSize:12, fontWeight:700,
                background:`${sub.color}22`, padding:"3px 10px", borderRadius:20,
              }}>{sub.label}</span>
            </div>
            {daysLeft !== null && (
              <p style={{color:"#8a7a6a", fontSize:12, margin:"8px 0 0"}}>
                {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining in your trial
              </p>
            )}
            {subStatus === "active" && userData?.subscriptionExpiry && (
              <p style={{color:"#8a7a6a", fontSize:12, margin:"8px 0 0"}}>
                Renews {new Date(userData.subscriptionExpiry?.seconds * 1000).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Subscribe button — trial or expired */}
          {(subStatus === "trial" || subStatus === "expired") && (
            <button
              onClick={onSubscribe}
              style={{
                display:"block", width:"100%", textAlign:"center",
                background:"#c86c3a", color:"#fff",
                borderRadius:12, padding:"12px 0", fontSize:14, fontWeight:700,
                border:"none", cursor:"pointer", marginBottom:12,
                transition:"opacity 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >Subscribe →</button>
          )}

          {/* Unsubscribe button — active only */}
          {subStatus === "active" && (
            <button
              onClick={() => setUnsubStep("confirm")}
              style={{
                width:"100%", background:"none",
                border:"1px solid #2a2018", color:"#5a5050",
                borderRadius:12, padding:"11px 0", fontSize:13,
                cursor:"pointer", transition:"all 0.2s", marginBottom:12,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#c86c3a66"; e.currentTarget.style.color = "#c86c3a"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2018"; e.currentTarget.style.color = "#5a5050"; }}
            >Unsubscribe</button>
          )}

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              width:"100%", background:"none",
              border:"1px solid #2a2018", color:"#5a5050",
              borderRadius:12, padding:"11px 0", fontSize:13,
              cursor:"pointer", transition:"all 0.2s",
            }}
          >
            {signingOut ? "Signing out..." : "Sign Out"}
          </button>
        </>
      )}
    </div>
  );

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:20,
    }} onClick={onClose}>
      {modalInner}
    </div>
  );
}

function UnsubscribeFlow({ reason, feedback, onReasonChange, onFeedbackChange, onKeep, onConfirm }) {
  return (
    <div>
      <h2 style={{color:"#f0e6d3", fontSize:17, fontWeight:700, margin:"0 0 6px"}}>Cancel Subscription?</h2>
      <p style={{color:"#8a7a6a", fontSize:13, margin:"0 0 20px", lineHeight:1.6}}>
        We're sorry to see you go. Before you cancel, tell us why — it helps us improve.
      </p>

      {/* Leading practice nudge */}
      <div style={{
        background:"#0d1a10", border:"1px solid #22c97a33",
        borderRadius:10, padding:"12px 14px", marginBottom:20,
        fontSize:13, color:"#5a9a6a", lineHeight:1.6,
      }}>
        💡 <strong style={{color:"#6cbf8a"}}>Keep the momentum.</strong> Regular short practice sessions are the fastest way to fluency — even 5 minutes a day makes a difference.
      </div>

      {/* Reason selection */}
      <p style={{color:"#6a5a50", fontSize:11, letterSpacing:1.5, textTransform:"uppercase", margin:"0 0 10px", fontFamily:"sans-serif"}}>Why are you canceling?</p>
      <div style={{display:"flex", flexDirection:"column", gap:6, marginBottom:16}}>
        {UNSUB_REASONS.map(r => (
          <button
            key={r}
            onClick={() => onReasonChange(r)}
            style={{
              textAlign:"left", padding:"9px 14px", borderRadius:8, fontSize:13,
              background: reason === r ? "#c86c3a18" : "none",
              border:`1px solid ${reason === r ? "#c86c3a66" : "#2a2018"}`,
              color: reason === r ? "#e8c8a8" : "#6a5a50",
              cursor:"pointer", transition:"all 0.15s",
            }}
          >{r}</button>
        ))}
      </div>

      {/* Optional feedback */}
      <textarea
        value={feedback}
        onChange={e => onFeedbackChange(e.target.value)}
        placeholder="Anything else you'd like to share? (optional)"
        rows={3}
        style={{
          width:"100%", background:"#0e0c0a", border:"1px solid #2a2018",
          borderRadius:10, padding:"10px 12px", fontSize:13, color:"#c8b896",
          fontFamily:"sans-serif", resize:"none", outline:"none",
          marginBottom:20, boxSizing:"border-box",
        }}
        onFocus={e => e.target.style.borderColor = "#c8956c55"}
        onBlur={e => e.target.style.borderColor = "#2a2018"}
      />

      {/* Actions */}
      <button
        onClick={onKeep}
        style={{
          width:"100%", background:"#6cbf8a22", border:"1px solid #6cbf8a55",
          color:"#6cbf8a", borderRadius:12, padding:"12px 0", fontSize:14,
          fontWeight:700, cursor:"pointer", marginBottom:10, transition:"opacity 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >Keep My Subscription</button>
      <button
        onClick={onConfirm}
        style={{
          width:"100%", background:"none", border:"1px solid #2a2018",
          color:"#5a5050", borderRadius:12, padding:"11px 0", fontSize:13,
          cursor:"pointer", transition:"all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#c86c3a66"; e.currentTarget.style.color = "#c86c3a"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2018"; e.currentTarget.style.color = "#5a5050"; }}
      >Cancel Subscription</button>
    </div>
  );
}

function UnsubscribeDone({ onClose }) {
  return (
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:36, marginBottom:12}}>🙏</div>
      <h2 style={{color:"#f0e6d3", fontSize:17, fontWeight:700, margin:"0 0 10px"}}>Thanks for your feedback</h2>
      <p style={{color:"#8a7a6a", fontSize:13, lineHeight:1.7, margin:"0 0 20px"}}>
        Your subscription has been flagged for cancellation. To complete the process, please manage your subscription via your Stripe billing portal or contact us at{" "}
        <span style={{color:"#c8956c"}}>support@habla.app</span>.
      </p>
      <p style={{color:"#5a5050", fontSize:12, lineHeight:1.6, margin:"0 0 24px"}}>
        You'll continue to have access until the end of your current billing period.
      </p>
      <button
        onClick={onClose}
        style={{
          width:"100%", background:"none", border:"1px solid #2a2018",
          color:"#8a7a6a", borderRadius:12, padding:"11px 0", fontSize:13,
          cursor:"pointer",
        }}
      >Close</button>
    </div>
  );
}
