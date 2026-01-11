# Lotto 6/45 Simulator

An advanced, AI-powered lottery simulation platform designed to provide strategic insights, historical data analysis, and seamless winning verification. Built with a focus on technical transparency and educational value.

## 🚀 Key Features

### 1. Main Page (Strategic Generation)
- **Magic Spell (Seed-based) Generation:** Uses a custom string input as an entropy source for the `Linear Congruential Generator (LCG)` algorithm, creating a personalized "fate-driven" number set.
- **Interactive Animation:** A high-quality CSS/JS-based ball mixing and extraction simulation.
- **Per-Ball Frequency Analysis:** Displays the all-time historical occurrence count for each drawn number immediately after extraction.
- **Similarity Matching:** Scans the entire 1,200+ draw history to find the Top 3 most similar past winning combinations.
- **100-Game Strategic Simulation:** 
    - Simulates a 100,000 KRW purchase.
    - Generates 100 combinations based on the "Original + 1-ball variations + 4-fixed semi-auto" strategy.
    - Compares results against the latest actual draw to calculate hypothetical prize winnings.

### 2. About Page (Technical Deep Dive)
- **Algorithm Transparency:** Detailed explanation of the PRNG (Pseudo-Random Number Generator) and the `Fisher-Yates Shuffle` used for fair number distribution.
- **Expected Value Analysis:** A rigorous mathematical breakdown of the 100,000 KRW investment, showing why the expected return is statistically ~51%.
- **Historical Context:** Educational content covering the history of lotteries from Ancient Rome to modern-day systems.
- **Responsible Gaming:** A dedicated section promoting healthy and fun usage of lottery systems.

### 3. Stats Page (Data Insights)
- **Full History Table:** Displays the latest 15 draw results with color-coded ball visuals.
- **Cumulative Frequency Chart:** An interactive bar chart (via Chart.js) visualizing the distribution of all winning numbers from Draw #1 to present.
- **Automated Analysis Report:** A text-based report that identifies "Hot" and "Cold" numbers, odd/even ratios, and range distribution trends based on real-time data.

### 4. AI Scan My Numbers (Smart Verification)
- **Multi-modal AI Integration:** Uses `Google Gemini 1.5/2.0 Flash` models to analyze uploaded or captured lottery receipt images.
- **Zero-Cost Architecture:** Client-side API calls directly to Google's servers, ensuring no hosting costs and maximum privacy.
- **Robust OCR Parsing:** Automatically detects the draw number and lines A through E, even from skewed or low-light photos.
- **Instant Verification:** Cross-references scanned numbers with the `data_all.json` database to report winning ranks and prizes.

## 📝 To-Do List
- [ ] **Automated Data Updates:** Implement a system (e.g., via GitHub Actions) to automatically fetch and update the latest lottery winning numbers every Saturday.

## 🛠 Tech Stack
- **Frontend:** HTML5, CSS3 (Cyberpunk/Dark Theme), Vanilla JavaScript.
- **AI/OCR:** Google Gemini SDK, Tesseract.js (Fallback).
- **Visualization:** Chart.js.
- **Data:** JSON-based all-time lottery history (1,200+ draws).
- **Deployment:** Cloudflare Pages with GitHub CI/CD integration.

## 🛡 Security & Privacy
- **API Key Safety:** Personal API keys are stored only in the browser's `LocalStorage` and are never transmitted to the service provider's server.
- **Encrypted Communication:** All AI requests are handled via HTTPS to Google API endpoints.
- **Stateless Analysis:** Scanned images are processed in-memory and are not saved on any server.

---
*Disclaimer: This simulator is for entertainment and educational purposes only. It does not guarantee or predict actual winning results in real-world lotteries.*
