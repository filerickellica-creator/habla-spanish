import { useState, useEffect } from "react";
import { getAuth, confirmPasswordReset, verifyPasswordResetCode, applyActionCode } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import AuthModule from "./M1_AuthModule";
import TrialModule from "./M2_TrialModule";
import PaywallModule from "./M3_PaywallModule";
import SpanishVoice from "./SpanishVoice";

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAWHZYkRMqwLM5NLxfna_4HcKru2P1Gzm0",
  authDomain:        "habla-espanyol.firebaseapp.com",
  projectId:         "habla-espanyol",
  storageBucket:     "habla-espanyol.firebasestorage.app",
  messagingSenderId: "92424848474",
  appId:             "1:92424848474:web:80612d9b22f0f391ba4463",
};

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);

function ResetPasswordScreen({ oobCode }) {
  const [pw, setPw]         = useState("");
  const [pw2, setPw2]       = useState("");
  const [busy, setBusy]     = useState(false);
  const [done, setDone]     = useState(false);
  const [err, setErr]       = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setErr("");
    if (pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (pw !== pw2)    { setErr("Passwords do not match."); return; }
    setBusy(true);
    try {
      await verifyPasswordResetCode(auth, oobCode);
      await confirmPasswordReset(auth, oobCode, pw);
      setDone(true);
    } catch (ex) {
      setErr("This reset link is invalid or has expired. Please request a new one.");
    } finally {
      setBusy(false);
    }
  };

  const s = {
    root:  { minHeight: "100vh", background: "#0e0e14", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "Georgia, serif" },
    card:  { width: "100%", maxWidth: 400, background: "#12121a", border: "1px solid #1e1e2a", borderRadius: 20, padding: "36px 32px 28px", boxShadow: "0 24px 80px #00000070" },
    logo:  { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
    title: { fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 900, color: "#e8e0d5", letterSpacing: "-1px" },
    tag:   { margin: "0 0 26px", fontSize: 13.5, color: "#4a4540", fontStyle: "italic", fontFamily: "sans-serif" },
    label: { display: "block", fontSize: 10.5, fontWeight: 700, color: "#3a3640", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 7, fontFamily: "sans-serif" },
    input: { width: "100%", background: "#0a0a10", border: "1.5px solid #1a1a26", borderRadius: 10, padding: "11px 14px", fontSize: 15, color: "#e8e0d5", fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box", marginBottom: 15 },
    btn:   { marginTop: 6, width: "100%", padding: "13px", background: "linear-gradient(135deg, #c8956c, #a87040)", border: "none", borderRadius: 12, color: "#0e0e14", fontSize: 15, fontWeight: 800, cursor: "pointer", minHeight: 48 },
    err:   { background: "#1e0e0e", border: "1px solid #c86c6c33", borderRadius: 9, padding: "10px 14px", fontSize: 13, color: "#f87171", fontFamily: "sans-serif", marginBottom: 12 },
    ok:    { background: "#0a1a12", border: "1px solid #22c55e2a", borderRadius: 12, padding: "22px 18px", textAlign: "center", fontFamily: "sans-serif" },
  };

  return (
    <div style={s.root}>
      <div style={s.card}>
        <div style={s.logo}><span style={{ fontSize: 28 }}>🇪🇸</span><span style={s.title}>Habla</span></div>
        <p style={s.tag}>Set your new password</p>
        {done ? (
          <div style={s.ok}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 700, color: "#e8e0d5", marginBottom: 8 }}>Password updated!</div>
            <div style={{ fontSize: 13, color: "#6b6560", marginBottom: 16 }}>You can now sign in with your new password.</div>
            <button style={s.btn} onClick={() => window.location.href = "/"}>Go to Sign In</button>
          </div>
        ) : (
          <form onSubmit={handleReset} noValidate>
            {err && <div style={s.err}>{err}</div>}
            <label style={s.label}>New Password</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)}
                   placeholder="Min 6 characters" style={s.input} autoComplete="new-password" />
            <label style={s.label}>Confirm Password</label>
            <input type="password" value={pw2} onChange={e => setPw2(e.target.value)}
                   placeholder="Repeat password" style={s.input} autoComplete="new-password" />
            <button type="submit" style={s.btn} disabled={busy}>
              {busy ? "Saving..." : "Set New Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function VerifyEmailLanding({ oobCode, auth }) {
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [err, setErr]       = useState("");

  useEffect(() => {
    (async () => {
      try {
        await applyActionCode(auth, oobCode);
        // Update cached user so persistence has emailVerified: true
        if (auth.currentUser) {
          await auth.currentUser.reload();
          await auth.currentUser.getIdToken(true);
        }
        setStatus("success");
      } catch (ex) {
        setErr("This verification link is invalid or has expired. Please request a new one.");
        setStatus("error");
      }
    })();
  }, [oobCode, auth]);

  const s = {
    root:  { minHeight: "100vh", background: "#0e0e14", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "Georgia, serif" },
    card:  { width: "100%", maxWidth: 400, background: "#12121a", border: "1px solid #1e1e2a", borderRadius: 20, padding: "36px 32px 28px", boxShadow: "0 24px 80px #00000070" },
    logo:  { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
    title: { fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 900, color: "#e8e0d5", letterSpacing: "-1px" },
    tag:   { margin: "0 0 26px", fontSize: 13.5, color: "#4a4540", fontStyle: "italic", fontFamily: "sans-serif" },
    btn:   { marginTop: 6, width: "100%", padding: "13px", background: "linear-gradient(135deg, #c8956c, #a87040)", border: "none", borderRadius: 12, color: "#0e0e14", fontSize: 15, fontWeight: 800, cursor: "pointer", minHeight: 48 },
    err:   { background: "#1e0e0e", border: "1px solid #c86c6c33", borderRadius: 9, padding: "10px 14px", fontSize: 13, color: "#f87171", fontFamily: "sans-serif", marginBottom: 12 },
    ok:    { background: "#0a1a12", border: "1px solid #22c55e2a", borderRadius: 12, padding: "22px 18px", textAlign: "center", fontFamily: "sans-serif" },
  };

  return (
    <div style={s.root}>
      <div style={s.card}>
        <div style={s.logo}><span style={{ fontSize: 28 }}>🇪🇸</span><span style={s.title}>Habla</span></div>
        <p style={s.tag}>Email verification</p>
        {status === "verifying" && (
          <div style={s.ok}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
            <div style={{ fontWeight: 700, color: "#e8e0d5", marginBottom: 8 }}>Verifying your email...</div>
          </div>
        )}
        {status === "success" && (
          <div style={s.ok}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 700, color: "#e8e0d5", marginBottom: 8 }}>Email verified!</div>
            <div style={{ fontSize: 13, color: "#6b6560", marginBottom: 16 }}>Your email has been verified. You can now access Habla.</div>
            <button style={s.btn} onClick={() => window.location.href = "/"}>Continue to Habla</button>
          </div>
        )}
        {status === "error" && (
          <div>
            <div style={s.err}>{err}</div>
            <button style={s.btn} onClick={() => window.location.href = "/"}>Go to Sign In</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [expired, setExpired]             = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);

  // Detect Firebase password-reset action in URL
  const params  = new URLSearchParams(window.location.search);
  const mode    = params.get("mode");
  const oobCode = params.get("oobCode");

  if (mode === "resetPassword" && oobCode) {
    return <ResetPasswordScreen oobCode={oobCode} />;
  }

  if (mode === "verifyEmail" && oobCode) {
    return <VerifyEmailLanding oobCode={oobCode} auth={auth} />;
  }

  return (
    <AuthModule onReady={(user, userData, controls) => {
      if (currentUserData !== userData) setCurrentUserData(userData);
      if (expired || userData?.subscriptionStatus === "expired") {
        return <PaywallModule userData={userData} />;
      }
      return (
        <TrialModule userData={userData} onExpired={() => setExpired(true)} onUpgrade={() => setExpired(true)}>
          <SpanishVoice user={user} userData={userData} controls={controls} />
        </TrialModule>
      );
    }} />
  );
}
