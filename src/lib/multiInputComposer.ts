// src/lib/multiInputComposer.ts
// Logika pro skládání více zdrojů do jedné entity.
// Uživatel může hodit Ctrl+V, pak fotku, pak URL — všechno se to postupně analyzuje.

import { ParsedEntityData } from './entities';

export type InputSource =
  | { kind: 'text'; content: string }
  | { kind: 'image'; content: string; mimeType: string }
  | { kind: 'url'; content: string };

export interface InputSourceDisplay {
  id: string;
  addedAt: number;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  errorMessage?: string;
  thumbnail?: string; // pro obrázky
  // Skutečný zdroj dat (text/image/url)
  kind: 'text' | 'image' | 'url';
  content: string;
  mimeType?: string;
  label?: string;
}

/**
 * Slučovač: Vezme více parsovaných výsledků a udělá z nich jednu konzistentní entitu.
 * Priority: čím později přidaný zdroj, tím vyšší váha (uživatel přidává doplňky).
 */
export function mergeParsedData(sources: ParsedEntityData[]): ParsedEntityData {
  if (sources.length === 0) {
    return {
      confidence: 0,
      missingFields: [],
    };
  }
  if (sources.length === 1) return sources[0];

  // Slučuj postupně — pozdější přepisuje dřívější, pokud má vyšší confidence
  let merged: ParsedEntityData = { ...sources[0], missingFields: [...sources[0].missingFields] };

  for (let i = 1; i < sources.length; i++) {
    const next = sources[i];

    // Merge myProfile
    if (next.myProfile) {
      merged.myProfile = { ...merged.myProfile, ...next.myProfile };
    }

    // Merge counterparty
    if (next.counterparty) {
      merged.counterparty = { ...merged.counterparty, ...next.counterparty };
    }

    // Merge workTemplate
    if (next.workTemplate) {
      merged.workTemplate = { ...merged.workTemplate, ...next.workTemplate };
    }

    // Merge contractData
    if (next.contractData) {
      merged.contractData = { ...merged.contractData, ...next.contractData };
    }

    // Confidence: průměr, ale ne víc než 0.95
    const avgConfidence = (merged.confidence + next.confidence) / 2;
    merged.confidence = Math.min(0.95, avgConfidence);

    // Missing fields: sjednotit, odstranit duplicity
    const allMissing = new Set([...merged.missingFields, ...next.missingFields]);
    merged.missingFields = Array.from(allMissing);
  }

  // Po sloučení: Pokud něco bylo prázdné v jednom a vyplněné v jiném, vyčisti
  if (merged.myProfile) {
    Object.keys(merged.myProfile).forEach((key) => {
      const val = (merged.myProfile as any)[key];
      if (typeof val === 'string' && val.trim() === '') {
        delete (merged.myProfile as any)[key];
      }
    });
  }

  return merged;
}

/**
 * Heuristika: Identifikuj, jestli parsovaná data vypadají jako vizitka/faktura/web/email.
 * Pomáhá parseru říct, co vlastně parsuje.
 */
export function detectInputKind(text: string): 'business_card' | 'invoice' | 'email' | 'webpage' | 'unknown' {
  const t = text.toLowerCase();
  if (/@/.test(t) && /(subject|from|komu|od):/i.test(text)) return 'email';
  if (/(faktura|invoice|daňový doklad|ič dph|duzp)/i.test(text)) return 'invoice';
  if (/(vizitka|contact|kontakt|tel:|telefon|mobil)/i.test(text)) return 'business_card';
  if (/(homepage|www|http|url)/i.test(text) || text.length > 1000) return 'webpage';
  return 'unknown';
}

/**
 * Fuzzy normalizer pro typické chyby v OCR/parsování.
 * "123 45 678" → "12345678" pro IČO
 * "+420 777 / 123 456" → "+420777123456" pro telefon
 */
export function fuzzyNormalize(value: string, kind: 'ico' | 'phone' | 'bankAccount'): string {
  let v = value.trim();

  if (kind === 'ico') {
    // IČO: 8 číslic
    const digits = v.replace(/\D/g, '');
    if (digits.length === 8) return digits;
    if (digits.length > 8) return digits.slice(0, 8);
  }

  if (kind === 'phone') {
    // Telefon: ponecháme + na začátku, zbytek čísla
    const hasPlus = v.startsWith('+');
    const digits = v.replace(/\D/g, '');
    if (digits.length >= 9) {
      return (hasPlus ? '+' : '') + digits;
    }
  }

  if (kind === 'bankAccount') {
    // Český formát: předčíslí-číslo/kód banky, nebo jen číslo/kód banky
    // "123456789/0100" → "123456789/0100"
    return v.replace(/\s/g, '').replace(/--/g, '-');
  }

  return v;
}