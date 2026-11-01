# ── Ofrenda Developer Workflow ──────────────────────────────────────────────
# Run `make help` to inspect available lifecycle targets.

PYTHON   := python3
PORT     := 8000
MODEL    := gemma3:4b
DATA     := ofrenda_data

.DEFAULT_GOAL := help

.PHONY: help
help:
	@echo ""
	@echo "  🕯️  Ofrenda – Offline Día de los Muertos Memory Altar"
	@echo "  ──────────────────────────────────────────────────────────"
	@echo "  make setup        Pull local Ollama model ($(MODEL))"
	@echo "  make run          Start server on http://localhost:$(PORT)"
	@echo "  make dev          Start server with pre-flight checks"
	@echo "  make test         Execute automated test suite (30 tests)"
	@echo "  make video        Record a 35s demo showcase video (macOS)"
	@echo "  make open         Open altar in your default browser"
	@echo "  make echo-agent   Start optional Mastra memory agent"
	@echo "  make clean        Remove cache, temporary files, and .pyc"
	@echo ""

.PHONY: setup
setup:
	@echo "▶ Pulling local Gemma model via Ollama: $(MODEL)"
	ollama pull $(MODEL)
	@echo "✅ Model ready. Run 'make run' to light the altar."

.PHONY: check-ollama
check-ollama:
	@curl -sf http://localhost:11434/api/tags > /dev/null && \
		echo "✅ Ollama inference daemon running." || \
		(echo "⚠️  Ollama not responding at localhost:11434. Starting 'ollama serve' in background..." && \
		 (ollama serve > /dev/null 2>&1 & sleep 2))

.PHONY: run
run:
	@echo "▶ Starting Ofrenda on http://localhost:$(PORT)..."
	OLLAMA_MODEL=$(MODEL) $(PYTHON) server.py

.PHONY: dev
dev: check-ollama
	@echo "▶ Starting Ofrenda in development mode on http://localhost:$(PORT)..."
	OLLAMA_MODEL=$(MODEL) $(PYTHON) server.py

.PHONY: test
test:
	@echo "▶ Running test suite..."
	$(PYTHON) -m pytest tests/ -v --tb=short
	@echo "✅ All tests passed."

.PHONY: video
video:
	@./scripts/record_showcase.sh 35

.PHONY: open
open:
	@open http://localhost:$(PORT) 2>/dev/null || \
	 xdg-open http://localhost:$(PORT) 2>/dev/null || \
	 echo "Altar running at: http://localhost:$(PORT)"

.PHONY: echo-agent
echo-agent:
	@echo "▶ Starting Mastra agent on http://127.0.0.1:8787..."
	cd echo-agent && npm install --silent && npm start

.PHONY: clean
clean:
	@echo "▶ Cleaning temp & cache files..."
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null; true
	find . -name "*.pyc" -delete 2>/dev/null; true
	find . -name "*.bak" -delete 2>/dev/null; true
	rm -rf .pytest_cache htmlcov .coverage
	@echo "✅ Repository clean."
