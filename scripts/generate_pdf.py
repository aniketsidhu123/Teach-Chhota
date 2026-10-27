import os
from playwright.sync_api import sync_playwright

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page {
    size: A4;
    margin: 1.6cm 1.4cm 1.6cm 1.4cm;
    @bottom-right {
      content: counter(page) " of " counter(pages);
      font-size: 8pt;
      color: #718096;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
  }

  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #1a202c;
    line-height: 1.5;
    font-size: 9.5pt;
    margin: 0;
    padding: 0;
  }

  /* Header */
  .header {
    border-bottom: 2px solid #285d5c;
    padding-bottom: 12px;
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .title-group h1 {
    font-size: 20pt;
    color: #285d5c;
    margin: 0 0 4px 0;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  .title-group .tagline {
    font-size: 10.5pt;
    color: #4a5568;
    margin: 0;
    font-weight: 600;
  }
  .badge-container {
    text-align: right;
  }
  .timer-badge {
    background: #e47451;
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 8.5pt;
    font-weight: 700;
    display: inline-block;
    margin-bottom: 4px;
  }
  .meta-text {
    font-size: 7.5pt;
    color: #718096;
  }

  /* Summary Table */
  .timing-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    font-size: 8pt;
  }
  .timing-table th {
    background: #285d5c;
    color: white;
    padding: 6px 10px;
    text-align: left;
    font-weight: 600;
  }
  .timing-table td {
    padding: 5px 10px;
    border-bottom: 1px solid #e2e8f0;
  }
  .timing-table tr:nth-child(even) {
    background: #f7fafc;
  }

  /* Section Styling */
  .act-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 12px;
    overflow: hidden;
    page-break-inside: avoid;
  }
  .act-header {
    background: #edf5f3;
    border-bottom: 1px solid #d2e4e1;
    padding: 6px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .act-title {
    font-size: 10.5pt;
    font-weight: 700;
    color: #285d5c;
    margin: 0;
  }
  .act-timestamp {
    background: #285d5c;
    color: white;
    font-size: 7.5pt;
    font-weight: bold;
    padding: 2px 7px;
    border-radius: 10px;
  }
  .act-body {
    padding: 10px 12px;
  }

  .stage-direction {
    background: #f7f9fa;
    border-left: 3px solid #f5b866;
    padding: 5px 9px;
    margin-bottom: 8px;
    font-size: 8pt;
    color: #4a5568;
    font-style: italic;
  }
  .spoken-script {
    font-size: 9.5pt;
    color: #1a202c;
    line-height: 1.55;
    margin-bottom: 6px;
  }
  .spoken-script strong {
    color: #285d5c;
  }
  .highlight-phrase {
    background: #fef3c7;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 600;
  }

  /* Key Metrics & Comparison */
  .usp-grid {
    display: flex;
    gap: 8px;
    margin: 8px 0;
  }
  .usp-box {
    flex: 1;
    background: #f0f7f6;
    border: 1px solid #c9e2de;
    border-radius: 6px;
    padding: 7px;
    font-size: 7.8pt;
  }
  .usp-box strong {
    color: #285d5c;
    display: block;
    font-size: 8.5pt;
    margin-bottom: 2px;
  }

  /* Table styling */
  table.comp-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.8pt;
    margin-top: 6px;
  }
  table.comp-table th {
    background: #39716c;
    color: white;
    padding: 5px 8px;
    text-align: left;
  }
  table.comp-table td {
    padding: 5px 8px;
    border: 1px solid #e2e8f0;
  }
  table.comp-table tr.highlight-row {
    background: #edf7f4;
    font-weight: bold;
  }

  /* Q&A Section */
  .qa-card {
    background: #fbfbfb;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 7px;
    page-break-inside: avoid;
  }
  .qa-q {
    font-weight: bold;
    color: #e47451;
    font-size: 8.5pt;
    margin-bottom: 3px;
  }
  .qa-a {
    color: #2d3748;
    font-size: 8pt;
    line-height: 1.45;
  }

  .page-break {
    page-break-before: always;
  }
