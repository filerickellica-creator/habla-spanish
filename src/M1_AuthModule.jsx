import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { initializeApp, getApps }         from "firebase/app";
import { getAuth, onAuthStateChanged,
         signInWithEmailAndPassword,
         createUserWithEmailAndPassword,
         sendPasswordResetEmail,
         updateProfile, signOut }          from "firebase/auth";
import { getFirestore, doc, getDoc,
         setDoc, onSnapshot, serverTimestamp }         from "firebase/firestore";

const TERMS_URL = "https://firebasestorage.googleapis.com/v0/b/habla-espanyol.firebasestorage.app/o/Habla_Terms_of_Service.pdf?alt=media&token=0ca6ca67-66ab-45dd-8bd8-a00f47578d06";
const PRIVACY_URL = "https://firebasestorage.googleapis.com/v0/b/habla-espanyol.firebasestorage.app/o/Habla_Privacy_Policy.pdf?alt=media&token=3582199b-c6b6-4f3d-8f81-8963ad60980f";
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAWHZYkRMqwLM5NLxfna_4HcKru2P1Gzm0",
  authDomain:        "habla-espanyol.firebaseapp.com",
  projectId:         "habla-espanyol",
  storageBucket:     "habla-espanyol.firebasestorage.app",
  messagingSenderId: "92424848474",
  appId:             "1:92424848474:web:80612d9b22f0f391ba4463",
  measurementId:     "G-WYQJ6PE1ZP",
};

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const auth        = getAuth(firebaseApp);
const db          = getFirestore(firebaseApp);
const SESSION_KEY = "habla_session_token";
const generateSessionToken = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const AuthContext = createContext(null);
export const useAuth    = () => useContext(AuthContext);

async function fetchOrCreateUserDoc(firebaseUser) {
  const ref  = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  const freshDoc = {
    name:               firebaseUser.displayName || firebaseUser.email.split("@")[0],
    email:              firebaseUser.email,
    createdAt:          serverTimestamp(),
    trialStartedAt:     serverTimestamp(),
    trialDays:          10,
    subscriptionStatus: "trial",
    agreedToTerms:      true,
    agreedAt:           serverTimestamp(),
    subscriptionExpiry: null,
    stripeCustomerId:   null,
    totalConversations: 0,
    wordsLearned:       0,
  };
  await setDoc(ref, freshDoc);
  return { ...freshDoc, trialStartedAt: new Date() };
}

export default function AuthModule({ onReady }) {
  const [phase,    setPhase]    = useState("loading");
  const [user,     setUser]     = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    let unsubSession = null;
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (unsubSession) { unsubSession(); unsubSession = null; }
      if (fbUser) {
        const data = await fetchOrCreateUserDoc(fbUser);
        const userRef = doc(db, "users", fbUser.uid);
        const localToken = localStorage.getItem(SESSION_KEY);
        if (!localToken) {
          const newToken = generateSessionToken();
          localStorage.setItem(SESSION_KEY, newToken);
          await setDoc(userRef, { sessionToken: newToken }, { merge: true });
        } else if (localToken !== data.sessionToken) {
          localStorage.removeItem(SESSION_KEY);
          await signOut(auth);
          return;
        }
        setUser(fbUser);
        setUserData(data);
        setPhase("ready");
        unsubSession = onSnapshot(userRef, (snap) => {
          const firestoreToken = snap.data()?.sessionToken;
          const currentLocalToken = localStorage.getItem(SESSION_KEY);
          if (firestoreToken && currentLocalToken && firestoreToken !== currentLocalToken) {
            localStorage.removeItem(SESSION_KEY);
            signOut(auth);
          }
        });
      } else {
        setUser(null);
        setUserData(null);
        setPhase("auth");
      }
    });
    return () => { unsubAuth(); if (unsubSession) unsubSession(); };
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) setUserData(snap.data());
  }, [user]);

  const handleSignOut = useCallback(() => { localStorage.removeItem(SESSION_KEY); return signOut(auth); }, []);
  const controls = { signOut: handleSignOut, refreshUserData };

  if (phase === "loading") return <SplashScreen />;
  if (phase === "ready") return (
    <AuthContext.Provider value={{ user, userData, controls }}>
      {onReady(user, userData, controls)}
    </AuthContext.Provider>
  );
  return (
    <AuthContext.Provider value={{ user: null, userData: null, controls }}>
      <AuthWall auth={auth} />
    </AuthContext.Provider>
  );
}

