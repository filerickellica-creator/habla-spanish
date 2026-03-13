import { useState, useEffect } from "react";

export default function TrialModule({ userData, onExpired, onUpgrade, children }) {
  const [daysLeft, setDaysLeft] = useState(null);
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    if (!userData) return;
    const subStatus = userData.subscriptionStatus;
    if (subStatus === "active") { setStatus("active"); return; }
    if (subStatus === "expired") { setStatus("expired"); onExpired?.(); return; }
    if (subStatus === "trial") {
      const ts = userData.trialStartedAt;
      const startedAt = ts instanceof Date ? ts
        : typeof ts?.toDate === "function" ? ts.toDate()
        : new Date((ts?.seconds || 0) * 1000);
      const trialDays = userData.trialDays || 10;
      const daysElapsed = (Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
      const remaining = Math.max(0, Math.ceil(trialDays - daysElapsed));
      setDaysLeft(remaining);
      if (remaining <= 0) { setStatus("expired"); onExpired?.(); }
      else { setStatus("trial"); }
    }
  }, [userData]);

  if (status === "checking" || status === "expired") return null;
  return (
    <>
      {status === "trial" && daysLeft !== null && <TrialBanner daysLeft={daysLeft} onUpgrade={onUpgrade} />}
      {children}
    </>
  );
}

function TrialBanner({ daysLeft, onUpgrade }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const urgent = daysLeft <= 3;
  const color = urgent ? "#c86c3a" : "#c8956c";
  const bg = urgent ? "#1e0e06" : "#12100e";
  const border = urgent ? "#c86c3a44" : "#c8956c33";
  return (
    <div style={{
      position:"fixed",top:0,left:0,right:0,zIndex:999,
      background:bg,borderBottom:`1px solid ${border}`,
      padding:"10px 20px",display:"flex",alignItems:"center",
      justifyContent:"space-between",fontFamily:"sans-serif",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:16}}>{urgent ? "⚠️" : "✨"}</span>
        <span style={{fontSize:13,color:"#c8b896"}}>
          {urgent
            ? <><strong style={{color}}>{daysLeft} day{daysLeft!==1?"s":""} left</strong> in your free trial!</>
            : <><strong style={{color}}>{daysLeft} days left</strong> in your free trial.</>}
        </span>
        <button onClick={onUpgrade} style={{
          fontSize:12,fontWeight:700,color,border:`1px solid ${color}66`,
          borderRadius:20,padding:"3px 12px",background:"none",cursor:"pointer",marginLeft:6,
        }}>Upgrade →</button>
      </div>
      <button onClick={() => setDismissed(true)} style={{
        background:"none",border:"none",color:"#3a3540",cursor:"pointer",fontSize:18,
      }}>×</button>
    </div>
  );
}
