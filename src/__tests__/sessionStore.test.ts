import { describe, it, expect, beforeEach } from 'vitest';
import { saveSession, loadSession, clearSession, hasSession } from '../lib/sessionStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'window', {
  value: { localStorage: localStorageMock },
  writable: true,
});

describe('sessionStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('saves and loads session', () => {
    const fields = { contractType: 'nda' as const, poskytovatel: 'Test s.r.o.' };
    saveSession('nda', fields, []);
    
    const loaded = loadSession();
    expect(loaded).not.toBeNull();
    expect(loaded!.contractType).toBe('nda');
    expect(loaded!.fields.poskytovatel).toBe('Test s.r.o.');
  });

  it('returns null when no session exists', () => {
    expect(loadSession()).toBeNull();
  });

  it('clears session', () => {
    saveSession('nda', { contractType: 'nda' }, []);
    clearSession();
    expect(loadSession()).toBeNull();
  });

  it('hasSession returns true when session exists', () => {
    expect(hasSession()).toBe(false);
    saveSession('rent', { contractType: 'rent' }, []);
    expect(hasSession()).toBe(true);
  });

  it('saves and loads messages', () => {
    const messages = [
      { id: '1', sender: 'user' as const, text: 'Hello', timestamp: '12:00' },
      { id: '2', sender: 'assistant' as const, text: 'Ahoj', timestamp: '12:01' },
    ];
    saveSession('work', { contractType: 'work' }, messages);
    
    const loaded = loadSession();
    expect(loaded!.messages).toHaveLength(2);
    expect(loaded!.messages[0].text).toBe('Hello');
  });

  it('handles null contractType', () => {
    saveSession(null, { contractType: 'nda' }, []);
    const loaded = loadSession();
    expect(loaded!.contractType).toBeNull();
  });
});