function AuthWall({ auth }) {
  const [screen, setScreen] = useState("login");
  return (
    <div style={css.root}>
      <style>{globalCSS}</style>
      <div style={css.ambient} />
      <div style={css.card} key={screen}>
        <Logo />
        <Tagline screen={screen} />
        {screen === "login"  && <LoginForm  auth={auth} go={setScreen} />}
        {screen === "signup" && <SignupForm auth={auth} go={setScreen} />}
        {screen === "forgot" && <ForgotForm auth={auth} go={setScreen} />}
        <Footer />
      </div>
    </div>
  );
}

function LoginForm({ auth, go }) {
  const [email, setEmail] = useState("");
  const [pw,    setPw]    = useState("");
  const [show,  setShow]  = useState(false);
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState("");
  const [cleared, setCleared] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await signInWithEmailAndPassword(auth, email.trim(), pw); }
    catch (ex) { setErr(friendlyErr(ex.code)); }
    finally    { setBusy(false); }
  };
  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  };
  return (
    <form onSubmit={submit} style={css.form} noValidate>
      <TextField label="Email"    type="email" value={email} set={setEmail} placeholder="you@example.com" />
      <PwField   label="Password" value={pw}   set={setPw}   show={show} toggle={() => setShow(v => !v)} />
      {err && <ErrBox msg={err} />}
      <PrimaryBtn busy={busy} label="Sign In" />
      <GhostBtn label="Forgot password?" onClick={() => go("forgot")} />
      <button type="button" onClick={clearSession} style={css.clearBtn}>
        {cleared ? "Session cleared — try signing in" : "Signing in not working? Clear session"}
      </button>
      <Divider />
      <SwitchRow text="No account yet?" link="Create one free" onClick={() => go("signup")} />
    </form>
  );
}

function SignupForm({ auth, go }) {
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [pw,    setPw]    = useState("");
  const [show,  setShow]  = useState(false);
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState("");
  const [agreed, setAgreed] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (!agreed) { setErr("Please accept the Terms of Service and Privacy Policy."); return; }
    if (!name.trim())  { setErr("Please enter your name."); return; }
    if (pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch (ex) { setErr(friendlyErr(ex.code)); }
    finally      { setBusy(false); }
  };
  return (
    <form onSubmit={submit} style={css.form} noValidate>
      <TextField label="Your name" type="text"  value={name}  set={setName}  placeholder="Maria Garcia" />
      <TextField label="Email"     type="email" value={email} set={setEmail} placeholder="you@example.com" />
      <PwField   label="Password"  value={pw}   set={setPw}   show={show}
                 toggle={() => setShow(v => !v)} hint="Minimum 6 characters" />
      {err && <ErrBox msg={err} />}
      <AgreeCheckbox agreed={agreed} setAgreed={setAgreed} />
      <PrimaryBtn busy={busy} label="Create Account" />
      <Divider />
      <SwitchRow text="Already have an account?" link="Sign in" onClick={() => go("login")} />
    </form>
  );
}

function ForgotForm({ auth, go }) {
  const [email, setEmail] = useState("");
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState("");
  const [sent,  setSent]  = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await sendPasswordResetEmail(auth, email.trim()); setSent(true); }
    catch (ex) { setErr(friendlyErr(ex.code)); }
    finally    { setBusy(false); }
  };
  if (sent) return (
    <div style={css.form}>
      <div style={css.successBox}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📬</div>
        <div style={{ fontWeight: 700, color: "#e8e0d5", marginBottom: 4 }}>Check your inbox</div>
        <div style={{ fontSize: 13, color: "#6b6560", lineHeight: 1.6 }}>
          Reset link sent to <strong style={{ color: "#c8b896" }}>{email}</strong>.<br/>
          Check spam if you do not see it.
        </div>
      </div>
      <GhostBtn label="Back to sign in" onClick={() => go("login")} />
    </div>
  );
  return (
    <form onSubmit={submit} style={css.form} noValidate>
      <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "#6b6560", fontFamily: "sans-serif", lineHeight: 1.65 }}>
        Enter your email and we will send a link to reset your password.
      </p>
      <TextField label="Email" type="email" value={email} set={setEmail} placeholder="you@example.com" />
      {err && <ErrBox msg={err} />}
      <PrimaryBtn busy={busy} label="Send Reset Link" />
      <GhostBtn label="Back to sign in" onClick={() => go("login")} />
    </form>
  );
}

