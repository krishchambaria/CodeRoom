# CodeRoom — Setup, Run & Hosting Guide

## Project Structure

```
coderoom/
├── index.html          ← Frontend (rename index-animated-part4.html → index.html)
├── server.js           ← Node.js backend (real compiler)
├── package.json        ← Dependencies
└── README.md           ← This file
```

> ⚠️ **Important:** Rename `index-animated-part4.html` to `index.html` before deploying.

---

## ✅ Compiler API — 100% Free, No Payment Required

CodeRoom uses **Judge0 CE** — a free, open-source code execution engine.

| Option | Cost | Setup | Speed |
|--------|------|-------|-------|
| **A) Public Judge0 CE** (default) | Free forever | Zero setup | Shared / moderate |
| **B) RapidAPI Free Tier** | Free (50 req/day) | 5 min signup | Fast |
| **C) Self-hosted Judge0** | Free (needs Docker) | ~30 min | Unlimited / fastest |

**Default is Option A — just run the server and it works.**

---

## ─────────────────────────────────────
## LOCAL SETUP (Run on Your Computer)
## ─────────────────────────────────────

### Step 1 — Prerequisites

- [Node.js](https://nodejs.org) v14 or higher
- A modern browser (Chrome, Firefox, Edge)

Check your Node version:
```bash
node --version
```

---

### Step 2 — Install Dependencies

```bash
npm install
```

This installs: `express`, `cors`, `node-fetch`.

---

### Step 3 — Start the Backend

```bash
node server.js
```

You should see:
```
✅  CodeRoom backend running at http://localhost:3000
    Health check : http://localhost:3000/health
    Judge0 URL   : https://ce.judge0.com
    Auth         : free public instance — no key needed ✓
```

---

### Step 4 — Open the Frontend

Open `index.html` directly in your browser:

```bash
# macOS
open index.html

# Windows
start index.html

# Linux
xdg-open index.html
```

> **Both the backend (port 3000) AND the HTML file must be open at the same time.**

---

## How It Works

```
Browser (index.html)
     │
     │  POST /run  { source_code, language_id }
     ▼
Node.js server (server.js : 3000)
     │
     │  POST /submissions  →  Judge0 CE (free public instance)
     │  GET  /submissions/:token  (polls until done)
     ▼
Judge0 CE (free cloud compiler)
     │
     └─ Returns: stdout / stderr / compile_output
```

---

## Supported Languages & Judge0 IDs

| Language   | Judge0 ID |
|------------|-----------|
| Python 3   | 71        |
| Java       | 62        |
| C          | 50        |
| C++        | 54        |
| JavaScript | 63        |

---

## ─────────────────────────────────────
## HOSTING (Deploy Online — Public URL)
## ─────────────────────────────────────

You need to host two things separately:
- **Backend** (`server.js`) → a Node.js hosting service
- **Frontend** (`index.html`) → a static hosting service

---

## Option 1 — Render (Recommended, Free Tier)

Render gives you a free Node.js server with a public URL.

### Backend on Render

1. Push your project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/coderoom.git
   git push -u origin main
   ```

2. Go to [https://render.com](https://render.com) → Sign up free

3. Click **"New +"** → **"Web Service"**

4. Connect your GitHub repo

5. Fill in settings:
   ```
   Name:           coderoom-backend
   Environment:    Node
   Build Command:  npm install
   Start Command:  node server.js
   Plan:           Free
   ```

6. Click **"Create Web Service"**

7. Wait ~2 minutes. You'll get a URL like:
   ```
   https://coderoom-backend.onrender.com
   ```

### Frontend on Render (Static Site)

1. Click **"New +"** → **"Static Site"**
2. Connect same GitHub repo
3. Settings:
   ```
   Name:           coderoom-frontend
   Build Command:  (leave empty)
   Publish Dir:    .
   ```
4. Click **"Create Static Site"**
5. You'll get a URL like: `https://coderoom-frontend.onrender.com`

### Connect Frontend to Backend

In `index.html`, find this line (near top of `<script>`):
```js
const BACKEND_URL = 'http://localhost:3000';
```
Change it to your Render backend URL:
```js
const BACKEND_URL = 'https://coderoom-backend.onrender.com';
```

---

## Option 2 — Railway (Simple, Free $5 credit)

1. Go to [https://railway.app](https://railway.app) → Sign up with GitHub

2. Click **"New Project"** → **"Deploy from GitHub repo"**

3. Select your repo

4. Railway auto-detects Node.js and sets `npm install` + `node server.js`

5. Click **"Deploy"** — you get a URL like:
   ```
   https://coderoom-production.up.railway.app
   ```

6. For the frontend: use **Netlify** or **GitHub Pages** (see below)

---

## Option 3 — GitHub Pages (Frontend Only, 100% Free)

GitHub Pages hosts the HTML file for free. The backend still needs Render or Railway.

1. Push to GitHub (see step above)

2. Go to your repo on GitHub → **Settings** → **Pages**

3. Under "Source", select:
   ```
   Branch: main
   Folder: / (root)
   ```

4. Click **Save**

5. Your site will be live at:
   ```
   https://YOUR_USERNAME.github.io/coderoom/
   ```

6. Update `BACKEND_URL` in `index.html` to point to your Render/Railway backend URL

---

## Option 4 — Netlify (Frontend, Free + Easy)

1. Go to [https://netlify.com](https://netlify.com) → Sign up free

2. Drag and drop your `index.html` file onto the Netlify dashboard

   **OR** connect your GitHub repo:
   - Click **"Add new site"** → **"Import an existing project"**
   - Connect GitHub → select your repo
   - Build command: *(leave blank)*
   - Publish directory: `.`
   - Click **Deploy**

3. You get a URL like:
   ```
   https://coderoom-abc123.netlify.app
   ```

4. Update `BACKEND_URL` in `index.html` to your backend URL

---

## Option 5 — Full Stack on Vercel (Advanced)

Vercel can host both frontend and a serverless version of the backend.

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Create `vercel.json` in your project root:
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "server.js", "use": "@vercel/node" },
       { "src": "index.html", "use": "@vercel/static" }
     ],
     "routes": [
       { "src": "/run", "dest": "/server.js" },
       { "src": "/health", "dest": "/server.js" },
       { "src": "/(.*)", "dest": "/index.html" }
     ]
   }
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

