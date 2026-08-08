// src/lib/entities.ts
// Datové modely pro "Paměť aplikace" — entitní systém, který umožní opakované použití.

/**
 * Profil uživatele = "Já jako strana smlouvy"
 * Ukládá se do localStorage při prvním vyplnění a pak se jen aktualizuje.
 */
export interface MyProfile {
  id: 'me';
  // Osobní údaje
  fullName: string;
  birthDate?: string;
  // Adresa
  street: string;
  city: string;
  zip: string;
  // Firma (pokud je OSVČ)
  ico?: string;
  dic?: string;
  businessName?: string;
  // Banka
  bankAccount: string;
  // Kontakt
  email: string;
  phone?: string;
  // Metadata
  lastUpdated: string;
  isComplete: boolean;
}

/**
 * Protistrana = Klient, Pronajímatel, Zaměstnavatel — kdokoli na druhé straně.
 * Knihovna klientů: uživatel nevyplňuje stejnou osobu dvakrát.
 */
export interface Counterparty {
  id: string;
  label: string; // Friendly name, např. "Pan Novák", "ACME s.r.o."
  // Osobní údaje
  fullName: string;
  // Firma (volitelné)
  ico?: string;
  dic?: string;
  businessName?: string;
  // Adresa
  street: string;
  city: string;
  zip: string;
  // Banka
  bankAccount?: string;
  // Kontakt
  email?: string;
  phone?: string;
  // Metadata
  createdAt: string;
  lastUsedAt: string;
  useCount: number;
  notes?: string;
}

/**
 * Šablona díla = "Co typicky dělám".
 * Uživatel nepopisuje znovu celý web od nuly, jen vybere šablonu.
 */
export interface WorkTemplate {
  id: string;
  label: string; // "Standardní web", "Logo", "Konzultace"
  contractType: 'nda' | 'rent' | 'employment' | 'work';
  description: string;
  defaultPrice?: number;
  defaultDurationDays?: number;
  // Klíčové parametry, které se šablónou vyplní (volné texty)
  defaultFields?: Record<string, string>;
  // Safeguards, které jsou u této šablony defaultně aktivní
  defaultSafeguards?: {
    copyrightTransfer: boolean;
    penaltyClause: boolean;
    nda: boolean;
  };
  createdAt: string;
  lastUsedAt: string;
  useCount: number;
}

/**
 * Quick Safeguard toggles = "Klid v duši"
 * Uživatelovo nastavení, co chce mít defaultně zapnuté.
 */
export interface SafeguardPrefs {
  copyrightTransfer: boolean;
  penaltyClause: boolean;
  nda: boolean;
  jurisdictionCZ: boolean;
}

/**
 * Hlavní kontejner pro celou paměť.
 */
export interface EntityStore {
  myProfile: MyProfile | null;
  counterparties: Counterparty[];
  workTemplates: WorkTemplate[];
  safeguardPrefs: SafeguardPrefs;
  version: number;
}

// ──────────────────────────────────────────────────────────────────────────
// PARSER TYPES — Data extracted from pasted text or scanned documents
// ──────────────────────────────────────────────────────────────────────────

/**
 * To, co dostaneme z AI parseru (Ctrl+V nebo fotka vizitky).
 * Může obsahovat obě strany najednou — AI se pokusí rozlišit.
 */
export interface ParsedEntityData {
  // Strana 1 (já)
  myProfile?: Partial<MyProfile>;
  // Strana 2 (protistrana)
  counterparty?: Partial<Counterparty>;
  // Pokud AI pozná šablonu díla
  workTemplate?: Partial<WorkTemplate>;
  // Konkrétní data smlouvy (cena, termín...)
  contractData?: {
    subject?: string;
    price?: string;
    deadline?: string;
  };
  // Confidence skóre 0-1, jak si je AI jistá
  confidence: number;
  // Pole, která AI nerozpoznala, aby se na ně dalo doptat
  missingFields: string[];
}

// ──────────────────────────────────────────────────────────────────────────
// FACTORY: Výchozí prázdné entity
// ──────────────────────────────────────────────────────────────────────────

export const createEmptyMyProfile = (): MyProfile => ({
  id: 'me',
  fullName: '',
  street: '',
  city: '',
  zip: '',
  bankAccount: '',
  email: '',
  isComplete: false,
  lastUpdated: new Date().toISOString(),
});

export const createDefaultSafeguards = (): SafeguardPrefs => ({
  copyrightTransfer: true,
  penaltyClause: true,
  nda: true,
  jurisdictionCZ: true,
});

export const createEmptyEntityStore = (): EntityStore => ({
  myProfile: null,
  counterparties: [],
  workTemplates: [],
  safeguardPrefs: createDefaultSafeguards(),
  version: 1,
});

// Vzorové šablony pro rychlý start (ne do produkce, jen pro demo)
export const createSampleWorkTemplates = (): WorkTemplate[] => [
  {
    id: 'tpl_web',
    label: 'Standardní web (5 stránek)',
    contractType: 'work',
    description: 'Responzivní web s 5 podstránkami, kontaktním formulářem a napojením na analytiku.',
    defaultPrice: 45000,
    defaultDurationDays: 30,
    defaultFields: {},
    defaultSafeguards: { copyrightTransfer: true, penaltyClause: true, nda: true },
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    useCount: 0,
  },
  {
    id: 'tpl_logo',
    label: 'Logo a vizuální identita',
    contractType: 'work',
    description: 'Návrh loga, barevné palety a základních vizuálních prvků značky.',
    defaultPrice: 18000,
    defaultDurationDays: 14,
    defaultFields: {},
    defaultSafeguards: { copyrightTransfer: true, penaltyClause: false, nda: true },
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    useCount: 0,
  },
  {
    id: 'tpl_consulting',
    label: 'Konzultace / Mentorství',
    contractType: 'work',
    description: 'Odborná konzultace v oblasti AI integrace, produktu nebo marketingu.',
    defaultPrice: 2500,
    defaultDurationDays: 1,
    defaultFields: {},
    defaultSafeguards: { copyrightTransfer: false, penaltyClause: false, nda: true },
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    useCount: 0,
  },
];