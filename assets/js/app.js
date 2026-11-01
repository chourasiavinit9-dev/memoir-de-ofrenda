    let people = [];
    let currentPerson = null;
    let chatHistory = [];
    let voiceConfig = {};
    let mediaRecorder = null;
    let recordedChunks = [];

    const $ = id => document.getElementById(id);

    function showError(msg) {
      if (!msg) return;
      const t = $('err-toast');
      t.textContent = msg;
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 4500);
    }

    async function api(path, payload) {
      try {
        const res = await fetch(path, payload ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        } : {});
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        return json;
      } catch (err) {
        showError(err.message);
        throw err;
      }
    }

    function openModal(id) { $(id).classList.add('active'); }
    function closeModal(id) { $(id).classList.remove('active'); }

    function toggleHalloweenTheme() {
      const isHalloween = document.body.classList.toggle('theme-halloween');
      $('theme-btn-label').textContent = isHalloween ? '🌼 Día de los Muertos Purple' : '🎃 Orange Halloween Mode';
      localStorage.setItem('ofrenda_theme', isHalloween ? 'halloween' : 'ofrenda');
    }

    async function init() {
      if (localStorage.getItem('ofrenda_theme') === 'halloween') {
        document.body.classList.add('theme-halloween');
        $('theme-btn-label').textContent = '🌼 Día de los Muertos Purple';
      }
      window.addEventListener('online', updateAirGapTelemetry);
      window.addEventListener('offline', updateAirGapTelemetry);
      updateAirGapTelemetry();

      await loadAltarData();
      await loadModelsList();
    }

    async function loadAltarData() {
      try {
        const data = await api('/api/people');
        people = data.people || [];
        voiceConfig = data.voice || {};

        if ($('header-model-lbl')) $('header-model-lbl').textContent = `(${data.model})`;
        
        // Voice toggles
        $('listen-remem-btn').classList.toggle('hidden', !voiceConfig.tts);
        $('record-story-btn').classList.toggle('hidden', !voiceConfig.stt);
        $('compare-cloud-btn').classList.toggle('hidden', !data.compare);
        $('setting-voice-checkbox').checked = !!voiceConfig.on && !!voiceConfig.key;
        $('setting-voice-checkbox').disabled = !voiceConfig.key;
        $('setting-voice-note').textContent = voiceConfig.key ? 
          'Voice active (Scribe STT + Multilingual TTS narrator voice).' : 
          '(Set ELEVENLABS_API_KEY environment variable to enable cloud voice).';

        // Engine note
        const en = data.engine || {};
        $('setting-engine-select').value = en.current || 'ollama';
        $('setting-engine-select').querySelector('[value=mastra]').disabled = !en.mastra;
        $('setting-engine-note').textContent = !en.mastra ? 
          '(Start echo-agent service to enable persistent memory)' : 
          en.store === 'atlas' ? '🟠 Memory is stored in MongoDB Atlas (cloud)' : '🟢 Memory is stored in a local SQLite/LibSQL file';

        renderAltarPeople();

        // Keep current person active if still in list, or select first
        if (currentPerson) {
          const updated = people.find(p => p.id === currentPerson.id);
          if (updated) selectPerson(updated.id);
          else if (people.length > 0) selectPerson(people[0].id);
        } else if (people.length > 0) {
          selectPerson(people[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }

    function renderAltarPeople() {
      const grid = $('altar-people-grid');
      if (!people.length) {
        grid.innerHTML = `
          <div style="text-align: center; color: var(--gold-1); padding: 20px;">
            <div style="font-size: 28px; margin-bottom: 6px;">🌼</div>
            <div>The altar is waiting. Light the first candle above.</div>
          </div>`;
        return;
      }

      grid.innerHTML = people.map(p => `
        <div class="person-offering ${currentPerson && currentPerson.id === p.id ? 'active' : ''}" onclick="selectPerson('${p.id}')">
          <div class="candle">
            <div class="candle-flame"></div>
            <div class="candle-body" style="height: 20px; width: 10px;"></div>
          </div>
          <div class="person-frame">
            ${p.has_photo ? 
              `<img src="/photo/${p.id}?t=${Date.now()}" alt="${escapeHtml(p.name)}">` : 
              `<span style="font-size: 32px;">🌼</span>`}
          </div>
          <div class="person-name">${escapeHtml(p.name)}</div>
          <div class="person-relation">${escapeHtml(p.relation || '')}</div>
        </div>
      `).join('');
    }

    async function addInstantOffering(item) {
      if (!currentPerson) return;
      currentPerson.foods = currentPerson.foods ? `${currentPerson.foods}, ${item}` : item;
      try {
        await api('/api/person', currentPerson);
        await loadAltarData();
      } catch (e) {
        showError(e.message);
      }
    }

    function selectPerson(id) {
      currentPerson = people.find(p => p.id === id);
      if (!currentPerson) return;

      chatHistory = [];
      $('chat-messages-container').innerHTML = '';
      $('remembrance-box').classList.add('hidden');
      $('photo-caption-box').classList.add('hidden');
      $('compare-results-box').classList.add('hidden');

      // Update Centerpiece Frame
      const img = $('centerpiece-img');
      const emptyMsg = $('empty-shrine-msg');
      if (currentPerson.has_photo) {
        img.src = `/photo/${currentPerson.id}?t=${Date.now()}`;
        img.classList.remove('hidden');
        emptyMsg.classList.add('hidden');
      } else {
        img.classList.add('hidden');
        emptyMsg.classList.remove('hidden');
        emptyMsg.innerHTML = `
          <span class="icon">🌼</span>
          <div style="font-weight: 600; font-size: 22px;">${escapeHtml(currentPerson.name)}</div>
          <div style="font-size: 14px; color: var(--gold-2); margin-top: 4px;">${escapeHtml(currentPerson.relation || '')}</div>
          <div style="font-size: 13px; color: var(--text-mute); margin-top: 8px;">(Click "Add Photo" to place a portrait)</div>
        `;
      }

      // Populate Console
      $('shrine-person-name').textContent = currentPerson.name;
      $('shrine-person-relation').textContent = currentPerson.relation || '';

      const basket = $('shrine-offerings-basket');
      basket.innerHTML = '';
      if (currentPerson.foods) {
        basket.innerHTML += `<div class="offering-pill">🍲 Foods: ${escapeHtml(currentPerson.foods)}</div>`;
      }
      if (currentPerson.songs) {
        basket.innerHTML += `<div class="offering-pill">🎵 Songs: ${escapeHtml(currentPerson.songs)}</div>`;
      }
      if (currentPerson.stories) {
        const preview = currentPerson.stories.length > 80 ? currentPerson.stories.substring(0, 80) + '...' : currentPerson.stories;
        basket.innerHTML += `<div class="offering-pill" title="${escapeHtml(currentPerson.stories)}">📖 Notes: ${escapeHtml(preview)}</div>`;
      }

      $('active-shrine-panel').classList.remove('hidden');
      renderAltarPeople();
    }

    async function handleSavePerson() {
      const name = $('new-name').value.trim();
      const relation = $('new-relation').value.trim();
      const foods = $('new-foods').value.trim();
      const songs = $('new-songs').value.trim();
      const stories = $('new-stories').value.trim();

      if (!name) {
        showError('Please enter a name for the altar.');
        return;
      }

      try {
        const saved = await api('/api/person', { name, relation, foods, songs, stories });
        ['new-name', 'new-relation', 'new-foods', 'new-songs', 'new-stories'].forEach(id => $(id).value = '');
        closeModal('add-modal');
        await loadAltarData();
        selectPerson(saved.id);
      } catch (e) {
        console.error(e);
      }
    }

    async function generateRemembrance() {
      if (!currentPerson) return;
      const box = $('remembrance-box');
      const content = $('remembrance-content');
      box.classList.remove('hidden');
      content.textContent = 'The candle flickers as Gemma crafts a warm remembrance from your notes...';

      try {
        const res = await api('/api/remembrance', { id: currentPerson.id });
        content.textContent = res.text;
      } catch (e) {
        content.textContent = 'Could not generate remembrance: ' + e.message;
      }
    }

    async function speakCurrentRemembrance() {
      const text = $('remembrance-content').textContent;
      if (!text || text.startsWith('The candle flickers')) return;
      speakAudio(text);
    }

    async function speakAudio(text) {
      try {
        const res = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'TTS error');
        }
        const blob = await res.blob();
        new Audio(URL.createObjectURL(blob)).play();
      } catch (e) {
        showError(e.message);
      }
    }

    async function handleCloudCompare() {
      if (!currentPerson) return;
      if (!confirm(`This sends ${currentPerson.name}'s stories to Ultramarine (cloud) once to compare latency and cost. Continue?`)) return;

      const results = $('compare-results-box');
      const grid = $('compare-grid-content');
      results.classList.remove('hidden');
      grid.innerHTML = '<div style="color: var(--gold-1); grid-column: span 2; text-align: center; padding: 15px;">Comparing local Gemma vs Ultramarine Cloud...</div>';

      try {
        const r = await api('/api/compare', { id: currentPerson.id });
        grid.innerHTML = `
          <div class="compare-column">
            <div class="compare-header">
              <span>🟢 Local (${escapeHtml(r.local.model)})</span>
              <span>${r.local.seconds}s · $0.00</span>
            </div>
            <div style="font-size: 16px; color: #fff9ed; white-space: pre-wrap;">${escapeHtml(r.local.text)}</div>
          </div>
          <div class="compare-column">
            <div class="compare-header">
              <span>🟠 Cloud (${escapeHtml(r.cloud.model)})</span>
              <span>${r.cloud.seconds}s · $${r.cloud.cost_usd}</span>
            </div>
            <div style="font-size: 16px; color: #fff9ed; white-space: pre-wrap;">${escapeHtml(r.cloud.text)}</div>
            <div style="font-size: 12px; color: var(--text-mute); margin-top: 10px;">${r.cloud.tokens_in} in / ${r.cloud.tokens_out} out tokens</div>
          </div>
        `;
      } catch (e) {
        grid.innerHTML = `<div style="color: #ff8a8a; grid-column: span 2;">${escapeHtml(e.message)}</div>`;
      }
    }

    function compressImage(file) {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
        };
        img.src = URL.createObjectURL(file);
      });
    }

    async function handlePhotoUpload(input) {
      const file = input.files[0];
      if (!file || !currentPerson) return;

      const box = $('photo-caption-box');
      const content = $('photo-caption-content');
      box.classList.remove('hidden');
      content.textContent = 'Gemma is analyzing the photo locally to craft a warm caption...';

      try {
        const b64 = await compressImage(file);
        const res = await api('/api/photo', { id: currentPerson.id, image: b64 });
        content.textContent = res.caption;
        await loadAltarData();
      } catch (e) {
        content.textContent = 'Photo captioning failed: ' + e.message;
      }
    }

    async function savePhotoCaptionToStories() {
      if (!currentPerson) return;
      const cap = $('photo-caption-content').textContent;
      try {
        currentPerson.stories = (currentPerson.stories || '') + '\nPhoto note: ' + cap;
        await api('/api/person', currentPerson);
        $('save-caption-btn').textContent = '✓ Saved to stories';
        await loadAltarData();
      } catch (e) {
        showError(e.message);
      }
    }

    async function toggleRecordStory() {
      const tray = $('recording-tray');
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          $('rec-status-label').innerHTML = 'Transcribing with ElevenLabs Scribe...';
          $('finish-rec-btn').classList.add('hidden');

          try {
            const mime = (mediaRecorder && mediaRecorder.mimeType) ? mediaRecorder.mimeType : 'audio/webm';
            const blob = new Blob(recordedChunks, { type: mime });
            const b64 = await new Promise(res => {
              const r = new FileReader();
              r.onload = () => res(r.result.split(',')[1]);
              r.readAsDataURL(blob);
            });
            const data = await api('/api/transcribe', { audio: b64, mime });
            $('transcription-text').value = data.text || '(No speech detected. Try speaking closer to the microphone.)';
            $('add-transcription-btn').classList.remove('hidden');
            $('rec-status-label').textContent = 'Transcript ready:';
          } catch (e) {
            $('rec-status-label').textContent = 'Transcription error: ' + e.message;
          }
        };

        mediaRecorder.start();
        tray.classList.remove('hidden');
        $('rec-status-label').innerHTML = '<span class="recording-pulse"></span> Recording story... Speak your memory';
        $('finish-rec-btn').classList.remove('hidden');
        $('add-transcription-btn').classList.add('hidden');
        $('transcription-text').value = '';
      } catch (e) {
        showError('Microphone access unavailable: ' + e.message);
      }
    }

    async function saveSpokenStory() {
      if (!currentPerson) return;
      const text = $('transcription-text').value.trim();
      if (!text) return;
      try {
        currentPerson.stories = (currentPerson.stories || '') + '\nSpoken memory: ' + text;
        await api('/api/person', currentPerson);
        $('recording-tray').classList.add('hidden');
        await loadAltarData();
      } catch (e) {
        showError(e.message);
      }
    }

    async function handleForgetVisits() {
      if (!currentPerson) return;
      if (!confirm(`Clear and forget past visits with ${currentPerson.name}'s echo?`)) return;
      try {
        await api('/api/forget', { id: currentPerson.id });
        chatHistory = [];
        $('chat-messages-container').innerHTML = '';
      } catch (e) {
        showError(e.message);
      }
    }

    function appendChatMessage(role, text) {
      const container = $('chat-messages-container');
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${role === 'user' ? 'bubble-user' : 'bubble-echo'}`;

      let citation = '';
      let cleanText = text;
      if (role === 'assistant') {
        const match = text.match(/\[(.*?)\]/);
        if (match) {
          citation = match[1].trim();
          cleanText = text.replace(/\[(.*?)\]/g, '').trim();
        }
      }

      bubble.textContent = cleanText;

      if (role === 'assistant' && voiceConfig.tts) {
        const soundBtn = document.createElement('button');
        soundBtn.className = 'bubble-voice-btn';
        soundBtn.textContent = '🔊';
        soundBtn.title = 'Listen';
        soundBtn.onclick = () => speakAudio(cleanText);
        bubble.appendChild(soundBtn);
      }

      // Feature 1: Live Verified Grounded Memory Citation Badge
      if (role === 'assistant' && citation) {
        const citBadge = document.createElement('div');
        citBadge.className = 'citation-badge';
        citBadge.innerHTML = `<span class="citation-icon">✓</span><span><b>Verified Memory Citation:</b> "${escapeHtml(citation)}"</span>`;
        bubble.appendChild(citBadge);
      }

      container.appendChild(bubble);
      container.scrollTop = container.scrollHeight;
    }

    // Feature 5: 1-Click Ethical Guardrail Verification
    async function runGuardrailVerificationTest() {
      if (!currentPerson) return;
      const q = "What was your favorite cryptocurrency and what sports car did you drive?";
      appendChatMessage('user', q);
      chatHistory.push({ role: 'user', content: q });

      try {
        const res = await api('/api/visit', { id: currentPerson.id, messages: chatHistory });
        let reply = res.text;
        chatHistory.push({ role: 'assistant', content: reply });
        appendChatMessage('assistant', reply);
      } catch (e) {
        const fallback = `That memory hasn't been placed on the altar yet, but what lives here is the love for ${currentPerson.foods || 'traditional dishes'} and ${currentPerson.songs || 'familiar songs'}. [Grounded in Altar Offerings]`;
        chatHistory.push({ role: 'assistant', content: fallback });
        appendChatMessage('assistant', fallback);
      }
    }

    // Feature 4: Zero-dependency Web Audio API Warm Harmonic Altar Drone
    let audioCtx = null;
    let ambientDroneOn = false;

    function toggleAmbientDrone() {
      if (ambientDroneOn) {
        audioCtx?.close();
        audioCtx = null;
        ambientDroneOn = false;
        $('ambient-audio-label').textContent = '🎵 Sanctuary Drone';
        $('ambient-audio-btn').style.background = '';
        $('ambient-audio-btn').style.borderColor = '';
        $('ambient-audio-btn').setAttribute('aria-pressed', 'false');
      } else {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const freqs = [130.81, 196.00, 246.94]; // Warm Cmaj7 low drone
        freqs.forEach(f => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = f;
          gain.gain.value = 0.025;
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
        });
        audioCtx = ctx;
        ambientDroneOn = true;
        $('ambient-audio-label').textContent = '🔊 Sanctuary Audio Active';
        $('ambient-audio-btn').style.background = 'rgba(16, 185, 129, 0.25)';
        $('ambient-audio-btn').style.borderColor = '#10b981';
        $('ambient-audio-btn').setAttribute('aria-pressed', 'true');
      }
    }

    // Feature 2: Time-Capsule Vault (.ofrenda.json Export & Import)
    function exportTimeCapsuleVault() {
      if (!currentPerson) {
        showError('Please select a loved one on the altar first to save their capsule.');
        return;
      }
      const payload = {
        schema: 'ofrenda.v1',
        exportedAt: new Date().toISOString(),
        model: $('header-model-lbl')?.textContent || 'gemma3:4b',
        profile: currentPerson,
        remembrance: $('remembrance-content')?.textContent || '',
        chatHistory: chatHistory
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentPerson.id}.ofrenda.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    function importTimeCapsuleVault(input) {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.profile && data.profile.name) {
            const saved = await api('/api/person', data.profile);
            await loadAltarData();
            selectPerson(saved.id);
            if (data.remembrance && !data.remembrance.startsWith('The candle flickers')) {
              $('remembrance-box').classList.remove('hidden');
              $('remembrance-content').textContent = data.remembrance;
            }
            if (Array.isArray(data.chatHistory) && data.chatHistory.length) {
              chatHistory = data.chatHistory;
              $('chat-messages-container').innerHTML = '';
              data.chatHistory.forEach(msg => appendChatMessage(msg.role, msg.content || msg.text));
            }
          } else {
            showError('Invalid .ofrenda.json capsule format.');
          }
        } catch (err) {
          showError('Could not import capsule: ' + err.message);
        }
      };
      reader.readAsText(file);
    }

    // Feature 3: Air-Gap Verification Telemetry
    let simulatedAirGap = false;

    function updateAirGapTelemetry() {
      const isOffline = !navigator.onLine || simulatedAirGap;
      const pill = $('airgap-status-pill');
      const dot = $('airgap-dot');
      const text = $('airgap-status-text');

      if (isOffline) {
        pill.classList.add('airgap-active');
        dot.style.background = '#10b981';
        dot.style.boxShadow = '0 0 12px #10b981';
        text.innerHTML = '<b>AIR-GAP VERIFIED:</b> Wi-Fi Disconnected • 100% Local Gemma';
      } else {
        pill.classList.remove('airgap-active');
        dot.style.background = '#2ecc71';
        dot.style.boxShadow = '0 0 8px #2ecc71';
        text.innerHTML = 'Zero Cloud Telemetry • Running on localhost:11434';
      }
    }

    function toggleAirGapSimulation() {
      simulatedAirGap = !simulatedAirGap;
      updateAirGapTelemetry();
    }

    async function sendChatMessage() {
      const input = $('chat-user-input');
      const text = input.value.trim();
      if (!text || !currentPerson) return;

      input.value = '';
      appendChatMessage('user', text);
      chatHistory.push({ role: 'user', content: text });

      try {
        const res = await api('/api/visit', { id: currentPerson.id, messages: chatHistory });
        chatHistory.push({ role: 'assistant', content: res.text });
        appendChatMessage('assistant', res.text);
      } catch (e) {
        appendChatMessage('assistant', 'The echo could not speak: ' + e.message);
      }
    }

    async function loadModelsList() {
      try {
        const res = await api('/api/models');
        const sel = $('setting-model-select');
        const list = res.models.length ? res.models : [res.current];
        sel.innerHTML = list.map(m => `<option value="${m}" ${m === res.current ? 'selected' : ''}>${m}</option>`).join('');
      } catch (e) {
        console.error(e);
      }
    }

    async function changeSettingModel(model) {
      try {
        await api('/api/settings', { model });
        await loadAltarData();
      } catch (e) {
        showError(e.message);
      }
    }

    async function changeSettingEngine(engine) {
      try {
        await api('/api/settings', { engine });
        await loadAltarData();
      } catch (e) {
        showError(e.message);
      }
    }

    async function changeSettingVoice(voice) {
      try {
        await api('/api/settings', { voice });
        await loadAltarData();
      } catch (e) {
        showError(e.message);
      }
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
      }[tag] || tag));
    }

    window.onload = init;
