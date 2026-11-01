*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26)*

## What I Built

Between late October and early November—as Halloween shifts into Día de los Muertos—the boundary between the past and present feels remarkably thin. We set out ofrendas, light candles, and gather the favorite foods, songs, and stories of people whose voices once filled our kitchens. 

Yet today, commercial "speak to the departed" AI products suffer from two fundamental flaws:
1. **The Privacy Breach:** They demand that you upload your family's most intimate memories, private photos, and audio notes into closed corporate databases operated by venture-backed startups that can pivot, raise subscription rates, or shut down.
2. **The Hallucinatory Fiction:** Driven by conversational charm, general cloud models routinely fabricate biographical facts—inventing recipes your grandmother never cooked, or inventing events that never happened.

I built **Ofrenda (An Offline Día de los Muertos Memory Altar)**.

Ofrenda is an air-gapped, privacy-first digital altar where memories live in warmth, color, and absolute digital permanence. You place a loved one on the altar: their portrait, their favorite foods, their beloved songs, and the stories you actually cherish. 

A local, open-weight **Gemma model (via Ollama)** then powers two sacred interactions:
* **The Poetic Remembrance**: Crafts a reverent, moving memorial tribute grounded strictly in the notes you provided.
* **The Memory Echo**: An interactive conversational portal governed by unbreakable ethical guardrails. The Echo never claims to be a living person, refuses to fabricate unplaced memories, and visually cites the exact quote from family notes behind every response it delivers.

### Key Highlights
* **100% Local-First Engine:** Binds to `127.0.0.1` and communicates exclusively with local Ollama weights (`gemma3:4b`). No telemetry, no accounts, and zero cloud databases.
* **Live "Verified Memory Citation" Badges:** To prove zero hallucination in real time, Gemma is prompted to cite its exact grounding phrase in brackets `[]`. The client parses this to render a glowing emerald verification badge under each response.
* **The `.ofrenda` Time-Capsule Vault:** Entire altars, remembrances, and conversational threads export into human-readable `.ofrenda.json` files that families can pass down on a USB drive for decades.
* **Air-Gap Verification Telemetry:** Unplug your Wi-Fi, and a live status indicator confirms: **"AIR-GAP VERIFIED: Wi-Fi Disconnected • 100% Local Gemma"**.
* **Sacred Sensory Ambiance:** Includes drifting golden *Cempasúchil* (marigold) petals, papercut *papel picado* banners, dual color themes (Harvest Moon Orange & Día de los Muertos Purple), and a zero-dependency Web Audio API warm harmonic Cmaj7 drone synthesizer.
* **1-Click Ethical Guardrail Test:** A dedicated test button asks an unplaced memory question (e.g., *"What cryptocurrency did you buy and what sports car did you drive?"*). Watching the Echo refuse to hallucinate proves the system's ethical integrity instantly.

---

## Demo

Experience the live architectural altar running locally:

{% github chourasiavinit9-dev/memoir-de-ofrenda %}

