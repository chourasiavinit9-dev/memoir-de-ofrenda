#!/usr/bin/env python3
"""Ofrenda: an offline memory altar. Python stdlib only + a local Ollama model (Gemma by default)."""
import json, os, re, time, urllib.request, urllib.error, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from collections import deque

HERE = Path(__file__).parent
DATA = HERE / "ofrenda_data"
DATA.mkdir(exist_ok=True)
PHOTOS = DATA / "photos"
PHOTOS.mkdir(exist_ok=True)

# Auto-load .env from directory if present (pure stdlib, zero dependencies)
env_file = HERE / ".env"
if env_file.exists():
    try:
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception:
        pass

OLLAMA = os.environ.get("OLLAMA_URL", "http://localhost:11434")
MODEL = os.environ.get("OLLAMA_MODEL", "gemma3:4b")

# Optional, off unless a key is set. Voice sends audio/text to ElevenLabs.
EL_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
EL_VOICE = os.environ.get("ELEVENLABS_VOICE_ID", "")
EL_STT = os.environ.get("ELEVENLABS_STT_MODEL", "scribe_v2")
EL_TTS = os.environ.get("ELEVENLABS_TTS_MODEL", "eleven_multilingual_v2")

# Runtime choices made in the "What runs where" panel.
STATE = {"model": MODEL, "voice": True, "engine": "ollama", "cloud_spent": 0.0}

# Optional cloud comparison (Paper Instruments Ultramarine, OpenAI-compatible API). Off unless all three are set.
# Prices are USD per million tokens; confirm them on your Ultramarine dashboard.
UM_KEY = os.environ.get("ULTRAMARINE_API_KEY", "")
UM_BASE = os.environ.get("ULTRAMARINE_BASE_URL", "").rstrip("/")
UM_MODEL = os.environ.get("ULTRAMARINE_MODEL", "")
UM_PRICE_IN = float(os.environ.get("ULTRAMARINE_PRICE_IN", "0.15"))
UM_PRICE_OUT = float(os.environ.get("ULTRAMARINE_PRICE_OUT", "0.50"))
MASTRA_URL = os.environ.get("MASTRA_URL", "http://127.0.0.1:8787")

# ── Anti-DDoS Rate Limiter ─────────────────────────────────────────────────────
# Allows max 5 AI-endpoint requests per 3 s burst, 20 per 10 min sliding window.
_rate_lock = threading.Lock()
_burst_log: deque = deque()   # timestamps within burst window (3s)
_window_log: deque = deque()  # timestamps within sliding window (10 min)
_BURST_MAX, _BURST_SECS = 5, 3
_WIN_MAX, _WIN_SECS = 20, 600
_MAX_PAYLOAD = 100_000        # 100 KB hard ceiling

def _check_rate() -> bool:
    """Return True if the request is allowed; False if it should be rejected."""
    now = time.monotonic()
    with _rate_lock:
        # Purge expired entries
        while _burst_log and now - _burst_log[0] > _BURST_SECS:
            _burst_log.popleft()
        while _window_log and now - _window_log[0] > _WIN_SECS:
            _window_log.popleft()
        if len(_burst_log) >= _BURST_MAX or len(_window_log) >= _WIN_MAX:
            return False
        _burst_log.append(now)
        _window_log.append(now)
        return True
# ──────────────────────────────────────────────────────────────────────────────

REMEMBRANCE_SYS = (
    "You write short, warm remembrances for an ofrenda (Dia de los Muertos altar). "
    "Use ONLY the facts provided. Never invent names, dates, places or events. "
    "Write 120-180 words in the second person, as if speaking to the person remembered. "
    "End with one line about what to place on the altar."
)

