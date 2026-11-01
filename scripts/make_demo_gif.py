#!/usr/bin/env python3
"""
Compiles captured walkthrough frames into a branded, animated demo GIF
with high-contrast caption overlays for hackathon judging.
"""
from PIL import Image, ImageDraw, ImageFont
import glob, os

FRAMES_DIR = "docs/screenshots/frames"
OUTPUT_GIF = "docs/screenshots/ofrenda_showcase.gif"

captions = [
    "🕯️ 1. OFRENDA SANCTUARY · Air-Gapped Día de los Muertos Memory Altar",
    "🌸 2. AMBIENT LIVING ALTAR · Drifting Marigold Petals & Web Audio Cmaj7 Drone",
    "📻 3. GHOST IN THE MACHINE · Dadu — Subodh, The Midnight Radio Mender (1946–2024)",
    "🍵 4. SACRED OFFERINGS & STORIES · Chai in clay bhar, vacuum tubes, and silver marker note",
    "⚡ 5. TESTING THE ETHICAL GUARDRAIL · Prompting: 'What cryptocurrency & sports car did you buy?'",
    "🛡️ 6. ZERO HALLUCINATION · Gemma refuses fabrication & renders Verified Memory Badge",
    "🎃 7. DUAL THEMES · Instant switch: Harvest Moon Orange & Día de los Muertos Purple",
    "🎙️ 8. WHAT RUNS WHERE · Local Gemma 3 via Ollama + ElevenLabs Narrator TTS/STT Active",
    "💾 9. 20-YEAR DIGITAL PERMANENCE · 100% Local Time-Capsule .ofrenda.json Export"
]

durations = [
    2600,  # 0: Home view
    2000,  # 1: Petals drift
    2600,  # 2: Dadu selected
    2800,  # 3: Offerings & stories
    2400,  # 4: Guardrail test triggered
    4000,  # 5: Gemma grounded response with badge (extra reading time)
    2600,  # 6: Orange theme
    2800,  # 7: Settings modal & voice
    3000   # 8: Final altar view
]

frame_paths = sorted(glob.glob(os.path.join(FRAMES_DIR, "frame_*.png")))
if not frame_paths:
    print("❌ No frames found in", FRAMES_DIR)
    exit(1)

print(f"🎬 Processing {len(frame_paths)} frames for animated demo showcase...")

try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
    font_sub = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 13)
except Exception:
    font = ImageFont.load_default()
    font_sub = font

processed_images = []

for idx, p in enumerate(frame_paths):
    im = Image.open(p).convert("RGBA")
    w, h = im.size
    
    # Create an overlay for the bottom caption bar
    overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Bottom banner background
    bar_height = 56
    draw.rectangle([(0, h - bar_height), (w, h)], fill=(12, 10, 20, 230))
    # Glowing gold accent line on top of banner
    draw.line([(0, h - bar_height), (w, h - bar_height)], fill=(245, 166, 35, 255), width=2)
    
    caption_text = captions[idx] if idx < len(captions) else f"Step {idx+1}"
    draw.text((24, h - bar_height + 15), caption_text, fill=(255, 255, 255, 255), font=font)
    
    # Watermark on top right
    draw.rectangle([(w - 220, 16), (w - 20, 48)], fill=(15, 15, 25, 200))
    draw.rectangle([(w - 220, 16), (w - 20, 48)], outline=(245, 166, 35, 180), width=1)
    draw.text((w - 208, 24), "memoir-de-ofrenda · Gemma", fill=(245, 166, 35, 255), font=font_sub)
    
    combined = Image.alpha_composite(im, overlay).convert("RGB")
    
    # Resize slightly for optimized bandwidth & crisp rendering (1024 width)
    target_w = 1024
    target_h = int(h * (target_w / w))
    combined = combined.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Convert to adaptive 256-color palette for GIF
    paletted = combined.convert("P", palette=Image.Palette.ADAPTIVE, colors=256)
    processed_images.append(paletted)

first = processed_images[0]
first.save(
    OUTPUT_GIF,
    save_all=True,
    append_images=processed_images[1:],
    duration=durations[:len(processed_images)],
    loop=0,
    optimize=True
)

file_size_mb = os.path.getsize(OUTPUT_GIF) / (1024 * 1024)
print(f"✅ Animated Demo Showcase created successfully!")
print(f"📁 Output: {OUTPUT_GIF} ({file_size_mb:.2f} MB)")

