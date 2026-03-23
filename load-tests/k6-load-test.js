/**
 * Habla Spanish — k6 Load Test
 *
 * Tests the app under up to 10,000 concurrent virtual users across two scenarios:
 *   1. static_assets  — Firebase Hosting (no auth required)
 *   2. api_calls      — callClaude Cloud Function (requires Firebase auth token)
 *
 * Prerequisites:
 *   - k6 installed: https://k6.io/docs/get-started/installation/
 *   - A Firebase test user with an active subscription (trial or paid)
 *
 * Usage:
 *   # Static hosting only (no credentials needed):
 *   k6 run k6-load-test.js
 *
 *   # Full test including Cloud Function:
 *   TEST_EMAIL=loadtest@example.com TEST_PASSWORD=secret k6 run k6-load-test.js
 *
 *   # Quick smoke test (50 users):
 *   k6 run --env SCENARIO=smoke k6-load-test.js
 *
 *   # Stress test (ramp to 10,000):
 *   k6 run --env SCENARIO=stress k6-load-test.js
 *
 * WARNING: Running the full stress scenario against production will:
 *   - Invoke the Anthropic API many times (cost + rate limits)
 *   - Write to Firestore (cost)
 *   - Consume Firebase Function invocation quota
 *   Consider running with SKIP_API=true first to test hosting only.
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const FIREBASE_API_KEY = "AIzaSyAWHZYkRMqwLM5NLxfna_4HcKru2P1Gzm0";
const PROJECT_ID       = "habla-espanyol";
const REGION           = "us-central1";

const APP_URL          = __ENV.APP_URL || "https://habla-espanyol.web.app";
const FUNCTION_URL     = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/callClaude`;
const FIREBASE_AUTH_URL =
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

const TEST_EMAIL    = __ENV.TEST_EMAIL    || "";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "";
const SCENARIO      = __ENV.SCENARIO      || "stress"; // smoke | load | stress
const SKIP_API      = __ENV.SKIP_API      === "true";

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

const errorRate        = new Rate("errors");
const authFailures     = new Counter("auth_failures");
const apiCallsOk       = new Counter("api_calls_ok");
const staticCallsOk    = new Counter("static_calls_ok");
const functionDuration = new Trend("function_duration_ms", true);
const staticDuration   = new Trend("static_duration_ms",   true);

// ---------------------------------------------------------------------------
// Scenario profiles
// ---------------------------------------------------------------------------

// Each stage ramps users up/down gradually. Firebase Hosting (CDN-backed)
// is tested with the full 10 k VU target. The Cloud Function scenario is
// intentionally capped lower to stay within Anthropic / Firebase quotas.

const SCENARIOS = {
  // Quick sanity check — a handful of users for a short time
  smoke: {
    static_assets: stagesConfig(  [
      { duration: "30s", target: 10 },
      { duration: "30s", target:  0 },
    ], "testStaticAssets"),
    api_calls: stagesConfig([
      { duration: "30s", target: 5 },
      { duration: "30s", target: 0 },
    ], "testApiCalls"),
  },

  // Sustained load — realistic daily-peak simulation
  load: {
    static_assets: stagesConfig([
      { duration: "2m",  target: 1000  },
      { duration: "5m",  target: 5000  },
      { duration: "5m",  target: 5000  },
      { duration: "2m",  target: 0     },
    ], "testStaticAssets"),
    api_calls: stagesConfig([
      { duration: "2m",  target: 100  },
      { duration: "5m",  target: 500  },
      { duration: "5m",  target: 500  },
      { duration: "2m",  target: 0    },
    ], "testApiCalls"),
  },

  // Stress test — ramp all the way to 10,000 concurrent users on hosting;
  // API scenario is intentionally kept under 1,000 to avoid runaway costs.
  stress: {
    static_assets: stagesConfig([
      { duration: "2m",  target:  1000  },
      { duration: "3m",  target:  5000  },
      { duration: "5m",  target: 10000  },
      { duration: "5m",  target: 10000  },
      { duration: "2m",  target:  0     },
    ], "testStaticAssets"),
    api_calls: stagesConfig([
      { duration: "2m",  target: 100  },
      { duration: "3m",  target: 500  },
      { duration: "5m",  target: 1000 },
      { duration: "5m",  target: 1000 },
      { duration: "2m",  target: 0    },
    ], "testApiCalls"),
  },
};

function stagesConfig(stages, exec) {
  return {
    executor:  "ramping-vus",
    startVUs:  0,
    stages,
    exec,
    gracefulRampDown: "30s",
  };
}

// ---------------------------------------------------------------------------
// k6 options
// ---------------------------------------------------------------------------

export const options = {
  scenarios: SCENARIOS[SCENARIO] || SCENARIOS.stress,

  thresholds: {
    // Hosting should respond fast (CDN-backed)
    "static_duration_ms":  ["p(95)<3000", "p(99)<5000"],
    // Cloud Function includes AI inference — allow up to 30 s p(95)
    "function_duration_ms": ["p(95)<30000"],
    // Overall error rate must stay below 5 %
    "errors":              ["rate<0.05"],
    // Standard k6 HTTP metrics
    "http_req_duration{scenario:static_assets}": ["p(95)<3000"],
    "http_req_duration{scenario:api_calls}":     ["p(95)<30000"],
    "http_req_failed":                           ["rate<0.05"],
  },
};

// ---------------------------------------------------------------------------
// setup() — runs once before VUs start; returns shared data for all VUs
// ---------------------------------------------------------------------------

export function setup() {
  const result = { idToken: null, authError: null };

  if (SKIP_API || !TEST_EMAIL || !TEST_PASSWORD) {
    console.log(
      "ℹ️  No TEST_EMAIL/TEST_PASSWORD provided — API scenario will run " +
      "without auth (unauthenticated requests, expected 401s)."
    );
    return result;
  }

  console.log(`🔑 Authenticating test user: ${TEST_EMAIL}`);
  const authStart = Date.now();

  const res = http.post(
    FIREBASE_AUTH_URL,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true }),
    { headers: { "Content-Type": "application/json" }, timeout: "15s" }
  );

  if (res.status !== 200) {
    result.authError = `Firebase auth failed (HTTP ${res.status}): ${res.body}`;
    console.error(`❌ ${result.authError}`);
    authFailures.add(1);
    return result;
  }

  const body = JSON.parse(res.body);
  result.idToken = body.idToken;
  console.log(`✅ Auth OK in ${Date.now() - authStart} ms. Token expires in ${body.expiresIn}s.`);
  return result;
}

// ---------------------------------------------------------------------------
// Scenario 1 — Static assets (Firebase Hosting / CDN)
// Tests that the SPA shell and critical assets load quickly at high concurrency.
// ---------------------------------------------------------------------------

export function testStaticAssets() {
  group("static_assets", () => {
    const start = Date.now();
    const res = http.get(APP_URL, { timeout: "10s" });
    staticDuration.add(Date.now() - start);

    const ok = check(res, {
      "hosting: status 200":              (r) => r.status === 200,
      "hosting: body not empty":          (r) => r.body && r.body.length > 100,
      "hosting: contains root div":       (r) => r.body && r.body.includes('id="root"'),
      "hosting: response time < 3 s":     (r) => r.timings.duration < 3000,
      "hosting: security headers present":(r) =>
        r.headers["X-Content-Type-Options"] === "nosniff" ||
        r.headers["x-content-type-options"] === "nosniff",
    });

    errorRate.add(!ok);
    if (ok) staticCallsOk.add(1);
  });

  // Simulate human think-time between page interactions (1–3 s)
  sleep(1 + Math.random() * 2);
}

// ---------------------------------------------------------------------------
// Scenario 2 — Cloud Function (callClaude)
// Tests Firebase Auth token validation, Firestore read, and the AI response
// pipeline. Requires TEST_EMAIL + TEST_PASSWORD of an active subscriber.
// ---------------------------------------------------------------------------

// Sample conversation turns spread across VUs for variety
const SAMPLE_MESSAGES = [
  "Hola, ¿cómo estás?",
  "Me gustaría ordenar un café con leche, por favor.",
  "¿Cuánto cuesta este artículo?",
  "Disculpe, ¿dónde está la estación de metro más cercana?",
  "Quisiera practicar mi español contigo.",
  "¿Puedes corregir mis errores?",
  "¿Qué significa 'madrugada'?",
  "Me alegra conocerte. ¿De dónde eres?",
];

const SYSTEM_PROMPT =
  "You are a friendly Spanish conversation tutor. " +
  "Respond in Spanish at an intermediate level. " +
  "Keep replies under 3 sentences.";

export function testApiCalls(data) {
  if (SKIP_API) return;

  group("api_calls", () => {
    const headers = {
      "Content-Type": "application/json",
    };

    if (data && data.idToken) {
      headers["Authorization"] = `Bearer ${data.idToken}`;
    }

    // Pick a random message to simulate different users
    const message = SAMPLE_MESSAGES[__VU % SAMPLE_MESSAGES.length];

    const payload = JSON.stringify({
      data: {
        system:     SYSTEM_PROMPT,
        messages:   [{ role: "user", content: message }],
        max_tokens: 150,
      },
    });

    const start = Date.now();
    const res = http.post(FUNCTION_URL, payload, {
      headers,
      timeout: "35s", // Function timeout is 30 s; allow a bit of buffer
    });
    const elapsed = Date.now() - start;
    functionDuration.add(elapsed);

    // When no auth token is available we expect an error response
    if (!data || !data.idToken) {
      const unauthOk = check(res, {
        "no-auth: returns error (expected)": (r) =>
          r.status === 401 || r.status === 403 ||
          (r.body && r.body.includes("unauthenticated")),
      });
      errorRate.add(!unauthOk);
      sleep(2);
      return;
    }

    const ok = check(res, {
      "api: status 200":           (r) => r.status === 200,
      "api: response time < 30 s": (r) => r.timings.duration < 30000,
      "api: has reply field": (r) => {
        try {
          const body = JSON.parse(r.body);
          return typeof body.result?.reply === "string" && body.result.reply.length > 0;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!ok);
    if (ok) apiCallsOk.add(1);

    if (!ok) {
      console.warn(`⚠️  VU ${__VU} — API call failed (${res.status}): ${res.body.slice(0, 200)}`);
    }
  });

  // Realistic think-time: a user reads the response before replying (3–8 s)
  sleep(3 + Math.random() * 5);
}

// ---------------------------------------------------------------------------
// teardown() — runs once after all VUs finish; log summary
// ---------------------------------------------------------------------------

export function teardown(data) {
  console.log("=".repeat(60));
  console.log("Load test complete.");
  if (data && data.authError) {
    console.warn(`Auth warning: ${data.authError}`);
  }
  console.log("Review the summary above for threshold pass/fail results.");
  console.log("=".repeat(60));
}
