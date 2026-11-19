import { describe, it, expect } from 'vitest';
import App from '../App';
import Header from '../components/Header';
import RoomModal from '../components/RoomModal';

describe('App & Navigation Shell', () => {
  it('exports component functions properly', () => {
    expect(typeof App).toBe('function');
    expect(typeof Header).toBe('function');
    expect(typeof RoomModal).toBe('function');
  });
});