function SplashScreen() {
  return (
    <div style={{ ...css.root, flexDirection: "column", gap: 14 }}>
      <style>{globalCSS}</style>
      <span style={{ fontSize: 36 }}>🇪🇸</span>
      <span style={css.logoText}>Habla</span>
      <span className="h-spin" style={css.spinner} />
    </div>
  );
}

const Logo      = () => <div style={css.logoRow}><span style={{ fontSize: 28 }}>🇪🇸</span><span style={css.logoText}>Habla</span></div>;
const Tagline   = ({ screen }) => <p style={css.tagline}>{{ login: "Welcome back. Bienvenido!", signup: "Start speaking Spanish today.", forgot: "Reset your password." }[screen]}</p>;
const TextField = ({ label, type, value, set, placeholder }) => (
  <div style={css.field}>
    <label style={css.label}>{label}</label>
    <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
           style={css.input} className="h-input" autoComplete={type === "email" ? "email" : "name"} />
  </div>
);
const PwField = ({ label, value, set, show, toggle, hint }) => (
  <div style={css.field}>
    <label style={css.label}>{label}</label>
    <div style={{ position: "relative" }}>
      <input type={show ? "text" : "password"} value={value} onChange={e => set(e.target.value)}
             placeholder="........" style={{ ...css.input, paddingRight: 44 }} className="h-input" autoComplete="current-password" />
      <button type="button" onClick={toggle} style={css.eye} tabIndex={-1}>{show ? "hide" : "show"}</button>
    </div>
    {hint && <div style={css.hint}>{hint}</div>}
  </div>
);
const PrimaryBtn = ({ busy, label }) => (
  <button type="submit" disabled={busy} style={css.primaryBtn} className="h-btn">
    {busy ? <span className="h-spin" style={css.spinner} /> : label}
  </button>
);
const GhostBtn   = ({ label, onClick }) => <button type="button" onClick={onClick} style={css.ghostBtn}>{label}</button>;
const Divider    = () => <div style={css.divRow}><div style={css.divLine}/><span style={css.divLabel}>or</span><div style={css.divLine}/></div>;
const SwitchRow  = ({ text, link, onClick }) => <p style={css.switchRow}>{text}{" "}<button type="button" onClick={onClick} style={css.switchLink}>{link}</button></p>;
const TrialBadge = () => <div style={css.trialBadge}>10-day free trial, no credit card required</div>;
const AgreeCheckbox = ({ agreed, setAgreed }) => (
  <div style={{ display:"flex", alignItems:"flex-start", gap:10, margin:"4px 0 10px", fontFamily:"sans-serif" }}>
    <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)}
      style={{ marginTop:3, accentColor:"#c8956c", cursor:"pointer", flexShrink:0 }} />
    <label htmlFor="agree" style={{ fontSize:12, color:"#6b6560", lineHeight:1.6, cursor:"pointer" }}>
      I agree to the{" "}
      <a href={TERMS_URL} target="_blank" rel="noreferrer" style={{ color:"#c8956c" }}>Terms of Service</a>
      {" "}and{" "}
      <a href={PRIVACY_URL} target="_blank" rel="noreferrer" style={{ color:"#c8956c" }}>Privacy Policy</a>
    </label>
  </div>
);
const ErrBox     = ({ msg }) => <div style={css.errorBox}><span>!</span><span>{msg}</span></div>;
const Footer     = () => <p style={css.footer}>By continuing you agree to our <a href="#" style={css.footerLink}>Terms</a> and <a href="#" style={css.footerLink}>Privacy Policy</a></p>;

const friendlyErr = (code) => ({
  "auth/invalid-email":          "Please enter a valid email address.",
  "auth/user-not-found":         "No account found with that email.",
  "auth/wrong-password":         "Incorrect password. Try again.",
  "auth/invalid-credential":     "Incorrect email or password.",
  "auth/email-already-in-use":   "An account with that email already exists.",
  "auth/weak-password":          "Password must be at least 6 characters.",
  "auth/too-many-requests":      "Too many attempts. Please wait and try again.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/user-disabled":          "This account has been disabled.",
})[code] ?? "Something went wrong. Please try again.";

