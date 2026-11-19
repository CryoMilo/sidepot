import { describe, it, expect } from 'vitest';
import { getJarMood, JarMood } from '../components/GoldenJar';

describe('Golden Jar Mood Calculation for Token Economy', () => {
  it('returns worried mood when tokens are under 20 (cannot be crowned dealer)', () => {
    expect(getJarMood(0)).toBe('worried' as JarMood);
    expect(getJarMood(10)).toBe('worried' as JarMood);
    expect(getJarMood(19)).toBe('worried' as JarMood);
  });

  it('returns confident mood when tokens are between 20 and 80', () => {
    expect(getJarMood(20)).toBe('confident' as JarMood);
    expect(getJarMood(50)).toBe('confident' as JarMood);
    expect(getJarMood(80)).toBe('confident' as JarMood);
  });

  it('returns ecstatic mood when tokens exceed 80', () => {
    expect(getJarMood(81)).toBe('ecstatic' as JarMood);
    expect(getJarMood(200)).toBe('ecstatic' as JarMood);
  });
});
