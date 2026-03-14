import TranslatorModule from "./TranslatorModule";
import VocabularyModules from "./VocabularyModules";
import { useState, useRef, useEffect, useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import AccountModule from "./M5_AccountModule";
const _fn = getFunctions();
const callCloudFn = httpsCallable(_fn, "callClaude");

const SCENARIOS = [
  { id: "cafe", emoji: "☕", label: "Café", color: "#c8956c", prompt: "You are a friendly Spanish barista at a cozy café in Madrid. Greet the customer warmly, take their order, and keep small talk going. Speak ONLY in Spanish. Keep replies to 1-2 short sentences." },
  { id: "market", emoji: "🛒", label: "Mercado", color: "#6cbf8a", prompt: "You are a vendor at a lively Spanish market selling fresh produce. Describe your items, negotiate prices, and chat. Speak ONLY in Spanish. Keep replies to 1-2 short sentences." },
  { id: "directions", emoji: "🗺️", label: "Direcciones y Transporte", color: "#6cb4c8", prompt: "You are a helpful local in a Spanish-speaking city assisting a tourist with directions and public transport. Help them navigate streets, find bus or metro stops, and use transportation vocabulary. Speak ONLY in Spanish. Keep replies to 1-2 short sentences." },
  { id: "restaurant", emoji: "🍽️", label: "Restaurante", color: "#c86c6c", prompt: "You are an enthusiastic waiter at a traditional Spanish restaurant. Describe the menu and take orders. Speak ONLY in Spanish. Keep replies to 1-2 short sentences." },
  { id: "amigo", emoji: "👋", label: "Amigo", color: "#a06cc8", prompt: "You are a fun, casual Spanish-speaking friend catching up. Talk about weekend plans and everyday life. Speak ONLY in Spanish. Keep replies to 1-2 short sentences." },
  { id: "jobinterview", emoji: "💼", label: "Entrevista de Trabajo", color: "#c8a84b", prompt: "You are a professional interviewer conducting a job interview in Spanish. Ask about the candidate's experience, skills, and goals. Use formal language. Speak ONLY in Spanish. Keep replies to 1-2 short sentences." },
];

const LEVELS = [
  { id: "beginner", label: "Principiante 🌱", note: "Add English translations in parentheses after each Spanish phrase." },
  { id: "intermediate", label: "Intermedio 🌿", note: "Speak natural Spanish. If the user makes an error, gently correct it once." },
  { id: "advanced", label: "Avanzado 🌳", note: "Speak full natural Spanish only. Correct subtle grammar and vocabulary errors." },
];

function Waveform({ active, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, height: 40 }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 4, background: color,
          height: active ? undefined : 6, minHeight: 6, maxHeight: 36,
          animation: active ? `wave ${0.6 + (i % 4) * 0.15}s ease-in-out ${i * 0.06}s infinite alternate` : "none",
          opacity: active ? 1 : 0.3, transition: "opacity 0.3s",
        }} />
      ))}
    </div>
  );
}