const css = {
  root:       { minHeight: "100vh", background: "#0e0e14", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", position: "relative", overflow: "hidden", fontFamily: "Georgia, serif" },
  ambient:    { position: "fixed", top: "0%", left: "50%", transform: "translateX(-50%)", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, #c8956c14 0%, transparent 68%)", pointerEvents: "none" },
  card:       { position: "relative", zIndex: 1, width: "100%", maxWidth: 400, background: "#12121a", border: "1px solid #1e1e2a", borderRadius: 20, padding: "36px 32px 24px", boxShadow: "0 24px 80px #00000070", animation: "cardIn 0.4s cubic-bezier(0.22,1,0.36,1) both" },
  logoRow:    { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  logoText:   { fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 900, color: "#e8e0d5", letterSpacing: "-1px" },
  tagline:    { margin: "0 0 26px", fontSize: 13.5, color: "#4a4540", fontStyle: "italic", fontFamily: "sans-serif" },
  form:       { display: "flex", flexDirection: "column" },
  field:      { marginBottom: 15 },
  label:      { display: "block", fontSize: 10.5, fontWeight: 700, color: "#3a3640", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 7, fontFamily: "sans-serif" },
  input:      { width: "100%", background: "#0a0a10", border: "1.5px solid #1a1a26", borderRadius: 10, padding: "11px 14px", fontSize: 15, color: "#e8e0d5", fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" },
  hint:       { fontSize: 11, color: "#3a3a4a", marginTop: 5, fontFamily: "sans-serif" },
  eye:        { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#555", padding: 0 },
  primaryBtn: { marginTop: 6, width: "100%", padding: "13px", background: "linear-gradient(135deg, #c8956c, #a87040)", border: "none", borderRadius: 12, color: "#0e0e14", fontSize: 15, fontWeight: 800, fontFamily: "Georgia, serif", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48 },
  ghostBtn:   { background: "none", border: "none", color: "#4a4540", cursor: "pointer", fontSize: 13, fontFamily: "sans-serif", padding: "10px 0 0", textDecoration: "underline", textAlign: "left" },
  clearBtn:   { background: "none", border: "none", color: "#2a2a3a", cursor: "pointer", fontSize: 11, fontFamily: "sans-serif", padding: "6px 0 0", textDecoration: "underline", textAlign: "left" },
  trialBadge: { marginTop: 11, textAlign: "center", fontSize: 12, color: "#7a6a5a", fontFamily: "sans-serif", background: "#c8956c08", border: "1px solid #c8956c1e", borderRadius: 8, padding: "8px 12px" },
  divRow:     { display: "flex", alignItems: "center", gap: 12, margin: "18px 0" },
  divLine:    { flex: 1, height: 1, background: "#1a1a26" },
  divLabel:   { fontSize: 10, color: "#2a2a38", fontFamily: "sans-serif", letterSpacing: "1.2px", textTransform: "uppercase" },
  switchRow:  { margin: 0, fontSize: 13, color: "#4a4540", textAlign: "center", fontFamily: "sans-serif" },
  switchLink: { background: "none", border: "none", color: "#c8956c", cursor: "pointer", fontSize: 13, fontFamily: "sans-serif", padding: 0, textDecoration: "underline" },
  errorBox:   { background: "#1e0e0e", border: "1px solid #c86c6c33", borderRadius: 9, padding: "10px 14px", fontSize: 13, color: "#f87171", fontFamily: "sans-serif", display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6, lineHeight: 1.5 },
  successBox: { background: "#0a1a12", border: "1px solid #22c55e2a", borderRadius: 12, padding: "22px 18px", textAlign: "center", fontFamily: "sans-serif", marginBottom: 8 },
  spinner:    { display: "inline-block", width: 17, height: 17, border: "2px solid #0e0e1450", borderTopColor: "#0e0e14", borderRadius: "50%" },
  footer:     { margin: "20px 0 0", fontSize: 11, color: "#252530", textAlign: "center", fontFamily: "sans-serif" },
  footerLink: { color: "#353545" },
};

const globalCSS = `
  * { box-sizing: border-box; }
  .h-input:focus { border-color: #c8956c70 !important; box-shadow: 0 0 0 3px #c8956c0e !important; }
  .h-input::placeholder { color: #252535 !important; }
  .h-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
  .h-btn:disabled { opacity: 0.65; cursor: not-allowed; }
  .h-spin { animation: hSpin 0.7s linear infinite; }
  @keyframes hSpin { to { transform: rotate(360deg); } }
  @keyframes cardIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
`;