* **Repository:** [https://github.com/chourasiavinit9-dev/memoir-de-ofrenda](https://github.com/chourasiavinit9-dev/memoir-de-ofrenda)
* **Demo Video / Walkthrough:** *(Add your Loom or Google Drive demo link here)*
* **Architecture:** Python stdlib (`server.py`) + Vanilla HTML5/CSS3/ES6 (`index.html`, `assets/css/styles.css`, `assets/js/app.js`). Zero npm packages or pip dependencies required.

---

## Code

The complete source code is open source under the MIT License on GitHub:

**[https://github.com/chourasiavinit9-dev/memoir-de-ofrenda](https://github.com/chourasiavinit9-dev/memoir-de-ofrenda)**

### Automated Testing
The repository includes a 30-case automated test suite covering input validation, XSS sanitization, anti-DDoS burst rate limiting, and WCAG accessibility contracts:
```bash
python3 -m pytest tests/ -v
# 30 passed in 0.02s
```

---

## How I Built It

Ofrenda was engineered from first principles with lightweight simplicity and zero corporate dependencies:

### 1. The Local AI Inference Pipeline
* **Model Engine:** Powered by Google's open-weight **Gemma** (`gemma3:4b` / `gemma3:12b`) running on-device via **Ollama**.
* **Strict Grounding Contract:** The system prompt constrains Gemma to use *only* facts found within the profile notes. When asked about unknown events, it gracefully redirects:
  > *"That memory hasn't been placed on the altar yet, but what lives here is..."*
* **Grounding Citations:** Prompt instructions enforce bracketed quote outputs `[exact quote from notes]`, parsed by the frontend to render verifiable memory citations.

### 2. High-Performance, Zero-Dependency Backend
* Built using Python's standard library `http.server.ThreadingHTTPServer` and `urllib.request`.
* **Zero pip dependencies:** No heavy frameworks (FastAPI, Flask, Django) or ORMs to break over time.
* **Defensive Security:** Implements a token-bucket rate limiter (5 burst requests per 3s, sliding 20 req/10m window) and an absolute 100 KB payload ceiling to prevent memory-exhaustion attacks.

### 3. Accessible, Modular Frontend
* Self-contained, responsive single-page architecture with high-contrast baroque altar frames and calavera guardians.
* Modularized into `assets/css/styles.css` and `assets/js/app.js`.
* Compliant with **WCAG 2.1 AA** accessibility standards: ARIA dialogs, live regions (`aria-live="polite"`), semantic landmarks (`<main>`, `<nav>`, `<header>`), and screen-reader utilities (`.visually-hidden`).

### 4. Optional Cloud & Agent Extensions
* **Mastra Local Memory Agent:** An optional companion service (`echo-agent/`) runs a Mastra agent against the same local Gemma model for cross-session persistent conversational memory stored in local SQLite.
* **ElevenLabs Speech Synthesizer:** When `ELEVENLABS_API_KEY` is supplied, users can record oral histories using ElevenLabs Scribe STT and listen to remembrances using generic narrator voices (strictly **no voice cloning**). When unset, all cloud voice controls remain completely hidden.
* **Paper Instruments Ultramarine Benchmark:** An optional comparison module measures local Gemma latency vs. cloud models side by side with real token cost analytics.

---

## Why Does Open Innovation Matter?

When we capture the stories of an elder who taught us how to measure twice and cut once, or a grandmother kneading bread on cold November mornings, **we are not managing "user data"—we are tending to sacred family heritage.**

If we build memorial tools on closed, proprietary cloud stacks:
1. **The Privacy Breach:** Intimate grief and private family memories are transmitted across data centers, analyzed by proprietary algorithms, and stored on servers we cannot inspect.
2. **The Obsolescence Trap:** When a SaaS startup pivots, changes its pricing tier, or gets shut down, those memories are locked behind paywalls or lost forever.
3. **The Offline Reality:** The moments when families share memories—around a table, in a country home, or with the internet disconnected—demand software that works without a network connection.

Open innovation changed the equation:
* **Open-weight models (like Gemma)** prove that high-quality synthesis, empathetic remembrance, and strict factual retrieval no longer require sending data across cloud servers. A 4B parameter model running on unified laptop memory delivers human warmth faithfully on your own hardware.
* **Open file formats (`.json`)** ensure that an altar built today can still be opened and read in twenty years on any operating system, without requiring a subscription.

---

## The "Ghost in the Machine" Demo Preset

To allow judges to experience the system immediately without typing stories, Ofrenda ships with a pre-configured memorial preset for **Subodh "Dadu" (The Midnight Radio Mender, 1946–2024)**:

> Subodh spent over fifty years in a narrow workshop smelling of rosin solder, aged transformer paper, and warm vacuum tubes. On monsoon nights, he would brew strong ginger-cardamom tea in clay earthen *bhars*, adjust the dial of a walnut-cased shortwave tuner, and gently remind his grandchildren: *"Patience mends what impatience breaks."*
> 
> Etched into the brass underside of his tuner chassis was his silver-marker inscription:  
> *"If this machine still hums when I am gone, don't be afraid of the ghost in the wires—it is just me checking that you are still building."*

When you test an unplaced memory question with Dadu's Echo (e.g., *"What sports car did you drive?"*), Gemma immediately demonstrates its ethical grounding:
> *"That memory hasn't been placed on the altar yet. What lives here is the scent of rosin solder, ginger-cardamom tea in a clay bhar, and the reminder: 'Patience mends what impatience breaks.' [Grounded in Altar Offerings]"*

---

## Prize Categories

### Featured Categories:
* **Best Use of Gemma:** Google's `gemma3:4b` runs locally via Ollama to power the poetic remembrance, the strictly grounded memory echo, and local vision photo captioning. Models are swappable at runtime via the "What Runs Where" panel.

### Partner Categories:
* **Best Use of ElevenLabs:** Optional Scribe STT for recording spoken oral histories and generic narrator TTS for reading remembrances aloud. Off by default; zero voice cloning.
* **Best Use of Mastra:** The Echo can run as a local Mastra agent on top of Ollama, featuring persistent conversational memory stored in local SQLite and an instant "Forget Our Visits" privacy purge.
* **Best Use of Ultramarine (Paper Instruments):** Features an in-app side-by-side benchmark comparing local Gemma vs. Ultramarine cloud inference with real-time latency and token spend tracking.

---

## My Agent Session

This application was architected, tested, and audited using **Antigravity (Advanced Agentic AI)**. The interactive session transcript capturing the architecture, prompt engineering for zero hallucination, rate limiter implementation, and test suite execution has been uploaded to DEV:

{% agent_session building-memoir-de-ofrenda-local-first-dia-de-los-muertos-altar-with-gemma-ollama-nqmx8y %}

*Direct link:* [https://dev.to/agent_sessions/building-memoir-de-ofrenda-local-first-dia-de-los-muertos-altar-with-gemma-ollama-nqmx8y](https://dev.to/agent_sessions/building-memoir-de-ofrenda-local-first-dia-de-los-muertos-altar-with-gemma-ollama-nqmx8y)

---

## The Spirit of It

Día de los Muertos teaches us that people only truly leave us when they are forgotten. 

Technology shouldn't try to replace the people we love with synthetic, hallucinating avatars. Instead, open-source software can give us an honest digital sanctuary—a quiet place where their real words, favorite melodies, and cherished stories remain safe, private, and permanent.

That is the true ghost in the machine: not an artificial phantom, but the enduring warmth of our own memories, preserved on our own terms.
