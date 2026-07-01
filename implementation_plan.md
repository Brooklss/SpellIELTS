# SpellIELTS — Implementation Plan

## Overview

A full-featured IELTS spelling & dictation web app built with **Next.js 14 (App Router)**, styled in a **clean black-and-white modern design**, with **localStorage + IndexedDB** as the database layer (zero backend needed, runs entirely in-browser). All audio is generated via the **Web Speech API (TTS)** with accent selection — no external API keys required.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | File-based routing, SSR/SSG, easy deployment |
| Styling | Vanilla CSS Modules | Black & white modern design, no Tailwind bloat |
| Database | **IndexedDB** via `idb` library | Persistent, relational-style, zero backend, works offline |
| Audio | **Web Speech API** (`SpeechSynthesis`) | Free, multi-accent, no API key required |
| State | React `useState` + `useReducer` + Context | Lightweight, no Redux needed |
| Diff highlighting | `diff-match-patch` library | Character-level diff for typo visualizer |

---

## Database Strategy (IndexedDB via `idb`)

Three object stores — simple, fast, zero cost:

### `words` store
```
id, word, category, audioText, difficulty
```

### `userProgress` store
```
wordId, failCount, passCount, lastSeen, nextReview (SRS date), status: "learning" | "review" | "mastered", errorLog: [{attempt, correct, timestamp}]
```

### `sessions` store
```
id, date, wordsAttempted, wordsCorrect, duration
```

---

## Open Questions

> [!IMPORTANT]
> **Accent voices**: The Web Speech API uses voices installed on the user's OS/browser. On most systems this includes `en-GB`, `en-AU`, `en-US`, `en-CA`. However, exotic accents like "Thick Scottish" or "Regional Australian" are **not available** natively. The plan is to:
> - Use available system voices for the main dictation (British, Australian, American)
> - For the "Accent Morpher" feature, **simulate** exotic accents by adjusting pitch/rate parameters on the closest available voice, with a label indicating it's an approximation
>
> Is this acceptable, or would you prefer to integrate a real TTS API (Google Cloud TTS / ElevenLabs) later?

> [!NOTE]
> **Word Bank**: The app will ship with a hand-curated list of **1,500 IELTS-focused words** organized into categories. I'll build this directly as a JSON file. Do you have a specific word list you'd like to use, or should I generate one from known IELTS vocabulary sources?

---

## Pages & Features

### 1. `/` — Home / Dashboard
- Stats overview: streak, total words mastered, weak words count
- Quick-start buttons: "Practice Now", "Weak Words", "Full Test"
- Session history mini-graph

### 2. `/practice` — Dictation Engine (Core MVP)
- Word/phrase/sentence mode selector
- Play audio button (TTS, accent selector dropdown: 🇬🇧 British · 🇦🇺 Australian · 🇺🇸 American · 🇨🇦 Canadian)
- Input box — `autocomplete="off"` `spellCheck={false}` `autoCorrect="off"`
- Submit → binary pass/fail grade
- **Diff Visualizer**: highlights exact wrong letters in red on failure
- "Typo vs. Ignorance" detection: if corrected on second try → logged differently
- IELTS Word-Count Guard: flags answers exceeding the specified limit
- Exam Hall Realism toggle (background noise)

### 3. `/weak-words` — Error Log & Re-test Queue
- Table of all failed words, sorted by fail count
- "Practice Weak Words" → generates a custom quiz from top N worst words
- Exact error history per word (what they typed vs. correct spelling)

### 4. `/progress` — Stats & SRS Overview
- Words due for review today (SRS queue)
- Category breakdown (pie/bar chart — pure CSS, no chart lib)
- Total sessions, accuracy rate, streak counter

### 5. `/settings` — User Preferences
- Default accent
- Exam Hall Realism default
- Reset progress

---

## SRS Algorithm

Simple SM-2 approximation:
- **First fail** → re-test in 2 minutes
- **Second fail** → re-test in 10 minutes  
- **Third fail** → re-test next day
- **Fourth fail** → re-test in 3 days
- **Pass after fail** → interval doubles each pass
- **3 consecutive passes** → `status: "mastered"`, removed from active queue

---

## Feature Checklist

### MVP (Phase 1)
- [x] Next.js 14 project scaffold
- [ ] IndexedDB setup with `idb`
- [ ] Word bank JSON (1,500 words, 8 categories)
- [ ] TTS audio engine with accent selection
- [ ] Practice page with strict input box
- [ ] Binary pass/fail grading (case-insensitive)
- [ ] Diff visualizer on failure
- [ ] Error logging to IndexedDB

### Phase 2
- [ ] Dashboard with stats
- [ ] Weak words page + re-test queue
- [ ] SRS scheduling logic
- [ ] Progress page

### Phase 3 (Premium)
- [ ] Exam Hall Noise Simulator (Web Audio API loop)
- [ ] Typo vs. Ignorance filter
- [ ] Accent Morpher button
- [ ] IELTS Word-Count Guard
- [ ] Settings page

---

## File Structure

```
spellIELTS/
├── app/
│   ├── layout.js
│   ├── page.js                  # Dashboard
│   ├── practice/page.js         # Dictation engine
│   ├── weak-words/page.js       # Error log + re-test
│   ├── progress/page.js         # Stats & SRS
│   └── settings/page.js
├── components/
│   ├── AudioPlayer.js
│   ├── AnswerInput.js
│   ├── DiffVisualizer.js
│   ├── WordCountGuard.js
│   ├── ExamHallToggle.js
│   └── Navbar.js
├── lib/
│   ├── db.js                    # IndexedDB setup (idb)
│   ├── srs.js                   # Spaced Repetition logic
│   ├── grader.js                # Pass/fail + typo detection
│   ├── tts.js                   # Web Speech API wrapper
│   └── examNoise.js             # Web Audio noise loop
├── data/
│   └── wordBank.json            # 1,500 IELTS words
└── styles/
    └── globals.css              # Black & white design system
```

---

## Verification Plan

- Manually test dictation flow: audio plays → input → grade → diff shown
- Test SRS scheduling: fail word → check `nextReview` date in IndexedDB
- Test Word-Count Guard with a 2-word limit
- Test Exam Hall noise toggle
- Verify `spellCheck={false}` is enforced in all browsers
- Test across Chrome, Firefox, Edge (Web Speech API compatibility)
