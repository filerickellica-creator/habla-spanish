import { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const db = getFirestore();
const LOCKS_DOC = doc(db, "settings", "moduleLocks");

// All lockable modules — scenarios + vocabulary
const SCENARIO_MODULES = [
  { id: "scenario_cafe",       emoji: "☕", label: "Café (Scenario)" },
  { id: "scenario_market",     emoji: "🛒", label: "Mercado (Scenario)" },
  { id: "scenario_directions", emoji: "🗺️", label: "Direcciones (Scenario)" },
  { id: "scenario_restaurant", emoji: "🍽️", label: "Restaurante (Scenario)" },
  { id: "scenario_amigo",      emoji: "👋", label: "Amigo (Scenario)" },
];

const VOCAB_MODULES = [
  { id: "vocab_1", emoji: "🌱", label: "Survival Basics (Vocab)" },
  { id: "vocab_2", emoji: "🪪", label: "About Yourself (Vocab)" },
  { id: "vocab_3", emoji: "🏫", label: "School & Work (Vocab)" },
  { id: "vocab_4", emoji: "🏠", label: "Daily Life (Vocab)" },
  { id: "vocab_5", emoji: "💬", label: "Emotions & Opinions (Vocab)" },
  { id: "vocab_6", emoji: "✈️", label: "Travel & Adventure (Vocab)" },
  { id: "vocab_7", emoji: "⏳", label: "Past Tense (Vocab)" },
  { id: "vocab_8", emoji: "🎓", label: "Advanced Topics (Vocab)" },
];

const ALL_MODULES = [...SCENARIO_MODULES, ...VOCAB_MODULES];

/**
 * Hook to fetch module lock status from Firestore.
 * Returns { locks, loading } where locks is a map of moduleId -> boolean (true = locked).
 */
export function useModuleLocks() {
  const [locks, setLocks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(LOCKS_DOC);
        if (!cancelled) {
          setLocks(snap.exists() ? snap.data() : {});
        }
      } catch (e) {
        console.error("Failed to fetch module locks:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { locks, loading };
}

/**
 * Helper: check if a specific module is locked.
 *   isLocked(locks, "scenario_cafe")  — for scenario
 *   isLocked(locks, "vocab_3")        — for vocabulary module 3
 */
export function isModuleLocked(locks, moduleId) {
  return !!locks[moduleId];
}

/**
 * Admin panel component. Only accessible when user email is in ADMIN_EMAILS list.
 */
const ADMIN_EMAILS = ["admin@habla.app"];

export function isAdmin(user) {
  return ADMIN_EMAILS.includes(user?.email?.toLowerCase());
}

export default function AdminModule({ user, onClose }) {
  const [locks, setLocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(LOCKS_DOC);
        setLocks(snap.exists() ? snap.data() : {});
      } catch (e) {
        console.error("Failed to fetch locks:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleLock = (id) => {
    setLocks(prev => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const lockAll = () => {
    const all = {};
    ALL_MODULES.forEach(m => { all[m.id] = true; });
    setLocks(all);
    setSaved(false);
  };

  const unlockAll = () => {
    setLocks({});
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      // Clean: only store locked modules (truthy values)
      const cleaned = {};
      Object.entries(locks).forEach(([k, v]) => { if (v) cleaned[k] = true; });
      await setDoc(LOCKS_DOC, cleaned);
      setSaved(true);
    } catch (e) {
      console.error("Failed to save locks:", e);
      alert("Failed to save. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const lockedCount = Object.values(locks).filter(Boolean).length;

  const s = {
    overlay: { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
    panel: { background: "#12121a", border: "1px solid #1e1e2a", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 500, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 80px #00000070" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    title: { fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 900, color: "#e8e0d5", margin: 0 },
    close: { background: "none", border: "none", color: "#3a3a4a", cursor: "pointer", fontSize: 22, lineHeight: 1 },
    section: { marginBottom: 18 },
    sectionTitle: { fontSize: 10.5, fontWeight: 700, color: "#4a4540", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 10, fontFamily: "sans-serif" },
    row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#0e0e14", border: "1px solid #1e1e2a", borderRadius: 10, marginBottom: 6, transition: "all 0.2s" },
    label: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#c8c0b8", fontFamily: "sans-serif" },
    toggle: (locked) => ({ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", background: locked ? "#c86c6c" : "#22c55e", transition: "background 0.2s", flexShrink: 0 }),
    toggleKnob: (locked) => ({ position: "absolute", top: 3, left: locked ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }),
    actions: { display: "flex", gap: 8, marginBottom: 16 },
    actionBtn: { flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #2a2a38", background: "#18181f", color: "#8a8075", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "sans-serif", transition: "all 0.2s" },
    saveBtn: { width: "100%", padding: "13px", borderRadius: 12, border: "none", background: saved ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #c8956c, #a87040)", color: saved ? "#fff" : "#0e0e14", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "Georgia, serif", transition: "all 0.2s" },
    stats: { textAlign: "center", fontSize: 12, color: "#4a4540", marginBottom: 14, fontFamily: "sans-serif" },
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.panel} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.title}>Module Lock Manager</h2>
          <button onClick={onClose} style={s.close}>x</button>
        </div>

        <div style={s.stats}>
          {lockedCount} of {ALL_MODULES.length} modules locked
        </div>

        <div style={s.actions}>
          <button onClick={lockAll} style={s.actionBtn}>Lock All</button>
          <button onClick={unlockAll} style={s.actionBtn}>Unlock All</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#4a4540", padding: 30 }}>Loading...</div>
        ) : (
          <>
            <div style={s.section}>
              <div style={s.sectionTitle}>Conversation Scenarios</div>
              {SCENARIO_MODULES.map(m => (
                <div key={m.id} style={{ ...s.row, borderColor: locks[m.id] ? "#c86c6c33" : "#1e1e2a" }}>
                  <div style={s.label}>
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                    {locks[m.id] && <span style={{ fontSize: 11, color: "#c86c6c" }}>LOCKED</span>}
                  </div>
                  <button style={s.toggle(!!locks[m.id])} onClick={() => toggleLock(m.id)}>
                    <div style={s.toggleKnob(!!locks[m.id])} />
                  </button>
                </div>
              ))}
            </div>

            <div style={s.section}>
              <div style={s.sectionTitle}>Vocabulary Modules</div>
              {VOCAB_MODULES.map(m => (
                <div key={m.id} style={{ ...s.row, borderColor: locks[m.id] ? "#c86c6c33" : "#1e1e2a" }}>
                  <div style={s.label}>
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                    {locks[m.id] && <span style={{ fontSize: 11, color: "#c86c6c" }}>LOCKED</span>}
                  </div>
                  <button style={s.toggle(!!locks[m.id])} onClick={() => toggleLock(m.id)}>
                    <div style={s.toggleKnob(!!locks[m.id])} />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={save} disabled={saving} style={s.saveBtn}>
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
