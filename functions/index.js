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
  const email = request.auth.token.email;
  if (!email) throw new HttpsError("permission-denied", "No email on account.");

  // Check master subscription record (1 per email)
  const emailKey = email.toLowerCase().trim();
  const subSnap = await db.collection("subscriptions").doc(emailKey).get();
  if (!subSnap.exists) throw new HttpsError("not-found", "No subscription record found.");

  const sub = subSnap.data();
  const status = sub.subscriptionStatus;

  if (status === "trial") {
    const startedAt = sub.trialStartedAt?.toDate?.() || new Date(sub.trialStartedAt);
    const daysElapsed = (Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysElapsed > (sub.trialDays || 10)) {
      await db.collection("subscriptions").doc(emailKey).update({ subscriptionStatus: "expired" });
      throw new HttpsError("permission-denied", "TRIAL_EXPIRED");
    }
  } else if (status === "expired") {
    throw new HttpsError("permission-denied", "TRIAL_EXPIRED");
  } else if (status !== "active") {
    throw new HttpsError("permission-denied", "No active subscription.");
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
  }).catch(() => {});

  const reply = result.content?.find(b => b.type === "text")?.text || "Lo siento, no entendí.";
  return { reply };
});
