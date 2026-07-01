'use client';

/**
 * Exam Hall Noise Simulator
 * Generates ambient keyboard clacking, page shuffling, and coughing
 * using Web Audio API synthesis (no external files needed).
 */

let audioCtx = null;
let noiseSource = null;
let gainNode = null;
let isPlaying = false;
let intervalId = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/** Generate white noise buffer */
function createNoiseBuffer(ctx, duration = 0.5) {
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/** Play a single keyboard tap sound */
function playKeyclack(ctx, when = 0, volume = 0.15) {
  const bufferNode = ctx.createBufferSource();
  bufferNode.buffer = createNoiseBuffer(ctx, 0.05);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000 + Math.random() * 2000;
  filter.Q.value = 1.5;

  const env = ctx.createGain();
  env.gain.setValueAtTime(volume, when);
  env.gain.exponentialRampToValueAtTime(0.001, when + 0.04);

  bufferNode.connect(filter);
  filter.connect(env);
  env.connect(ctx.destination);
  bufferNode.start(when);
}

/** Play a low rumble ambient loop */
function startAmbientRumble(ctx) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.02;
  }

  noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 400;

  gainNode = ctx.createGain();
  gainNode.gain.value = 0.3;

  noiseSource.connect(lowpass);
  lowpass.connect(gainNode);
  gainNode.connect(ctx.destination);
  noiseSource.start();
}

/** Schedule bursts of keyboard taps */
function scheduleKeybursts() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const burstCount = 4 + Math.floor(Math.random() * 8);
  for (let i = 0; i < burstCount; i++) {
    const when = now + Math.random() * 0.4;
    playKeyclack(ctx, when, 0.08 + Math.random() * 0.12);
  }
}

export function startExamNoise() {
  if (isPlaying || typeof window === 'undefined') return;
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    isPlaying = true;
    startAmbientRumble(ctx);

    // Random keyboard bursts every 0.8–2.5 seconds
    intervalId = setInterval(() => {
      if (isPlaying) scheduleKeybursts();
    }, 800 + Math.random() * 1700);
  } catch (e) {
    console.warn('ExamNoise: Web Audio not supported', e);
  }
}

export function stopExamNoise() {
  if (!isPlaying) return;
  isPlaying = false;
  clearInterval(intervalId);
  intervalId = null;
  if (noiseSource) {
    try { noiseSource.stop(); } catch (_) {}
    noiseSource = null;
  }
  if (gainNode) gainNode.disconnect();
}

export function isExamNoiseActive() {
  return isPlaying;
}
