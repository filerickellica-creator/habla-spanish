import { useState } from "react";
import { passwordStrength } from "./M1_AuthModule";

export default function AccountModule({ user, userData, controls, onClose }) {
  const [signingOut, setSigningOut] = useState(false);
  const [panel,      setPanel]      = useState(null); // "name" | "password" | "delete"

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
    <div style={s.overlay} onClick={onClose}>
      <div style={s.card} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: panel ? 16 : 28 }}>
          <h2 style={s.h2}>
            {panel === "name"     && "Change Name"}
            {panel === "password" && "Change Password"}
            {panel === "delete"   && "Delete Account"}
            {!panel               && "My Account"}
          </h2>
          <button onClick={panel ? () => setPanel(null) : onClose} style={s.closeBtn}>
            {panel ? "← Back" : "×"}
          </button>
        </div>

        {/* — Sub-panels — */}
        {panel === "name"     && <ChangeNamePanel     controls={controls} onDone={() => setPanel(null)} />}
        {panel === "password" && <ChangePasswordPanel controls={controls} onDone={() => setPanel(null)} />}
        {panel === "delete"   && <DeleteAccountPanel  controls={controls} />}

        {/* — Main panel — */}
        {!panel && <>
          {/* Avatar + Name */}
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24 }}>
            <div style={s.avatar}>
              {(userData?.name || user?.email || "?")[0].toUpperCase()}
            </div>
            <div>
              <p style={s.userName}>{userData?.name || "User"}</p>
              <p style={s.userEmail}>{user?.email}</p>
              <EmailVerifiedBadge user={user} controls={controls} />
            </div>
          </div>

          <div style={s.divider} />

          {/* Subscription */}
          <div style={{ background: sub.bg, border:`1px solid ${sub.color}33`, borderRadius:12, padding:"14px 18px", marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={s.planLabel}>Plan</span>
              <span style={{ color: sub.color, fontSize:12, fontWeight:700, background:`${sub.color}22`, padding:"3px 10px", borderRadius:20 }}>
                {sub.label}
              </span>
            </div>
            {daysLeft !== null && (
              <p style={s.planMeta}>{daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining in your trial</p>
            )}
            {userData?.subscriptionStatus === "active" && userData?.subscriptionExpiry && (
              <p style={s.planMeta}>
                Renews {new Date(userData.subscriptionExpiry?.seconds * 1000).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Upgrade button */}
          {userData?.subscriptionStatus !== "active" && (
            <a href="#upgrade" style={s.upgradeBtn}>Upgrade to Premium →</a>
          )}

          {/* Account actions */}
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
            <ActionRow label="Change Name"     onClick={() => setPanel("name")} />
            <ActionRow label="Change Password" onClick={() => setPanel("password")} />
          </div>

          {/* Sign out */}
          <button onClick={handleSignOut} disabled={signingOut} style={s.signOutBtn}>
            {signingOut ? "Signing out..." : "Sign Out"}
          </button>

          {/* Delete account */}
          <button onClick={() => setPanel("delete")} style={s.deleteLink}>
            Delete account
          </button>
        </>}

      </div>
    </div>
  );
}

/* ---- Email Verified Badge ---- */
function EmailVerifiedBadge({ user, controls }) {
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [checking, setChecking] = useState(false);

  if (user?.emailVerified) return (
    <span style={{ fontSize:11, color:"#6cbf8a", fontFamily:"sans-serif" }}>✓ Email verified</span>
  );

  const resend = async () => {
    setSending(true);
    try { await controls.resendVerification(); setSent(true); }
    catch { /* silently fail */ }
    finally { setSending(false); }
  };

  const checkVerified = async () => {
    setChecking(true);
    try { await controls.reloadUser(); }
    catch { /* ignore */ }
    finally { setChecking(false); }
  };

  return (
    <div style={{ marginTop:2 }}>
      <span style={{ fontSize:11, color:"#f97316", fontFamily:"sans-serif" }}>⚠ Email not verified</span>
      <div style={{ display:"flex", gap:8, marginTop:4 }}>
        <button onClick={resend} disabled={sending || sent} style={s.microBtn}>
          {sent ? "Sent!" : sending ? "Sending…" : "Resend email"}
        </button>
        <button onClick={checkVerified} disabled={checking} style={s.microBtn}>
          {checking ? "Checking…" : "I've verified"}
        </button>
      </div>
    </div>
  );
}

/* ---- Change Name ---- */
function ChangeNamePanel({ controls, onDone }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");
  const [ok,   setOk]   = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (!name.trim()) { setErr("Name cannot be empty."); return; }
    setBusy(true);
    try {
      await controls.updateDisplayName(name.trim());
      setOk(true);
      setTimeout(onDone, 1200);
    } catch (ex) {
      setErr(ex.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <input
        type="text" value={name} onChange={e => setName(e.target.value)}
        placeholder="Your new name" autoComplete="name"
        style={s.input} className="h-account-input"
      />
      {err && <div style={s.err}>{err}</div>}
      {ok  && <div style={s.ok}>Name updated!</div>}
      <button type="submit" disabled={busy} style={s.actionBtn}>
        {busy ? "Saving…" : "Save Name"}
      </button>
    </form>
  );
}

/* ---- Change Password ---- */
function ChangePasswordPanel({ controls, onDone }) {
  const [current, setCurrent] = useState("");
  const [next,    setNext]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [showC,   setShowC]   = useState(false);
  const [showN,   setShowN]   = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState("");
  const [ok,      setOk]      = useState(false);

  const { score, checks } = passwordStrength(next);
  const strengthColors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (!current)          { setErr("Enter your current password."); return; }
    if (!checks.length)    { setErr("New password must be at least 8 characters."); return; }
    if (!checks.upper)     { setErr("New password must contain an uppercase letter."); return; }
    if (!checks.number)    { setErr("New password must contain a number."); return; }
    if (!checks.special)   { setErr("New password must contain a special character."); return; }
    if (next !== confirm)  { setErr("Passwords do not match."); return; }
    setBusy(true);
    try {
      await controls.updateUserPassword(current, next);
      setOk(true);
      setTimeout(onDone, 1400);
    } catch (ex) {
      const msg = ex.code === "auth/wrong-password" || ex.code === "auth/invalid-credential"
        ? "Current password is incorrect."
        : ex.code === "auth/requires-recent-login"
        ? "Please sign out and sign back in, then try again."
        : "Something went wrong. Please try again.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Current password */}
      <div>
        <label style={s.miniLabel}>Current Password</label>
        <div style={{ position:"relative" }}>
          <input type={showC ? "text" : "password"} value={current} onChange={e => setCurrent(e.target.value)}
                 placeholder="Current password" autoComplete="current-password"
                 style={{ ...s.input, paddingRight:44 }} className="h-account-input" />
          <button type="button" onClick={() => setShowC(v => !v)} style={s.eye}>{showC ? "hide" : "show"}</button>
        </div>
      </div>

      {/* New password */}
      <div>
        <label style={s.miniLabel}>New Password</label>
        <div style={{ position:"relative" }}>
          <input type={showN ? "text" : "password"} value={next} onChange={e => setNext(e.target.value)}
                 placeholder="New password" autoComplete="new-password"
                 style={{ ...s.input, paddingRight:44 }} className="h-account-input" />
          <button type="button" onClick={() => setShowN(v => !v)} style={s.eye}>{showN ? "hide" : "show"}</button>
        </div>
        {/* Strength bar */}
        {next && (
          <div style={{ marginTop:6 }}>
            <div style={{ display:"flex", gap:4, marginBottom:3 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ flex:1, height:3, borderRadius:99,
                  background: i <= score ? strengthColors[score] : "#1a1a26", transition:"background 0.2s" }} />
              ))}
            </div>
            <span style={{ fontSize:11, color: strengthColors[score] || "#555", fontFamily:"sans-serif" }}>
              {strengthLabels[score]}
            </span>
          </div>
        )}
        <div style={{ fontSize:11, color:"#3a3a4a", marginTop:4, fontFamily:"sans-serif" }}>
          8+ chars, uppercase, number, special character
        </div>
      </div>

      {/* Confirm */}
      <div>
        <label style={s.miniLabel}>Confirm New Password</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
               placeholder="Repeat new password" autoComplete="new-password"
               style={s.input} className="h-account-input" />
      </div>

      {err && <div style={s.err}>{err}</div>}
      {ok  && <div style={s.ok}>Password updated!</div>}
      <button type="submit" disabled={busy} style={s.actionBtn}>
        {busy ? "Updating…" : "Update Password"}
      </button>
    </form>
  );
}

