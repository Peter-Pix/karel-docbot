/**
 * Single Source of Truth for all contract field definitions.
 * 
 * Used by:
 * - src/App.tsx (smart suggestions, progress tracking)
 * - src/components/ChatPanel.tsx (progress bar)
 * - src/components/FieldsEditorPanel.tsx (field editor)
 * - src/lib/templateGenerator.ts (defaults, labels, HTML generation)
 * - api/chat.ts (AI prompts, fallback logic)
 * 
 * Never duplicate field keys/labels/prompts elsewhere.
 * If you add a new contract type or field, add it HERE and everything else updates automatically.
 */

import { ContractType, ContractFields } from '../types';

export interface FieldDefinition {
  key: keyof ContractFields;
  label: string;
  prompt: string;
  defaultValue: string;
  /** Optional validation hint for the editor */
  placeholder?: string;
}

export interface ContractSchema {
  type: ContractType;
  title: string;
  fields: FieldDefinition[];
}

// ─── NDA ──────────────────────────────────────────────────────────
const ndaSchema: FieldDefinition[] = [
  {
    key: 'poskytovatel',
    label: 'Poskytovatel informací',
    prompt: 'Jaké je celé jméno nebo název firmy Poskytovatele důvěrných informací?',
    defaultValue: '',
    placeholder: 'např. Inovativní Startup s.r.o.',
  },
  {
    key: 'prijemce',
    label: 'Příjemce informací',
    prompt: 'A kdo je Příjemcem důvěrných informací? Uveďte prosím jméno nebo název firmy.',
    defaultValue: '',
    placeholder: 'např. Jan Horký',
  },
  {
    key: 'predmet_tajemstvi',
    label: 'Předmět tajemství / Účel',
    prompt: 'Co bude předmětem ochrany tajemství? (např. "zdrojové kódy mobilní aplikace" nebo "obchodní plány k projektu X")',
    defaultValue: '',
    placeholder: 'např. zdrojové kódy a designové podklady',
  },
  {
    key: 'smluvni_pokuta',
    label: 'Smluvní pokuta',
    prompt: 'Jaká má být výše smluvní pokuty za případné porušení mlčenlivosti? (např. "100 000 Kč" - doporučuje se přiměřená částka)',
    defaultValue: '50 000 Kč',
    placeholder: 'např. 100 000 Kč',
  },
  {
    key: 'doba_platnosti',
    label: 'Doba platnosti / Trvání',
    prompt: 'Jak dlouho má mlčenlivost po předání informací platit? (např. "3 roky od podpisu")',
    defaultValue: '3 roky od podpisu',
    placeholder: 'např. 5 let od ukončení spolupráce',
  },
  {
    key: 'rozhodne_pravo',
    label: 'Rozhodné právo',
    prompt: 'A nakonec, pod jaké rozhodné právo má dohoda spadat? (např. "Česká republika (české právo)")',
    defaultValue: 'Česká republika (české právo)',
    placeholder: 'např. Česká republika (české právo)',
  },
];

// ─── RENT ──────────────────────────────────────────────────────────
const rentSchema: FieldDefinition[] = [
  {
    key: 'pronajimatel',
    label: 'Pronajímatel',
    prompt: 'Kdo je Pronajímatelem bytu? Uveďte prosím celé jméno nebo název firmy.',
    defaultValue: '',
    placeholder: 'např. Jaroslav Bohatý',
  },
  {
    key: 'najemce',
    label: 'Nájemce',
    prompt: 'Kdo bude Nájemcem bytu? Uveďte prosím celé jméno.',
    defaultValue: '',
    placeholder: 'např. Květoslav Chudý',
  },
  {
    key: 'predmet_najmu',
    label: 'Předmět nájmu / Adresa',
    prompt: 'Uveďte prosím přesnou adresu pronajímaného bytu (např. "Spálená 23, Praha 1, byt č. 4").',
    defaultValue: '',
    placeholder: 'např. Spálená 23, Praha 1, byt č. 4',
  },
  {
    key: 'vyska_najemneho',
    label: 'Výše měsíčního nájemného',
    prompt: 'Jaká bude výše čistého měsíčního nájemného? (např. "15 000 Kč")',
    defaultValue: '',
    placeholder: 'např. 15 000 Kč',
  },
  {
    key: 'poplatky_sluzby',
    label: 'Zálohy na služby a energie',
    prompt: 'Kolik činí měsíční zálohy na služby a energie? (např. "3 500 Kč")',
    defaultValue: '',
    placeholder: 'např. 3 500 Kč',
  },
  {
    key: 'vratna_kauce',
    label: 'Vratná kauce (Jistota)',
    prompt: 'Jaká bude výše vratné kauce? (obvykle se dává 1 až 2 měsíční nájmy, např. "25 000 Kč")',
    defaultValue: '',
    placeholder: 'např. 25 000 Kč',
  },
  {
    key: 'vypovedni_lhuta',
    label: 'Výpovědní lhůta',
    prompt: 'Jaká bude výpovědní lhůta? (zákonné minimum je "3 měsíce", doporučuje se ponechat toto nastavení)',
    defaultValue: '3 měsíce',
    placeholder: 'např. 3 měsíce',
  },
  {
    key: 'datum_zacatku',
    label: 'Datum začátku nájmu',
    prompt: 'Od kdy nájemní vztah začíná? (např. "1. srpna 2026")',
    defaultValue: '',
    placeholder: 'např. 1. srpna 2026',
  },
];

