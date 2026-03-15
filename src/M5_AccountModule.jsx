import { useState } from "react";

export default function AccountModule({ user, userData, controls, onClose, onSubscribe }) {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await controls.signOut();
  };

  const statusConfig = {
    trial:   { label: "Free Trial",    color: "#c8956c", bg: "#1e1408" },
    active:  { label: "Premium ✓",     color: "#6cbf8a", bg: "#081a0e" },
    expired: { label: "Trial Expired", color: "#c86c3a", bg: "#1e0a04" },
  };
  const sub = statusConfig[userData?.subscriptionStatus] || statusConfig.trial;

  const trialDaysLeft = () => {
    if (userData?.subscriptionStatus !== "trial") return null;
    const startedAt = userData.trialStartedAt?.toDate?.()
      || new Date((userData.trialStartedAt?.seconds || 0) * 1000);
    const elapsed = (Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil((userData.trialDays || 10) - elapsed));
  };
  const daysLeft = trialDaysLeft();

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:20,
    }} onClick={onClose}>
      <div style={{
        background:"#14110e", border:"1px solid #2a2018",
        borderRadius:20, padding:"32px 28px", width:"100%", maxWidth:380,
        boxShadow:"0 24px 64px rgba(0,0,0,0.6)",
      }} onClick={e => e.stopPropagation()}>

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

        {/* Subscription */}
        <div style={{
          background: sub.bg, border:`1px solid ${sub.color}33`,
          borderRadius:12, padding:"14px 18px", marginBottom:20,
        }}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <span style={{color:"#8a7a6a", fontSize:12, letterSpacing:1, textTransform:"uppercase"}}>Plan</span>
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
          {userData?.subscriptionStatus === "active" && userData?.subscriptionExpiry && (
            <p style={{color:"#8a7a6a", fontSize:12, margin:"8px 0 0"}}>
              Renews {new Date(userData.subscriptionExpiry?.seconds * 1000).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Subscribe button — only show for trial/expired */}
        {userData?.subscriptionStatus !== "active" && (
          <button onClick={onSubscribe} style={{
            display:"block", width:"100%", textAlign:"center",
            background:"#c86c3a", color:"#fff",
            borderRadius:12, padding:"12px 0", fontSize:14, fontWeight:700,
            border:"none", marginBottom:12, cursor:"pointer",
            transition:"opacity 0.2s",
          }}>Subscribe →</button>
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

      </div>
    </div>
  );
}
