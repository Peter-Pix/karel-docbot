// src/lib/useEntityStore.ts
// React hook nad entitním storem. UI nemusí vědět o localStorage.

import { useState, useEffect, useCallback } from 'react';
import {
  EntityStore,
  MyProfile,
  Counterparty,
  WorkTemplate,
  SafeguardPrefs,
  createEmptyMyProfile,
} from './entities';
import {
  getEntityStore,
  saveMyProfile as saveMyProfileToStorage,
  upsertCounterparty,
  deleteCounterparty as deleteCounterpartyFromStorage,
  bumpCounterpartyUsage,
  upsertWorkTemplate,
  deleteWorkTemplate as deleteWorkTemplateFromStorage,
  bumpWorkTemplateUsage,
  saveSafeguardPrefs,
} from './storage';

export function useEntityStore() {
  const [store, setStore] = useState<EntityStore | null>(null);

  // Načti při mountu
  useEffect(() => {
    setStore(getEntityStore());
  }, []);

  const refresh = useCallback(() => {
    setStore(getEntityStore());
  }, []);

  // ── My Profile ──
  const saveProfile = useCallback((profile: MyProfile | Partial<MyProfile>) => {
    const current = getEntityStore().myProfile ?? createEmptyMyProfile();
    const merged: MyProfile = {
      ...current,
      ...profile,
      id: 'me',
      lastUpdated: new Date().toISOString(),
      isComplete: isProfileComplete({ ...current, ...profile } as MyProfile),
    };
    saveMyProfileToStorage(merged);
    refresh();
    return merged;
  }, [refresh]);

  // ── Counterparties ──
  const saveCounterparty = useCallback((cp: Counterparty) => {
    const result = upsertCounterparty(cp);
    refresh();
    return result;
  }, [refresh]);

  const deleteCounterparty = useCallback((id: string) => {
    deleteCounterpartyFromStorage(id);
    refresh();
  }, [refresh]);

  const useCounterparty = useCallback((id: string) => {
    bumpCounterpartyUsage(id);
    refresh();
  }, [refresh]);

  // ── Work Templates ──
  const saveTemplate = useCallback((tpl: WorkTemplate) => {
    const result = upsertWorkTemplate(tpl);
    refresh();
    return result;
  }, [refresh]);

  const deleteTemplate = useCallback((id: string) => {
    deleteWorkTemplateFromStorage(id);
    refresh();
  }, [refresh]);

  const useTemplate = useCallback((id: string) => {
    bumpWorkTemplateUsage(id);
    refresh();
  }, [refresh]);

  // ── Safeguard Prefs ──
  const setSafeguardPrefs = useCallback((prefs: SafeguardPrefs) => {
    saveSafeguardPrefs(prefs);
    refresh();
  }, [refresh]);

  return {
    store,
    isLoaded: store !== null,
    saveProfile,
    saveCounterparty,
    deleteCounterparty,
    useCounterparty,
    saveTemplate,
    deleteTemplate,
    useTemplate,
    setSafeguardPrefs,
    refresh,
  };
}

// Helper: Kdy je profil považován za "kompletní"?
function isProfileComplete(p: MyProfile): boolean {
  return Boolean(p.fullName?.trim() && p.email?.trim() && (p.ico?.trim() || p.bankAccount?.trim()));
}