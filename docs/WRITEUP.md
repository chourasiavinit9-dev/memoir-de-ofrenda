---
title: "Ofrenda: An Offline Altar Where Gemma Remembers Only What You Tell It"
tags: hacktoberfest, ai, opensource, gemma
---

*Submission for the Hacktoberfest Open-Source AI Challenge: Week 4, "Ghost in the Machine". The prize categories I am entering are listed at the end.*

## The ghost I wanted to build

Every "talk to a lost loved one" AI product I have seen has the same problem. It needs a server. It needs your grandmother's voicemails, photos and half-remembered stories sitting in somebody else's database, behind a company that might pivot, raise its prices, or shut down. And the ghost it conjures is made of guesses. It will happily invent a recipe she never cooked.

So I built the opposite. **Ofrenda** is a small web app that runs entirely on your own machine. You place someone on an altar: their name, their favorite foods and songs, and the stories you actually remember. A local Gemma model then does two things:

1. **Writes a remembrance** for the altar, using only the facts you gave it.
2. **Lets you visit their "echo."** The echo is not the person and says so. It answers only from your notes, and when it does not know something, it asks you to tell the story so it can be added.

## Why open weights matter here

This is the part of the post I care about most, because for this project open is not a nice-to-have. It is the whole point.

- **Privacy by construction.** The server binds to `127.0.0.1` and talks only to a local Ollama instance. By default a family's stories and photos are never sent anywhere, because there is no "anywhere" in the architecture. The exceptions are the optional cloud features described below: voice, cloud memory, and a cloud comparison. Each is off by default and labelled in the app's "What runs where" panel.
- **It works with the lights off.** Once the model is pulled, no internet is needed. An altar you build in November should still open in ten years.
- **It cannot be switched off by someone else.** Memories stored as plain JSON files next to a model you downloaded do not depend on any service staying alive.
- **Swappable.** One environment variable (`OLLAMA_MODEL`) changes the model. If a better small model appears next year, the altar keeps working.

## How Gemma is used

Gemma does the writing and the vision, both locally through Ollama.

- **Text:** `gemma3:4b` produces the remembrance and powers the echo. The system prompts forbid invented names, dates and events, and the echo is instructed never to claim to be the person.
- **Vision:** you can add a photo to an altar. Gemma looks at it on your machine and suggests a short caption of what is visible. It is told not to guess identities. The caption is only added to the stories if you press the button, so you stay the author of the memory.

Gemma's small size is what makes this realistic. It runs on an ordinary laptop, which means anyone can build an altar for their own family without a GPU or a subscription.

## Optional voice with ElevenLabs

Oral history is the most natural way families keep stories, so I added two voice features. Both are **off by default** and only appear when you set an `ELEVENLABS_API_KEY`.

- **Record a story.** Press record, tell the story out loud, and ElevenLabs Scribe transcribes it. You can edit the text before it is added to the altar.
- **Listen.** The remembrance and each echo reply can be read aloud.

This is the one place data leaves your machine, and I chose to be upfront about it: the interface says so right next to the record button, and nothing is sent unless you press it. Everything else, including all of Gemma's reasoning, stays local. If you never set a key, Ofrenda is fully offline.

I deliberately use a generic narrator voice and **no voice cloning**. Cloning a loved one's voice and making it say words they never said crosses a line I was not willing to cross in a project about grief.

## A Mastra agent that remembers your visits