4. You get a single URL for both frontend and backend.

---

## ─────────────────────────────────────
## OPTIONAL: SWITCH COMPILER API SOURCE
## ─────────────────────────────────────

### Option B — RapidAPI Free Tier (50 req/day)

Use this if the public instance is slow or rate-limited.

1. Sign up at [https://rapidapi.com](https://rapidapi.com)
2. Subscribe (free): [https://rapidapi.com/judge0-official/api/judge0-ce](https://rapidapi.com/judge0-official/api/judge0-ce)
3. Run with your key:

```bash
RAPIDAPI_KEY=your_key_here node server.js
```

On Render/Railway, add `RAPIDAPI_KEY` as an **Environment Variable** in the dashboard.

---

### Option C — Self-Host Judge0 (Unlimited, Requires Docker)

```bash
# Follow the official guide:
# https://github.com/judge0/judge0

# Then point the server at your local instance:
JUDGE0_URL=http://localhost:2358 node server.js
```

---

## ─────────────────────────────────────
## ENVIRONMENT VARIABLES REFERENCE
## ─────────────────────────────────────

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `JUDGE0_URL` | `https://ce.judge0.com` | Judge0 instance URL |
| `RAPIDAPI_KEY` | *(empty)* | RapidAPI key (only for Option B) |

Set on Render/Railway: go to your service → **Environment** tab → Add variable.

---

## ─────────────────────────────────────
## TROUBLESHOOTING
## ─────────────────────────────────────

| Problem | Solution |
|---|---|
| "Could not connect to backend" | Make sure `node server.js` is running |
| "Judge0 submission failed" | Public instance may be temporarily overloaded — retry or switch to RapidAPI |
| "No output" | Your code ran but printed nothing — check your print statement |
| CORS error in browser | Backend is not running or wrong port / URL in `BACKEND_URL` |
| Slow execution | Public instance is shared — use RapidAPI or self-host for speed |
| Render spins down after 15 min | Free tier sleeps — first run after idle takes ~30s to wake up |
| `node-fetch` not found | Run `npm install` again |
| Port 3000 already in use | Run `PORT=3001 node server.js` and update `BACKEND_URL` in index.html |

---

## Quick Checklist Before Going Live

- [ ] Renamed `index-animated-part4.html` → `index.html`
- [ ] `npm install` completed successfully
- [ ] Backend running and `/health` returns `{"status":"ok"}`
- [ ] `BACKEND_URL` in `index.html` updated to production URL (not `localhost`)
- [ ] Tested all 5 languages in the Compiler tab
- [ ] `package.json` is in the same folder as `server.js`
