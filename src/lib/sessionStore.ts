/**
 * Session persistence — saves current contract state to localStorage
 * so users don't lose work on refresh or accidental close.
 */

import { ContractType, ContractFields, Message } from '../types';

const SESSION_KEY = 'docbot_session_v1';

interface SessionData {
  contractType: ContractType | null;
  fields: ContractFields;
  messages: Message[];
  savedAt: number;
}

export function saveSession(
  contractType: ContractType | null,
  fields: ContractFields,
  messages: Message[]
): void {
  if (typeof window === 'undefined') return;
  try {
    const data: SessionData = {
      contractType,
      fields,
      messages,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[sessionStore] Failed to save session', err);
  }
}

export function loadSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionData;
    
    // Expire sessions older than 24 hours
    if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) {
      clearSession();
      return null;
    }
    
    return data;
  } catch (err) {
    console.warn('[sessionStore] Failed to load session', err);
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.warn('[sessionStore] Failed to clear session', err);
  }
}

export function hasSession(): boolean {
  return loadSession() !== null;
}