ECHO_SYS = (
    "You are a gentle, strictly grounded 'Memory Echo' of {name} ({relation}), built ONLY from the notes below. "
    "CRITICAL ETHICAL GUARDRAILS:\n"
    "1. You are not {name} and must never claim to be a living person. Begin your first reply by reminding the user you are an echo made from their own stories.\n"
    "2. NEVER invent facts, names, or events outside the notes.\n"
    "3. If asked about something NOT in the notes, start with: 'That memory hasn\\'t been placed on the altar yet, but what lives here is...' and share a detail from the notes.\n"
    "4. At the very end of your response, ALWAYS include the exact source quote from the notes you used in brackets: [exact quote from notes]. If nothing applied, output [Grounded in Altar Offerings].\n\n"
    "NOTES:\n{notes}"
)


CAPTION_PROMPT = (
    "Describe this family photo in two warm sentences for an ofrenda altar. "
    "Mention only what is visible: setting, clothing, objects, mood. "
    "Do NOT guess anyone's name, age, or identity."
)


def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "unnamed"


def notes_of(p):
    return (
        f"Name: {p['name']}\nRelation: {p['relation']}\n"
        f"Favorite foods: {p.get('foods','')}\nFavorite songs: {p.get('songs','')}\n"
        f"Stories:\n{p.get('stories','')}"
    )


