#!/bin/bash
# ── record_showcase.sh ────────────────────────────────────────────────────────
# Records a high-definition video walkthrough of Ofrenda using native macOS screencapture.

DURATION=${1:-35}
OUTPUT_FILE="docs/screenshots/ofrenda_showcase.mov"

echo "=========================================================="
echo "🎬 Recording Ofrenda Video Walkthrough (${DURATION}s)"
echo "=========================================================="
echo "1. Opening http://localhost:8000 in your browser..."
open "http://localhost:8000"
sleep 2

echo "2. Recording begins in 3 seconds. Focus your browser window!"
sleep 3
echo "🔴 RECORDING NOW (${DURATION} seconds)..."
echo "👉 Walkthrough checklist:"
echo "   - Click on Dadu (The Midnight Radio Mender)"
echo "   - Click '⚡ Test Ethical Guardrail'"
echo "   - Highlight the emerald 'Verified Memory Citation' badge"
echo "   - Click the 'Zero Cloud / Air-Gap' pill in the header"
echo "   - Click '💾 Save .ofrenda' to export the time capsule"

/usr/sbin/screencapture -v -V "${DURATION}" -k "${OUTPUT_FILE}"

if [ -f "${OUTPUT_FILE}" ]; then
  echo ""
  echo "✅ Video saved successfully to: ${OUTPUT_FILE}"
  echo "Open with QuickTime to review: open ${OUTPUT_FILE}"
else
  echo "❌ Recording was interrupted or cancelled."
fi
