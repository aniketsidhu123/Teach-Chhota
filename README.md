# 📚 Teach Chhota (टीच छोटा)

> **"Study without internet. Learn by teaching a tiny, curious AI."**  
> An offline-first, AI-powered learning companion for Indian school students (Classes 6–12, Maths & Science) that implements the **Protégé Effect** and the **Feynman Technique**.

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Framework: React 18 + Vite](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-blue.svg)](https://vitejs.dev/)
[![Backend: Express + TypeScript](https://img.shields.io/badge/Backend-Express%20%2B%20TS-green.svg)](https://expressjs.com/)
[![Database: SQLite + Drizzle](https://img.shields.io/badge/Database-SQLite%20%2B%20Drizzle-orange.svg)](https://orm.drizzle.team/)
[![AI: Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.5%20Flash-purple.svg)](https://aistudio.google.com/)
[![PWA: Offline First](https://img.shields.io/badge/PWA-Offline%20First-success.svg)](https://web.dev/progressive-web-apps/)

---

## 📖 Table of Contents

- [🌟 The Core Innovation: Protégé Effect](#-the-core-innovation-protégé-effect)
- [✨ Key Features](#-key-features)
- [🧠 AI & Pedagogical Engine](#-ai--pedagogical-engine)
- [🏗️ Project Architecture & Monorepo Layout](#️-project-architecture--monorepo-layout)
- [🚀 Quick Start (Windows One-Click)](#-quick-start-windows-one-click)
- [🛠️ Manual Installation (All Platforms)](#️-manual-installation-all-platforms)
- [⚙️ Environment Variables](#️-environment-variables)
- [🎯 5-Minute Pitch Script & Presentation Dossier](#-5-minute-pitch-script--presentation-dossier)
- [🌐 Deployment (Vercel & Production)](#-deployment-vercel--production)
- [🤝 Contributing & License](#-contributing--license)

---

## 🌟 The Core Innovation: Protégé Effect

Traditional EdTech treats students as passive consumers of video lectures—leading to **over 70% conceptual loss within 48 hours**. Generic AI homework bots encourage cognitive laziness by providing instant copy-paste answers.

**Teach Chhota flips the classroom:**
- **Chhota is NOT a tutor:** Chhota is a friendly, curious AI student who holds common academic misconceptions from the NCERT syllabus.
- **The Student is the Teacher:** Grounded in cognitive science's **Protégé Effect** and the **Feynman Technique**, students master concepts by explaining them aloud to fix Chhota’s wrong beliefs.
- **Active Recall > Passive Consumption:** Formulating an explanation forces deep understanding, permanent retention, and metacognitive awareness.

```
┌─────────────────┐       Student Explains Aloud      ┌─────────────────┐
│     Student     │ ─────────────────────────────────> │  Chhota (Tutee) │
│   ("Teacher")   │ <───────────────────────────────── │  AI Misconception│
└─────────────────┘       Multi-Factor Evaluation     └─────────────────┘
                                   │
                                   ▼
                      ┌──────────────────────────┐
                      │  Samajh Score Engine     │
                      │  • Correctness (35%)     │
                      │  • Misconception (25%)   │
                      │  • Clarity (25%)         │
                      │  • Analogy (15%)         │
                      └──────────────────────────┘
```

---

## ✨ Key Features

| Feature | Route / Module | Description |
| :--- | :--- | :--- |
| **🎙️ Practice Studio** | `/teach` | Voice hold-to-talk (Web Speech API) & text interface where Chhota asks questions. Real-time multi-factor AI feedback with scaffolded hints. |
| **🗃️ Galti-Dex** | `/galti-dex` | Pokédex-style collectible misconception cards. Destigmatizes mistakes by turning corrected errors into trophies with Daily Bug Bounties. |
| **🌳 Knowledge Tree** | `/tree` | Visual concept tree where mastered topics bloom and decaying concepts wilt when due for spaced review via SM-2. |
| **🛍️ Avatar Cosmetic Shop** | `/shop` | Chhota avatar customizations (skins, accessories, hats, streak freezes) unlocked purely via earned **Samajh Coins** (no pay-to-win microtransactions). |
| **👥 Social & Study Buddies**| `/friends` | Add study partners, share misconception milestones, track peer progress, and collaborate in low-stress study circles. |
| **🔊 Parent & Teacher Audio**| `/parent` | Plain-language Hindi and English audio summaries for parents with zero marks, zero rankings, and zero stress. |
| **🗺️ Syllabus Roadmaps** | `/roadmaps` | Structured NCERT curriculum roadmaps for Classes 6–12 across Mathematics and Science chapters. |
| **💎 Teach Chhota Plus** | `/plus` | Premium offline content packs, custom voice synthesis, and teacher misconception heatmaps. |
| **📶 Offline-First PWA** | Service Worker (`sw.js`) | Installable on budget smartphones; persists local SQLite caches and operates gracefully with intermittent or zero internet. |

---

## 🧠 AI & Pedagogical Engine

### 1. Google Gemini Integration
- **`gemini-embedding-001`**: Indexes NCERT textbook passages into vector embeddings for high-precision syllabus-grounded doubt retrieval.
- **`gemini-2.5-flash` / `gemini-2.0-flash`**: Evaluates student audio/text explanations in real time, detecting whether the core misconception was resolved, whether misconceptions were reinforced, and generating encouraging dialogue.

### 2. The Samajh Score Formula
Every student explanation is scored against a rigorous 4-factor rubric:
$$\text{Score} = (0.35 \times \text{Correctness}) + (0.25 \times \text{Misconception Fix}) + (0.25 \times \text{Clarity}) + (0.15 \times \text{Analogy Use})$$

### 3. SM-2 Spaced Repetition Decay
- **Anti-Cramming Penalty:** Repeating the same concept repeatedly within a short window suffers a $0.7\times$ diminishing return.
- **Revival Bonus:** Reviving a wilted node on the Knowledge Tree after the memory consolidation window rewards a $1.5\times$ Samajh score multiplier.

---

## 🏗️ Project Architecture & Monorepo Layout

Teach Chhota is structured as a typed `pnpm` monorepo:

```
Teach-Chhota/
├── artifacts/
│   ├── teach-chhota/              # Frontend React application
│   │   ├── src/
│   │   │   ├── pages/             # friends, galti-dex, knowledge-tree, shop, plus, profile
│   │   │   ├── components/        # Radix UI + shadcn components, audio recorders, speech
│   │   │   └── lib/               # Gamification, auth context, service worker sync
│   │   ├── public/                # Web manifest, icons, service worker, pitch PDF
│   │   └── vite.config.ts         # Vite bundler configuration
│   │
│   └── api-server/                # Express backend application
│       ├── src/
│       │   ├── routes/            # rag, gamification, bug-bounty, shop, friends, auth
│       │   └── seed-cosmetics.ts  # Cosmetic items seeder
│       └── build.mjs              # ESBuild server bundling script
│
├── lib/
│   ├── db/                        # SQLite database & Drizzle ORM schemas
│   │   ├── src/schema/            # Drizzle table schemas
│   │   └── sqlite.db              # Pre-seeded NCERT vector database
│   ├── api-spec/                  # OpenAPI 3.0 specification & Orval configs
│   ├── api-client-react/          # Auto-generated React Query hooks
│   └── api-zod/                   # Auto-generated Zod validation schemas
│
├── scripts/
│   ├── generate_pdf.py            # Playwright script to generate 5-minute pitch PDF
│   └── post-merge.sh              # Git hook automation
│
├── Teach_Chhota_5Min_Pitch_Script.pdf # Pitch presentation script & judge defense dossier
├── run.bat                        # Windows 1-Click Launch Script
├── setup.bat                      # Windows 1-Click Setup Script
├── pnpm-workspace.yaml            # Monorepo workspace configuration
├── vercel.json                    # Vercel deployment configuration
└── package.json                   # Workspace scripts
```

---

## 🚀 Quick Start (Windows One-Click)

The repository provides automated batch scripts for quick setup and launching:

### Step 1: One-Time Setup
Double-click `setup.bat` (or run in PowerShell/CMD):
```cmd
.\setup.bat
```
This automated script will:
1. Verify Node.js (v20+) and install `pnpm` if missing.
2. Prompt for your free **Google Gemini API Key** and configure `.env`.
3. Install all monorepo workspace dependencies.
4. Compile database schemas and push SQLite tables.
5. Build all frontend and backend packages.
6. Seed avatar cosmetics and NCERT misconceptions.

### Step 2: Launch the App
Double-click `run.bat` (or run in PowerShell/CMD):
```cmd
.\run.bat
```
Both servers will start concurrently and launch in your default browser:
- **Frontend PWA:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 🛠️ Manual Installation (All Platforms)

For Linux, macOS, or manual terminal execution:

### 1. Prerequisites
- **Node.js**: `v20.0.0` or higher
- **pnpm**: `v9.0.0` or higher (`npm install -g pnpm`)
- **Python 3.9+** (optional, for PDF pitch generation)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Configuration
Create `.env` in the repository root and `artifacts/api-server/.env`:
```env
PORT=5000
DATABASE_URL="file:../../lib/db/sqlite.db"
GEMINI_API_KEY="your-google-gemini-api-key"
```
*(Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey))*

### 4. Database Initialization & Build
```bash
# Push database schema
pnpm --filter @workspace/db run push-force

# Build packages
pnpm run build

# Seed shop items and catalog
pnpm --filter @workspace/api-server run seed-cosmetics
```

### 5. Start Development Servers
Open two terminal tabs:

**Terminal 1 (Backend API):**
```bash
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 (Frontend PWA):**
```bash
pnpm --filter @workspace/teach-chhota run dev
```

---

## ⚙️ Environment Variables

| Variable | Description | Default / Example | Required |
| :--- | :--- | :--- | :---: |
| `GEMINI_API_KEY` | Google Gemini API key for embeddings and AI evaluation | `AIzaSy...` | **Yes** |
| `DATABASE_URL` | SQLite file connection string | `file:./lib/db/sqlite.db` | **Yes** |
| `PORT` | Port for the Express API server | `5000` | No |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` | No |

---

## 🎯 5-Minute Pitch Script & Presentation Dossier

Teach Chhota includes a comprehensive presentation dossier and defense strategy for competitions and judge reviews:

- **Location:** [Teach_Chhota_5Min_Pitch_Script.pdf](Teach_Chhota_5Min_Pitch_Script.pdf)  
  *(Also served in the web app under `/Teach_Chhota_5Min_Pitch_Script.pdf`)*
- **Contents:**
  - **Pacing Strategy:** Exact 4m 45s runtime breakdown across 7 acts (Hook, Innovation, Live MVP Walkthrough, Tech Architecture, USPs, Business Viability, Q&A).
  - **Competitive Comparison Grid:** Generic Video Apps vs. ChatGPT Homework Bots vs. Teach Chhota.
  - **Judge Q&A Defense Strategy:** Rapid-fire answers for offline resilience, hallucination mitigation, and anti-gaming controls.

### Re-generating the PDF:
```bash
pip install playwright
playwright install chromium
python scripts/generate_pdf.py
```

---

## 🌐 Deployment (Vercel & Production)

Teach Chhota is pre-configured for Vercel deployment with [`vercel.json`](vercel.json):

1. Connect the GitHub repository to [Vercel](https://vercel.com).
2. Set Environment Variables in the Vercel dashboard:
   - `GEMINI_API_KEY`: Your Gemini API key.
3. Build command:
   ```bash
   pnpm run build
   ```
4. Output directory:
   ```
   artifacts/teach-chhota/dist
   ```

---

## 🤝 Contributing & License

Contributions, feedback, and bug reports are welcome!
- **License:** Distributed under the MIT License.
- **Author:** Aniket Sidhu ([@aniketsidhu123](https://github.com/aniketsidhu123))
