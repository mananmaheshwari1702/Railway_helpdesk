# 🚆 RailSahayak AI: The Future of Indian Railway Enquiries

**RailSahayak AI** (Railway Assistant) is a next-generation, multimodal help-desk kiosk designed to revolutionize passenger assistance at Indian Railway stations. By leveraging the **Google Gemini 2.5 Flash Native Audio API**, it provides a "Vision-First, Voice-Always" experience that eliminates the need for touchscreens or complex menus.

---

## 🌟 The Vision-Driven Experience

Unlike traditional kiosks, RailSahayak doesn't wait to be touched. It **sees** and **hears** the station environment in real-time.

1.  **Proactive Engagement**: Using continuous vision processing, the kiosk detects when a passenger approaches.
2.  **Autonomous Greeting**: The AI initiates contact: *"Namaste! Jai Johar! Kaise ho sangwari? RailSahayak ma aapka swagat hai."*
3.  **Dynamic Flow**: If you respond warmly, the AI follows up in Chhattisgarhi: *"Kahan jaat ha? Kon si gaadi pakadna hai?"*
4.  **Multimodal PNR Scanning**: Passengers can simply hold up their physical or digital ticket. The AI reads the PNR number using Vision and automatically updates the dashboard.
5.  **Multilingual Support**: Fluent in English, Hindi, and **Chhattisgarhi** (Jai Johar!).

---

## 🛠️ Key Features

### 📡 Real-Time Multimodal Interaction
- **Low-Latency Voice**: Powered by Gemini's Live API for near-instantaneous, human-like speech responses.
- **Vision-to-Action**: Detects people, reads tickets, and interprets gestures.
- **Dynamic UI Board**: Swaps between **Live Train Schedules**, **PNR Status Tickets**, and **Station Maps** based on the conversation context.

### 🧠 Intelligent Tool Calling
The system utilizes autonomous function calling to fetch data:
- `searchTrains(query)`: Finds trains by number, name, or destination.
- `checkPNR(pnr)`: Validates and fetches seat status for 10-digit PNRs.
- `getStationFacilities()`: Locates waiting rooms, canteens, and essential services.

### ♿ Accessibility-First Design
- **Voice-Only Navigation**: Fully operable for visually impaired passengers.
- **Simplified Scanning**: Designed for elderly passengers who may find typing PNR numbers difficult.
- **Regional Dialects**: Native support for **Chhattisgarhi** (Jai Johar!).

---

## 🏗️ Technical Architecture

- **Core Engine**: `Gemini 2.5 Flash Native Audio (Live API)`
- **Frontend**: `React 19` + `TypeScript`
- **Styling**: `Tailwind CSS` for a high-contrast, "Digital India" themed UI.
- **Audio Pipeline**: Raw PCM streaming (16kHz in / 24kHz out) for gapless conversational flow.
- **Vision Pipeline**: 2 FPS HD frame capture (720p) optimized for OCR and presence detection.

---

## 🚀 Setup & Execution

### Prerequisites
- An active Google Gemini API Key.
- A modern browser with Camera and Microphone permissions enabled.

### Configuration
The application requires an environment variable for authentication:
```env
API_KEY=your_gemini_api_key_here
```

### Quick Start
1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Launch the development server: `npm start`
4.  Stand in front of the camera and say: *"Jai Johar! Raipur train kab aahee?"*

---

## 🗺️ Roadmap
- [x] **Regional Dialects**: Dynamic conversational flow for **Chhattisgarhi** implemented.
- [ ] **Expanded Regional Dialects**: Marathi, Bengali, Tamil, and more coming soon.
- [ ] **Live NTES Integration**: Connecting to the National Train Enquiry System for real-time GPS tracking.
- [ ] **Platform Wayfinding**: AR-based arrows for navigating to specific platforms.

---

*Built for the modernization of Indian Railways. Transform your commute with RailSahayak AI.*