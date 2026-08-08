import { describe, it, expect } from 'vitest';
import { validateField } from '../lib/validation';

describe('validateField', () => {
  describe('money fields', () => {
    it('accepts valid Czech format', () => {
      expect(validateField('smluvni_pokuta', '50 000 Kč')).toBeNull();
      expect(validateField('vyska_najemneho', '15 000 Kč')).toBeNull();
      expect(validateField('mzda', '45000')).toBeNull();
    });

    it('accepts negative sign as part of text (regex extracts positive number)', () => {
      expect(validateField('smluvni_pokuta', '-5000 Kč')).toBeNull();
    });

    it('warns on unreasonably high amounts', () => {
      expect(validateField('smluvni_pokuta', '50 000 000 Kč')).toBe('Částka se zdá nepřiměřeně vysoká');
    });

    it('returns null for empty value', () => {
      expect(validateField('smluvni_pokuta', '')).toBeNull();
      expect(validateField('smluvni_pokuta', '   ')).toBeNull();
    });
  });

  describe('date fields', () => {
    it('accepts Czech date format with month name', () => {
      expect(validateField('datum_zacatku', '1. srpna 2026')).toBeNull();
    });

    it('accepts numeric date format', () => {
      expect(validateField('datum_nastupu', '1.8.2026')).toBeNull();
    });

    it('rejects invalid date format', () => {
      const result = validateField('datum_zacatku', 'zítra');
      expect(result).toBe('Zadejte datum (např. "1. srpna 2026" nebo "1.8.2026")');
    });
  });

  describe('duration fields', () => {
    it('warns on eternal duration', () => {
      const result = validateField('doba_platnosti', 'na věčné časy');
      expect(result).toContain('právně sporné');
    });

    it('accepts normal duration', () => {
      expect(validateField('doba_platnosti', '3 roky')).toBeNull();
    });
  });

  describe('notice period (rent)', () => {
    it('rejects less than 3 months', () => {
      const result = validateField('vypovedni_lhuta', '1 měsíc');
      expect(result).toBe('Výpovědní lhůta u nájmu bytu musí být min. 3 měsíce');
    });

    it('accepts 3 months', () => {
      expect(validateField('vypovedni_lhuta', '3 měsíce')).toBeNull();
    });
  });

  describe('probation period (employment)', () => {
    it('rejects more than 3 months', () => {
      const result = validateField('zkusebni_doba', '6 měsíců');
      expect(result).toBe('Zkušební doba nesmí přesáhnout 3 měsíce (zákoník práce)');
    });

    it('accepts 3 months', () => {
      expect(validateField('zkusebni_doba', '3 měsíce')).toBeNull();
    });
  });

  describe('working hours', () => {
    it('rejects more than 40 hours', () => {
      const result = validateField('pracovni_doba', '55 hodin týdně');
      expect(result).toBe('Týdenní pracovní doba nesmí přesáhnout 40 hodin (zákoník práce)');
    });

    it('accepts 40 hours', () => {
      expect(validateField('pracovni_doba', '40 hodin týdně')).toBeNull();
    });
  });

  describe('jurisdiction', () => {
    it('warns on foreign jurisdiction', () => {
      const result = validateField('rozhodne_pravo', 'Čínská lidová republika');
      expect(result).toContain('Zahraniční');
    });

    it('accepts Czech jurisdiction', () => {
      expect(validateField('rozhodne_pravo', 'Česká republika')).toBeNull();
    });
  });

  describe('text length', () => {
    it('rejects text over 500 chars', () => {
      const longText = 'a'.repeat(501);
      expect(validateField('poskytovatel', longText)).toBe('Text je příliš dlouhý (max 500 znaků)');
    });

    it('accepts text under 500 chars', () => {
      expect(validateField('poskytovatel', 'a'.repeat(500))).toBeNull();
    });
  });
});
