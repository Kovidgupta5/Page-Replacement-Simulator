# Page Replacement Algorithm Visualizer & Learning Hub

A modern, interactive web application for simulating, comparing, and deeply understanding **Page Replacement Algorithms** in Operating Systems memory management. Built for computer science students, educators, and systems engineers.

![Version](https://img.shields.io/badge/Version-2.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Topics](https://img.shields.io/badge/Topic-OS%20Memory%20Management-purple)

---

## 🚀 Key Features

### 1. Seven Page Replacement Algorithms
- **FIFO (First-In, First-Out):** Evicts oldest resident page by queue arrival timestamp. Vulnerable to **Bélády's Anomaly**.
- **OPT (Optimal / Bélády's Min):** Evicts the page unused for the longest future time. Mathematical lower bound for page faults.
- **LRU (Least Recently Used):** Evicts least recently referenced page exploiting temporal locality. True stack algorithm immune to Bélády's Anomaly.
- **Clock (Second-Chance):** Hardware-efficient $O(1)$ LRU approximation using 1-bit reference flags and circular buffer traversal.
- **LFU (Least Frequently Used):** Evicts page with lowest reference frequency count. Excels on stable popularity distributions.
- **ARC (Adaptive Replacement Cache):** IBM self-tuning algorithm dynamically balancing recency ($T_1$) and frequency ($T_2$) using ghost caches ($B_1, B_2$).
- **ML-Based (Learned / Predictive):** Online machine learning model extracting recency, frequency, and Markov sequence transition dynamics to predict future reuse distances.

### 2. Interactive Classroom-Style Step Visualizer
- **Step-by-Step Playback:** Play, Pause, Next Step, Previous Step, and Reset.
- **Playback Speed Selector:** Fast (0.6s), Normal (1.2s), Slow (2.0s).
- **Classroom Memory Matrix:** Dynamic grid displaying frames vertically and reference string steps horizontally, color-coded for:
  - 🟢 **Page Hit** (Frame already resident)
  - 🟡 **Empty Frame Allocation** (Page fault without eviction)
  - 🔴 **Page Fault & Eviction** (Replaced page highlighted)
- **Live State Inspector:**
  - FIFO Arrival Queue: `Oldest [ P1 ] → ... → [ Pn ] Newest`
  - LRU Recency Track: `Least Recently Used [ P1 ] ↔ ... ↔ [ Pn ] Most Recently Used`
  - Optimal Future Lookahead Table for all resident frames.
  - Clock Circular Buffer with Hand pointer and reference bits (`bit 1 → 0` second chances).
  - LFU Live Frequency Counters for each resident frame.
  - ARC Self-Tuning State: $T_1$ (recency), $T_2$ (frequency), $B_1, B_2$ ghost caches, and adaptive target $p$.
  - ML-Based Feature Vectors, transition likelihoods, and predicted reuse risk scores.

### 3. Multi-Algorithm Comparison
- Runs all 7 algorithms simultaneously on identical reference sequences and frame sizes.
- Displays performance scorecards with ranking badges (🏆 Lowest Faults).
- Comparative evaluation table with Hit Ratios, Fault Ratios, and architectural notes.
- Interactive Chart.js bar chart comparing Page Faults vs Page Hits across all 7 policies.

### 4. Interactive Bélády's Anomaly Lab
- Dedicated experimental workbench demonstrating how increasing frames from 3 to 4 increases page faults from 9 to 10 on reference sequence `[1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]`.
- Side-by-side matrices showing exactly why the anomaly occurs in non-stack algorithms ($M_t(m) \not\subseteq M_t(m+1)$).

### 5. In-Depth Educational Guide & Theory Section
- **Paging Fundamentals:** Demand paging, page table mapping, page hits vs page faults, and thrashing.
- **Detailed Algorithm Breakdowns:** Principles, heuristics, hardware mechanisms, pros & cons, time/space complexities for FIFO, OPT, LRU, Clock, LFU, ARC, and ML-Based.
- **TABLE I (Master Comparison Matrix):** Full comparative methodology table evaluating Core Principle, Complexity/Overhead, Adaptability, Bélády's Anomaly susceptibility, and Ideal Workload across all 7 algorithms.
- **Mathematical Formulas & EAT Calculator:** KaTeX formula rendering for Hit Ratio ($HR$), Fault Ratio ($FR$), Effective Access Time ($EAT$), memory degradation multiplier, and an interactive real-time EAT parameter calculator.

---

## 📁 Project Structure

```
cpu-scheduling-simulator-main/
├── index.html              # Main HTML entry point with tabs, visualizer, and theory guide
├── css/
│   └── styles.css          # Modern dark-theme glassmorphism styling
├── js/
│   ├── page-replacement.js # FIFO, LRU, Optimal algorithms & Belády anomaly logic
│   ├── app.js              # Application controller, step playback, and DOM manipulation
│   ├── metrics.js          # Metric helper utilities
│   ├── scheduling.js       # CPU scheduling algorithms (companion module)
│   ├── gantt-chart.js      # Gantt chart visualizer (companion module)
│   └── comparison.js       # Comparison logic
└── README.md               # Project documentation
```

---

## ⚡ Quick Start

### Option 1: Open Directly in Any Web Browser
Simply double-click `index.html` or open it with your favorite browser (Chrome, Firefox, Edge, Safari).

### Option 2: Run with a Local Server
```bash
# Using Node.js
npx -y serve . -p 3000

# Or using Python 3
python -m http.server 3000
```
Navigate to `http://localhost:3000` in your web browser.

---

## 🧪 Testing with Node.js

The core algorithms in `js/page-replacement.js` export cleanly for automated testing:

```bash
node -e "
const { fifo, lru, optimal } = require('./js/page-replacement.js');
const ref = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
console.log('FIFO:', fifo(ref, 3).totalFaults, 'faults');
console.log('LRU:', lru(ref, 3).totalFaults, 'faults');
console.log('OPT:', optimal(ref, 3).totalFaults, 'faults');
"
```

Expected Output:
```
FIFO: 15 faults
LRU: 12 faults
OPT: 9 faults
```
