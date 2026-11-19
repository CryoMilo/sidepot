import { describe, it, expect } from 'vitest';
import { playSound } from '../utils/audio';

describe('Audio Engine', () => {
  it('safely handles environments without Web Audio API or user gesture', () => {
    expect(() => playSound('pop')).not.toThrow();
    expect(() => playSound('clink')).not.toThrow();
    expect(() => playSound('win')).not.toThrow();
    expect(() => playSound('collect')).not.toThrow();
    expect(() => playSound('error')).not.toThrow();
  });
});
