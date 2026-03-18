const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const https = require("https");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// ─── Lemon Squeezy config ──────────────────────────────────────────────────
const LS_API_KEY = () => process.env.LEMONSQUEEZY_API_KEY;
const LS_WEBHOOK_SECRET = () => process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
const LS_STORE_ID = () => process.env.LEMONSQUEEZY_STORE_ID; // your store numeric ID

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

// ─── Lemon Squeezy: Create Checkout ────────────────────────────────────────
// Called from the frontend to generate a checkout URL for the signed-in user.
exports.createCheckout = onCall({ timeoutSeconds: 15, memory: "256MiB" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const uid = request.auth.uid;
  const email = request.auth.token.email || "";
  const { variantId } = request.data;

  if (!variantId) throw new HttpsError("invalid-argument", "variantId required.");
  const apiKey = LS_API_KEY();
  if (!apiKey) throw new HttpsError("internal", "Payment config error.");

  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email,
          custom: { user_id: uid },
        },
      },
      relationships: {
        store: { data: { type: "stores", id: LS_STORE_ID() } },
        variant: { data: { type: "variants", id: String(variantId) } },
      },
    },
  };

  const result = await lemonSqueezyRequest("POST", "/v1/checkouts", payload, apiKey);
  const checkoutUrl = result?.data?.attributes?.url;
  if (!checkoutUrl) throw new HttpsError("internal", "Could not create checkout.");
  return { url: checkoutUrl };
});

// ─── Lemon Squeezy: Webhook Handler ───────────────────────────────────────
// Receives events from Lemon Squeezy and updates Firestore subscription data.
exports.lemonSqueezyWebhook = onRequest({ timeoutSeconds: 30 }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).send("Method not allowed"); return; }

  // Verify webhook signature
  const secret = LS_WEBHOOK_SECRET();
  if (!secret) { res.status(500).send("Webhook not configured"); return; }

  const rawBody = req.rawBody;
  const signature = req.headers["x-signature"];
  if (!signature || !rawBody) { res.status(400).send("Missing signature"); return; }

  const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))) {
    res.status(401).send("Invalid signature");
    return;
  }

  const event = JSON.parse(rawBody);
  const eventName = event.meta?.event_name;
  const userId = event.meta?.custom_data?.user_id;

  if (!userId) {
    // No user_id in custom data — can't map to a user
    res.status(200).send("OK (no user_id)");
    return;
  }

  const attrs = event.data?.attributes || {};
  const lsCustomerId = String(attrs.customer_id || "");
  const lsSubscriptionId = String(event.data?.id || "");

  // Determine the renewal/expiry date
  const renewsAt = attrs.renews_at ? new Date(attrs.renews_at) : null;
  const endsAt = attrs.ends_at ? new Date(attrs.ends_at) : null;

  const userRef = db.collection("users").doc(userId);

  switch (eventName) {
    case "subscription_created":
    case "subscription_resumed":
    case "subscription_unpaused": {
      await userRef.update({
        subscriptionStatus: "active",
        subscriptionExpiry: renewsAt ? admin.firestore.Timestamp.fromDate(renewsAt) : null,
        lemonSqueezyCustomerId: lsCustomerId,
        lemonSqueezySubscriptionId: lsSubscriptionId,
      });
      break;
    }

    case "subscription_updated": {
      const status = attrs.status; // active, paused, cancelled, expired
      if (status === "active") {
        await userRef.update({
          subscriptionStatus: "active",
          subscriptionExpiry: renewsAt ? admin.firestore.Timestamp.fromDate(renewsAt) : null,
          lemonSqueezyCustomerId: lsCustomerId,
          lemonSqueezySubscriptionId: lsSubscriptionId,
        });
      } else if (status === "expired" || status === "cancelled") {
        await userRef.update({
          subscriptionStatus: "expired",
          subscriptionExpiry: endsAt ? admin.firestore.Timestamp.fromDate(endsAt) : null,
        });
      } else if (status === "paused") {
        await userRef.update({
          subscriptionStatus: "expired",
          subscriptionExpiry: null,
        });
      }
      break;
    }

    case "subscription_cancelled":
    case "subscription_expired":
    case "subscription_paused": {
      await userRef.update({
        subscriptionStatus: "expired",
        subscriptionExpiry: endsAt ? admin.firestore.Timestamp.fromDate(endsAt) : null,
      });
      break;
    }

    case "subscription_payment_success": {
      // Renewal payment succeeded — ensure status is active
      await userRef.update({
        subscriptionStatus: "active",
        subscriptionExpiry: renewsAt ? admin.firestore.Timestamp.fromDate(renewsAt) : null,
      });
      break;
    }

    default:
      // Unhandled event — acknowledge
      break;
  }

  res.status(200).send("OK");
});

// ─── Lemon Squeezy API helper ──────────────────────────────────────────────
function lemonSqueezyRequest(method, path, body, apiKey) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: "api.lemonsqueezy.com",
      path,
      method,
      headers: {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": `Bearer ${apiKey}`,
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let raw = "";
      res.on("data", chunk => (raw += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error("Invalid JSON from Lemon Squeezy")); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}