def ollama(messages):
    req = urllib.request.Request(
        f"{OLLAMA}/api/chat",
        data=json.dumps({"model": STATE["model"], "messages": messages, "stream": False,
                         "options": {"temperature": 0.4}}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.load(r)["message"]["content"]


def cloud_on():
    return bool(UM_KEY and UM_BASE and UM_MODEL)


def ultramarine(messages):
    if not cloud_on():
        raise RuntimeError("Cloud comparison is off. Set ULTRAMARINE_API_KEY, ULTRAMARINE_BASE_URL and ULTRAMARINE_MODEL.")
    req = urllib.request.Request(
        f"{UM_BASE}/chat/completions",
        data=json.dumps({"model": UM_MODEL, "messages": messages, "temperature": 0.4}).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {UM_KEY}"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            j = json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Ultramarine error {e.code}: {e.read()[:200].decode(errors='ignore')}")
    except urllib.error.URLError:
        raise RuntimeError("Cannot reach Ultramarine. The cloud comparison needs internet; the rest of Ofrenda does not.")
    usage = j.get("usage", {})
    tin, tout = usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)
    text = (j["choices"][0]["message"].get("content") or "").strip()
    return text, tin, tout, (tin * UM_PRICE_IN + tout * UM_PRICE_OUT) / 1e6


def mastra(path, payload=None, timeout=300):
    """Talk to the local Mastra echo-agent service (echo-agent/server.mjs)."""
    req = urllib.request.Request(
        MASTRA_URL + path,
        data=None if payload is None else json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        try:
            msg = json.loads(e.read()).get("error", str(e))
        except Exception:
            msg = str(e)
        raise RuntimeError(msg)
    except urllib.error.URLError:
        raise RuntimeError("The Mastra echo service is not running. Start it with: cd echo-agent && npm install && npm start")


def engine_info():
    try:
        return {"mastra": True, "store": mastra("/health", timeout=1).get("store"), "current": STATE["engine"]}
    except RuntimeError:
        return {"mastra": False, "store": None, "current": STATE["engine"]}


def multipart(fields, filename, mime, data):
    boundary = "----ofrenda" + os.urandom(8).hex()
    out = b""
    for k, v in fields.items():
        out += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    out += (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            f"Content-Type: {mime}\r\n\r\n").encode() + data + b"\r\n"
    out += f"--{boundary}--\r\n".encode()
    return out, f"multipart/form-data; boundary={boundary}"


def elevenlabs(url, body, ctype, accept="application/json"):
    if not EL_KEY:
        raise RuntimeError("Voice is off. Set ELEVENLABS_API_KEY to enable it.")
    if not STATE["voice"]:
        raise RuntimeError("Voice is switched off in the panel.")
    req = urllib.request.Request(url, data=body, headers={
        "xi-api-key": EL_KEY, "Content-Type": ctype, "Accept": accept})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        err_bytes = e.read()
        try:
            err_json = json.loads(err_bytes)
            detail = err_json.get("detail", {})
            msg = detail.get("message") if isinstance(detail, dict) else str(detail)
        except Exception:
            msg = err_bytes[:300].decode(errors='ignore')
        raise RuntimeError(f"ElevenLabs error {e.code}: {msg}")
    except urllib.error.URLError:
        raise RuntimeError("Cannot reach ElevenLabs. Voice needs internet; the rest of Ofrenda does not.")


def transcribe(audio, mime):
    ext = "m4a" if "mp4" in mime else "webm"
    clean_mime = mime.split(";")[0].strip() if mime else "audio/webm"
    body, ctype = multipart({"model_id": EL_STT}, f"story.{ext}", clean_mime, audio)
    return json.loads(elevenlabs("https://api.elevenlabs.io/v1/speech-to-text", body, ctype))["text"]


def speak(text):
    if EL_KEY and not EL_VOICE:
        raise RuntimeError("Set ELEVENLABS_VOICE_ID (a generic narrator voice) to enable read-aloud.")
    body = json.dumps({"text": text[:2500], "model_id": EL_TTS}).encode()
    return elevenlabs(f"https://api.elevenlabs.io/v1/text-to-speech/{EL_VOICE}", body,
                      "application/json", "audio/mpeg")


class H(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json"):
        raw = body if isinstance(body, bytes) else json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.end_headers()
        self.wfile.write(raw)

    def _body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length > _MAX_PAYLOAD:
            raise ValueError(f"Payload too large ({length} bytes > {_MAX_PAYLOAD} limit).")
        return json.loads(self.rfile.read(length) or b"{}")

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            return self._send(200, (HERE / "index.html").read_bytes(), "text/html; charset=utf-8")
        if self.path == "/api/people":
            people = [json.loads(f.read_text()) for f in sorted(DATA.glob("*.json"))]
            for p in people:
                p["has_photo"] = (PHOTOS / p["id"]).exists()
            on = bool(EL_KEY) and STATE["voice"]
            return self._send(200, {"model": STATE["model"], "people": people, "engine": engine_info(), "compare": cloud_on(),
                                    "voice": {"key": bool(EL_KEY), "on": STATE["voice"],
                                              "stt": on, "tts": on and bool(EL_VOICE)}})
        if self.path == "/api/models":
            try:
                with urllib.request.urlopen(f"{OLLAMA}/api/tags", timeout=5) as r:
                    names = [m["name"] for m in json.load(r)["models"]]
            except Exception:
                names = []
            return self._send(200, {"models": names, "current": STATE["model"]})
        if self.path.startswith("/assets/"):
            rel_path = self.path[8:].split("?")[0].strip("/")
            # Prevent directory traversal
            target = (HERE / "assets" / rel_path).resolve()
            assets_dir = (HERE / "assets").resolve()
            if assets_dir in target.parents or target == assets_dir:
                if target.is_file():
                    raw = target.read_bytes()
                    ext = target.suffix.lower()
                    mime_types = {
                        ".css": "text/css; charset=utf-8",
                        ".js": "application/javascript; charset=utf-8",
                        ".png": "image/png",
                        ".jpg": "image/jpeg",
                        ".jpeg": "image/jpeg",
                        ".svg": "image/svg+xml",
                        ".json": "application/json",
                        ".woff": "font/woff",
                        ".woff2": "font/woff2",
                    }
                    ctype = mime_types.get(ext, "application/octet-stream")
                    return self._send(200, raw, ctype)
            return self._send(404, {"error": "asset not found"})
        if self.path.startswith("/photo/"):
            f = PHOTOS / slug(self.path[7:].split("?")[0])
            if f.exists():
                raw = f.read_bytes()
                return self._send(200, raw, "image/png" if raw[:4] == b"\x89PNG" else "image/jpeg")
        self._send(404, {"error": "not found"})

    def do_POST(self):
        try:
            d = self._body()
            # Rate-limit AI endpoints (not settings/photo-meta)
            ai_paths = {"/api/remembrance", "/api/visit", "/api/compare",
                        "/api/transcribe", "/api/speak", "/api/photo"}
            if self.path in ai_paths and not _check_rate():
                return self._send(429, {"error": "Rate limit exceeded. Please wait a moment."})
            if self.path == "/api/person":
                if not d.get("name"):
                    return self._send(400, {"error": "name required"})
                d["id"] = slug(d["name"])
                d.pop("has_photo", None)
                (DATA / f"{d['id']}.json").write_text(json.dumps(d, indent=2))
                return self._send(200, d)
            if self.path == "/api/remembrance":
                p = json.loads((DATA / f"{slug(d['id'])}.json").read_text())
                text = ollama([{"role": "system", "content": REMEMBRANCE_SYS},
                               {"role": "user", "content": notes_of(p)}])
                return self._send(200, {"text": text})
            if self.path == "/api/visit":
                p = json.loads((DATA / f"{slug(d['id'])}.json").read_text())
                sysmsg = ECHO_SYS.format(name=p["name"], relation=p["relation"], notes=notes_of(p))
                if STATE["engine"] == "mastra":
                    # Mastra keeps the conversation history itself, so only the newest message is sent.
                    text = mastra("/echo", {"id": p["id"], "model": STATE["model"], "instructions": sysmsg,
                                            "message": d["messages"][-1]["content"]})["text"]
                else:
                    text = ollama([{"role": "system", "content": sysmsg}] + d["messages"])
                return self._send(200, {"text": text})
            if self.path == "/api/compare":
                p = json.loads((DATA / f"{slug(d['id'])}.json").read_text())
                msgs = [{"role": "system", "content": REMEMBRANCE_SYS}, {"role": "user", "content": notes_of(p)}]
                t0 = time.time()
                local = ollama(msgs)
                t1 = time.time()
                text, tin, tout, cost = ultramarine(msgs)
                t2 = time.time()
                STATE["cloud_spent"] += cost
                return self._send(200, {
                    "local": {"model": STATE["model"], "text": local, "seconds": round(t1 - t0, 1)},
                    "cloud": {"model": UM_MODEL, "text": text, "seconds": round(t2 - t1, 1),
                              "tokens_in": tin, "tokens_out": tout, "cost_usd": round(cost, 6)},
                    "session_total_usd": round(STATE["cloud_spent"], 6)})
            if self.path == "/api/forget":
                mastra("/forget", {"id": slug(d["id"])})
                return self._send(200, {"ok": True})
            if self.path == "/api/settings":
                if d.get("model"):
                    STATE["model"] = str(d["model"])
                if "voice" in d:
                    STATE["voice"] = bool(d["voice"])
                if d.get("engine") in ("ollama", "mastra"):
                    STATE["engine"] = d["engine"]
                return self._send(200, STATE)
            if self.path == "/api/transcribe":
                import base64
                return self._send(200, {"text": transcribe(base64.b64decode(d["audio"]), d.get("mime", "audio/webm"))})
            if self.path == "/api/speak":
                return self._send(200, speak(d["text"]), "audio/mpeg")
            if self.path == "/api/photo":
                import base64
                (PHOTOS / slug(d["id"])).write_bytes(base64.b64decode(d["image"]))
                caption = "A cherished family portrait resting on the altar."
                try:
                    caption = ollama([{"role": "user", "content": CAPTION_PROMPT, "images": [d["image"]]}])
                except Exception:
                    pass
                return self._send(200, {"caption": caption, "saved": True})
            self._send(404, {"error": "not found"})
        except urllib.error.URLError:
            self._send(502, {"error": f"Cannot reach Ollama at {OLLAMA}. Run: ollama serve && ollama pull {MODEL}"})
        except Exception as e:
            self._send(500, {"error": str(e)})

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    print(f"Ofrenda on http://localhost:8000  (model: {MODEL}, data stays in {DATA})")
    ThreadingHTTPServer(("127.0.0.1", 8000), H).serve_forever()
