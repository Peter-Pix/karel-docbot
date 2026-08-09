/**
 * Field validation with Czech legal compliance rules
 * Sources: Zákoník práce č. 262/2006 Sb., Občanský zákoník č. 89/2012 Sb.
 */

import { ContractType } from '../types';

export interface ValidationResult {
  error?: string | null;
  warning?: string | null;
  legalCitation?: string;
}

export function validateField(
  fieldKey: string,
  value: string,
  contractType?: ContractType,
  context?: Record<string, any>
): string | null {
  if (!value || value.trim() === '') return null;

  const trimmed = value.trim();

  // ── Money fields ──
  if (['smluvni_pokuta', 'vyska_najemneho', 'mzda', 'workPrice', 'vratna_kauce'].includes(fieldKey)) {
    const numMatch = trimmed.match(/(\d[\d\s]*)/);
    if (!numMatch) return 'Zadejte částku v korunách (např. "50 000 Kč")';
    const num = parseInt(numMatch[1].replace(/\s/g, ''), 10);
    if (isNaN(num)) return 'Neplatná částka';
    
    // Negative check
    if (trimmed.includes('-')) {
      return 'Částka nesmí být záporná';
    }
    
    // Unreasonably high amounts
    if (num > 10000000) return 'Částka se zdá nepřiměřeně vysoká';
    
    return null;
  }

  // ── Date fields ──
  if (['datum_zacatku', 'datum_nastupu', 'workDeadline'].includes(fieldKey)) {
    const datePattern = /^\d{1,2}\.\s*\d{1,2}\.\s*\d{4}$|^\d{1,2}\.\s*(ledna|února|únor|března|dubna|května|června|července|srpna|září|října|listopadu|prosince)\s+\d{4}$/i;
    if (!datePattern.test(trimmed)) {
      return 'Zadejte datum (např. "1. srpna 2026" nebo "1.8.2026")';
    }
    return null;
  }

  // ── Duration fields ──
  if (fieldKey === 'doba_platnosti') {
    if (/na věčné časy|bez omezení|navždy/i.test(trimmed)) {
      return 'Právně sporné ujednání — doporučuje se konkrétní doba (např. "3 roky")';
    }
    return null;
  }

  // ── Employment: Probation period (zákoník práce § 35) ──
  if (fieldKey === 'zkusebni_doba') {
    if (/([5-9]|1[0-9])\s*měsíc(ů|i)/i.test(trimmed)) {
      return 'Zkušební doba nesmí přesáhnout 3 měsíce (zákoník práce § 35). Pro vedoucí zaměstnance max. 8 měsíců.';
    }
    if (/6\s*měsíc(ů|i)/i.test(trimmed)) {
      return 'Zkušební doba nesmí přesáhnout 3 měsíce (zákoník práce § 35)';
    }
    if (/4\s*měsíc(ů|i)/i.test(trimmed)) {
      return '⚠️ Zkušební doba 4 měsíce je nad zákonný limit (3 měsíce). Pouze pro vedoucí zaměstnance lze sjednat až 8 měsíců.';
    }
    return null;
  }

  // ── Employment: Working hours (zákoník práce § 78–82) ──
  if (fieldKey === 'pracovni_doba') {
    const hoursMatch = trimmed.match(/(\d+)\s*(hodin|h|týdně|za týden)/i);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1], 10);
      if (hours > 40) {
        return 'Týdenní pracovní doba nesmí přesáhnout 40 hodin (zákoník práce § 78)';
      }
    }
    return null;
  }

  // ── Employment: Place of work ──
  if (fieldKey === 'misto_vykonu') {
    if (/celé území|celá ČR|celá EU|všech pracovišť/i.test(trimmed)) {
      return 'Místo výkonu práce musí být konkrétní (obec/městská část). Příliš široké určení může být neplatné.';
    }
    return null;
  }

  // ── Rent: Deposit (občanský zákoník § 2258) ──
  if (fieldKey === 'vratna_kauce') {
    const depositMatch = trimmed.match(/(\d[\d\s]*)/);
    const rentMatch = context?.vyska_najemneho?.match(/(\d[\d\s]*)/);
    
    if (depositMatch && rentMatch) {
      const deposit = parseInt(depositMatch[1].replace(/\s/g, ''), 10);
      const rent = parseInt(rentMatch[1].replace(/\s/g, ''), 10);
      
      if (deposit > rent * 3) {
        return `Kauce nesmí přesáhnout trojnásobek měsíčního nájmu (občanský zákoník § 2258). Max: ${rent * 3} Kč`;
      }
    }
    return null;
  }

  // ── Rent: Notice period (občanský zákoník § 2285–2290) ──
  if (fieldKey === 'vypovedni_lhuta') {
    if (/1\s*měsíc(ů|i)?/i.test(trimmed)) {
      return 'Výpovědní lhůta u nájmu bytu musí být min. 3 měsíce (občanský zákoník § 2285)';
    }
    if (/2\s*měsíc(ů|i)?/i.test(trimmed)) {
      return 'Výpovědní lhůta u nájmu bytu musí být min. 3 měsíce (občanský zákoník § 2285)';
    }
    return null;
  }

  // ── Work: Price required (občanský zákoník § 2607) ──
  if (fieldKey === 'workPrice') {
    if (trimmed === '0 Kč' || /cenu neuveden|neuvedeno/i.test(trimmed)) {
      return 'Smlouva o dílo musí obsahovat cenu díla (občanský zákoník § 2607)';
    }
    return null;
  }

  // ── Work: IP rights (občanský zákoník § 2620–2623) ──
  if (fieldKey === 'safeguardIP') {
    if (/žádné|bez převodu|zůstávají u zhotovitele/i.test(trimmed)) {
      return 'U smlouvy o dílo musí být explicitně řešen převod autorských práv (občanský zákoník § 2620)';
    }
    return null;
  }

  // ── Work: Penalty for delay (občanský zákoník § 2612) ──
  if (fieldKey === 'safeguardPenalty') {
    if (/žádné sankce|bez sankcí|není upraveno/i.test(trimmed)) {
      return 'Doporučuje se sjednat smluvní pokutu za prodlení (např. 0,5 % z ceny díla denně)';
    }
    return null;
  }

  // ── NDA: Duration ──
  if (fieldKey === 'doba_trvani' || fieldKey === 'smluvni_pokuta') {
    if (/na věčné časy|bez omezení|navždy/i.test(trimmed)) {
      return 'Závazek mlčenlivosti na věčné časy je právně sporný. Doporučuje se konkrétní doba (3–5 let).';
    }
    return null;
  }

  // ── NDA: Penalty amount ──
  if (fieldKey === 'smluvni_pokuta') {
    const numMatch = trimmed.match(/(\d[\d\s]*)/);
    if (numMatch) {
      const num = parseInt(numMatch[1].replace(/\s/g, ''), 10);
      if (num > 1000000) {
        return 'Smluvní pokuta > 1 000 000 Kč je nepřiměřeně vysoká a soud ji může snížit (§ 2051 občanského zákoníku)';
      }
      if (num > 500000) {
        return '⚠️ Smluvní pokuta > 500 000 Kč může být považována za nepřiměřenou';
      }
    }
    return null;
  }

  // ── NDA: Jurisdiction ──
  if (fieldKey === 'rozhodne_pravo') {
    if (/Čínská lidová republika|Čína|Rusko|Bělorusko/i.test(trimmed)) {
      return 'Zahraniční jurisdikce mimo EU je extrémně riziková pro české subjekty. Doporučuje se české právo.';
    }
    if (/cizí|zahraniční/i.test(trimmed)) {
      return 'Varování: Zahraniční jurisdikce může být nevýhodná. Doporučuje se české právo.';
    }
    return null;
  }

  // ── Text length ──
  if (trimmed.length > 500) {
    return 'Text je příliš dlouhý (max 500 znaků)';
  }

  return null;
}

export function getLegalCitation(fieldKey: string): string | undefined {
  const citations: Record<string, string> = {
    zkusebni_doba: 'zákoník práce § 35',
    pracovni_doba: 'zákoník práce § 78–82',
    misto_vykonu: 'zákoník práce § 34',
    vypovedni_lhuta: 'zákoník práce § 51–52 (zaměstnání) | občanský zákoník § 2285 (nájem)',
    vratna_kauce: 'občanský zákoník § 2258',
    workPrice: 'občanský zákoník § 2607',
    safeguardIP: 'občanský zákoník § 2620–2623',
    safeguardPenalty: 'občanský zákoník § 2612',
    smluvni_pokuta: 'občanský zákoník § 2048–2051',
    rozhodne_pravo: 'občanský zákoník § 1798–1804',
  };
  return citations[fieldKey];
}
