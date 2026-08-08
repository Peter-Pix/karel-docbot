/**
 * Basic field validation for contract inputs.
 * 
 * Validates formats and reasonable ranges without being overly strict.
 * Returns null for valid values, or an error message string for invalid ones.
 */

type ValidationResult = string | null;

/** Validate a single field value based on its key */
export function validateField(key: string, value: string): ValidationResult {
  const trimmed = value.trim();
  
  if (!trimmed) return null; // Empty is OK (optional validation handled at form level)

  switch (key) {
    // ── Money fields ──
    case 'smluvni_pokuta':
    case 'vyska_najemneho':
    case 'poplatky_sluzby':
    case 'vratna_kauce':
    case 'mzda': {
      // Allow Czech format: "50 000 Kč", "15 000 Kč", or just numbers
      const numMatch = trimmed.match(/(\d[\d\s]*)/);
      if (!numMatch) return 'Zadejte částku v korunách (např. "50 000 Kč")';
      const num = parseInt(numMatch[1].replace(/\s/g, ''), 10);
      if (isNaN(num) || num < 0) return 'Částka nesmí být záporná';
      if (num > 10000000) return 'Částka se zdá nepřiměřeně vysoká';
      return null;
    }

    // ── Date fields ──
    case 'datum_zacatku':
    case 'datum_nastupu': {
      // Accept Czech date formats: "1. srpna 2026", "1.8.2026", "1. 8. 2026"
      const datePattern = /^\d{1,2}\.\s*\d{1,2}\.\s*\d{4}$|^\d{1,2}\.\s*(ledna|února|únor|března|dubna|května|června|července|srpna|září|října|listopadu|prosince)\s+\d{4}$/i;
      if (!datePattern.test(trimmed)) {
        return 'Zadejte datum (např. "1. srpna 2026" nebo "1.8.2026")';
      }
      return null;
    }

    // ── Duration fields ──
    case 'doba_platnosti': {
      if (/věč|nekoneč/i.test(trimmed)) {
        return 'Varování: "Na věčné časy" je právně sporné (doporučeno max 5 let)';
      }
      return null;
    }

    case 'vypovedni_lhuta': {
      // For rent: should be at least 3 months
      const monthMatch = trimmed.match(/(\d+)\s*měs/);
      if (monthMatch) {
        const months = parseInt(monthMatch[1], 10);
        if (months < 3) return 'Výpovědní lhůta u nájmu bytu musí být min. 3 měsíce';
      }
      return null;
    }

    case 'zkusebni_doba': {
      const monthMatch = trimmed.match(/(\d+)\s*měs/);
      if (monthMatch) {
        const months = parseInt(monthMatch[1], 10);
        if (months > 3) return 'Zkušební doba nesmí přesáhnout 3 měsíce (zákoník práce)';
      }
      return null;
    }

    case 'pracovni_doba': {
      const hourMatch = trimmed.match(/(\d+)\s*hod/);
      if (hourMatch) {
        const hours = parseInt(hourMatch[1], 10);
        if (hours > 40) return 'Týdenní pracovní doba nesmí přesáhnout 40 hodin (zákoník práce)';
      }
      return null;
    }

    // ── Jurisdiction ──
    case 'rozhodne_pravo': {
      if (/čín|china|peking|beijing/i.test(trimmed)) {
        return 'Varování: Zahraniční jurisdikce může být riziková pro české subjekty';
      }
      return null;
    }

    // ── Text fields (names, addresses, descriptions) ──
    default:
      if (trimmed.length > 500) return 'Text je příliš dlouhý (max 500 znaků)';
      return null;
  }
}

/** Validate all fields for a contract type, return map of key -> error */
export function validateAllFields(
  fieldKeys: string[],
  fields: Record<string, string>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const key of fieldKeys) {
    const error = validateField(key, fields[key] || '');
    if (error) errors[key] = error;
  }
  return errors;
}