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

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- `pnpm` installed globally (`npm install -g pnpm`)

### Installation & Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory (and in `artifacts/api-server/.env`) with your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run the Application**:
   You can start both the frontend and backend in parallel from the root directory:
   
   Start the API Server (Port 5000):
   ```bash
   pnpm --filter @workspace/api-server run dev
   ```

   Start the Frontend (Port 5173):
   ```bash
   pnpm --filter @workspace/teach-chhota run dev
   ```

## 🧠 AI Integration

Teach Chhota uses the Gemini API for:
1. **RAG Vector Search**: `gemini-embedding-001` for embedding NCERT chunks and student queries.
2. **Generative Responses**: `gemini-2.5-flash` for answering doubts and providing personalized evaluation feedback when the student teaches Chhota.
