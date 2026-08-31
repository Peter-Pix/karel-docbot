/**
 * Session persistence — saves current contract state to localStorage
 * so users don't lose work on refresh or accidental close.
 *
 * B3: Historie smluv — kromě aktivní session udržujeme i seznam uložených
 * smluv (rozpracovaných i dokončených), ke kterým se uživatel může vrátit
 * i po nové session (data nejsou mazána při clearSession).
 */

import { ContractType, ContractFields, Message } from '../types';

const SESSION_KEY = 'docbot_session_v1';
const HISTORY_KEY = 'docbot_contract_history_v1';

export type ContractStatus = 'in_progress' | 'completed';

export interface SessionData {
  contractType: ContractType | null;
  fields: ContractFields;
  messages: Message[];
  savedAt: number;
}

export interface ContractHistoryEntry {
  id: string;
  contractType: ContractType;
  fields: ContractFields;
  messages: Message[];
  status: ContractStatus;
  savedAt: number;
  title: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Active session (single, backward-compatible)
// ──────────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────────
// Contract history (B3) — seznam uložených smluv
// ──────────────────────────────────────────────────────────────────────────

function readHistory(): ContractHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[sessionStore] Failed to read history', err);
    return [];
  }
}

function writeHistory(entries: ContractHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('[sessionStore] Failed to write history', err);
  }
}

function makeTitle(contractType: ContractType, fields: ContractFields): string {
  const typeLabels: Record<ContractType, string> = {
    nda: 'Dohoda o mlčenlivosti',
    rent: 'Nájemní smlouva',
    employment: 'Pracovní smlouva',
    work: 'Smlouva o dílo',
  };
  const party =
    fields.poskytovatel ||
    fields.pronajimatel ||
    fields.zamestnavatel ||
    fields.employerName ||
    fields.clientName ||
    '';
  return party ? `${typeLabels[contractType]} — ${party}` : typeLabels[contractType];
}

/**
 * Uloží aktuální stav smlouvy do historie. Pokud už existuje záznam se stejným
 * id, aktualizuje ho (místo duplikace). Vrací id záznamu.
 */
export function saveToHistory(
  id: string | null,
  contractType: ContractType,
  fields: ContractFields,
  messages: Message[],
  status: ContractStatus = 'in_progress'
): string {
  const entryId = id || `contract_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();
  const history = readHistory();
  const idx = history.findIndex((h) => h.id === entryId);

  const entry: ContractHistoryEntry = {
    id: entryId,
    contractType,
    fields,
    messages,
    status,
    savedAt: now,
    title: makeTitle(contractType, fields),
  };

  if (idx >= 0) {
    history[idx] = entry;
  } else {
    history.unshift(entry);
  }

  // Keep history bounded (max 50 entries)
  writeHistory(history.slice(0, 50));
  return entryId;
}

/** Vrátí seznam uložených smluv (nejnovější první). */
export function getHistory(): ContractHistoryEntry[] {
  return readHistory();
}

/** Načte konkrétní smlouvu z historie podle id. */
export function loadFromHistory(id: string): ContractHistoryEntry | null {
  return readHistory().find((h) => h.id === id) ?? null;
}

/** Smaže smlouvu z historie. */
export function deleteFromHistory(id: string): void {
  writeHistory(readHistory().filter((h) => h.id !== id));
}

/** Smaže celou historii (bez vlivu na aktivní session). */
export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.warn('[sessionStore] Failed to clear history', err);
  }
}
