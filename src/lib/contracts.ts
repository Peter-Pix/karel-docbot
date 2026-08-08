/**
 * Client-side re-export of shared contract definitions.
 * 
 * Single source of truth lives in shared/contracts.ts.
 * This file adds client-specific helpers (React-friendly, type-safe wrappers).
 */

import { ContractType, ContractFields } from '../types';
import {
  SCHEMAS,
  TITLES,
  ADVICE_DICT,
  FieldDefinition,
  getFieldsForType,
  getFieldKeys as sharedGetFieldKeys,
  getTitle as sharedGetTitle,
  getAdvice,
} from '../../shared/contracts';

// Re-export for convenience
export type { FieldDefinition };
export { SCHEMAS, TITLES, ADVICE_DICT, getFieldsForType, getAdvice };

// ─── Accessor Functions ───────────────────────────────────────────

/** Get all field definitions for a contract type */
export function getFieldDefinitions(type: ContractType): FieldDefinition[] {
  return getFieldsForType(type);
}

/** Get all field keys for a contract type (for progress tracking, validation, etc.) */
export function getFieldKeys(type: ContractType): (keyof ContractFields)[] {
  return sharedGetFieldKeys(type) as (keyof ContractFields)[];
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
  return sharedGetTitle(type);
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
  return { ...ADVICE_DICT };
}
