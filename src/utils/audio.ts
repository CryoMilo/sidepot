export type SoundType = 'pop' | 'clink' | 'win' | 'collect' | 'error' | 'money';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    try {
      audioCtx = new AudioContextClass();
    } catch {
      return null;
    }
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

export function playSound(type: SoundType): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'clink':
      case 'pop':
      case 'money': {
        // High-end Casino Clay Chip / Gold Coin Clink with Metallic Resonance
        // Oscillator 1: High metallic ping (2400Hz -> 1800Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(2400, now);
        osc1.frequency.exponentialRampToValueAtTime(1800, now + 0.15);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);

        // Oscillator 2: Sub-bell resonance (3800Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(3800, now);
        osc2.frequency.exponentialRampToValueAtTime(3200, now + 0.12);
        gain2.gain.setValueAtTime(0.18, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.12);

        // Transient: Snappy click transient (800Hz instant drop)
        const oscClick = ctx.createOscillator();
        const gainClick = ctx.createGain();
        oscClick.type = 'square';
        oscClick.frequency.setValueAtTime(950, now);
        oscClick.frequency.exponentialRampToValueAtTime(200, now + 0.025);
        gainClick.gain.setValueAtTime(0.15, now);
        gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        oscClick.connect(gainClick);
        gainClick.connect(ctx.destination);
        oscClick.start(now);
        oscClick.stop(now + 0.025);
        break;
      }
      case 'win': {
        // Grand Casino Winning Bell Arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.07;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.22, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.28);
        });
        break;
      }
      case 'collect': {
        // Smooth Casino Felt Chips Sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }
      case 'error': {
        // Deep warning thud
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
    }
  } catch {
    // Silent fail if audio policy blocks
  }
}
