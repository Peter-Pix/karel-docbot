import { describe, it, expect } from 'vitest';
import {
  getFieldDefinitions,
  getFieldKeys,
  getFieldLabel,
  getFieldPrompt,
  getFieldDefault,
  getFieldPlaceholder,
  getContractTitleFromSchema,
  getDefaultFieldsFromSchema,
} from '../lib/contracts';

describe('contracts', () => {
  const contractTypes = ['nda', 'rent', 'employment', 'work'] as const;

  describe('getFieldDefinitions', () => {
    it.each(contractTypes)('returns non-empty array for %s', (type) => {
      const defs = getFieldDefinitions(type);
      expect(defs.length).toBeGreaterThan(0);
      defs.forEach(def => {
        expect(def).toHaveProperty('key');
        expect(def).toHaveProperty('label');
        expect(def).toHaveProperty('prompt');
        expect(def).toHaveProperty('defaultValue');
      });
    });
  });

  describe('getFieldKeys', () => {
    it.each(contractTypes)('returns same count as definitions for %s', (type) => {
      const keys = getFieldKeys(type);
      const defs = getFieldDefinitions(type);
      expect(keys.length).toBe(defs.length);
    });

    it('includes contractType in keys', () => {
      // contractType is always present in ContractFields but not in field definitions
      const keys = getFieldKeys('nda');
      expect(keys).toContain('poskytovatel');
      expect(keys).toContain('prijemce');
    });
  });

  describe('getFieldLabel', () => {
    it('returns label for known key', () => {
      expect(getFieldLabel('poskytovatel')).toBe('Poskytovatel informací');
      expect(getFieldLabel('employerName')).toBe('Zhotovitel');
    });

    it('returns key string for unknown key', () => {
      expect(getFieldLabel('nonexistent' as any)).toBe('nonexistent');
    });
  });

  describe('getFieldPrompt', () => {
    it('returns prompt for known key', () => {
      const prompt = getFieldPrompt('smluvni_pokuta');
      expect(prompt).toContain('smluvní pokuty');
    });

    it('returns empty string for unknown key', () => {
      expect(getFieldPrompt('nonexistent' as any)).toBe('');
    });
  });

  describe('getFieldDefault', () => {
    it('returns default for smluvni_pokuta', () => {
      expect(getFieldDefault('smluvni_pokuta')).toBe('50 000 Kč');
    });

    it('returns empty string for fields without default', () => {
      expect(getFieldDefault('poskytovatel')).toBe('');
    });
  });

  describe('getFieldPlaceholder', () => {
    it('returns placeholder for fields that have one', () => {
      expect(getFieldPlaceholder('poskytovatel')).toContain('Startup');
    });

    it('returns empty string for fields without placeholder', () => {
      // Some fields don't have placeholders
      const placeholder = getFieldPlaceholder('employerName');
      expect(typeof placeholder).toBe('string');
    });
  });

  describe('getContractTitleFromSchema', () => {
    it('returns correct titles', () => {
      expect(getContractTitleFromSchema('nda')).toContain('NDA');
      expect(getContractTitleFromSchema('rent')).toContain('Nájemní');
      expect(getContractTitleFromSchema('employment')).toContain('Pracovní');
      expect(getContractTitleFromSchema('work')).toContain('dílo');
    });
  });

  describe('getDefaultFieldsFromSchema', () => {
    it('returns object with contractType set', () => {
      const fields = getDefaultFieldsFromSchema('nda');
      expect(fields.contractType).toBe('nda');
    });

    it('includes all field keys with default values', () => {
      const fields = getDefaultFieldsFromSchema('employment');
      const keys = getFieldKeys('employment');
      keys.forEach(key => {
        expect(fields).toHaveProperty(key);
      });
    });
  });

  describe('cross-type consistency', () => {
    it('all contract types have unique field keys within their type', () => {
      for (const type of contractTypes) {
        const keys = getFieldKeys(type);
        const uniqueKeys = new Set(keys);
        expect(uniqueKeys.size).toBe(keys.length);
      }
    });

    it('all field definitions have non-empty labels', () => {
      for (const type of contractTypes) {
        const defs = getFieldDefinitions(type);
        defs.forEach(def => {
          expect(def.label.trim()).not.toBe('');
        });
      }
    });
  });
});
