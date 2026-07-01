'use client';

/**
 * TTS Engine — Web Speech API wrapper
 * Supports accent selection via voice URI/lang matching
 */

// Map of accent labels to BCP-47 language tags (priority order)
const ACCENT_LANGS = {
  british: ['en-GB', 'en_GB'],
  australian: ['en-AU', 'en_AU'],
  american: ['en-US', 'en_US'],
  canadian: ['en-CA', 'en_CA'],
};

// Pitch/rate modifiers for "accent morphing" simulation
const ACCENT_MORPH = {
  scottish: { pitch: 1.1, rate: 0.88 },
  australian_thick: { pitch: 0.95, rate: 0.85 },
  rp: { pitch: 1.05, rate: 0.92 },
};

let cachedVoices = [];

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedVoices = voices;
    return voices;
  }
  return cachedVoices;
}

export function getAvailableAccents() {
  const voices = loadVoices();
  const found = {};
  for (const [accent, langs] of Object.entries(ACCENT_LANGS)) {
    for (const lang of langs) {
      if (voices.some(v => v.lang.startsWith(lang.replace('_', '-').split('-')[0] + '-' + lang.split(/[-_]/)[1]))) {
        found[accent] = true;
        break;
      }
    }
  }
  return found;
}

export function getVoicesForAccent(accent) {
  const voices = loadVoices();
  const langs = ACCENT_LANGS[accent] || ['en-GB'];
  for (const lang of langs) {
    const normalized = lang.replace('_', '-');
    const match = voices.filter(v => v.lang === normalized || v.lang.startsWith(normalized));
    if (match.length > 0) return match;
  }
  // fallback: any English voice
  return voices.filter(v => v.lang.startsWith('en')) || voices.slice(0, 1);
}

/**
 * Speak text with given accent and optional morph settings
 * @param {string} text
 * @param {string} accent — 'british' | 'australian' | 'american' | 'canadian'
 * @param {string|null} morph — 'scottish' | 'australian_thick' | 'rp' | null
 * @param {number} rate
 * @param {number} pitch
 */
export function speak(text, { accent = 'british', morph = null, rate = 0.9, pitch = 1.0 } = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Ensure voices are loaded (Chrome lazy-loads them)
  if (cachedVoices.length === 0) {
    window.speechSynthesis.getVoices();
  }

  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  const voices = getVoicesForAccent(accent);
  if (voices.length > 0) utter.voice = voices[0];

  if (morph && ACCENT_MORPH[morph]) {
    utter.pitch = ACCENT_MORPH[morph].pitch;
    utter.rate = ACCENT_MORPH[morph].rate;
  } else {
    utter.pitch = pitch;
    utter.rate = rate;
  }

  return new Promise((resolve, reject) => {
    utter.onend = resolve;
    utter.onerror = reject;
    window.speechSynthesis.speak(utter);
  });
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function initVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  // Chrome requires this event to populate voices
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
    };
  }
  // Try to load immediately
  cachedVoices = window.speechSynthesis.getVoices();
}
