// src/lib/storage.ts
// Wrapper nad localStorage pro ukládání entit.
// Veškerá perzistence aplikace — profil, klienti, šablony — jde přes tento modul.

import {
  EntityStore,
  MyProfile,
  Counterparty,
  WorkTemplate,
  SafeguardPrefs,
  createEmptyEntityStore,
  createSampleWorkTemplates,
} from './entities';

const STORAGE_KEY = 'docbot_entities_v1';

// ──────────────────────────────────────────────────────────────────────────
// SAFE JSON: odolnost proti rozbitým datům, schématickým změnám
// ──────────────────────────────────────────────────────────────────────────

function safeGet(): EntityStore {
  if (typeof window === 'undefined') return createEmptyEntityStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyEntityStore();

    const parsed = JSON.parse(raw) as Partial<EntityStore>;

    // Migrace / sanitizace — vždy vrátíme validní tvar
    return {
      myProfile: parsed.myProfile ?? null,
      counterparties: Array.isArray(parsed.counterparties) ? parsed.counterparties : [],
      workTemplates: Array.isArray(parsed.workTemplates) ? parsed.workTemplates : [],
      safeguardPrefs: {
        copyrightTransfer: parsed.safeguardPrefs?.copyrightTransfer ?? true,
        penaltyClause: parsed.safeguardPrefs?.penaltyClause ?? true,
        nda: parsed.safeguardPrefs?.nda ?? true,
        jurisdictionCZ: parsed.safeguardPrefs?.jurisdictionCZ ?? true,
      },
      version: parsed.version ?? 1,
    };
  } catch (err) {
    console.warn('[storage] Corrupted data, resetting to empty store', err);
    return createEmptyEntityStore();
  }
}

function safeSet(store: EntityStore): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('[storage] Failed to persist', err);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// CRUD API
// ──────────────────────────────────────────────────────────────────────────

export function getEntityStore(): EntityStore {
  const store = safeGet();
  // Lazy seed sample templates only if completely empty AND never seeded
  if (store.workTemplates.length === 0) {
    store.workTemplates = createSampleWorkTemplates();
    safeSet(store);
  }
  return store;
}

export function saveMyProfile(profile: MyProfile): void {
  const store = getEntityStore();
  store.myProfile = { ...profile, lastUpdated: new Date().toISOString() };
  safeSet(store);
}

export function upsertCounterparty(cp: Counterparty): Counterparty {
  const store = getEntityStore();
  const idx = store.counterparties.findIndex(c => c.id === cp.id);
  const updated = { ...cp, lastUsedAt: new Date().toISOString() };

  if (idx >= 0) {
    updated.useCount = (store.counterparties[idx].useCount || 0) + 1;
    store.counterparties[idx] = updated;
  } else {
    store.counterparties.push(updated);
  }
  safeSet(store);
  return updated;
}

export function deleteCounterparty(id: string): void {
  const store = getEntityStore();
  store.counterparties = store.counterparties.filter(c => c.id !== id);
  safeSet(store);
}

export function findCounterparty(id: string): Counterparty | undefined {
  return getEntityStore().counterparties.find(c => c.id === id);
}

export function bumpCounterpartyUsage(id: string): void {
  const store = getEntityStore();
  const cp = store.counterparties.find(c => c.id === id);
  if (cp) {
    cp.useCount = (cp.useCount || 0) + 1;
    cp.lastUsedAt = new Date().toISOString();
    safeSet(store);
  }
}

export function upsertWorkTemplate(tpl: WorkTemplate): WorkTemplate {
  const store = getEntityStore();
  const idx = store.workTemplates.findIndex(t => t.id === tpl.id);
  const updated = { ...tpl, lastUsedAt: new Date().toISOString() };

  if (idx >= 0) {
    updated.useCount = (store.workTemplates[idx].useCount || 0) + 1;
    store.workTemplates[idx] = updated;
  } else {
    store.workTemplates.push(updated);
  }
  safeSet(store);
  return updated;
}

export function deleteWorkTemplate(id: string): void {
  const store = getEntityStore();
  store.workTemplates = store.workTemplates.filter(t => t.id !== id);
  safeSet(store);
}

export function bumpWorkTemplateUsage(id: string): void {
  const store = getEntityStore();
  const tpl = store.workTemplates.find(t => t.id === id);
  if (tpl) {
    tpl.useCount = (tpl.useCount || 0) + 1;
    tpl.lastUsedAt = new Date().toISOString();
    safeSet(store);
  }
}

export function saveSafeguardPrefs(prefs: SafeguardPrefs): void {
  const store = getEntityStore();
  store.safeguardPrefs = prefs;
  safeSet(store);
}

// ──────────────────────────────────────────────────────────────────────────
// HELPERS: Top counterparties by usage (nejčastěji používaní klienti)
// ──────────────────────────────────────────────────────────────────────────

export function getTopCounterparties(limit = 5): Counterparty[] {
  return [...getEntityStore().counterparties]
    .sort((a, b) => (b.useCount || 0) - (a.useCount || 0))
    .slice(0, limit);
}

export function getTopWorkTemplates(limit = 5): WorkTemplate[] {
  return [...getEntityStore().workTemplates]
    .sort((a, b) => (b.useCount || 0) - (a.useCount || 0))
    .slice(0, limit);
}