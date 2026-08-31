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

// ──────────────────────────────────────────────────────────────────────────
// B3: Contract history tests
// ──────────────────────────────────────────────────────────────────────────

import {
  saveToHistory,
  getHistory,
  loadFromHistory,
  deleteFromHistory,
  clearHistory,
} from '../lib/sessionStore';

describe('contract history (B3)', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('saves a contract to history and returns an id', () => {
    const id = saveToHistory(null, 'nda', { contractType: 'nda', poskytovatel: 'Test s.r.o.' }, []);
    expect(id).toBeTruthy();
    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(id);
    expect(history[0].contractType).toBe('nda');
    expect(history[0].status).toBe('in_progress');
  });

  it('updates an existing entry instead of duplicating when same id is used', () => {
    const id = saveToHistory(null, 'nda', { contractType: 'nda', poskytovatel: 'A' }, []);
    saveToHistory(id, 'nda', { contractType: 'nda', poskytovatel: 'B' }, []);
    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].fields.poskytovatel).toBe('B');
  });

  it('loads a specific contract from history by id', () => {
    const id = saveToHistory(null, 'rent', { contractType: 'rent', najemce: 'Karel' }, []);
    const loaded = loadFromHistory(id);
    expect(loaded).not.toBeNull();
    expect(loaded!.contractType).toBe('rent');
    expect(loaded!.fields.najemce).toBe('Karel');
  });

  it('returns null when loading a non-existent history id', () => {
    expect(loadFromHistory('nope')).toBeNull();
  });

  it('deletes a contract from history', () => {
    const id = saveToHistory(null, 'work', { contractType: 'work' }, []);
    expect(getHistory()).toHaveLength(1);
    deleteFromHistory(id);
    expect(getHistory()).toHaveLength(0);
  });

  it('marks a contract as completed', () => {
    const id = saveToHistory(null, 'nda', { contractType: 'nda' }, [], 'completed');
    const loaded = loadFromHistory(id);
    expect(loaded!.status).toBe('completed');
  });

  it('builds a title from the contract type and party', () => {
    const id = saveToHistory(null, 'nda', { contractType: 'nda', poskytovatel: 'Acme s.r.o.' }, []);
    const loaded = loadFromHistory(id);
    expect(loaded!.title).toContain('Dohoda o mlčenlivosti');
    expect(loaded!.title).toContain('Acme s.r.o.');
  });

  it('clears the whole history', () => {
    saveToHistory(null, 'nda', { contractType: 'nda' }, []);
    saveToHistory(null, 'rent', { contractType: 'rent' }, []);
    expect(getHistory()).toHaveLength(2);
    clearHistory();
    expect(getHistory()).toHaveLength(0);
  });

  it('history survives clearSession (not deleted on new session)', () => {
    saveToHistory(null, 'nda', { contractType: 'nda' }, []);
    clearSession();
    expect(getHistory()).toHaveLength(1);
  });
});
