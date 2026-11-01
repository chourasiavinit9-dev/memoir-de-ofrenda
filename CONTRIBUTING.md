# Contributing to Ofrenda

Thank you for your interest in contributing to **Ofrenda**! This project is an offline-first, privacy-respecting Día de los Muertos digital altar.

---

## 🛠️ Architecture Principles

1. **Local Permanence by Construction**: The application must run 100% offline without requiring external servers or telemetry for core functionality.
2. **Zero Hallucination Guarantee**: Prompts and AI services must strictly cite existing family notes and guard against synthetic facts.
3. **No Heavy Toolchains**: The client is a self-contained web app, and the server relies purely on the Python standard library without external framework baggage.

---

## 🚀 Development Workflow

### Prerequisites
- Python 3.9+
- [Ollama](https://ollama.com/) with `gemma3:4b` installed
- *(Optional)* Node.js 18+ if contributing to the Mastra memory agent (`echo-agent/`)

### Setup & Testing
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd ofrenda
   ```
2. Verify Ollama & pull model:
   ```bash
   make check
   make setup
   ```
3. Run the test suite:
   ```bash
   make test
   ```
4. Start the development server:
   ```bash
   make run
   # or simply: make open
   ```

---

## 🧪 Testing Checklist

Before submitting a Pull Request or completing any changes:
- [ ] Run `make test` — all 30 tests in `tests/test_server.py` must pass.
- [ ] Ensure all dynamic HTML interpolations pass through `escapeHtml()` to prevent XSS.
- [ ] Ensure any newly added controls include standard WCAG 2.1 AA accessible labels (`aria-label`, `role`, keyboard event handling).
- [ ] Ensure no family notes or sensitive keys are committed (check `.gitignore`).

