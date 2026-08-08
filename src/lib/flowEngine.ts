// src/lib/flowEngine.ts
// Adaptivní Flow Engine — srdce nového UX.
// Místo rigidního formuláře řídí konverzaci s uživatelem.
// Každý krok je nezávislý blok, který se umí přeskočit, pokud uživatel
// data poskytl (Ctrl+V, fotka, vyplněná entita v minulosti).

import { ContractType } from '../types';
import {
  EntityStore,
  MyProfile,
  Counterparty,
  WorkTemplate,
  ParsedEntityData,
} from './entities';

// ──────────────────────────────────────────────────────────────────────────
// FLOW STEPS: Co musí uživatel vyřešit pro daný typ smlouvy
// ──────────────────────────────────────────────────────────────────────────

export type FlowStepId =
  | 'intro'
  | 'identify_me'
  | 'identify_counterparty'
  | 'select_counterparty'
  | 'work_subject'
  | 'work_template'
  | 'work_details'
  | 'pricing'
  | 'safeguards'
  | 'preview'
  | 'export';

export interface FlowStep {
  id: FlowStepId;
  label: string;
  question: string; // Co se zobrazí jako hlavní otázka
  helper?: string; // Krátký hint pod otázkou
  estimatedSeconds: number; // Pro ETA progress baru
  canSkip: boolean; // Může být přeskočen pokud data existují
  required: boolean; // Musí být dokončen před exportem
}

// Definice kroků pro Smlouvu o dílo (work)
const WORK_STEPS: FlowStep[] = [
  {
    id: 'intro',
    label: 'Úvod',
    question: 'Připravíme smlouvu o dílo.',
    helper: 'Začněme tím nejjednodušším — daty.',
    estimatedSeconds: 5,
    canSkip: false,
    required: false,
  },
  {
    id: 'identify_me',
    label: 'Kdo jsem já',
    question: 'Nejdřív tvoje údaje.',
    helper: 'Aplikace si je pamatuje — vyplníš je jen poprvé.',
    estimatedSeconds: 30,
    canSkip: true,
    required: true,
  },
  {
    id: 'identify_counterparty',
    label: 'Komu to dělám',
    question: 'S kým uzavíráme smlouvu?',
    helper: 'Můžeš vybrat ze seznamu, vložit blok textu, nebo vyfotit vizitku.',
    estimatedSeconds: 30,
    canSkip: true,
    required: true,
  },
  {
    id: 'work_template',
    label: 'Co děláme',
    question: 'Jaký typ díla to je?',
    helper: 'Pokud to děláš opakovaně, najdeš tu šablonu.',
    estimatedSeconds: 20,
    canSkip: true,
    required: true,
  },
  {
    id: 'work_details',
    label: 'Detaily díla',
    question: 'Co přesně budeš dělat a do kdy?',
    helper: 'Detailní popis a termín dokončení.',
    estimatedSeconds: 60,
    canSkip: false,
    required: true,
  },
  {
    id: 'pricing',
    label: 'Cena a platba',
    question: 'Kolik to stojí a jak se platí?',
    helper: 'Částka, DPH, splatnost.',
    estimatedSeconds: 30,
    canSkip: false,
    required: true,
  },
  {
    id: 'safeguards',
    label: 'Klid v duši',
    question: 'Co chceš mít ošetřené?',
    helper: 'Autorská práva, sankce, mlčenlivost — vše na jedno kliknutí.',
    estimatedSeconds: 15,
    canSkip: true,
    required: true,
  },
  {
    id: 'preview',
    label: 'Kontrola',
    question: 'Vše je připraveno.',
    helper: 'Mrkni na preview a potvrď.',
    estimatedSeconds: 15,
    canSkip: false,
    required: true,
  },
  {
    id: 'export',
    label: 'Hotovo',
    question: 'Smlouva je hotová.',
    helper: 'Stáhni si ji.',
    estimatedSeconds: 5,
    canSkip: false,
    required: true,
  },
];

export function getStepsForContract(type: ContractType): FlowStep[] {
  // Pro NDA a Rent později přidáme specializované kroky
  return WORK_STEPS;
}

// ──────────────────────────────────────────────────────────────────────────
// STATE: Aktuální stav flow
// ──────────────────────────────────────────────────────────────────────────

export interface FlowState {
  currentStep: FlowStepId;
  completedSteps: FlowStepId[];
  skippedSteps: FlowStepId[];
  startedAt: number;
  estimatedTotalSeconds: number;
  estimatedRemainingSeconds: number;
}