</style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="title-group">
      <h1>Teach Chhota 📚</h1>
      <p class="tagline">5-Minute Judge Pitch Presentation Script & Defense Dossier</p>
    </div>
    <div class="badge-container">
      <span class="timer-badge">⏱️ STRICT RUNTIME: 4m 45s</span><br>
      <span class="meta-text">Target: 620 words @ 135 WPM | Max Cap: 5:00</span>
    </div>
  </div>

  <!-- TIMING PACING STRATEGY -->
  <table class="timing-table">
    <thead>
      <tr>
        <th style="width: 15%;">Timestamp</th>
        <th style="width: 25%;">Section</th>
        <th style="width: 45%;">Core Message / Judge Takeaway</th>
        <th style="width: 15%;">Pacing</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>0:00 – 0:40</strong></td>
        <td>1. The Hook & The Problem</td>
        <td>Passive learning yields 70% loss; EdTech ignores tier-2/3 offline reality</td>
        <td>40s (88 words)</td>
      </tr>
      <tr>
        <td><strong>0:40 – 1:20</strong></td>
        <td>2. The Innovation & Solution</td>
        <td>The Protégé Effect & Feynman Technique: Student teaches an AI tutee</td>
        <td>40s (92 words)</td>
      </tr>
      <tr>
        <td><strong>1:20 – 2:50</strong></td>
        <td>3. Live MVP Demonstration</td>
        <td>Teach Chhota studio, Galti-Dex, Knowledge Tree & Parent Hindi Audio</td>
        <td>90s (195 words + demo)</td>
      </tr>
      <tr>
        <td><strong>2:50 – 3:40</strong></td>
        <td>4. Tech Stack & AI Engine</td>
        <td>Gemini 2.5 Flash RAG, Samajh Engine, SM-2 Spaced Repetition, Offline PWA</td>
        <td>50s (115 words)</td>
      </tr>
      <tr>
        <td><strong>3:40 – 4:20</strong></td>
        <td>5. USPs & Defensibility</td>
        <td>Collectible mistakes (Galti-Dex), No-Anxiety metric, True Offline-First</td>
        <td>40s (85 words)</td>
      </tr>
      <tr>
        <td><strong>4:20 – 4:45</strong></td>
        <td>6. Business Viability & Vision</td>
        <td>B2C Freemium, B2G DIETs heatmaps, Bharat accessibility</td>
        <td>25s (55 words)</td>
      </tr>
      <tr>
        <td><strong>4:45 – 5:00</strong></td>
        <td>7. Buffer / Transition</td>
        <td>Smooth handoff to Judges' Q&A session</td>
        <td>15s buffer</td>
      </tr>
    </tbody>
  </table>

  <!-- ACT 1 -->
  <div class="act-card">
    <div class="act-header">
      <span class="act-title">Act 1: The Hook & The Broken EdTech Paradigm</span>
      <span class="act-timestamp">0:00 – 0:40 (40 Seconds)</span>
    </div>
    <div class="act-body">
      <div class="stage-direction">
        <strong>Visual:</strong> Slide 1 (Split graphic: Child passive before video vs. Child enthusiastically explaining). Stand center stage. Deliver with clear, urgent conviction.
      </div>
      <div class="spoken-script">
        "Respected judges, here is the harsh reality of Indian EdTech: Millions of students watch high-definition video lectures every day, yet their conceptual retention drops by over <span class="highlight-phrase">70% within 48 hours</span>. Why? Because <strong>watching a video is not learning</strong>.<br><br>
        Worse, 95% of EdTech tools assume high-speed 5G. For over <strong>150 million school students across Bharat</strong>, expensive subscriptions and spotty connections lock them out.<br><br>
        We asked: What if, instead of another AI bot lecturing the child, we flipped the classroom? <strong>Meet Teach Chhota.</strong>"
      </div>
    </div>
  </div>

  <!-- ACT 2 -->
  <div class="act-card">
    <div class="act-header">
      <span class="act-title">Act 2: The Core Innovation — The Protégé Effect</span>
      <span class="act-timestamp">0:40 – 1:20 (40 Seconds)</span>
    </div>
    <div class="act-body">
      <div class="stage-direction">
        <strong>Visual:</strong> Slide 2 (Mascot Chhota with speech bubble: "I get confused easily! Can you teach me?").
      </div>
      <div class="spoken-script">
        "Teach Chhota is an offline-first, AI learning companion for Classes 6 to 12. But Chhota is <strong>not a tutor</strong>.<br><br>
        Chhota is a friendly, curious AI student who holds common academic misconceptions. <span class="highlight-phrase">The child is the teacher</span>.<br><br>
        Grounded in cognitive science’s <strong>Protégé Effect</strong> and the <strong>Feynman Technique</strong>, students master Math and Science by explaining concepts aloud to fix Chhota’s wrong beliefs. Because when you teach it, your brain permanently keeps it."
      </div>
    </div>
  </div>

  <!-- ACT 3 -->
  <div class="act-card">
    <div class="act-header">
      <span class="act-title">Act 3: Live MVP Product Walkthrough</span>
      <span class="act-timestamp">1:20 – 2:50 (90 Seconds)</span>
    </div>
    <div class="act-body">
      <div class="stage-direction">
        <strong>Visual:</strong> Live Screen Demo of Teach Chhota web app. Seamless transitions between tabs.
      </div>
      <div class="spoken-script">
        <strong>[1. Practice Studio – /teach]:</strong><br>
        "Here in our Practice Studio, Chhota states a classic doubt: <em>'I think 1/8 is bigger than 1/4 because 8 is bigger than 4!'</em><br>
        The student taps 'Hold to Talk' and explains: <em>'No Chhota, think of cutting a pizza into 8 slices versus 4. 8 slices are much smaller!'</em><br>
        In real time, our AI evaluates correctness, clarity, and analogy use, and Chhota celebrates: <em>'Oh, I get it now! Larger denominators mean smaller slices!'</em><br><br>

        <strong>[2. Galti-Dex – /galti-dex]:</strong><br>
        "Next, notice what happens: Debunking that misconception unlocks a collectible card in the <span class="highlight-phrase">Galti-Dex</span>. We turn the shame of mistakes into a Pokédex-style trophy hunt with Daily Bug Bounties!<br><br>

        <strong>[3. Knowledge Tree & Parent Audio – /tree & /parent]:</strong><br>
        "Concepts live on a <strong>Knowledge Tree</strong> that wilts if not reviewed, triggering spaced repetition. And for parents, we generate zero-anxiety audio summaries in Hindi and English with zero marks and zero stress."
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ACT 4 -->
  <div class="act-card">
    <div class="act-header">
      <span class="act-title">Act 4: Technical Architecture & AI Stack</span>
      <span class="act-timestamp">2:50 – 3:40 (50 Seconds)</span>
    </div>
    <div class="act-body">
      <div class="stage-direction">
        <strong>Visual:</strong> Slide 4 (Architecture flow: React PWA ⇄ Express Server ⇄ Gemini 2.5 Flash / Embeddings ⇄ Local SQLite).
      </div>
      <div class="spoken-script">
        "Our engineering stack is built for scale, intelligence, and edge reliability:<br><br>
        • <strong>AI & RAG Pipeline:</strong> Powered by <strong>Google Gemini</strong>. We use <code>gemini-embedding-001</code> to index NCERT textbooks, and <code>gemini-2.0-flash / 2.5-flash</code> for syllabus-grounded doubt resolution and multi-factor evaluation.<br>
        • <strong>The Samajh Score Engine:</strong> A rigorous mathematical formula weighting correctness (35%), misconception resolution (25%), clarity (25%), and analogy use (15%), multiplied by an <strong>SM-2 spaced repetition decay</strong> that rewards long-term memory over cramming.<br>
        • <strong>Offline-First Resilience:</strong> Built with <strong>React 18, Vite, TypeScript, Drizzle ORM, and SQLite</strong>. If the internet drops, local keyword fallbacks and browser Web Speech APIs ensure the student never stops learning."
      </div>
    </div>
  </div>

  <!-- ACT 5 -->
  <div class="act-card">
    <div class="act-header">
      <span class="act-title">Act 5: Unique Selling Propositions (USPs) & Moat</span>
      <span class="act-timestamp">3:40 – 4:20 (40 Seconds)</span>
    </div>
    <div class="act-body">
      <div class="stage-direction">
        <strong>Visual:</strong> Slide 5 (Competitive Comparison Grid).
      </div>
      <div class="spoken-script">
        "Why can't Byju’s or ChatGPT easily copy this?<br>
        1. <strong>Flipped Role (Tutee vs Tutor):</strong> While ChatGPT answers homework and promotes cognitive laziness, Teach Chhota forces cognitive effort through the Protégé Effect.<br>
        2. <strong>Galti-Dex Gamification:</strong> We destigmatize failure by turning errors into collectible assets.<br>
        3. <strong>Bharat-Ready Architecture:</strong> Zero-latency client-side speech, Hindi audio readouts, and full offline survivability designed for budget smartphones."
      </div>
    </div>
  </div>

  <!-- ACT 6 & 7 -->
  <div class="act-card">
    <div class="act-header">
      <span class="act-title">Act 6 & 7: Business Viability, Social Impact & Grand Close</span>
      <span class="act-timestamp">4:20 – 4:45 (25 Seconds) + Buffer</span>
    </div>
    <div class="act-body">
      <div class="stage-direction">
        <strong>Visual:</strong> Slide 6 (Mascot Chhota smiling, QR code to live demo, team credits). Confident closing tone.
      </div>
      <div class="spoken-script">
        "Our business model combines a <strong>Freemium 'Teach Chhota Plus'</strong> tier with <strong>B2G school partnerships</strong> providing non-ranking misconception heatmaps to teachers.<br><br>
        Judges, the best way to master anything is not to be lectured by a supercomputer—it is to have the confidence to teach someone else. With Teach Chhota, we empower 150 million young learners to become masters of their own mind.<br><br>
        <strong>Thank you! We welcome your questions.</strong>"
      </div>
    </div>
  </div>

  <!-- COMPARISON TABLE -->
  <table class="comp-table">
    <thead>
      <tr>
        <th>Feature</th>
        <th>Generic Video Apps</th>
        <th>ChatGPT / Homework Bots</th>
        <th>Teach Chhota 🌟</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Learning Dynamic</strong></td>
        <td>Passive viewing (&lt;20% recall)</td>
        <td>Passive copying (Zero recall)</td>
        <td><strong>Active Teaching (&gt;80% recall)</strong></td>
      </tr>
      <tr>
        <td><strong>Treatment of Errors</strong></td>
        <td>Penalized on quizzes</td>
        <td>Ignored (Gives direct answers)</td>
        <td><strong>Celebrated in Galti-Dex</strong></td>
      </tr>
      <tr>
        <td><strong>Connectivity Need</strong></td>
        <td>High-bandwidth video streaming</td>
        <td>Constant internet required</td>
        <td><strong>Offline-First PWA + Local RAG</strong></td>
      </tr>
      <tr>
        <td><strong>Parental Anxiety</strong></td>
        <td>High (Scores & rankings)</td>
        <td>None / Detached</td>
        <td><strong>Zero-stress Hindi/English audio updates</strong></td>
      </tr>
    </tbody>
  </table>

  <!-- JUDGE Q&A DEFENSE CHEAT SHEET -->
  <h3 style="color: #285d5c; font-size: 10pt; margin: 12px 0 6px 0; border-bottom: 1px solid #d2e4e1; padding-bottom: 3px;">
    🎯 Judge Q&A Defense Strategy (Quick-Fire Answers)
  </h3>

  <div class="qa-card">
    <div class="qa-q">Q1: "How can it be truly offline-first if you are using Google Gemini?"</div>
    <div class="qa-a">
      <strong>Answer:</strong> "Teach Chhota uses an <em>Offline-First, Graceful Degradation</em> design. When connected, queries tap Gemini 2.5 Flash for nuanced evaluation and embeddings. When offline, our Service Worker caches core NCERT passages, runs local heuristic similarity scoring, and leverages native on-device browser speech APIs. The core learning loop never breaks."
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-q">Q2: "What if the student hallucinates or teaches Chhota something completely wrong?"</div>
    <div class="qa-a">
      <strong>Answer:</strong> "Chhota does not blindly accept inputs. Every explanation is checked against our NCERT ground-truth knowledge base. If the student reinforces the mistake, Chhota expresses gentle confusion: <em>'Wait, does having 8 parts really mean bigger slices?'</em> and prompts them to try again with a scaffolded hint."
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-q">Q3: "How do you stop students from gaming the system to hoard coins?"</div>
    <div class="qa-a">
      <strong>Answer:</strong> "Our <em>Samajh Engine</em> applies mathematical diminishing returns: repeating the same concept lowers score gains by up to 85%. Furthermore, our SM-2 algorithm enforces a 0.7x penalty on cramming, but rewards a 1.5x multiplier when reviving wilted concepts after the proper memory consolidation window."
    </div>
  </div>

</body>
</html>
"""

import shutil
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
PUBLIC_DIR = PROJECT_ROOT / "artifacts" / "teach-chhota" / "public"

temp_html_path = PROJECT_ROOT / "temp_pitch_doc.html"
output_pdf_path = PROJECT_ROOT / "Teach_Chhota_5Min_Pitch_Script.pdf"
public_pdf_path = PUBLIC_DIR / "Teach_Chhota_5Min_Pitch_Script.pdf"

with open(temp_html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(temp_html_path.as_uri())
    page.pdf(
        path=str(output_pdf_path),
        format="A4",
        print_background=True,
        margin={"top": "12mm", "right": "12mm", "bottom": "12mm", "left": "12mm"}
    )
    browser.close()

if os.path.exists(temp_html_path):
    os.remove(temp_html_path)

if PUBLIC_DIR.exists():
    shutil.copyfile(output_pdf_path, public_pdf_path)
    print(f"Synced PDF to public asset: {public_pdf_path}")

print(f"Successfully generated PDF: {output_pdf_path} (Size: {os.path.getsize(output_pdf_path)} bytes)")