// ─── EMPLOYMENT ────────────────────────────────────────────────────
const employmentSchema: FieldDefinition[] = [
  {
    key: 'zamestnavatel',
    label: 'Zaměstnavatel',
    prompt: 'Jaký je přesný název nebo jméno Zaměstnavatele?',
    defaultValue: '',
    placeholder: 'např. Rychlá Logistika a.s.',
  },
  {
    key: 'zamestnanec',
    label: 'Zaměstnanec',
    prompt: 'Uveďte prosím celé jméno Zaměstnance.',
    defaultValue: '',
    placeholder: 'např. Pavel Rychlý',
  },
  {
    key: 'pracovni_pozice',
    label: 'Pracovní pozice',
    prompt: 'Jaká bude pracovní pozice / druh vykonávané práce? (např. "Kurýr zásilek" nebo "Software vývojář")',
    defaultValue: '',
    placeholder: 'např. Software vývojář',
  },
  {
    key: 'misto_vykonu',
    label: 'Místo výkonu práce',
    prompt: 'Kde bude hlavní místo výkonu práce? (např. "Praha" nebo konkrétní provozovna)',
    defaultValue: '',
    placeholder: 'např. Praha',
  },
  {
    key: 'datum_nastupu',
    label: 'Datum nástupu do práce',
    prompt: 'Jaké je datum nástupu do zaměstnání? (např. "1. srpna 2026")',
    defaultValue: '',
    placeholder: 'např. 1. srpna 2026',
  },
  {
    key: 'mzda',
    label: 'Mzda (Hrubý měsíční plat)',
    prompt: 'Jaká bude výše hrubé měsíční mzdy? (např. "45 000 Kč")',
    defaultValue: '',
    placeholder: 'např. 45 000 Kč',
  },
  {
    key: 'zkusebni_doba',
    label: 'Zkušební doba',
    prompt: 'Jak dlouhá bude zkušební doba? (u běžných zaměstnanců je zákonný limit max "3 měsíce")',
    defaultValue: '3 měsíce',
    placeholder: 'např. 3 měsíce (max. zákonný limit)',
  },
  {
    key: 'pracovni_doba',
    label: 'Týdenní pracovní doba',
    prompt: 'Jaká bude stanovená týdenní pracovní doba? (standardní plný úvazek je "40 hodin týdně")',
    defaultValue: '40 hodin týdně',
    placeholder: 'např. 40 hodin týdně',
  },
];

// ─── Schema Registry ───────────────────────────────────────────────
const SCHEMAS: Record<ContractType, FieldDefinition[]> = {
  nda: ndaSchema,
  rent: rentSchema,
  employment: employmentSchema,
};

const TITLES: Record<ContractType, string> = {
  nda: 'Dohoda o ochraně důvěrných informací (NDA)',
  rent: 'Nájemní smlouva na byt',
  employment: 'Pracovní smlouva',
};

// ─── Accessor Functions ───────────────────────────────────────────

/** Get all field definitions for a contract type */
export function getFieldDefinitions(type: ContractType): FieldDefinition[] {
  return SCHEMAS[type];
}

/** Get all field keys for a contract type (for progress tracking, validation, etc.) */
export function getFieldKeys(type: ContractType): (keyof ContractFields)[] {
  return SCHEMAS[type].map(f => f.key);
}

/** Get the human-readable label for a field key */
export function getFieldLabel(key: keyof ContractFields): string {
  for (const type of Object.keys(SCHEMAS) as ContractType[]) {
    const def = SCHEMAS[type].find(f => f.key === key);
    if (def) return def.label;
  }
  return key as string;
}

/** Get the AI prompt for a field key */
export function getFieldPrompt(key: keyof ContractFields): string {
  for (const type of Object.keys(SCHEMAS) as ContractType[]) {
    const def = SCHEMAS[type].find(f => f.key === key);
    if (def) return def.prompt;
  }
  return '';
}

/** Get the default value for a field key */
export function getFieldDefault(key: keyof ContractFields): string {
  for (const type of Object.keys(SCHEMAS) as ContractType[]) {
    const def = SCHEMAS[type].find(f => f.key === key);
    if (def) return def.defaultValue;
  }
  return '';
}

/** Get the placeholder for a field key (for editor inputs) */
export function getFieldPlaceholder(key: keyof ContractFields): string {
  for (const type of Object.keys(SCHEMAS) as ContractType[]) {
    const def = SCHEMAS[type].find(f => f.key === key);
    if (def?.placeholder) return def.placeholder;
  }
  return '';
}

/** Get the contract title */
export function getContractTitleFromSchema(type: ContractType): string {
  return TITLES[type];
}

/** Get default fields object for a contract type (all fields with default values) */
export function getDefaultFieldsFromSchema(type: ContractType): ContractFields {
  const fields: ContractFields = { contractType: type };
  for (const def of SCHEMAS[type]) {
    (fields as any)[def.key] = def.defaultValue;
  }
  return fields;
}

/** Get the legal advice dictionary (prompt-based explanations) for fallback chat */
export function getAdviceDictionary(): Record<string, string> {
  const advice: Record<string, string> = {};
  for (const type of Object.keys(SCHEMAS) as ContractType[]) {
    for (const def of SCHEMAS[type]) {
      // The prompt itself serves as the advice text context
      // Extended advice is still in api/chat.ts adviceDict, but field prompts are now centralized
      advice[def.key] = def.prompt;
    }
  }
  return advice;
}