function extractSpanishOnly(text) {
  return text
    .replace(/\([^)]*[a-zA-Z]{3,}[^)]*\)/g, '')
    .replace(/\[[^\]]*[a-zA-Z]{3,}[^\]]*\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function ApiKeyScreen({ onSave }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const handleSave = () => {
    if (!input.startsWith("sk-ant-")) {
      setError("Key should start with sk-ant-");
      return;
    }
    localStorage.setItem("habla_api_key", input.trim());
    onSave(input.trim());
  };
  return (
    <div style={{
      minHeight: "100vh", background: "#0e0e14", color: "#e8e0d5",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 24px", fontFamily: "sans-serif",
    }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } } * { box-sizing: border-box; }`}</style>
      <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp 0.5s ease" }}>
        <div style={{ fontSize: 44, marginBottom: 12, textAlign: "center" }}>🇪🇸</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 900, textAlign: "center", margin: "0 0 8px", color: "#e8e0d5" }}>Habla</h1>
        <p style={{ textAlign: "center", color: "#6b6560", fontSize: 13, marginBottom: 32, letterSpacing: 2, textTransform: "uppercase" }}>Voice Spanish Practice</p>

        <div style={{ background: "#12121a", border: "1px solid #2a2a38", borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 13, color: "#8a8075", marginBottom: 16, lineHeight: 1.6 }}>
            Enter your <strong style={{ color: "#c8956c" }}>Anthropic API key</strong> to get started. Your key is stored only in your browser.
          </div>
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(""); }}
            placeholder="sk-ant-..."
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 10,
              background: "#0e0e14", border: "1.5px solid #2a2a38",
              color: "#e8e0d5", fontSize: 14, outline: "none",
              marginBottom: 8, fontFamily: "monospace",
            }}
            onFocus={e => e.target.style.borderColor = "#c8956c"}
            onBlur={e => e.target.style.borderColor = "#2a2a38"}
            onKeyDown={e => e.key === "Enter" && handleSave()}
          />
          {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 8 }}>⚠️ {error}</div>}
          <button onClick={handleSave} style={{
            width: "100%", padding: "12px", borderRadius: 10,
            background: "linear-gradient(135deg, #c8956c, #a06cc8)",
            border: "none", color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: "pointer", marginTop: 4,
          }}>Start Practicing →</button>
          <div style={{ marginTop: 14, fontSize: 11, color: "#3a3a4a", textAlign: "center" }}>
            Get your key at <span style={{ color: "#c8956c" }}>console.anthropic.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SpanishVoice({ user, userData, controls }) {
  const [screen, setScreen] = useState("home");
  const [scenario, setScenario] = useState(null);
  const [level, setLevel] = useState("beginner");
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("idle");
  const [showAccount, setShowAccount] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiText, setAiText] = useState("");
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);
  const [showTranslations, setShowTranslations] = useState(true);
  const [hintLoading, setHintLoading] = useState(false);
  const [hint, setHint] = useState("");
  const [grammarLoading, setGrammarLoading] = useState(false);
  const [corrections, setCorrections] = useState({});

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setSupported(false);
      return;
    }
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(stream => { stream.getTracks().forEach(t => t.stop()); })
      .catch(() => setSupported(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiText]);

  const clearApiKey = () => {
    setScreen("home");
    synthRef.current.cancel();
  };

  const speak = useCallback((text) => {
    synthRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "es-ES";
    utter.rate = 0.92;
    utter.pitch = 1.05;
    const voices = synthRef.current.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith("es"));
    if (spanishVoice) utter.voice = spanishVoice;
    utter.onstart = () => setStatus("speaking");
    utter.onend = () => setStatus("idle");
    utter.onerror = () => setStatus("idle");
    synthRef.current.speak(utter);
  }, []);

  const callClaude = useCallback(async (userText, currentMessages, scen, lvl) => {
    setStatus("thinking");
    setError("");
    const levelInfo = LEVELS.find(l => l.id === lvl);
    const systemPrompt = `${scen.prompt} ${levelInfo.note} Be warm and encouraging. Never break character.`;
    const apiMessages = [
      ...currentMessages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })),
      { role: "user", content: userText },
    ];
    try {
      const _result = await callCloudFn({ system: systemPrompt, messages: apiMessages, max_tokens: 1000 });
      const data = { content: [{ type: "text", text: _result.data?.reply || "Lo siento, no entendí." }] };
      console.log("API response:", JSON.stringify(data)); const reply = data.content?.find(b => b.type === "text")?.text || "Lo siento, no entendí.";
      setAiText(reply);
      const updated = [...currentMessages, { role: "user", text: userText }, { role: "ai", text: reply }];
      setMessages(updated);
      speak(extractSpanishOnly(reply));
      return updated;
    } catch {
      setError("Connection error. Tap the mic to try again.");
      setStatus("idle");
    }
  }, [speak]);

  const startListening = useCallback(() => {
    if (status !== "idle") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => { setStatus("listening"); setTranscript(""); setHint(""); };
    recognition.onend = async () => {
      const finalTranscript = recognitionRef._lastTranscript;
      if (finalTranscript?.trim()) {
        await callClaude(finalTranscript.trim(), messages, scenario, level);
      } else {
        setStatus("idle");
      }
    };
    recognition.onerror = () => { setError("Couldn't hear you. Try again!"); setStatus("idle"); };
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(t);
      recognitionRef._lastTranscript = t;
    };
    recognitionRef.current = recognition;
    recognition.start();
  }, [status, messages, scenario, level, callClaude]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const getHint = useCallback(async () => {
    if (hintLoading || messages.length === 0) return;
    setHintLoading(true);
    setHint("");
    const lastAI = [...messages].reverse().find(m => m.role === "ai");
    if (!lastAI) { setHintLoading(false); return; }
    const levelInfo = LEVELS.find(l => l.id === level);
    try {
      const _hr = await callCloudFn({ system: `You are a Spanish tutor helping a ${levelInfo.label} student practice conversation in the scenario: ${scenario?.label}.`, messages: [{ role: "user", content: `The AI just said: "${lastAI.text}"\n\nGive 2-3 short example responses in Spanish with English translations. Be encouraging and brief.` }], max_tokens: 1000 });
      const data = { content: [{ type: "text", text: _hr.data?.reply || "" }] };
      setHint(data.content?.find(b => b.type === "text")?.text || "Try responding naturally!");
    } catch { setHint("Connection error. Try again!"); }
    setHintLoading(false);
  }, [hintLoading, messages, level, scenario]);

  const checkGrammar = useCallback(async (text, messageIndex) => {
    if (grammarLoading) return;
    setGrammarLoading(true);
    try {
      const _gr = await callCloudFn({ system: "You are a concise Spanish grammar tutor. Return a JSON object only - no extra text, no markdown. Fields: { \"hasErrors\": boolean, \"corrected\": string, \"errors\": [ { \"original\": string, \"fix\": string, \"explanation\": string } ], \"praise\": string }", messages: [{ role: "user", content: `Student said: "${text}"` }], max_tokens: 1000 });
      const data = { content: [{ type: "text", text: _gr.data?.reply || "{}" }] };
      const raw = data.content?.find(b => b.type === "text")?.text || "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setCorrections(prev => ({ ...prev, [messageIndex]: parsed }));
    } catch {
      setCorrections(prev => ({ ...prev, [messageIndex]: { hasErrors: false, corrected: text, errors: [], praise: "Keep practising!" } }));
    }
    setGrammarLoading(false);
  }, [grammarLoading]);

  const startScenario = async (s) => {
    synthRef.current.cancel();
    setScenario(s);
    setMessages([]);
    setTranscript("");
    setAiText("");
    setError("");
    setHint("");
    setCorrections({});
    setScreen("chat");
    setStatus("thinking");
    const levelInfo = LEVELS.find(l => l.id === level);
    const systemPrompt = `${s.prompt} ${levelInfo.note} Be warm and encouraging. Never break character.`;
    try {
      const _sr = await callCloudFn({ system: systemPrompt, messages: [{ role: "user", content: "Start the conversation naturally with a greeting." }], max_tokens: 1000 });
      const data = { content: [{ type: "text", text: _sr.data?.reply || "¡Hola!" }] };
      const reply = data.content?.find(b => b.type === "text")?.text || "¡Hola!";
      setAiText(reply);
      setMessages([{ role: "ai", text: reply }]);
      speak(extractSpanishOnly(reply));
    } catch {
      setError("Connection error.");
      setStatus("idle");
    }
  };

  const handleBack = () => {
    synthRef.current.cancel();
    recognitionRef.current?.stop();
    setScreen("home");
    setStatus("idle");
  };

  const accentColor = scenario?.color || "#c8956c";


  if (screen === "home") return (
    <div style={{
      minHeight: "100vh", background: "#0e0e14", color: "#e8e0d5",
      fontFamily: "'Palatino Linotype', Georgia, serif",
      display: "flex", flexDirection: "column", alignItems: "center", padding: "0 0 48px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap');
        @keyframes wave { from { height: 6px; } to { height: 32px; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 420, padding: "52px 24px 0", animation: "fadeUp 0.6s ease" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🇪🇸</div>
            <button onClick={() => setShowAccount(true)} style={{
              background: "none", border: "1px solid #2a2a38", color: "#3a3a4a",
              borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer",
              marginTop: 8, transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "#a78bfa"; e.currentTarget.style.borderColor = "#a78bfa"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#3a3a4a"; e.currentTarget.style.borderColor = "#2a2a38"; }}
            >👤 Account</button>
            <button onClick={() => controls && controls.signOut()} style={{ background: "none", border: "1px solid #2a2a38", color: "#3a3a4a", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer", marginTop: 8, marginLeft: 6, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "#f87171"; }} onMouseLeave={e => { e.currentTarget.style.color = "#3a3a4a"; e.currentTarget.style.borderColor = "#2a2a38"; }}>🚪 Sign Out</button>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 38, fontWeight: 900, margin: "0 0 6px", color: "#e8e0d5", letterSpacing: "-1px" }}>Habla</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#6b6560", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif" }}>Voice Spanish Practice</p>
          <p style={{ margin: "14px 0 0", fontSize: 15, color: "#8a8075", lineHeight: 1.7, fontFamily: "sans-serif", fontStyle: "italic" }}>Speak naturally. Your AI conversation partner listens, responds in Spanish, and helps you improve.</p>
        </div>
        {!supported && (
          <div style={{ background: "#2a1a1a", border: "1px solid #c86c6c", borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 13, color: "#f87171", fontFamily: "sans-serif" }}>
            ⚠️ Your browser does not support speech recognition. Please use Chrome or Safari.
          </div>
        )}
        <div style={{ marginBottom: 28 }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, color: "#4a4540", fontFamily: "sans-serif", letterSpacing: 3, textTransform: "uppercase" }}>Level</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {LEVELS.map(l => (
              <button key={l.id} onClick={() => setLevel(l.id)} style={{
                padding: "12px 16px", borderRadius: 10, textAlign: "left",
                border: `1.5px solid ${level === l.id ? "#c8956c" : "#1e1e2a"}`,
                background: level === l.id ? "#c8956c18" : "#12121a",
                color: level === l.id ? "#e8d5c0" : "#5a5555",
                cursor: "pointer", fontFamily: "sans-serif", fontSize: 14, transition: "all 0.2s",
              }}>{l.label}</button>
            ))}
          </div>
        </div>
        <div>
        {/* Translator */}
        <TranslatorModule />

          <p style={{ margin: "0 0 10px", fontSize: 10, color: "#4a4540", fontFamily: "sans-serif", letterSpacing: 3, textTransform: "uppercase" }}>Scenario</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {SCENARIOS.map((s, i) => (
              <button key={s.id} onClick={() => startScenario(s)} disabled={!supported} style={{
                padding: "18px 14px", borderRadius: 14, border: "1.5px solid #1e1e2a",
                background: "#12121a", cursor: supported ? "pointer" : "not-allowed", textAlign: "left",
                animation: `fadeUp 0.5s ease ${i * 0.07}s both`, transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.background = `${s.color}12`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e2a"; e.currentTarget.style.background = "#12121a"; }}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>{s.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#c8c0b8", fontFamily: "sans-serif" }}>{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
        <button onClick={() => setScreen("vocab")} style={{ marginTop: 20, width: "100%", padding: "14px 16px", borderRadius: 14, border: "1.5px solid #1e1e2a", background: "#12121a", color: "#8a8075", cursor: "pointer", fontFamily: "sans-serif", fontSize: 14, textAlign: "left", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 12 }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#c4b5fd"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e2a"; e.currentTarget.style.color = "#8a8075"; }}>
          <span style={{ fontSize: 22 }}>📚</span>
          <div><div style={{ fontWeight: 700, fontSize: 14 }}>Vocabulario</div><div style={{ fontSize: 12, marginTop: 2, opacity: 0.6 }}>500 words · 8 modules · flip cards</div></div>
        </button>
    </div>
  );

  if (screen === "vocab") return (
    <div style={{ minHeight: "100vh", background: "#0e0e14", color: "#e8e0d5" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #1e1e2a", position: "sticky", top: 0, background: "#0e0e14", zIndex: 10 }}>
        <button onClick={() => setScreen("home")} style={{ background: "#18181f", border: "1px solid #2a2a38", color: "#6b6560", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#e8e0d5" }}>📚 Vocabulario</span>
      </div>
      <VocabularyModules />
    </div>
  );


  const isListening = status === "listening";
  const isThinking = status === "thinking";
  const isSpeaking = status === "speaking";

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e14", color: "#e8e0d5", fontFamily: "sans-serif", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        @keyframes wave { from { height: 6px; } to { height: 32px; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ripple { 0%{transform:scale(1);opacity:0.5;} 100%{transform:scale(2.8);opacity:0;} }
        @keyframes pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; }
      `}</style>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #1e1e2a", background: "#0e0e14ee", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(8px)" }}>
        <button onClick={handleBack} style={{ background: "#18181f", border: "1px solid #2a2a38", color: "#6b6560", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <span style={{ fontSize: 22 }}>{scenario?.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#e8e0d5", fontWeight: 700 }}>{scenario?.label}</div>
          <div style={{ fontSize: 11, color: accentColor, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 1 }}>{LEVELS.find(l => l.id === level)?.label.split(" ")[0]}</div>
        </div>
        <div style={{ fontSize: 11, color: isListening ? "#4ade80" : isThinking ? "#facc15" : isSpeaking ? accentColor : "#3a3a4a", letterSpacing: 1, textTransform: "uppercase", transition: "color 0.3s" }}>
          {isListening ? "Listening..." : isThinking ? "Thinking..." : isSpeaking ? "Speaking..." : "Ready"}
        </div>
        <button onClick={() => setShowTranslations(v => !v)} style={{ background: showTranslations ? accentColor + "22" : "#18181f", border: `1px solid ${showTranslations ? accentColor + "66" : "#2a2a38"}`, color: showTranslations ? accentColor : "#3a3a4a", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5, textTransform: "uppercase", transition: "all 0.2s" }}>
          {showTranslations ? "🇬🇧 EN" : "🙈 EN"}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", animation: "fadeUp 0.3s ease" }}>
            <div style={{ maxWidth: "80%", padding: "12px 16px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? `${accentColor}25` : "#18181f", border: `1px solid ${m.role === "user" ? accentColor + "50" : "#2a2a38"}`, color: m.role === "user" ? "#e8d5c0" : "#d8d0c8", fontSize: 15, lineHeight: 1.65 }}>
              {m.role === "ai" && !showTranslations ? extractSpanishOnly(m.text) : m.text}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, padding: "0 4px" }}>
              <div style={{ fontSize: 10, color: "#3a3a4a" }}>{m.role === "ai" ? `🇪🇸 ${scenario?.label}` : "Tú"}</div>
              {m.role === "user" && !corrections[i] && (
                <button onClick={() => checkGrammar(m.text, i)} disabled={grammarLoading}
                  style={{ background: "none", border: "1px solid #2a2a42", color: "#4a4a6a", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#4f8ef7"; e.currentTarget.style.color = "#4f8ef7"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a42"; e.currentTarget.style.color = "#4a4a6a"; }}
                >{grammarLoading ? "checking…" : "✏️ Check my Spanish"}</button>
              )}
            </div>
            {m.role === "user" && corrections[i] && (
              <div style={{ maxWidth: "88%", marginTop: 6, background: corrections[i].hasErrors ? "#0f1a2e" : "#0d1f14", border: `1px solid ${corrections[i].hasErrors ? "#4f8ef766" : "#22c97a66"}`, borderRadius: 12, padding: "12px 14px", animation: "fadeUp 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: corrections[i].hasErrors ? "#4f8ef7" : "#22c97a" }}>{corrections[i].hasErrors ? "✏️ Grammar Check" : "✅ Grammar Check"}</span>
                  <button onClick={() => setCorrections(prev => { const n = { ...prev }; delete n[i]; return n; })} style={{ background: "none", border: "none", color: "#3a3a4a", fontSize: 11, cursor: "pointer", padding: 0 }}>✕</button>
                </div>
                <div style={{ fontSize: 12, color: "#6b8a6b", fontStyle: "italic", marginBottom: corrections[i].hasErrors ? 10 : 0 }}>{corrections[i].praise}</div>
                {corrections[i].hasErrors && (
                  <>
                    <div style={{ borderTop: "1px solid #1e2a3a", paddingTop: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 11, color: "#4a5a7a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Corrected</div>
                      <div style={{ fontSize: 14, color: "#a8d4ff", fontWeight: 600 }}>{corrections[i].corrected}</div>
                    </div>
                    {corrections[i].errors.map((err, j) => (
                      <div key={j} style={{ borderTop: "1px solid #1e2a3a", paddingTop: 8, marginTop: 6 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap", marginBottom: 3 }}>
                          <span style={{ fontSize: 13, color: "#f87171", textDecoration: "line-through" }}>{err.original}</span>
                          <span style={{ fontSize: 11, color: "#4a5a7a" }}>→</span>
                          <span style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>{err.fix}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: "#6b7a8a", lineHeight: 1.5 }}>{err.explanation}</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
        {hintLoading && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ background: "#1a1a2e", border: "1px solid #facc1544", borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "#facc15", fontStyle: "italic" }}>💡 Getting hint…</div>
          </div>
        )}
        {hint && !hintLoading && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ background: "#1a1a2e", border: "1px solid #facc1566", borderRadius: 14, padding: "14px 18px", maxWidth: "90%", boxShadow: "0 4px 20px #facc1520" }}>
              <div style={{ fontSize: 11, color: "#facc15", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>💡 Hint</div>
              <div style={{ fontSize: 13.5, color: "#e8e0d5", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{hint}</div>
              <button onClick={() => setHint("")} style={{ marginTop: 10, background: "none", border: "none", color: "#4a4540", fontSize: 11, cursor: "pointer", padding: 0 }}>✕ dismiss</button>
            </div>
          </div>
        )}
        {isThinking && (
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{ background: "#18181f", border: "1px solid #2a2a38", borderRadius: "16px 16px 16px 4px", padding: "14px 18px", display: "flex", gap: 5 }}>
              {[0,1,2].map(j => <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: accentColor, animation: `wave 0.8s ease ${j*0.2}s infinite alternate` }} />)}
            </div>
          </div>
        )}
        {error && <div style={{ textAlign: "center", color: "#f87171", fontSize: 13, background: "#2a1212", borderRadius: 10, padding: "10px 16px" }}>{error}</div>}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: "20px 20px 44px", borderTop: "1px solid #1e1e2a", background: "#0e0e14", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ minHeight: 40, width: "100%", textAlign: "center", fontSize: 15, color: isListening ? "#e8e0d5" : "#3a3640", fontStyle: "italic", lineHeight: 1.5, transition: "color 0.3s", padding: "0 16px" }}>
          {isListening && transcript ? `"${transcript}"` : isListening ? "Escuchando..." : isSpeaking ? "🔊 Hablando..." : isThinking ? "" : "Toca el micrófono para hablar"}
        </div>
        {isListening && <Waveform active={true} color={accentColor} />}
        {isSpeaking && <Waveform active={true} color={accentColor} />}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <button onClick={getHint} disabled={hintLoading || isThinking || isSpeaking || messages.length === 0}
            style={{ width: 48, height: 48, borderRadius: "50%", background: hint ? "#facc1522" : "#12121a", border: `1.5px solid ${hint ? "#facc1566" : "#2a2a42"}`, color: hint ? "#facc15" : "#3a3a4a", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", opacity: messages.length === 0 ? 0.3 : 1 }}>💡</button>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isListening && [1, 2].map(r => (
              <div key={r} style={{ position: "absolute", borderRadius: "50%", width: 80, height: 80, border: `2px solid ${accentColor}`, animation: `ripple 1.5s ease ${r * 0.5}s infinite`, pointerEvents: "none" }} />
            ))}
            <button onMouseDown={startListening} onMouseUp={stopListening}
              onTouchStart={(e) => { e.preventDefault(); startListening(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopListening(); }}
              disabled={isThinking || isSpeaking}
              style={{ width: 80, height: 80, borderRadius: "50%", background: isListening ? `radial-gradient(circle, ${accentColor}, ${accentColor}cc)` : isThinking || isSpeaking ? "#18181f" : `radial-gradient(circle, #1e1e2a, #16161e)`, border: `2.5px solid ${isListening ? accentColor : isThinking || isSpeaking ? "#2a2a38" : "#2a2a42"}`, cursor: isThinking || isSpeaking ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, transition: "all 0.2s", boxShadow: isListening ? `0 0 30px ${accentColor}60, 0 0 60px ${accentColor}30` : "0 4px 20px #00000060", animation: isListening ? "pulse 1s ease infinite" : "none", userSelect: "none", WebkitUserSelect: "none" }}>
              {isThinking ? "⌛" : isSpeaking ? "🔊" : "🎙️"}
            </button>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: "#2a2a38", letterSpacing: 1.5, textTransform: "uppercase" }}>
          {isListening ? "Release to send" : "Hold to speak"}
        </p>
      </div>
      {showAccount && user && (<AccountModule user={user} userData={userData || {subscriptionStatus:"trial", name: user.email}} controls={controls} onClose={() => setShowAccount(false)} />)}
    </div>
  );
}
