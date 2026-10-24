# 📚 Teach Chhota

Teach Chhota is an offline-first, AI-powered learning companion designed for Indian school students (Classes 6-12, Maths & Science). It implements the "Learn by Teaching" pedagogy, where students master concepts by explaining them to Chhota, a friendly AI companion.

## 🌟 Key Features

- **Offline-First Architecture**: Works seamlessly without internet, critical for accessibility.
- **Learn by Teaching**: Students fix Chhota's "misconceptions," receiving real-time, constructive AI feedback (powered by Gemini).
- **RAG-Powered Doubt Resolution**: Ask questions in natural language and get answers grounded directly in NCERT syllabus materials.
- **Dynamic Progress Tracking**: Visual streak counters, daily goals, and per-concept mastery tracking.
- **Teacher & Parent Dashboards**: Actionable insights without ranking or scoring anxiety.

## 🏗️ Project Structure

This is a `pnpm` monorepo containing:

- `artifacts/teach-chhota`: The React (Vite) frontend application.
- `artifacts/api-server`: The Express backend handling RAG queries, AI evaluation, and database interactions.

## 🚀 Quick Start (Windows)

For a one-click setup and execution, use the provided batch scripts:

1. **One-Time Setup**:
   Double-click `setup.bat` (or run `.\setup.bat` in terminal).  
   This will:
   - Check Node.js and pnpm prerequisites
   - Configure environment variables and database URLs
   - Install all workspace dependencies
   - Push the SQLite database schema
   - Build all packages
   - Seed the cosmetic shop items

2. **Run the Application**:
   Double-click `run.bat` (or run `.\run.bat` in terminal).  
   This will start both servers and open `http://localhost:5173` in your browser:
   - **Frontend App**: `http://localhost:5173`
   - **Backend API**:  `http://localhost:5000`

---

## 🛠️ Manual Installation & Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Setup Database & Build**:
   ```bash
   pnpm --filter @workspace/db run push-force
   pnpm run build
   pnpm --filter @workspace/api-server run seed-cosmetics
   ```

3. **Run the Application**:
   - Start the API Server (Port 5000):
     ```bash
     pnpm --filter @workspace/api-server run dev
     ```
   - Start the Frontend (Port 5173):
     ```bash
     pnpm --filter @workspace/teach-chhota run dev
     ```

## 🧠 AI Integration

Teach Chhota uses the Gemini API for:
1. **RAG Vector Search**: `gemini-embedding-001` for embedding NCERT chunks and student queries.
2. **Generative Responses**: `gemini-2.5-flash` for answering doubts and providing personalized evaluation feedback when the student teaches Chhota.
