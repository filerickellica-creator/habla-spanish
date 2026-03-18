const functions = require("firebase-functions/v2/https");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const https = require("https");

admin.initializeApp();
const db = admin.firestore();

function callAnthropic(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("Invalid JSON")); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

exports.callClaude = onCall({ timeoutSeconds: 30, memory: "256MiB" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const uid = request.auth.uid;
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) throw new HttpsError("not-found", "User not found.");

  const user = userSnap.data();
  const status = user.subscriptionStatus;

  if (status === "trial") {
    const startedAt = user.trialStartedAt?.toDate?.() || new Date(user.trialStartedAt);
    const daysElapsed = (Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysElapsed > (user.trialDays || 10)) {
      await db.collection("users").doc(uid).update({ subscriptionStatus: "expired" });
      throw new HttpsError("permission-denied", "TRIAL_EXPIRED");
    }
  } else if (status === "expired") {
    throw new HttpsError("permission-denied", "TRIAL_EXPIRED");
  } else if (status !== "active") {
    throw new HttpsError("permission-denied", "No active subscription.");
  }

  // ── Rate limiting: 100/day, 300/week ──
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const dailyField = `apiCalls_${today}`;
  const dailyCalls = user[dailyField] || 0;
  if (dailyCalls >= 100) {
    throw new HttpsError("resource-exhausted", "DAILY_LIMIT_REACHED");
  }
  // Weekly: sum last 7 days
  const weeklyTotal = Array.from({ length: 7 }).reduce((sum, _, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = `apiCalls_${d.toISOString().slice(0, 10)}`;
    return sum + (user[key] || 0);
  }, 0);
  if (weeklyTotal >= 300) {
    throw new HttpsError("resource-exhausted", "WEEKLY_LIMIT_REACHED");
  }

  const { system, messages, max_tokens } = request.data;
  const safePayload = {
    model: "claude-haiku-4-5-20251001",
    max_tokens: Math.min(max_tokens || 1000, 1000),
    messages: messages.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content).slice(0, 2000),
    })),
  };
  if (typeof system === "string") safePayload.system = system;

  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) throw new HttpsError("internal", "Server config error.");

  let result;
  try { result = await callAnthropic(apiKey, safePayload); }
  catch (err) { throw new HttpsError("internal", "AI error. Try again."); }

  db.collection("users").doc(uid).update({
    totalConversations: admin.firestore.FieldValue.increment(1),
    [dailyField]: admin.firestore.FieldValue.increment(1),
  }).catch(() => {});

  const reply = result.content?.find(b => b.type === "text")?.text || "Lo siento, no entendí.";
  return { reply };
});