Grief is not one conversation. So the echo can run as a [Mastra](https://mastra.ai) agent on the same local Gemma model, with persistent memory. Come back next week and it still knows what you talked about. Mastra is open source and runs on your machine, so its memory is a plain file next to your stories.

I tested the memory properly: the second message carries the first, the history survives a full restart of the service, and a **Forget our visits** button deletes the thread. I think a memory feature about the dead needs a delete button more than any other kind.

[PASTE A SHORT EXCHANGE SHOWING THE ECHO RECALLING SOMETHING FROM AN EARLIER VISIT]

## Optional: memory in MongoDB Atlas

By default that memory is a local file. If you want it to live elsewhere, one environment variable (`OFRENDA_MEMORY=atlas`) points Mastra's memory at a free MongoDB Atlas cluster instead. This is opt-in and the panel turns orange when it is on, because it means conversations about your family are stored on someone else's servers. [DESCRIBE WHAT YOU ACTUALLY TRIED WITH ATLAS, OR DELETE THIS SECTION]

## Local vs cloud, with real numbers

The challenge asks where open beat closed, so I measured instead of asserting. A **Compare** button writes the same remembrance with local Gemma and with Paper Instruments' Ultramarine, and shows seconds and dollars for each.

| | Local Gemma | Ultramarine (cloud) |
|---|---|---|
| Time | [PASTE] s | [PASTE] s |
| Cost | $0 (my laptop) | $[PASTE] |
| Where the stories went | nowhere | sent to the API |

[PASTE ONE HONEST SENTENCE ON QUALITY: WHICH READ BETTER AND WHY IT DID OR DID NOT MATTER]

## Design decisions

**Grounding over charm.** A generated "voice" that invents memories would be worse than silence. The echo's prompt includes the full notes and the rule: if it is not in the notes, say you do not remember and invite the user to tell it. The result feels less like a chatbot and more like a conversation with your own memory.

**Honesty about what it is.** The first reply always reminds you it is an echo built from your stories. I think that matters when the subject is grief.

**You choose what runs where.** A "What runs where" panel marks each part as local or cloud. You can switch the Gemma model from a list of the models installed in Ollama and turn the ElevenLabs voice on or off. Open weights mean the model is a setting, not a contract.

**Zero dependencies.** The backend is about 100 lines of Python standard library. The frontend is one HTML file. There is nothing to break between now and the day someone wants to open an altar again.

## Try it

```bash
ollama pull gemma3:4b
ollama serve
python3 server.py   # open http://localhost:8000
```

Code: [PASTE GITHUB REPO LINK]

## What it produced

[PASTE A REAL REMEMBRANCE GENERATED FROM YOUR OWN TEST STORY]

[PASTE A SHORT ECHO EXCHANGE, INCLUDING ONE QUESTION THE ECHO CORRECTLY SAYS IT DOES NOT KNOW]

[PASTE SCREENSHOT OF THE ALTAR WITH CANDLES]

## Where open worked better than closed

A hosted model would have been easier to wire up. But I could not honestly tell someone "your mother's stories stay private" while sending them to an API. Running Gemma locally let me make that promise true by architecture instead of by policy.

## What I would add next

- Voice recording and local transcription so oral histories can be captured by speaking.
- Fine-tuning a small model on a family's own stories, entirely offline.
- Exporting the whole altar as a single printable booklet.

## Prize Categories

Keep only the categories you actually ran and can show in this post. Delete any bullet you did not use.

- **Best Use of Gemma:** `gemma3:4b` runs locally through Ollama for the remembrance, the grounded echo, and photo captions via Gemma's vision. The model can be swapped at runtime from the panel.
- **Best Use of ElevenLabs:** optional Scribe transcription for recording oral-history stories, and optional read-aloud with a generic narrator voice. Off unless you enable it.
- **Best Use of Mastra:** the echo is a Mastra agent on a local Ollama model, with persistent memory so it recalls earlier visits, and a "forget" button that deletes the thread.
- **Best Use of MongoDB Atlas:** opt-in. `OFRENDA_MEMORY=atlas` stores the agent's memory in a free Atlas cluster instead of a local file.
- **Best Use of Ultramarine:** an optional side-by-side of the remembrance from local Gemma and from Ultramarine, with measured time and cost. Cloud spend for this project: $[PASTE].

*Agent session: [PASTE DEVRELAY / ENTIRE LINK IF YOU SAVE ONE]*
