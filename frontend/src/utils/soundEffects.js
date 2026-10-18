/**
 * Smart Campus Web Audio API Synthesizer
 * Zero-external MP3 audio dependencies: Generates real-time acoustic alarms,
 * dispatch chimes, and success sounds directly via browser oscillator synthesis.
 */

let audioCtx = null;
let isMuted = false;

// Audio context helper that complies with browser user-gesture policies
const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const isAudioMuted = () => isMuted;

export const setAudioMuted = (muted) => {
  isMuted = Boolean(muted);
  localStorage.setItem('campus_audio_muted', isMuted ? 'true' : 'false');
};

export const toggleAudioMute = () => {
  setAudioMuted(!isMuted);
  return isMuted;
};

// Initialize mute state from localStorage
if (typeof window !== 'undefined') {
  isMuted = localStorage.getItem('campus_audio_muted') === 'true';
}

/**
 * 1. High-Urgency Dual-Tone Emergency Siren:
 * European oscillating dual-tone siren (800 Hz <-> 1200 Hz) for 3 seconds + Haptic Vibration.
 * Triggered on Panic SOS, Altercation/Fight, Fire, or Backup Dispatch.
 */
export const playEmergencySiren = () => {
  if (isMuted) return;

  // Haptic feedback for field devices
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([400, 200, 400, 200, 600]);
    } catch (e) {
      // Ignore vibration blocks
    }
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const duration = 2.8; // seconds
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';

    // 4 Oscillating cycles between 800Hz and 1250Hz
    const cycles = 5;
    const cycleDuration = duration / cycles;

    for (let i = 0; i < cycles; i++) {
      const startTime = now + i * cycleDuration;
      const midTime = startTime + cycleDuration / 2;
      const endTime = startTime + cycleDuration;

      osc.frequency.setValueAtTime(800, startTime);
      osc.frequency.exponentialRampToValueAtTime(1250, midTime);
      osc.frequency.exponentialRampToValueAtTime(800, endTime);
    }

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.setValueAtTime(0.35, now + duration - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch (err) {
    console.debug('Emergency siren synthesis bypassed by browser audio policy:', err);
  }
};

/**
 * 2. Crisp 3-Beep Dispatch Chime:
 * Rapid cyber alert pulses (750 Hz, 950 Hz, 1150 Hz) + Haptic Vibration.
 * Triggered when a Ground Worker or Guard receives an assignment card.
 */
export const playWorkorderAlert = () => {
  if (isMuted) return;

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([300, 150, 300]);
    } catch (e) {}
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const frequencies = [750, 950, 1200];
    const beepDuration = 0.12;
    const gap = 0.08;

    frequencies.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * (beepDuration + gap);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + beepDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + beepDuration);
    });
  } catch (err) {
    console.debug('Workorder alert sound bypassed:', err);
  }
};

/**
 * 3. Pleasant Ascending Success Chord:
 * Ascending Major triad (C5 -> E5 -> G5 -> C6).
 * Triggered on double-verified task resolution or incident closure.
 */
export const playResolvedSuccess = () => {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const chord = [523.25, 659.25, 783.99, 1046.5];
    const now = ctx.currentTime;

    chord.forEach((freq, i) => {
      const startTime = now + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.42);
    });
  } catch (err) {
    console.debug('Success chord synthesis bypassed:', err);
  }
};