/* ---- Delete Account ---- */
function DeleteAccountPanel({ controls }) {
  const [pw,       setPw]       = useState("");
  const [show,     setShow]     = useState(false);
  const [confirmed,setConfirmed]= useState(false);
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState("");

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (!pw) { setErr("Enter your password to confirm."); return; }
    setBusy(true);
    try {
      await controls.deleteAccount(pw);
      // auth state change will redirect to login automatically
    } catch (ex) {
      const msg = ex.code === "auth/wrong-password" || ex.code === "auth/invalid-credential"
        ? "Incorrect password."
        : "Something went wrong. Please try again.";
      setErr(msg);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ background:"#1e0a04", border:"1px solid #c86c3a33", borderRadius:10, padding:"14px 16px" }}>
        <p style={{ margin:0, fontSize:13, color:"#c86c3a", fontFamily:"sans-serif", lineHeight:1.6 }}>
          <strong>This action is permanent.</strong> Your account and all data will be deleted and cannot be recovered.
        </p>
      </div>
      <label style={s.miniLabel}>
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
               style={{ accentColor:"#c86c3a", marginRight:6 }} />
        I understand this cannot be undone
      </label>
      <div>
        <label style={s.miniLabel}>Confirm your password</label>
        <div style={{ position:"relative" }}>
          <input type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)}
                 placeholder="Your password" autoComplete="current-password"
                 style={{ ...s.input, paddingRight:44 }} className="h-account-input" />
          <button type="button" onClick={() => setShow(v => !v)} style={s.eye}>{show ? "hide" : "show"}</button>
        </div>
      </div>
      {err && <div style={s.err}>{err}</div>}
      <button type="submit" disabled={busy || !confirmed} style={{ ...s.actionBtn, background:"#c86c3a", opacity: (!confirmed) ? 0.5 : 1 }}>
        {busy ? "Deleting…" : "Delete My Account"}
      </button>
    </form>
  );
}

