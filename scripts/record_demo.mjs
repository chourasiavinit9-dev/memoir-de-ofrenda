import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve('docs/screenshots/frames');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// 1. Launch Headless Chrome
console.log('🚀 Launching Headless Chrome...');
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=1280,850'
]);

await sleep(2000);

// 2. Fetch page target
console.log('🔗 Connecting to DevTools Protocol...');
const targets = await fetch('http://localhost:9222/json').then(r => r.json());
const pageTarget = targets.find(t => t.type === 'page') || targets[0];
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

let msgId = 1;
const callbacks = new Map();

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id && callbacks.has(data.id)) {
    callbacks.get(data.id)(data);
    callbacks.delete(data.id);
  }
};

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = msgId++;
    callbacks.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

await new Promise(r => ws.onopen = r);
console.log('✅ Connected to Chrome CDP!');

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 850,
  deviceScaleFactor: 1,
  mobile: false
});

// Navigate to app
console.log('📍 Navigating to http://localhost:8000...');
await send('Page.navigate', { url: 'http://localhost:8000' });
await sleep(2500);

let frameIndex = 0;
async function capture(caption) {
  const filename = `frame_${String(frameIndex++).padStart(3, '0')}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  console.log(`📸 [${caption}] -> ${filename}`);
  const res = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filepath, Buffer.from(res.result.data, 'base64'));
  await sleep(600);
}

// Walkthrough Scenario:
// 1. Initial Shrine View
await capture('01_altar_home');
await sleep(1000);
await capture('02_altar_petals_drift');

// 2. Select Dadu Profile
console.log('👉 Selecting Dadu profile...');
await send('Runtime.evaluate', {
  expression: `
    const daduCard = document.querySelector('[data-person-id="dadu-subodh"]') || document.querySelectorAll('.altar-portrait-card')[2];
    if (daduCard) daduCard.click();
  `
});
await sleep(1200);
await capture('03_dadu_selected');

// 3. Scroll to Offerings & Stories
await send('Runtime.evaluate', {
  expression: `window.scrollBy({ top: 380, behavior: 'smooth' });`
});
await sleep(1000);
await capture('04_dadu_offerings_and_stories');

// 4. Trigger Ethical Guardrail Test
console.log('👉 Triggering Ethical Guardrail test...');
await send('Runtime.evaluate', {
  expression: `
    const btn = document.getElementById('test-guardrail-btn');
    if (btn) btn.click();
  `
});
await sleep(1200);
await capture('05_guardrail_prompt_sent');

// Wait for Gemma response to render
await sleep(3500);
await capture('06_gemma_grounded_response_with_badge');

// 5. Toggle Orange Halloween Theme
console.log('👉 Toggling to Halloween Theme...');
await send('Runtime.evaluate', {
  expression: `toggleHalloweenTheme();`
});
await sleep(1000);
await capture('07_orange_halloween_theme');

// 6. Open Settings Modal (Showing Gemma + ElevenLabs active)
console.log('👉 Opening Settings Modal...');
await send('Runtime.evaluate', {
  expression: `openModal('settings-modal');`
});
await sleep(1000);
await capture('08_settings_modal_voice_active');

// 7. Close Settings and return to Altar
await send('Runtime.evaluate', {
  expression: `closeModal('settings-modal'); toggleHalloweenTheme(); window.scrollTo({ top: 0, behavior: 'smooth' });`
});
await sleep(1200);
await capture('09_altar_complete_view');

ws.close();
chrome.kill();
console.log(`\n🎉 Captured ${frameIndex} high-res demonstration frames!`);

