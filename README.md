# 🇪🇸 Habla — Spanish Voice Practice App

A voice-powered Spanish conversation practice app built with React + Vite, deployed free on Firebase Hosting.

---

## 🚀 Full Deployment Guide (Free, Step by Step)

### What You'll Need
- A computer with internet access
- A Google account (free)
- An Anthropic API key (free to get)
- Node.js installed (free)

---

## STEP 1 — Install Node.js (if you don't have it)

1. Go to **https://nodejs.org**
2. Download the **LTS version** (recommended)
3. Run the installer — click Next through all steps
4. To verify, open Terminal (Mac) or Command Prompt (Windows) and type:
   ```
   node --version
   ```
   You should see something like `v20.10.0`

---

## STEP 2 — Get Your Free Anthropic API Key

1. Go to **https://console.anthropic.com**
2. Sign up for a free account
3. Go to **API Keys** in the left menu
4. Click **Create Key** → copy and save it (starts with `sk-ant-`)
5. Add $5 credit (cheapest option — this app uses ~$0.001 per conversation)

---

## STEP 3 — Set Up the Project

Open Terminal (Mac/Linux) or Command Prompt (Windows):

```bash
# Go into the project folder
cd habla-spanish

# Install dependencies
npm install
```

---

## STEP 4 — Test Locally

```bash
npm run dev
```

Open your browser and go to **http://localhost:5173**

You should see the app! Enter your Anthropic API key on the setup screen and test it.

Press `Ctrl+C` to stop the local server when done.

---

## STEP 5 — Create a Free Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Name it `habla-spanish` (or anything you like)
4. **Disable Google Analytics** (not needed) → click Continue
5. Wait for project to be created → click **Continue**
6. In the left sidebar, click **Hosting** (under Build)
7. Click **Get Started** → click through the setup wizard (we'll do it via CLI)

---

## STEP 6 — Install Firebase CLI

In your terminal:

```bash
npm install -g firebase-tools
```

Then log in to your Google account:

```bash
firebase login
```

A browser window will open — sign in with your Google account and allow access.

---

## STEP 7 — Connect Project to Firebase

In your terminal, inside the `habla-spanish` folder:

```bash
firebase use --add
```

- Select your project from the list (the one you created in Step 5)
- Give it the alias: `default`

---

## STEP 8 — Build the App

```bash
npm run build
```

This creates an optimized `dist/` folder ready for deployment.

---

## STEP 9 — Deploy to Firebase! 🚀

```bash
firebase deploy
```

After ~30 seconds you'll see:

```
✔ Deploy complete!

Hosting URL: https://habla-spanish.web.app
```

**Your app is now live!** Share that URL with anyone.

---

## 🔄 How to Update the App Later

Whenever you make changes to the code:

```bash
npm run build
firebase deploy
```

That's it — your live app updates in seconds.

---

## 💰 Cost Breakdown (All Free)

| Service | Cost |
|---|---|
| Firebase Hosting | **FREE** (10GB storage, 360MB/day) |
| Anthropic API | **~$0.001 per conversation** (you pay only what you use) |
| Node.js | **FREE** |
| Firebase CLI | **FREE** |

---

## 🎙️ How to Use the App

1. Open the app URL in **Chrome** or **Safari** (best speech recognition support)
2. Enter your Anthropic API key (stored only in your browser)
3. Choose your level: Principiante / Intermedio / Avanzado
4. Pick a scenario (Café, Mercado, Restaurante, etc.)
5. **Hold the 🎙️ button** to speak in Spanish
6. **Release** — the AI listens and responds out loud in Spanish
7. Keep the conversation going!

---

## 🛠️ Project Structure

```
habla-spanish/
├── src/
│   ├── main.jsx        # React entry point
│   └── App.jsx         # Main app (all screens + logic)
├── public/
│   └── favicon.svg     # App icon
├── index.html          # HTML shell
├── package.json        # Dependencies
├── vite.config.js      # Build config
├── firebase.json       # Firebase hosting config
├── .firebaserc         # Firebase project link
└── .gitignore
```

---

## ❓ Troubleshooting

**"Speech recognition not supported"**
→ Use Google Chrome or Safari. Firefox doesn't support the Web Speech API.

**"Invalid API key"**
→ Make sure your key starts with `sk-ant-` and was copied fully.

**"firebase: command not found"**
→ Run `npm install -g firebase-tools` again, or restart your terminal.

**App works locally but not on Firebase**
→ Make sure you ran `npm run build` before `firebase deploy`.
