# Habla Spanish — Load Tests

k6-based load tests to verify the app can handle up to **10,000 concurrent users**.

## What is tested

| Scenario | Target | Auth required |
|---|---|---|
| `static_assets` | Firebase Hosting (CDN) | No |
| `api_calls` | `callClaude` Cloud Function | Yes (Firebase ID token) |

### Performance thresholds

| Metric | Threshold |
|---|---|
| Firebase Hosting p(95) response time | < 3 s |
| Cloud Function p(95) response time | < 30 s (includes AI inference) |
| Overall error rate | < 5 % |

---

## Prerequisites

### 1. Install k6

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows
choco install k6
# or: winget install k6
```

### 2. Create a Firebase test user (for API tests)

The `api_calls` scenario requires a real Firebase user with an **active subscription** (`subscriptionStatus: "trial"` or `"active"` in Firestore).

1. Register a user at https://habla-spanish.web.app
2. In the Firebase console, set `subscriptionStatus: "active"` for that user
3. Export the credentials as environment variables (see below)

---

## Running the tests

All commands must be run from the `load-tests/` directory.

### Smoke test — quick sanity check (≈ 10 users, 1 minute)

```bash
# Hosting only
k6 run --env SCENARIO=smoke k6-load-test.js

# Hosting + API
TEST_EMAIL=you@example.com TEST_PASSWORD=yourpassword \
  k6 run --env SCENARIO=smoke k6-load-test.js
```

### Load test — sustained realistic peak (≈ 5,000 hosting / 500 API users)

```bash
TEST_EMAIL=you@example.com TEST_PASSWORD=yourpassword \
  k6 run --env SCENARIO=load k6-load-test.js
```

### Stress test — ramp to 10,000 users (default)

```bash
# Hosting only (safe — no API cost)
k6 run k6-load-test.js

# Hosting + API (⚠️ incurs Anthropic API costs)
TEST_EMAIL=you@example.com TEST_PASSWORD=yourpassword \
  k6 run --env SCENARIO=stress k6-load-test.js
```

### Skip API calls (hosting-only, any scenario)

```bash
k6 run --env SCENARIO=stress --env SKIP_API=true k6-load-test.js
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `TEST_EMAIL` | *(empty)* | Email of the Firebase test user |
| `TEST_PASSWORD` | *(empty)* | Password of the Firebase test user |
| `SCENARIO` | `stress` | `smoke` / `load` / `stress` |
| `SKIP_API` | `false` | Set `true` to skip Cloud Function calls |

---

## Scenario stages (stress)

### Firebase Hosting — up to 10,000 VUs

```
0 ──[2 min]──> 1,000 ──[3 min]──> 5,000 ──[5 min]──> 10,000
──[5 min stay]──> 10,000 ──[2 min]──> 0
```
Total duration: ~17 minutes

### Cloud Function — up to 1,000 VUs

The API scenario is capped at 1,000 concurrent VUs to:
- Avoid exhausting the Anthropic API rate limit (requests per minute)
- Prevent unexpected Firebase Function invocation costs
- Prevent excessive Firestore write costs

```
0 ──[2 min]──> 100 ──[3 min]──> 500 ──[5 min]──> 1,000
──[5 min stay]──> 1,000 ──[2 min]──> 0
```
Total duration: ~17 minutes

---

## Interpreting results

k6 prints a summary after each run. Key things to look for:

```
✓ hosting: status 200
✓ hosting: response time < 3 s
✓ api: status 200
✓ api: has reply field

checks.........................: 97.40%
http_req_duration (p95).......: 2.1s  ← should be < 3 s for hosting
function_duration_ms (p95)....: 8.3s  ← should be < 30 s for API
errors.........................: 2.60% ← should be < 5 %
```

### Common failure modes

| Symptom | Likely cause |
|---|---|
| `hosting: status 200` failing | Firebase Hosting quota hit or region issue |
| `api: status 200` failing at scale | Cloud Function cold-start backlog, Anthropic rate limit |
| High `function_duration_ms` p(95) | Anthropic API latency under load |
| `auth_failures > 0` | Wrong credentials or Firebase Auth quota |
| Error rate > 5 % | App cannot sustain the target concurrency |

---

## Architecture bottlenecks at 10,000 users

Based on the current design:

| Layer | Expected limit | Notes |
|---|---|---|
| Firebase Hosting (CDN) | Millions req/s | Not a bottleneck; global CDN |
| Firebase Auth | 100 req/s (default) | Can be increased in Firebase console |
| Cloud Function (callClaude) | ~1,000 concurrent | Default max instances = 1,000 |
| Firestore reads | 1M ops/day (free tier) | Needs paid plan at scale |
| Anthropic API | Tier-dependent RPM/TPM | Main bottleneck for AI responses |

**Recommendation:** For 10,000 simultaneous users all actively chatting, the Anthropic API
rate limit will be reached first. Consider:
- Batching / queuing requests
- Upgrading to a higher Anthropic usage tier
- Caching common responses
- Setting `max_instances` on the Cloud Function to control concurrency

---

## Running with k6 Cloud (distributed load)

For a truly distributed 10,000 VU test from multiple regions:

```bash
k6 login cloud --token <your-k6-cloud-token>
k6 cloud k6-load-test.js
```

This offloads the load generation to Grafana k6 Cloud infrastructure,
avoiding the need to run k6 from a single high-spec machine.
