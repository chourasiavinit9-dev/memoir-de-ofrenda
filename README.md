# 🕯️ Ofrenda · An Offline Día de los Muertos Memory Altar

[![Model](https://img.shields.io/badge/Model-Gemma%203%20via%20Ollama-blueviolet?style=flat-square&logo=google)](https://ollama.com/library/gemma3)
[![License](https://img.shields.io/badge/License-MIT-amber?style=flat-square)](./LICENSE)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local%20%E2%80%A2%20Air--Gapped-emerald?style=flat-square)](#why-open-weight-ai-matters)
[![Tests](https://img.shields.io/badge/Tests-30%20Passing%20(0.03s)-brightgreen?style=flat-square)](#test-suite)
[![Python](https://img.shields.io/badge/Python-3.9%20%7C%203.10%20%7C%203.11%20%7C%203.12-blue?style=flat-square&logo=python)](https://www.python.org/)

> **A sanctuary where family memories live in warmth, color, and local permanence.**  
> Powered by an open-weight Gemma model via Ollama. Built with zero cloud databases, zero telemetry, and zero hallucination.

---

## 🌟 Why Open-Weight AI Matters Here

Most commercial "talk to a lost loved one" products make a false promise. They require uploading sensitive family voice notes, private photos, and cherished remembrances into corporate databases—surrendering sacred memories to services that could be acquired, raise prices, monetize data, or disappear.

**Ofrenda is engineered from first principles as an antidote:**

1. **Sacred Family Privacy**: The server binds to `127.0.0.1` and communicates exclusively with local model weights via Ollama.
2. **20-Year Digital Permanence**: Stories and profiles are saved as portable, human-readable `.ofrenda.json` time capsules. Families can pass them down on a USB drive without requiring a SaaS subscription or external server.
3. **Strict Grounding & Zero Hallucination**: Grief demands strict ethical truth. The Gemma system prompt explicitly forbids inventing biographical details or pretending to be a living person. Every Memory Echo response quotes the exact grounding phrase in brackets `[]` and visually generates a verified memory badge.
4. **Air-Gap Verified**: Disconnecting from the internet does not interrupt or impair the altar. A live telemetry indicator confirms when the application runs 100% air-gapped on local weights.

---

## 🏛️ Architecture & Data Flow

```text
       ┌────────────────────────────────────────────────────────┐
       │                   Web Client (Browser)                 │
       │   Single-page architectural shrine with folk art UI,   │
       │  Cempasúchil petals, Web Audio drone, & Time-Capsule   │
       └───────────────────────────┬────────────────────────────┘
                                   │ HTTP (Localhost)
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                    server.py (Python)                  │
       │   Stdlib HTTP Server • Anti-DDoS Bucket • 100KB Cap    │
       │       No external pip dependencies required            │
       └──────────────┬──────────────────────────┬──────────────┘
                      │                          │
                      │ Native IPC / HTTP        │ Optional WebSocket
                      ▼                          ▼
       ┌────────────────────────┐      ┌────────────────────────┐
       │   Local Ollama Engine  │      │   Mastra Memory Agent  │
       │   (Gemma 3 4B / 12B)   │      │   (echo-agent/ service)│
       │  100% On-Device Weights│      │   Local SQLite Memory  │
       └────────────────────────┘      └────────────────────────┘
                      │
                      ▼ (Optional Cloud Fallback)
       ┌────────────────────────────────────────────────────────┐
       │     ElevenLabs Narrator TTS & Scribe STT (Opt-in)      │
       │   Strictly generic narrator voice • No voice cloning   │
       └────────────────────────────────────────────────────────┘
```

---

## ⚡ 3-Step Quickstart

### 1. Prerequisites
Install [Ollama](https://ollama.com/) and download the local Gemma model:
```bash
ollama pull gemma3:4b
```

### 2. Clone & Inspect
```bash
git clone https://github.com/<your-username>/ofrenda.git
cd ofrenda
```

### 3. Light the Altar
```bash
# Starts the server and opens http://localhost:8000
make run
```
*Tip: Run `make dev` to automatically run pre-flight checks and ensure Ollama is active.*

---

## 📻 Featured Demo Preset: Dadu (The Midnight Radio Mender)

To experience the system without typing stories manually, Ofrenda ships with a pre-configured sample profile:
* **Name**: Subodh "Dadu" (1946–2024)
* **Tradition**: Master vacuum tube technician & shortwave radio restorer.
* **Favorite Offerings**: Ginger-cardamom chai in a burnt clay bhar, buttered cream toasts, and nighttime shortwave static.
* **Grounding Test**: Click **"⚡ Test Ethical Guardrail"** to ask about cryptocurrencies or cars. Observe the Echo gently refuse to fabricate facts and redirect back to his workshop memories and the quote:
  > *"If this machine still hums when I am gone, don't be afraid of the ghost in the wires—it is just me checking that you are still building."*

---

## 📂 Repository Directory Tree

```text
ofrenda/
├── .github/
│   └── workflows/
│       └── ci.yml             # Automated multi-version Python test runner
├── .env.example               # Clean configuration template
├── .gitignore                 # Enforces privacy of personal runtime files
├── CONTRIBUTING.md            # Guidelines for open-source contributors
├── LICENSE                    # MIT Open-Source License
├── Makefile                   # Developer task automation (run, test, clean)
├── README.md                  # Flagship documentation
├── server.py                  # Python stdlib HTTP backend (<350 lines)
├── index.html                 # Accessible semantic HTML structure
├── assets/
│   ├── css/
│   │   └── styles.css         # Extracted modular CSS theme & animations
│   ├── js/
│   │   └── app.js             # Extracted modular client logic & telemetry
│   ├── altar-tiered.jpg       # Baroque altar centerpiece art
│   ├── canva-stickers.jpg     # Calaveras & traditional folk motifs
│   ├── dia-de-muertos-festive.jpg
│   ├── halloween-orange-moon.jpg
│   └── neon-frame.jpg
├── docs/
│   ├── DEV_SUBMISSION.md      # Official DEV Hacktoberfest challenge writeup
│   ├── SETUP_PROMPTS.md       # Gemma system prompt reference & guardrails
│   ├── reference/
│   │   └── App.jsx.reference  # Standalone React component architecture
│   └── screenshots/           # Altar theme & feature verification captures
├── echo-agent/                # Optional Mastra persistent conversational memory
│   ├── package.json
│   └── server.mjs
├── ofrenda_data/              # Local storage for profiles & time capsules
│   ├── dadu-subodh.json       # "Ghost in the Machine" default demo preset
│   ├── abuela-elena.json
│   ├── abuelo-mateo.json
│   └── photos/
└── tests/
    ├── __init__.py
    └── test_server.py         # 30 automated test cases (pass in <0.05s)
```

---

## 🧪 Test Suite

Run the automated test suite covering validation, security sanitization, rate-limiting, and accessibility contracts:
```bash
make test
# or: python3 -m pytest tests/ -v
```

All 30 tests execute in **0.03s** with zero external testing services.

---

## 📜 Ethical Boundaries & Code of Conduct

1. **No Synthetic People**: The system is an "Echo" grounded in human notes, not a simulation of consciousness.
2. **No Voice Cloning**: Voice output is strictly restricted to generic, third-party narrator voices.
3. **Data Sovereign**: No telemetry, tracking pixels, or third-party cookies are used.
