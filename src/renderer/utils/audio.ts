/**
 * Web Audio API Notification Sound Synthesizer v2.0
 * Generates a clean, pleasant modern bell chime with strict Cooldown Mutex to prevent duplicate sounds.
 */
let audioCtx: AudioContext | null = null;
let lastPlayTimestamp = 0;
const SOUND_COOLDOWN_MS = 3500; // Minimum 3.5 seconds between notification chimes

export const playNotificationSound = (force = false) => {
  const nowMs = Date.now();
  if (!force && nowMs - lastPlayTimestamp < SOUND_COOLDOWN_MS) {
    return; // Block duplicate sound within cooldown window
  }
  lastPlayTimestamp = nowMs;

  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Tone 1: E5 (659.25Hz) - Pleasant crystal bell
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: B5 (987.77Hz) - Harmonic warm echo
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.08);
    gain2.gain.setValueAtTime(0.25, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.error('Failed to play notification chime:', err);
  }
};
