import { describe, it, expect } from 'vitest';
import { getJarMood, JarMood } from '../components/GoldenJar';

describe('Golden Jar Mood Calculation', () => {
  it('returns worried mood when chips are under 1,500', () => {
    expect(getJarMood(0)).toBe('worried' as JarMood);
    expect(getJarMood(1499)).toBe('worried' as JarMood);
  });

  it('returns confident mood when chips are between 1,500 and 6,000', () => {
    expect(getJarMood(1500)).toBe('confident' as JarMood);
    expect(getJarMood(5000)).toBe('confident' as JarMood);
    expect(getJarMood(6000)).toBe('confident' as JarMood);
  });

  it('returns ecstatic mood when chips exceed 6,000', () => {
    expect(getJarMood(6001)).toBe('ecstatic' as JarMood);
    expect(getJarMood(25000)).toBe('ecstatic' as JarMood);
  });
});
