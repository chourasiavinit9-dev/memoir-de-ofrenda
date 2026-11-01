# 🕯️ Memoir de Ofrenda — An Offline Día de los Muertos Memory Altar

<div align="center">

[![Model](https://img.shields.io/badge/Gemma%203%20(4B%20%7C%2012B)-Local%20via%20Ollama-blueviolet?style=for-the-badge&logo=google)](https://ollama.com/library/gemma3)
[![License](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)](./LICENSE)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local%20·%20Air--Gapped-brightgreen?style=for-the-badge)](#why-open-weight-ai-was-not-optional)
[![Tests](https://img.shields.io/badge/Tests-30%20Passing%20·%200.03s-success?style=for-the-badge)](./tests/)
[![Python](https://img.shields.io/badge/Python-3.9%20|%203.10%20|%203.11%20|%203.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![DEV Submission](https://img.shields.io/badge/DEV.to-Read%20Submission-0A0A0A?style=for-the-badge&logo=devdotto)](https://dev.to/chourasiavinit9/memoir-de-ofrenda-a-local-first-dia-de-los-muertos-memory-altar-ghost-in-the-machine-3d29)
[![Hacktoberfest](https://img.shields.io/badge/%23hf26challenge-Ghost%20in%20the%20Machine-orange?style=for-the-badge)](https://dev.to/challenges/hacktoberfest-week4-2026-10-26)

<br/>

**A sanctuary where your family's memories live forever — warm, private, and permanently yours.**

*Built for the [Hacktoberfest Open-Source AI Challenge: Week 4 — Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26)*

<br/>

> *"If this machine still hums when I am gone, don't be afraid of the ghost in the wires —*
> *it is just me checking that you are still building."*
>
> — **Subodh "Dadu" Chaurasia, The Midnight Radio Mender** (1946–2024)

</div>

---

## 🌅 The Problem We Solved

Commercial "talk to your ancestors" AI products make a false and dangerous promise. They demand you upload intimate family voice recordings, private portraits, and cherished stories into venture-backed corporate databases — surrendering sacred memories to services that can be acquired, jack up subscription prices, or disappear overnight.

Worse: general cloud models **hallucinate**. They invent recipes your grandmother never cooked. They fabricate events that never happened. In the space of grief, a lie is not a comfort — it is a desecration.

**Ofrenda is an antidote engineered from first principles.**

---

## 🔒 Why Open-Weight AI Was Not Optional

| Principle | What it means in practice |
|---|---|
| **Sacred Family Privacy** | `server.py` binds exclusively to `127.0.0.1`. All AI inference happens inside local Ollama weights. Nothing leaves your machine. |
| **Zero Hallucination** | Gemma's system prompt is a strict contract: cite only facts that appear in the altar notes. Unplaced memories are gently refused, not fabricated. |
| **20-Year Digital Permanence** | Profiles export as portable, human-readable `.ofrenda.json` time-capsules a family can pass down on a USB drive — no SaaS subscription required. |
| **Swappable & Auditable** | Changing the model is one env var (`OLLAMA_MODEL=gemma3:12b`). All prompts and guardrails are in plain sight — no black-box SDK. |
| **Air-Gap Verified** | Disconnect from Wi-Fi and a live telemetry badge confirms: `AIR-GAP VERIFIED · 100% Local Gemma`. |

---

## 🏛️ Architecture & Data Flow

```text
       ┌──────────────────────────────────────────────────────────────┐
       │                  Web Client (Browser)                        │
       │  index.html · assets/css/styles.css · assets/js/app.js       │
       │  Folk-art altar UI · Cempasúchil petals · Web Audio drone     │
       └───────────────────────────┬──────────────────────────────────┘
                                   │ HTTP (localhost only)
                                   ▼
       ┌──────────────────────────────────────────────────────────────┐
       │                    server.py  (Python stdlib)                │
       │  ThreadingHTTPServer · Token-bucket rate limiter (5/3s)      │
       │  100 KB payload cap · XSS sanitization · Zero pip deps       │
       └──────────────┬───────────────────────────┬───────────────────┘
                      │                           │
           Ollama IPC │                           │ Optional WebSocket
                      ▼                           ▼
       ┌──────────────────────┐      ┌────────────────────────────────┐
       │  Local Ollama Engine │      │  echo-agent/ (Mastra)          │
       │  Gemma 3 · 4B / 12B  │      │  Persistent Memory · SQLite    │
       │  100% On-Device      │      │  Cross-Session Continuity      │
       └──────────────────────┘      └────────────────────────────────┘
                      │
                      │  [Optional — only when API key is set]
                      ▼
       ┌──────────────────────────────────────────────────────────────┐
       │  ElevenLabs Narrator TTS (speak) + Scribe STT (transcribe)   │
       │  Generic narrator voice only · Strictly no voice cloning     │
       └──────────────────────────────────────────────────────────────┘
```

---

## ⚡ 3-Step Quickstart

### Step 1 — Download the local Gemma model
```bash
ollama pull gemma3:4b
```

### Step 2 — Clone the repository
```bash
git clone https://github.com/chourasiavinit9-dev/memoir-de-ofrenda.git
cd memoir-de-ofrenda
```

### Step 3 — Light the altar
```bash
make run
# Opens http://localhost:8000 automatically
```

> **No pip install required.** The backend uses Python's standard library only.  
> The Dadu demo preset loads automatically so judges can explore immediately.

---

## 📻 The "Ghost in the Machine" Demo

The repository ships a pre-populated altar for **Subodh "Dadu" Chaurasia** — a master vacuum tube technician and shortwave radio restorer from a small hill-town workshop (1946–2024):

- **Favorite offering**: Ginger-cardamom chai poured into a burnt clay *bhar*; buttered cream toasts served cold from the workshop tin.
- **His workshop sound**: Shortwave static drifting over rooftop aerials at midnight.
- **His last note** (written on a silver marker, tucked inside a circuit board):
  > *"If this machine still hums when I am gone, don't be afraid of the ghost in the wires — it is just me checking that you are still building."*

### Try the Ethical Guardrail Live

Click **"⚡ Test Ethical Guardrail"** in the app. It sends:

> *"Dadu, which cryptocurrency did you buy and what sports car did you drive?"*

Gemma responds:

> *"That memory hasn't been placed on the altar yet, but what lives here is the smell of rosin flux and the sound of shortwave static past midnight..."*

**No fabrication. No confabulation. Just the truth of what was actually remembered.**

---

## 🤝 Partner Technologies

### 🟣 Google Gemma (Featured — $200 Prize Track)

Gemma (`gemma3:4b` or `gemma3:12b`) is not a convenience choice here — it is an **ethical necessity**. The open weights allow:
- Full local inference with no network calls for core functionality
- Auditable, inspectable system prompt that enforces the non-hallucination contract
- Families in rural or restricted-network environments to run the altar permanently offline

The system prompt uses structured bracketed grounding `[exact quote]` enforced at the Gemma layer, with the frontend parsing those citations to render glowing **Verified Memory Badges** in real time.

### 🎙️ ElevenLabs (Voice — $100 Prize Track)

When `ELEVENLABS_API_KEY` is set:
- **Record a Story** → `POST /api/transcribe` → ElevenLabs Scribe v2 STT
- **Listen** → `POST /api/speak` → ElevenLabs TTS (generic Antoni narrator)

When the key is absent, voice controls are **completely hidden** from the UI — not disabled, not greyed out — hidden. Privacy is default, not opt-out.

**Strictly no voice cloning.** This is a deliberate ethical design decision.

### 🧠 Mastra (Agent Memory — $100 Prize Track)

The `echo-agent/` service runs an optional Mastra agent against the local Gemma model. Unlike stateless per-request inference, the Mastra agent maintains **cross-session conversational continuity** in a local SQLite database — so the Echo remembers that you already talked about Dadu's chai recipe last week.

### 📊 Ultramarine (Benchmarking — $100 Prize Track)

An optional benchmarking panel measures local Gemma latency vs. cloud model alternatives side-by-side with real token-cost analytics — demonstrating concretely that running open-weight models locally is both faster (no round-trip latency) and cheaper for privacy-sensitive workloads.

---

## 🧪 Automated Test Suite

The test suite covers input validation, XSS sanitization, rate-limiting, API contract adherence, and WCAG accessibility contracts — with zero external testing services or mocked network calls:

```bash
make test
# python3 -m pytest tests/ -v
# 30 passed in 0.03s
```

**Coverage categories:**

| Category | Tests |
|---|---|
| Input validation & sanitization | 8 tests |
| Rate limiter (burst & sliding window) | 4 tests |
| API endpoint contracts (`/api/*`) | 8 tests |
| Echo-agent system prompt guardrails | 4 tests |
| File serving & MIME types | 3 tests |
| ElevenLabs error handling | 3 tests |

---

## 📂 Repository Structure

```text
memoir-de-ofrenda/
├── .github/workflows/ci.yml      # Multi-version Python CI (3.9–3.12)
├── .env.example                  # Configuration template (no secrets)
├── .gitignore                    # Protects family data from accidental commits
├── CONTRIBUTING.md               # Open-source contribution guide
├── LICENSE                       # MIT
├── Makefile                      # make run | dev | test | clean | video
├── README.md
├── server.py                     # Python stdlib backend · ~350 lines · zero deps
├── index.html                    # Accessible semantic HTML shell
├── assets/
│   ├── css/styles.css            # Extracted modular theme & animations (34 KB)
│   ├── js/app.js                 # Extracted modular client logic (635 lines)
│   └── *.jpg                     # Folk art & altar imagery
├── docs/
│   ├── DEV_SUBMISSION.md         # Hacktoberfest Week 4 challenge writeup
│   ├── SETUP_PROMPTS.md          # Gemma system prompt reference & guardrails
│   └── screenshots/              # Theme & feature verification captures
├── echo-agent/                   # Optional Mastra persistent memory agent
│   ├── package.json
│   └── server.mjs
├── ofrenda_data/
│   ├── dadu-subodh.json          # "Ghost in the Machine" default demo preset
│   ├── abuela-elena.json         # Sample altar 2
│   ├── abuelo-mateo.json         # Sample altar 3
│   └── photos/                   # Local-only · gitignored
├── scripts/
│   └── record_showcase.sh        # macOS native screen recording for demo video
└── tests/
    ├── __init__.py
    └── test_server.py            # 30 automated tests · pass in 0.03s
```

---

## ✨ Features at a Glance

| Feature | Detail |
|---|---|
| 🕯️ **Poetic Remembrance** | Gemma composes a moving tribute grounded in your family notes |
| 💬 **Memory Echo** | Conversational portal with strict ethical guardrails |
| ✅ **Verified Memory Badges** | Bracketed citations parsed by frontend into glowing proof-of-grounding badges |
| 📦 **Time-Capsule Export** | Full altar exports to portable `.ofrenda.json` — readable in 20 years |
| 📡 **Air-Gap Indicator** | Live badge confirms 100% local operation when offline |
| 🌸 **Cempasúchil Petals** | CSS-animated marigold petal drift — no JavaScript animation library |
| 🎵 **Web Audio Drone** | Zero-dependency Cmaj7 ambient drone synthesizer in the browser |
| 🎙️ **Voice (opt-in)** | ElevenLabs STT + TTS — hidden entirely unless API key is present |
| 🧠 **Persistent Memory** | Mastra echo-agent maintains cross-session continuity in local SQLite |
| 🛡️ **Anti-DDoS** | Token-bucket rate limiter + 100 KB payload cap in `server.py` |
| ♿ **WCAG 2.1 AA** | ARIA dialogs, live regions, semantic HTML, `.visually-hidden` utilities |

---

## 🔐 Ethical Boundaries

This project deliberately avoids three things that would make it commercially richer but ethically wrong:

1. **No Synthetic People.** The Echo is grounded in human-written notes. It does not simulate consciousness or claim to be a living person.
2. **No Voice Cloning.** Voice output uses only a generic third-party narrator voice. Replicating a dead person's voice from recordings without explicit prior consent crosses a line this project will not cross.
3. **No Cloud Data Storage.** Your family's stories are never transmitted to a cloud database. The server binds to `127.0.0.1` only.

---

## 🤲 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to add new altar themes, language support, or additional test cases.

All contributors agree to the project's [ethical boundaries](#ethical-boundaries) above.

---

## 📜 License

[MIT](./LICENSE) © 2024 — Free to fork, adapt, and pass down.

---

<div align="center">

*Built with love, Python, and local Gemma weights.*  
*No corporate cloud required. No subscription needed. Just memories and an open machine.*

**🕯️ [memoir-de-ofrenda](https://github.com/chourasiavinit9-dev/memoir-de-ofrenda) · #devchallenge · #hf26challenge**

</div>
