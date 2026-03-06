import VocabularyModules from './VocabularyModules';
import { useState, useRef, useEffect, useCallback } from "react";

const SCENARIOS = [
  { id: "cafe", emoji: "☕", label: "Café", color: "#c8956c", prompt: "You are a friendly Spanish barista at a cozy café in Madrid. Greet the customer warmly, take their order, and keep small talk going. Speak ONLY in Spanish. Keep replies to 1-2 short sentences." },
  { id: "market", emoji: "🛒", label: "Mercado", color: "#6cbf8a", prompt: "You are a vendor at a lively Spanish market selling fresh produce. Describe your items, negotiate prices, and chat. Speak ONLY in Spanish. Keep replies to 1-2 short sentences." },
  { id: "directions", emoji: "🗺️", label: "Direcciones", color: "#6cb4c8", prompt: "You are a helpful local on the streets of Barcelona giving directions to a tourist. Use street vocabulary and helpful phrases. Speak ONLY in Spanish. Keep replies to 1-2 short sentences." },
  { id: "restaurant", emoji: "🍽️", label: "Restaurante", color: "#c86c6c", prompt: "You are an enthusiastic waiter at a traditional Spanish restaurant. Describe the menu and take orders. Speak ONLY in Spanish. Keep replies to 1-2 short sentences." },
  { id: "amigo", emoji: "👋", label: "Amigo", color: "#a06cc8", prompt: "You are a fun, casual Spanish-speaking friend catching up. Talk about weekend plans and everyday life. Speak ONLY in Spanish. Keep replies to 1-2 short sentences." },
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

export default function App() {
  const [screen, setScreen] = useState("setup"); // setup | home | chat
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("habla_api_key") || "");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [scenario, setScenario] = useState(null);
  const [level, setLevel] = useState("beginner");
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setSupported(false);
    }
    if (apiKey) setScreen("home");
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveApiKey = () => {
    const key = apiKeyInput.trim();
    if (!key.startsWith("sk-ant-")) {
      setError("Invalid key — it should start with sk-ant-");
      return;
    }
    localStorage.setItem("habla_api_key", key);
    setApiKey(key);
    setError("");
    setScreen("home");
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
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 300, system: systemPrompt, messages: apiMessages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const reply = data.content?.find(b => b.type === "text")?.text || "Lo siento.";
      const updated = [...currentMessages, { role: "user", text: userText }, { role: "ai", text: reply }];
      setMessages(updated);
      speak(reply);
      return updated;
    } catch (e) {
      setError(`Error: ${e.message}`);
      setStatus("idle");
    }
  }, [apiKey, speak]);

  const startListening = useCallback(() => {
    if (status !== "idle") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = true;
    let lastTranscript = "";
    recognition.onstart = () => { setStatus("listening"); setTranscript(""); };
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(t);
      lastTranscript = t;
    };
    recognition.onend = async () => {
      if (lastTranscript.trim()) {
        await callClaude(lastTranscript.trim(), messages, scenario, level);
      } else {
        setStatus("idle");
      }
    };
    recognition.onerror = () => { setError("Couldn't hear you. Try again!"); setStatus("idle"); };
    recognitionRef.current = recognition;
    recognition.start();
  }, [status, messages, scenario, level, callClaude]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startScenario = async (s) => {
    synthRef.current.cancel();
    setScenario(s);
    setMessages([]);
    setTranscript("");
    setError("");
    setScreen("chat");
    setStatus("thinking");
    const levelInfo = LEVELS.find(l => l.id === level);
    const systemPrompt = `${s.prompt} ${levelInfo.note} Be warm and encouraging.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 300, system: systemPrompt, messages: [{ role: "user", content: "Start the conversation naturally with a greeting." }] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const reply = data.content?.find(b => b.type === "text")?.text || "¡Hola!";
      setMessages([{ role: "ai", text: reply }]);
      speak(reply);
    } catch (e) {
      setError(`Error: ${e.message}`);
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
  const isListening = status === "listening";
  const isThinking = status === "thinking";
  const isSpeaking = status === "speaking";

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
    @keyframes wave { from { height: 6px; } to { height: 32px; } }
    @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes ripple { 0%{transform:scale(1);opacity:0.5;} 100%{transform:scale(2.8);opacity:0;} }
    @keyframes pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.06);} }
    @keyframes spin { to { transform: rotate(360deg); } }
    * { box-sizing: border-box; }
    body { margin: 0; background: #0e0e14; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
    input { font-family: sans-serif; }
  `;

  // ── SETUP SCREEN ──
  if (screen === "setup") return (
    <div style={{ minHeight: "100vh", background: "#0e0e14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "sans-serif" }}>
      <style>{globalStyles}</style>
      <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp 0.5s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🇪🇸</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, color: "#e8e0d5", margin: "0 0 8px" }}>Habla</h1>
          <p style={{ color: "#6b6560", fontSize: 14, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>Spanish Voice Practice</p>
        </div>

        <div style={{ background: "#12121a", border: "1px solid #2a2a38", borderRadius: 16, padding: 24 }}>
          <p style={{ color: "#8a8075", fontSize: 14, lineHeight: 1.7, margin: "0 0 20px" }}>
            To use this app, you need a free Anthropic API key. It only costs fractions of a cent per conversation.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, color: "#6b6560", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
              Your Anthropic API Key
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveApiKey()}
              placeholder="sk-ant-api03-..."
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 10,
                background: "#1a1a26", border: "1.5px solid #2a2a38",
                color: "#e8e0d5", fontSize: 14, outline: "none",
              }}
            />
          </div>

          {error && <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 16px" }}>{error}</p>}

          <button onClick={saveApiKey} style={{
            width: "100%", padding: "14px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #c8956c, #c8956caa)",
            color: "#0e0e14", fontSize: 15, fontWeight: 700, cursor: "pointer",
            marginBottom: 16,
          }}>
            Get Started →
          </button>

          <div style={{ borderTop: "1px solid #2a2a38", paddingTop: 16 }}>
            <p style={{ color: "#4a4545", fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              🔑 Get your free key at{" "}
              <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: "#c8956c" }}>
                console.anthropic.com
              </a>
              <br />
              🔒 Your key is stored only in your browser — never on any server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── HOME SCREEN ──
  if (screen === "home") return (
    <div style={{ minHeight: "100vh", background: "#0e0e14", color: "#e8e0d5", fontFamily: "sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 0 48px" }}>
      <style>{globalStyles}</style>
      <div style={{ width: "100%", maxWidth: 420, padding: "52px 24px 0", animation: "fadeUp 0.5s ease" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 44, marginBottom: 8 }}>🇪🇸</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 900, margin: "0 0 4px", color: "#e8e0d5", letterSpacing: "-1px" }}>Habla</h1>
              <p style={{ margin: 0, fontSize: 11, color: "#6b6560", letterSpacing: 3, textTransform: "uppercase" }}>Voice Spanish Practice</p>
            </div>
            <button onClick={() => { localStorage.removeItem("habla_api_key"); setApiKey(""); setScreen("setup"); }} style={{ background: "none", border: "1px solid #2a2a38", color: "#4a4545", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 11, marginTop: 8 }}>
              🔑 Key
            </button>
          </div>
          <p style={{ margin: "16px 0 0", fontSize: 15, color: "#8a8075", lineHeight: 1.7, fontStyle: "italic" }}>
            Speak naturally. Your AI partner listens, responds in Spanish, and helps you improve.
          </p>
        </div>

        {!supported && (
          <div style={{ background: "#2a1a1a", border: "1px solid #c86c6c", borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 13, color: "#f87171" }}>
            ⚠️ Use Chrome or Safari for speech recognition support.
          </div>
        )}

        <div style={{ marginBottom: 28 }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, color: "#4a4540", letterSpacing: 3, textTransform: "uppercase" }}>Your Level</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {LEVELS.map(l => (
              <button key={l.id} onClick={() => setLevel(l.id)} style={{
                padding: "12px 16px", borderRadius: 10, textAlign: "left",
                border: `1.5px solid ${level === l.id ? "#c8956c" : "#1e1e2a"}`,
                background: level === l.id ? "#c8956c18" : "#12121a",
                color: level === l.id ? "#e8d5c0" : "#5a5555",
                cursor: "pointer", fontSize: 14, transition: "all 0.2s",
              }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ margin: "0 0 10px", fontSize: 10, color: "#4a4540", letterSpacing: 3, textTransform: "uppercase" }}>Pick a Scenario</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {SCENARIOS.map((s, i) => (
              <button key={s.id} onClick={() => startScenario(s)} disabled={!supported} style={{
                padding: "18px 14px", borderRadius: 14, border: "1.5px solid #1e1e2a",
                background: "#12121a", cursor: supported ? "pointer" : "not-allowed",
                textAlign: "left", animation: `fadeUp 0.5s ease ${i * 0.07}s both`, transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.background = `${s.color}12`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e2a"; e.currentTarget.style.background = "#12121a"; }}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>{s.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#c8c0b8" }}>{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    <div style={{ marginTop: 24 }}>
        <p style={{ margin: "0 0 10px", fontSize: 10, color: "#4a4540", letterSpacing: 3, textTransform: "uppercase" }}>Vocabulario</p>
        <button onClick={() => setScreen("vocabulary")} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "1.5px solid #2a4a3a", background: "#0d1f17", cursor: "pointer", textAlign: "left", color: "#e8e0d5", fontSize: 14, fontWeight: 600 }}>
          �� Módulo de Vocabulario — 500 palabras
        </button>
      </div>
    </div>
  );

  if (screen === "vocabulary") return (
    <div style={{ minHeight: "100vh", background: "#0e0e14", color: "#e8e0d5", fontFamily: "sans-serif" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #1e1e2a", background: "#0e0e14ee", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => setScreen("home")} style={{ background: "#18181f", border: "1px solid #2a2a38", color: "#6b6560", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 16 }}>←</button>
        <span style={{ fontSize: 18, fontWeight: 700 }}>📚 Vocabulario</span>
      </div>
      <VocabularyModules />
    </div>
  );
  // ── CHAT SCREEN ──
  return (
    <div style={{ minHeight: "100vh", background: "#0e0e14", color: "#e8e0d5", fontFamily: "sans-serif", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <style>{globalStyles}</style>

      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #1e1e2a", background: "#0e0e14ee", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(8px)" }}>
        <button onClick={handleBack} style={{ background: "#18181f", border: "1px solid #2a2a38", color: "#6b6560", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <span style={{ fontSize: 22 }}>{scenario?.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#e8e0d5", fontWeight: 700 }}>{scenario?.label}</div>
          <div style={{ fontSize: 11, color: accentColor, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 1 }}>{LEVELS.find(l => l.id === level)?.label.split(" ")[0]}</div>
        </div>
        <div style={{ fontSize: 11, color: isListening ? "#4ade80" : isThinking ? "#facc15" : isSpeaking ? accentColor : "#3a3a4a", letterSpacing: 1, textTransform: "uppercase", transition: "color 0.3s" }}>
          {isListening ? "Listening" : isThinking ? "Thinking" : isSpeaking ? "Speaking" : "Ready"}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", animation: "fadeUp 0.3s ease" }}>
            <div style={{
              maxWidth: "80%", padding: "12px 16px",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.role === "user" ? `${accentColor}25` : "#18181f",
              border: `1px solid ${m.role === "user" ? accentColor + "50" : "#2a2a38"}`,
              color: m.role === "user" ? "#e8d5c0" : "#d8d0c8",
              fontSize: 15, lineHeight: 1.65,
            }}>
              {m.text}
            </div>
            <div style={{ fontSize: 10, color: "#3a3a4a", marginTop: 4, padding: "0 4px" }}>
              {m.role === "ai" ? `🇪🇸 ${scenario?.label}` : "Tú"}
            </div>
          </div>
        ))}
        {isThinking && (
          <div style={{ display: "flex", animation: "fadeUp 0.3s ease" }}>
            <div style={{ background: "#18181f", border: "1px solid #2a2a38", borderRadius: "16px 16px 16px 4px", padding: "14px 18px", display: "flex", gap: 5 }}>
              {[0,1,2].map(j => (
                <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: accentColor, animation: `wave 0.8s ease ${j*0.2}s infinite alternate` }} />
              ))}
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

        {(isListening || isSpeaking) && <Waveform active={true} color={accentColor} />}

        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isListening && [1, 2].map(r => (
            <div key={r} style={{ position: "absolute", borderRadius: "50%", width: 80, height: 80, border: `2px solid ${accentColor}`, animation: `ripple 1.5s ease ${r * 0.5}s infinite`, pointerEvents: "none" }} />
          ))}
          <button
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={(e) => { e.preventDefault(); startListening(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopListening(); }}
            disabled={isThinking || isSpeaking}
            style={{
              width: 80, height: 80, borderRadius: "50%",
              background: isListening ? `radial-gradient(circle, ${accentColor}, ${accentColor}cc)` : "#1e1e2a",
              border: `2.5px solid ${isListening ? accentColor : "#2a2a42"}`,
              cursor: isThinking || isSpeaking ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, transition: "all 0.2s",
              boxShadow: isListening ? `0 0 30px ${accentColor}60` : "0 4px 20px #00000060",
              animation: isListening ? "pulse 1s ease infinite" : "none",
              userSelect: "none", WebkitUserSelect: "none",
            }}
          >
            {isThinking ? "⌛" : isSpeaking ? "🔊" : "🎙️"}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: "#2a2a38", letterSpacing: 1.5, textTransform: "uppercase" }}>
          {isListening ? "Release to send" : "Hold to speak"}
        </p>
      </div>
    </div>
  );
}