/* ---- Shared small components ---- */
const ActionRow = ({ label, onClick }) => (
  <button onClick={onClick} style={{
    display:"flex", justifyContent:"space-between", alignItems:"center",
    background:"#1a1510", border:"1px solid #2a2018", borderRadius:10,
    padding:"12px 16px", color:"#c8b896", fontSize:13, fontFamily:"sans-serif",
    cursor:"pointer", width:"100%", textAlign:"left",
  }}>
    {label} <span style={{ color:"#3a3530" }}>›</span>
  </button>
);

/* ---- Styles ---- */
const s = {
  overlay:    { position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  card:       { background:"#14110e", border:"1px solid #2a2018", borderRadius:20, padding:"32px 28px", width:"100%", maxWidth:380, boxShadow:"0 24px 64px rgba(0,0,0,0.6)" },
  h2:         { color:"#f0e6d3", fontSize:18, fontWeight:700, margin:0 },
  closeBtn:   { background:"none", border:"none", color:"#5a5050", cursor:"pointer", fontSize:14, fontFamily:"sans-serif", padding:0 },
  avatar:     { width:52, height:52, borderRadius:"50%", background:"#c86c3a22", border:"2px solid #c86c3a44", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:"#c8956c", fontFamily:"Georgia, serif" },
  userName:   { color:"#f0e6d3", fontSize:15, fontWeight:600, margin:"0 0 2px", fontFamily:"Georgia, serif" },
  userEmail:  { color:"#5a5050", fontSize:12, margin:"0 0 4px", fontFamily:"sans-serif" },
  divider:    { borderTop:"1px solid #1e1a14", marginBottom:20 },
  planLabel:  { color:"#8a7a6a", fontSize:12, letterSpacing:1, textTransform:"uppercase", fontFamily:"sans-serif" },
  planMeta:   { color:"#8a7a6a", fontSize:12, margin:"8px 0 0", fontFamily:"sans-serif" },
  upgradeBtn: { display:"block", textAlign:"center", background:"#c86c3a", color:"#fff", borderRadius:12, padding:"12px 0", fontSize:14, fontWeight:700, textDecoration:"none", marginBottom:12, transition:"opacity 0.2s", fontFamily:"sans-serif" },
  signOutBtn: { width:"100%", background:"none", border:"1px solid #2a2018", color:"#5a5050", borderRadius:12, padding:"11px 0", fontSize:13, cursor:"pointer", transition:"all 0.2s", fontFamily:"sans-serif" },
  deleteLink: { width:"100%", background:"none", border:"none", color:"#5a3a3a", fontSize:12, cursor:"pointer", marginTop:10, fontFamily:"sans-serif", textAlign:"center", textDecoration:"underline", padding:"4px 0" },
  input:      { width:"100%", background:"#0e0c0a", border:"1.5px solid #2a2018", borderRadius:10, padding:"10px 14px", fontSize:14, color:"#e8e0d5", fontFamily:"Georgia, serif", outline:"none", boxSizing:"border-box" },
  miniLabel:  { display:"block", fontSize:10.5, fontWeight:700, color:"#5a5050", letterSpacing:"1px", textTransform:"uppercase", marginBottom:5, fontFamily:"sans-serif" },
  eye:        { position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#555", padding:0 },
  actionBtn:  { width:"100%", padding:"12px", background:"linear-gradient(135deg, #c8956c, #a87040)", border:"none", borderRadius:12, color:"#0e0e14", fontSize:14, fontWeight:800, fontFamily:"Georgia, serif", cursor:"pointer", minHeight:44 },
  err:        { background:"#1e0e0e", border:"1px solid #c86c6c33", borderRadius:9, padding:"10px 14px", fontSize:13, color:"#f87171", fontFamily:"sans-serif" },
  ok:         { background:"#0a1a12", border:"1px solid #22c55e2a", borderRadius:9, padding:"10px 14px", fontSize:13, color:"#4ade80", fontFamily:"sans-serif", textAlign:"center" },
  microBtn:   { background:"none", border:"1px solid #3a2a1a", borderRadius:6, padding:"3px 10px", fontSize:11, color:"#8a6a4a", cursor:"pointer", fontFamily:"sans-serif" },
};
