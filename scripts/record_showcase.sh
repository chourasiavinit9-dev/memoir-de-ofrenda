#!/bin/bash
# ── record_showcase.sh ────────────────────────────────────────────────────────
# Automatically captures high-definition walkthrough frames using Headless Chrome
# and compiles them into docs/screenshots/ofrenda_showcase.gif with branded caption overlays.

set -e

echo "=========================================================="
echo "🎬 Generating Ofrenda Animated Demo Showcase"
echo "=========================================================="

# Ensure server is running
if ! curl -sf http://localhost:8000/api/people > /dev/null; then
  echo "⚠️  Starting Ofrenda server in background on port 8000..."
  python3 server.py &
  sleep 2
fi

echo "1. Capturing high-resolution browser frames via Chrome DevTools Protocol..."
node scripts/record_demo.mjs

echo "2. Compiling and optimizing animated demo showcase..."
python3 scripts/make_demo_gif.py

echo ""
echo "=========================================================="
echo "✅ Demo Showcase ready at: docs/screenshots/ofrenda_showcase.gif"
echo "=========================================================="
