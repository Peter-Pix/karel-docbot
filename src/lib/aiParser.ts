// src/lib/aiParser.ts
// Rozhraní pro AI parser: Ctrl+V, fotka vizitky, URL firmy.
// Všechno jde přes jeden endpoint, který vrátí strukturovaná data.

import { ParsedEntityData } from './entities';

export interface ParseRequest {
  // Co parser dostává na vstupu
  text?: string; // Volný text z Ctrl+V
  imageBase64?: string; // Base64 zakódovaný obrázek (vizitka, faktura)
  imageMimeType?: string; // 'image/jpeg', 'image/png', 'image/webp'
  url?: string; // Webová stránka firmy
  // Kontext
  contractType: 'nda' | 'rent' | 'employment' | 'work';
  hint?: string; // Volitelný hint od uživatele, co se pokouší vložit
}

export interface ParseResponse {
  success: boolean;
  data?: ParsedEntityData;
  error?: string;
  rawResponse?: string; // Pro debug
}

/**
 * Zavolej AI parser. Všechen parsing jde přes serverless endpoint,
 * který drží API klíče a prompty.
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

// ──────────────────────────────────────────────────────────────────────────
// PROMPT BUILDER: Sestaví prompt pro LLM (použito na serveru)
// ──────────────────────────────────────────────────────────────────────────

export function buildParserSystemPrompt(): string {
  return `Jsi extraktor dat z neuspořádaného textu nebo obrázku (vizitka, faktura, web).
Tvůj úkol: Najdi všechny údaje o OSOBÁCH nebo FIRMÁCH a vrať je jako JSON.

Pravidla:
1. Pokud text popisuje JEDNU osobu/firmu, vlož ji do "counterparty".
2. Pokud text obsahuje DVĚ osoby/firmy (např. "Já jsem X a druhá strana je Y"), pokus se rozlišit podle kontextu. Pokud si nejsi jistý, dej hlavní/zmíněnou osobu do "counterparty" a označ v "missingFields" co chybí.
3. Pokud vidíš údaj "IČO" nebo "DIČ" nebo "bankovní účet" nebo "telefon" nebo "email" nebo "adresu" — extrahuj je.
4. Pokud je v textu zmínka o ceně, dílu nebo datu — vlož do "contractData".
5. Vždy nastav "confidence" (0-1) podle toho, jak moc jsi si jistý.
6. Do "missingFields" vlož stringy s tím, co se nepodařilo najít (např. ["ico", "email"]).

Vrať POUZE validní JSON, bez markdown bloků.`;
}

export function buildParserUserPrompt(text: string, contractType: string): string {
  return `Typ smlouvy: ${contractType}

Text k analýze:
"""
${text}
"""

Extrahuj data podle instrukcí a vrať JSON.`;
}