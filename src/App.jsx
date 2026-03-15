import { useState, useEffect, useRef, useCallback } from "react";
import { getAuth, confirmPasswordReset, verifyPasswordResetCode, signOut } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import AuthModule from "./M1_AuthModule";
import TrialModule from "./M2_TrialModule";
import PaywallModule from "./M3_PaywallModule";
import SpanishVoice from "./SpanishVoice";
import HomescreenPrompt from "./HomescreenPrompt";

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

const INACTIVITY_TIMEOUT = 60 * 1000; // 1 minute

function useAutoSignOut(controlsRef) {
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (controlsRef.current?.signOut) controlsRef.current.signOut();
    }, INACTIVITY_TIMEOUT);
  }, [controlsRef]);

  useEffect(() => {
    const events = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);
}

export default function App() {
  const [expired, setExpired]             = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [showHomescreenPrompt, setShowHomescreenPrompt] = useState(false);
  const controlsRef = useRef(null);

  useAutoSignOut(controlsRef);

  // Detect Firebase password-reset action in URL
  const params  = new URLSearchParams(window.location.search);
  const mode    = params.get("mode");
  const oobCode = params.get("oobCode");

  if (mode === "resetPassword" && oobCode) {
    return <ResetPasswordScreen oobCode={oobCode} />;
  }

  return (
    <>
      <AuthModule onReady={(user, userData, controls) => {
        controlsRef.current = controls;
        if (currentUserData !== userData) setCurrentUserData(userData);

        // Show homescreen prompt once per session on login
        if (userData && !sessionStorage.getItem("habla_hs_shown")) {
          sessionStorage.setItem("habla_hs_shown", "1");
          setTimeout(() => setShowHomescreenPrompt(true), 1500);
        }

        if (expired || userData?.subscriptionStatus === "expired") {
          return <PaywallModule userData={userData} />;
        }
        return (
          <TrialModule userData={userData} onExpired={() => setExpired(true)} onUpgrade={() => setExpired(true)}>
            <SpanishVoice user={user} userData={userData} controls={controls} />
          </TrialModule>
        );
      }} />
      {showHomescreenPrompt && <HomescreenPrompt onClose={() => setShowHomescreenPrompt(false)} />}
    </>
  );
}
