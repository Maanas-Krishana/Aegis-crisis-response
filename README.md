# 🛡️ Aegis Protocol


**Google Solution Challenge 2026 Submission**  
**Target:** Problem Statement 2 - Rapid Crisis Response (Accelerated Emergency Response and Crisis Coordination in Hospitality)

Aegis is a decentralized, AI-powered emergency mesh network designed for the hospitality ecosystem. It eliminates fragmented communication during high-stakes emergencies by bridging distressed guests, active personnel, and emergency services in real-time.

---

## ✨ Key Features


1. **Progressive Web App (PWA) SOS Portal:** Guests do not need to download an app during a panic. They simply scan a QR code in their room to instantly access the Aegis SOS portal on their browser.
2. **Local AI Crisis Triage (Gemma 3):** Powered by Google's Gemma 3 running *locally* via Ollama, the system can parse panicked, unstructured descriptions and categorize them by emergency type (e.g., FIRE, MEDICAL, SECURITY) and severity (1-5) without relying on cloud APIs. This ensures functionality even if external internet access drops.
3. **Real-time Command Center:** Built on Firebase Firestore, the staff dashboard updates instantly. As soon as a guest presses SOS, their GPS location, room number, and AI-triaged action plan appear on the dashboard.

---

## 🏗️ Architecture Stack


- **Frontend:** React + Vite (Vanilla CSS with Glassmorphism UI)
- **Backend/Database:** Firebase Firestore (Real-time NoSQL)
- **AI Engine:** Google Gemma (via Ollama Local API)
- **Icons:** Lucide-React

---

## 🚀 How to Run Locally


### Prerequisites
1. **Node.js** installed on your machine.
2. **Ollama** installed (download from [ollama.com](https://ollama.com/)).
3. A **Firebase Project** configured with Firestore in Test Mode.

### 1. Start the Local AI

Open your terminal and run Gemma to start the local API server:
```bash
ollama run gemma:2b
```
*(Leave this running in the background)*

### 2. Configure Firebase
1. Create a `.env` file in the root of the project.
2. Paste your Firebase configuration variables (if you separated them, or ensure `src/firebase.js` has your config object).

### 3. Start the Application
Install dependencies and run the Vite development server:
```bash
npm install
npm run dev
```

### 4. The Setup (Split Screen)

To test the real-time ecosystem:
- Open the **Guest View** at: `http://localhost:5173/`
- Open the **Command Center** at: `http://localhost:5173/dashboard`
- Hit SOS on the Guest View and watch the Command Center update instantly!

---

## 💡 The "Why"

Hospitality venues face unpredictable emergencies. Relying on phone calls to a front desk creates a bottleneck. Aegis empowers every guest to be a real-time sensor, while empowering staff with prioritized, AI-analyzed data to coordinate an immediate response.

Built with ❤️ for the Google Solution Challenge.
