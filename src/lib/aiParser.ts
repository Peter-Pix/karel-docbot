// src/lib/aiParser.ts
// AI Parser — podpora jednoho i více zdrojů najednou (Multi-Input Composer).

import { ParsedEntityData } from './entities';

// ──────────────────────────────────────────────────────────────────────────
// SINGLE INPUT REQUEST
// ──────────────────────────────────────────────────────────────────────────

export interface ParseRequest {
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
  url?: string;
  contractType: 'nda' | 'rent' | 'employment' | 'work';
  hint?: string;
}

// ──────────────────────────────────────────────────────────────────────────
// MULTI-INPUT REQUEST (Fáze 6: Multi-source merge)
// ──────────────────────────────────────────────────────────────────────────

export interface MultiParseRequest {
  sources: Array<{
    text?: string;
    imageBase64?: string;
    imageMimeType?: string;
    url?: string;
    label?: string; // např. "Vizitka z meetingu", "Email z 5.8."
  }>;
  contractType: 'nda' | 'rent' | 'employment' | 'work';
  mode: 'me' | 'counterparty';
}

export interface ParseResponse {
  success: boolean;
  data?: ParsedEntityData;
  error?: string;
  rawResponse?: string;
}

export interface MultiParseResponse {
  success: boolean;
  data?: ParsedEntityData;
  sourceResults?: ParsedEntityData[]; // Jednotlivé výsledky pro každý zdroj
  error?: string;
}

/**
 * Zavolej AI parser — jeden zdroj.
 */
export async function parseEntityData(req: ParseRequest): Promise<ParseResponse> {
  try {
    const response = await fetch('/api/parse-entity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        error: `Server vrátil ${response.status}: ${errText.slice(0, 200)}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Neznámá chyba',
    };
  }
}

/**
 * Zavolej AI parser — více zdrojů najednou.
 * Server to analyzuje všechno a vrátí sloučenou entitu + jednotlivé výsledky.
 */
export async function parseMultipleEntityData(req: MultiParseRequest): Promise<MultiParseResponse> {
  try {
    const response = await fetch('/api/parse-entity-multi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        error: `Server vrátil ${response.status}: ${errText.slice(0, 200)}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.merged,
      sourceResults: data.sources,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Neznámá chyba',
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// PROMPTS
// ──────────────────────────────────────────────────────────────────────────

export function buildParserSystemPrompt(mode: 'me' | 'counterparty' = 'counterparty'): string {
  const target = mode === 'me' ? 'uživatel samotný (jeho vlastní údaje)' : 'protistrana (druhý účastník smlouvy)';
  return `Jsi extraktor dat z neuspořádaného textu nebo obrázku (vizitka, faktura, web, email, billboard, letáček — cokoliv).
Tvůj úkol: Najdi všechny údaje o ${target} a vrať je jako JSON.

PRAVIDLA (čti pozorně):

1. OCR je SHŮVÁVÉ. Pokud něco vypadá jako IČO (8 číslic), bankovní účet (číslo/kód banky), email (text@domena.tld) nebo telefon (+420... nebo 9+ číslic) — extrahuj to, i když má mezery nebo divný formát. Validaci nech na nás.

2. Pokud vidíš firmu (s.r.o., a.s., k.s., v.o.s. nebo "společnost", "firma", "sídlo") — extrahuj její název a IČO/DIČ pokud jsou.

3. Adresa: Hledej PSČ (3 čísla + 2 čísla), město, ulici. Nemusí být všechno — co najdeš, to extrahuj.

4. Pokud text popisuje JEDNU osobu/firmu, vlož ji do "counterparty" (nebo "myProfile" pokud je to o uživateli).

5. VŽDY nastav "confidence" (0-1):
   - 0.9+ = data jsou jasná a kompletní
   - 0.6-0.9 = data jsou z většiny jasná
   - 0.3-0.6 = data jsou částečná, hodně chybí
   - pod 0.3 = skoro nic jsem nenašel

6. Do "missingFields" vlož STRINGY s tím, co se nepodařilo najít (např. ["ico", "email", "bankAccount"]).

7. Pokud je to vizitka nebo faktura nebo email nebo web — prostě extrahuj, neříkej "this is a vizitka".

8. Vrať POUZE validní JSON, bez markdown bloků.`;
}

export function buildParserUserPrompt(text: string, contractType: string, mode: 'me' | 'counterparty'): string {
  const targetHint = mode === 'me'
    ? 'Toto jsou údaje o UŽIVATELI (o mně).'
    : 'Toto jsou údaje o DRUHÉ STRANĚ (protistraně).';
  return `${targetHint}
Typ smlouvy: ${contractType}

Text k analýze:
"""
${text}
"""

Extrahuj data podle instrukcí a vrať JSON.`;
}

/**
 * Multi-source prompt: Všechny zdroje najednou, sjednotit do jedné entity.
 */
export function buildMultiParserSystemPrompt(mode: 'me' | 'counterparty'): string {
  return `${buildParserSystemPrompt(mode)}

DOSTANEŠ VÍCE ZDROJŮ NAJEDNOU (např. text z emailu + fotka vizitky + URL webu).
Tvůj úkol: Sjednoť je do JEDNÉ konzistentní entity.

Strategie:
- Pokud je v jednom zdroji IČO a v jiném email, oboj tam dej.
- Pokud má zdroj A "Jan Novák" a zdroj B "ACME s.r.o." — oboj jsou důležité (jméno kontaktní osoby + firma).
- Pokud si zdroje odporují (různé adresy), preferuj NOVĚJŠÍ zdroj (ten na konci pole).
- Vrať JEDEN finální JSON + do "sources" pole JSON pro každý zdroj zvlášť (pro debugging).`;
}

export function buildMultiParserUserPrompt(sources: Array<{ content: string; label?: string }>): string {
  return `Analyzuj ${sources.length} zdrojů:

${sources.map((s, i) => `
--- ZDROJ ${i + 1}${s.label ? ` (${s.label})` : ''} ---
${s.content}
--- KONEC ZDROJE ${i + 1} ---
`).join('\n')}

Vrať JSON:
{
  "merged": { ... finální sjednocená entita ... },
  "sources": [
    { ... výsledek ze zdroje 1 ... },
    { ... výsledek ze zdroje 2 ... }
  ]
}`;
}