export function createInitialFlowState(contractType: ContractType): FlowState {
  const steps = getStepsForContract(contractType);
  const total = steps.reduce((sum, s) => sum + s.estimatedSeconds, 0);

  return {
    currentStep: 'intro',
    completedSteps: [],
    skippedSteps: [],
    startedAt: Date.now(),
    estimatedTotalSeconds: total,
    estimatedRemainingSeconds: total,
  };
}

export function advanceFlow(
  state: FlowState,
  contractType: ContractType,
  store: EntityStore
): FlowState {
  const steps = getStepsForContract(contractType);
  const currentIdx = steps.findIndex(s => s.id === state.currentStep);
  if (currentIdx === -1) return state;

  const current = steps[currentIdx];
  const completed = [...state.completedSteps, current.id];

  // Najdi další krok, který NENÍ hotový a NENÍ přeskočený
  let nextIdx = currentIdx + 1;
  while (nextIdx < steps.length) {
    const next = steps[nextIdx];
    if (!completed.includes(next.id) && !state.skippedSteps.includes(next.id)) {
      break;
    }
    nextIdx++;
  }

  // Pokud jsme na konci, zůstaň
  if (nextIdx >= steps.length) {
    return {
      ...state,
      completedSteps: completed,
      estimatedRemainingSeconds: 0,
    };
  }

  // Přepočítej ETA
  const remaining = steps.slice(nextIdx).reduce((sum, s) => sum + s.estimatedSeconds, 0);

  return {
    ...state,
    currentStep: steps[nextIdx].id,
    completedSteps: completed,
    estimatedRemainingSeconds: remaining,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// COMPUTED: Které kroky můžeme přeskočit na základě dostupných dat
// ──────────────────────────────────────────────────────────────────────────

export function computeAutoSkips(
  store: EntityStore,
  contractType: ContractType
): FlowStepId[] {
  const skips: FlowStepId[] = [];

  // Pokud mám kompletní profil → přeskoč identify_me
  if (store.myProfile?.isComplete) {
    skips.push('identify_me');
  }

  // Pokud mám uložené klienty → nabídni rychlý výběr, ale nepřeskakuj úplně
  // (chceme aby uživatel aktivně zvolil koho)

  return skips;
}

// ──────────────────────────────────────────────────────────────────────────
// PARSER: Aplikuj AI-parsovaná data na flow
// ──────────────────────────────────────────────────────────────────────────

export interface ApplyParseResult {
  updatedStore: EntityStore;
  autoCompletedSteps: FlowStepId[];
  needsUserConfirmation: ParsedEntityData;
}

export function applyParsedData(
  store: EntityStore,
  parsed: ParsedEntityData
): ApplyParseResult {
  const updated: EntityStore = {
    ...store,
    counterparties: [...store.counterparties],
    workTemplates: [...store.workTemplates],
  };
  const autoCompleted: FlowStepId[] = [];

  // 1. Aktualizovat profil (pokud má complete data)
  if (parsed.myProfile) {
    const current = updated.myProfile ?? {
      id: 'me' as const,
      fullName: '',
      street: '',
      city: '',
      zip: '',
      bankAccount: '',
      email: '',
      isComplete: false,
      lastUpdated: new Date().toISOString(),
    };
    updated.myProfile = { ...current, ...parsed.myProfile };
    // Označ jako kompletní pokud máme klíčové údaje
    const filled = updated.myProfile;
    if (filled.fullName && filled.email && (filled.ico || filled.bankAccount)) {
      filled.isComplete = true;
      autoCompleted.push('identify_me');
    }
  }

  // 2. Přidat protistranu
  if (parsed.counterparty && parsed.counterparty.fullName) {
    const newCp: Counterparty = {
      id: `cp_${Date.now()}`,
      label: parsed.counterparty.label || parsed.counterparty.fullName,
      fullName: parsed.counterparty.fullName,
      street: parsed.counterparty.street ?? '',
      city: parsed.counterparty.city ?? '',
      zip: parsed.counterparty.zip ?? '',
      bankAccount: parsed.counterparty.bankAccount ?? '',
      ico: parsed.counterparty.ico,
      dic: parsed.counterparty.dic,
      businessName: parsed.counterparty.businessName,
      email: parsed.counterparty.email,
      phone: parsed.counterparty.phone,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      useCount: 1,
    };
    updated.counterparties.push(newCp);
    autoCompleted.push('identify_counterparty');
  }

  return {
    updatedStore: updated,
    autoCompletedSteps: autoCompleted,
    needsUserConfirmation: parsed,
  };
}