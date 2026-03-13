import { useState, useRef, useCallback, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";

const _fn = getFunctions();
const callCloudFn = async (payload) => {
  const callable = httpsCallable(_fn, "callClaude");
  const result = await callable(payload);
  return result.data?.reply || "";
};

const TRANSLATOR_COLOR = "#7eb8c9";

function MicIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function SpeakerIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function Waveform({ active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 28 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 3, background: TRANSLATOR_COLOR,
          height: active ? undefined : 4, minHeight: 4, maxHeight: 24,
          animation: active ? `transWave ${0.55 + (i % 4) * 0.13}s ease-in-out ${i * 0.055}s infinite alternate` : "none",
          opacity: active ? 0.9 : 0.25, transition: "opacity 0.3s",
        }} />
      ))}
    </div>
  );
}

export default function TranslatorModule() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const [englishText, setEnglishText] = useState("");
  const [spanishText, setSpanishText] = useState("");
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const lastTranscriptRef = useRef("");
  const recognitionTimeoutRef = useRef(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) setSupported(false);
  }, []);

  const speakSpanish = useCallback((text) => {
    synthRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "es-ES"; utter.rate = 0.9; utter.pitch = 1.05;
    const voices = synthRef.current.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith("es"));
    if (spanishVoice) utter.voice = spanishVoice;
    utter.onstart = () => setStatus("speaking");
    utter.onend = () => setStatus("idle");
    utter.onerror = () => setStatus("idle");
    synthRef.current.speak(utter);
  }, []);

  const translate = useCallback(async (text) => {
    if (!text.trim()) return;
    setStatus("thinking"); setError(""); setSpanishText("");
    try {
      const translation = await callCloudFn({
        system: "You are a Spanish translator. Translate English to Spanish. Output ONLY the Spanish text. Never output English. Never explain. Just the Spanish translation.",
        messages: [{ role: "user", content: `Translate this to Spanish: ${text.trim()}` }],
        max_tokens: 300,
      });
      if (translation) { setSpanishText(translation); speakSpanish(translation); }
      else { setError("No translation returned."); setStatus("idle"); }
    } catch { setError("Connection error. Try again."); setStatus("idle"); }
  }, [speakSpanish]);

  const startListening = useCallback(() => {
    if (status !== "idle") return;
    setError(""); setEnglishText(""); setSpanishText("");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US"; recognition.continuous = false; recognition.interimResults = true;
    recognition.onstart = () => { setStatus("listening"); lastTranscriptRef.current = ""; };
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setEnglishText(t); lastTranscriptRef.current = t;
    };
    recognition.onend = () => {
      clearTimeout(recognitionTimeoutRef.current);
      const final = lastTranscriptRef.current;
      if (final?.trim()) translate(final.trim()); else setStatus("idle");
    };
    recognition.onerror = (e) => {
      clearTimeout(recognitionTimeoutRef.current);
      if (e.error === "no-speech" || e.error === "aborted") { setStatus("idle"); }
      else { setError("Couldn't hear you. Try again."); setStatus("idle"); }
    };
    recognitionRef.current = recognition;
    recognition.start();
    // Safety timeout: force-stop recognition after 15s to prevent infinite freeze
    recognitionTimeoutRef.current = setTimeout(() => { recognition.stop(); }, 15000);
  }, [status, translate]);

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); }, []);
  const replaySpanish = () => { if (spanishText && status === "idle") speakSpanish(spanishText); };

  const isListening = status === "listening";
  const isThinking = status === "thinking";
  const isSpeaking = status === "speaking";
  const busy = isListening || isThinking || isSpeaking;

  return (
    <div style={{ marginBottom: 28 }}>
      <style>{`
        @keyframes transWave { from { height: 4px; } to { height: 22px; } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spinRing { to { transform: rotate(360deg); } }
        @keyframes ripple { 0%{transform:scale(1);opacity:0.6;} 100%{transform:scale(2.5);opacity:0;} }
      `}</style>

      <p style={{ margin: "0 0 10px", fontSize: 10, color: "#4a4540", fontFamily: "sans-serif", letterSpacing: 3, textTransform: "uppercase" }}>Translate</p>

      {!open ? (
        <button onClick={() => setOpen(true)} style={{ width: "100%", padding: "18px 20px", borderRadius: 14, border: "1.5px solid #1e1e2a", background: "#12121a", cursor: "pointer", textAlign: "left", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "space-between" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = TRANSLATOR_COLOR; e.currentTarget.style.background = TRANSLATOR_COLOR + "12"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e2a"; e.currentTarget.style.background = "#12121a"; }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>🔤</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#c8c0b8", fontFamily: "sans-serif" }}>English → Spanish</div>
              <div style={{ fontSize: 11, color: "#4a4845", fontFamily: "sans-serif", marginTop: 2 }}>Say a word or phrase to translate</div>
            </div>
          </div>
          <span style={{ fontSize: 18, color: "#3a3835" }}>›</span>
        </button>
      ) : (
        <div style={{ borderRadius: 16, border: `1.5px solid ${TRANSLATOR_COLOR}40`, background: "#0f0f18", padding: "20px", animation: "fadeSlide 0.25s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🔤</span>
              <span style={{ fontFamily: "sans-serif", fontSize: 13, fontWeight: 700, color: TRANSLATOR_COLOR, letterSpacing: 1 }}>English → Español</span>
            </div>
            <button onClick={() => { setOpen(false); synthRef.current.cancel(); setStatus("idle"); }} style={{ background: "none", border: "none", color: "#3a3835", cursor: "pointer", fontSize: 18, padding: "2px 6px", borderRadius: 6, transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#8a8075"}
              onMouseLeave={e => e.currentTarget.style.color = "#3a3835"}>✕</button>
          </div>

          <div style={{ minHeight: 48, padding: "12px 14px", borderRadius: 10, background: "#17171f", border: "1px solid #1e1e2a", marginBottom: 14 }}>
            {isListening ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Waveform active={true} />
                {englishText && <span style={{ fontSize: 14, color: "#a0a0b0", fontFamily: "sans-serif", fontStyle: "italic" }}>{englishText}</span>}
              </div>
            ) : englishText ? (
              <span style={{ fontSize: 14, color: "#c8c0b8", fontFamily: "sans-serif" }}>{englishText}</span>
            ) : (
              <span style={{ fontSize: 13, color: "#2e2e3a", fontFamily: "sans-serif", fontStyle: "italic" }}>Tap the mic and speak in English…</span>
            )}
          </div>

          <div style={{ textAlign: "center", fontSize: 16, color: "#2e2e3a", marginBottom: 14 }}>↓</div>

          <div style={{ minHeight: 56, padding: "12px 14px", borderRadius: 10, background: "#12121e", border: `1px solid ${spanishText ? TRANSLATOR_COLOR + "35" : "#1e1e2a"}`, marginBottom: 20, transition: "border-color 0.3s" }}>
            {isThinking ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 16, height: 16, border: `2px solid ${TRANSLATOR_COLOR}40`, borderTopColor: TRANSLATOR_COLOR, borderRadius: "50%", animation: "spinRing 0.8s linear infinite" }} />
                <span style={{ fontSize: 12, color: "#4a4845", fontFamily: "sans-serif" }}>Translating…</span>
              </div>
            ) : isSpeaking ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Palatino Linotype', Georgia, serif", color: "#e8e0d5", letterSpacing: "0.5px" }}>{spanishText}</span>
                <Waveform active={true} />
              </div>
            ) : spanishText ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Palatino Linotype', Georgia, serif", color: "#e8e0d5", letterSpacing: "0.5px", flex: 1 }}>{spanishText}</span>
                <button onClick={replaySpanish} style={{ background: TRANSLATOR_COLOR + "18", border: `1px solid ${TRANSLATOR_COLOR}40`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: TRANSLATOR_COLOR, display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "sans-serif", transition: "all 0.2s", flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = TRANSLATOR_COLOR + "30"}
                  onMouseLeave={e => e.currentTarget.style.background = TRANSLATOR_COLOR + "18"}>
                  <SpeakerIcon size={14} /> escuchar
                </button>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: "#2e2e3a", fontFamily: "sans-serif", fontStyle: "italic" }}>Spanish translation appears here…</span>
            )}
          </div>

          {error && <div style={{ fontSize: 12, color: "#f87171", fontFamily: "sans-serif", marginBottom: 16, textAlign: "center" }}>{error}</div>}
          {!supported && <div style={{ fontSize: 12, color: "#f87171", fontFamily: "sans-serif", marginBottom: 16, textAlign: "center" }}>⚠️ Speech recognition requires Chrome or Safari.</div>}

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isListening && <div style={{ position: "absolute", width: 72, height: 72, borderRadius: "50%", border: `2px solid ${TRANSLATOR_COLOR}`, animation: "ripple 1.2s ease-out infinite", pointerEvents: "none" }} />}
              <button
                onMouseDown={supported && !busy ? startListening : undefined}
                onMouseUp={isListening ? stopListening : undefined}
                onTouchStart={supported && !busy ? (e) => { e.preventDefault(); startListening(); } : undefined}
                onTouchEnd={(e) => { e.preventDefault(); stopListening(); }}
                disabled={!supported || (busy && !isListening)}
                style={{ width: 58, height: 58, borderRadius: "50%", background: isListening ? TRANSLATOR_COLOR : isSpeaking || isThinking ? "#1e1e2a" : TRANSLATOR_COLOR + "22", border: `2px solid ${isListening ? TRANSLATOR_COLOR : TRANSLATOR_COLOR + "50"}`, cursor: supported && !busy ? "pointer" : isListening ? "pointer" : "default", color: isListening ? "#0e0e14" : TRANSLATOR_COLOR, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", opacity: !supported || (busy && !isListening) ? 0.4 : 1, boxShadow: isListening ? `0 0 24px ${TRANSLATOR_COLOR}60` : "none" }}>
                <MicIcon size={22} />
              </button>
            </div>
          </div>
          <p style={{ textAlign: "center", fontSize: 11, color: "#2e2e3a", fontFamily: "sans-serif", marginTop: 10, marginBottom: 0 }}>
            {isListening ? "Release to translate" : "Hold to speak"}
          </p>
        </div>
      )}
    </div>
  );
}
