// src/components/AdaptiveFlowWizard.tsx
// Nový adaptivní průvodce, který řídí celou cestu uživatele.
// Pravidlo: Uživatel vždycky ví, kde je, co se po něm chce, a za jak dlouho bude hotovo.

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Clock,
  Zap,
  User,
  Building2,
  Hammer,
  Calendar,
  DollarSign,
  ShieldCheck,
  Eye,
  Download,
} from 'lucide-react';
import { ContractType } from '../types';
import { useEntityStore } from '../lib/useEntityStore';
import {
  FlowStepId,
  FlowStep,
  getStepsForContract,
  createInitialFlowState,
  advanceFlow,
  computeAutoSkips,
  applyParsedData,
} from '../lib/flowEngine';
import {
  Counterparty,
  WorkTemplate,
  MyProfile,
  ParsedEntityData,
} from '../lib/entities';
import { SmartEntryPanel } from './SmartEntryPanel';

interface AdaptiveFlowWizardProps {
  contractType: ContractType;
  // Callbacky pro plnění fields do App.tsx (kvůli preview)
  onFieldsUpdate: (updates: Record<string, string>) => void;
  currentFields: Record<string, string>;
  onClose: () => void;
}

// Mapování flow steps na ContractFields klíče
// (Abychom mohli plnit smlouvu z flow)
const STEP_TO_FIELDS: Record<FlowStepId, string[]> = {
  intro: [],
  identify_me: [], // aktualizuje myProfile, ne contract fields
  identify_counterparty: [], // aktualizuje counterparty entitu
  select_counterparty: [],
  work_subject: ['predmet_dila'],
  work_template: [],
  work_details: ['predmet_dila', 'termin_plneni'],
  pricing: ['cena', 'datum_platby'],
  safeguards: ['autorska_prava', 'smluvni_pokuta'],
  preview: [],
  export: [],
};

export function AdaptiveFlowWizard({
  contractType,
  onFieldsUpdate,
  currentFields,
  onClose,
}: AdaptiveFlowWizardProps) {
  const entityStore = useEntityStore();
  const [flowState, setFlowState] = useState(() => createInitialFlowState(contractType));
  const [currentEntityDraft, setCurrentEntityDraft] = useState<{
    mode: 'me' | 'counterparty';
    data: ParsedEntityData | null;
  } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkTemplate | null>(null);
  const [selectedCounterparty, setSelectedCounterparty] = useState<Counterparty | null>(null);

  const steps = useMemo(() => getStepsForContract(contractType), [contractType]);
  const currentStepDef = steps.find((s) => s.id === flowState.currentStep) ?? steps[0];

  // Progress
  const progress = useMemo(() => {
    const completed = flowState.completedSteps.length;
    const total = steps.filter((s) => s.required).length;
    return Math.min(100, (completed / total) * 100);
  }, [flowState.completedSteps, steps]);

  const etaMinutes = Math.ceil(flowState.estimatedRemainingSeconds / 60);

  // ── Přeskoč krok: identify_me pokud mám profil
  useEffect(() => {
    if (!entityStore.isLoaded) return;
    const autoSkips = computeAutoSkips(entityStore.store!, contractType);
    if (autoSkips.length > 0) {
      setFlowState((s) => ({
        ...s,
        skippedSteps: [...new Set([...s.skippedSteps, ...autoSkips])],
      }));
    }
  }, [entityStore.isLoaded, contractType]);

  // ── Advance po dokončení kroku
  const handleStepComplete = useCallback(() => {
    setFlowState((s) => advanceFlow(s, contractType, entityStore.store!));
  }, [contractType, entityStore.store]);

  // ── Smart entry confirm handler
  const handleEntityConfirm = useCallback(
    (parsed: ParsedEntityData) => {
      if (!currentEntityDraft) return;
      const result = applyParsedData(entityStore.store!, parsed);

      // Ulož změny do storage
      if (currentEntityDraft.mode === 'me' && result.updatedStore.myProfile) {
        entityStore.saveProfile(result.updatedStore.myProfile);
      }
      if (currentEntityDraft.mode === 'counterparty' && result.updatedStore.counterparties.length > 0) {
        const lastCp = result.updatedStore.counterparties[result.updatedStore.counterparties.length - 1];
        entityStore.saveCounterparty(lastCp);
        setSelectedCounterparty(lastCp);
      }

      setCurrentEntityDraft(null);
      handleStepComplete();
    },
    [currentEntityDraft, entityStore, handleStepComplete]
  );

  // ── Quick select existing counterparty
  const handleSelectExistingCp = useCallback(
    (cp: Counterparty) => {
      setSelectedCounterparty(cp);
      entityStore.useCounterparty(cp.id);
      // Přepni fields smlouvy na tohoto klienta
      onFieldsUpdate({
        klient_jmeno: cp.fullName,
        klient_firma: cp.businessName || '',
        klient_ico: cp.ico || '',
        klient_adresa: `${cp.street}, ${cp.city} ${cp.zip}`.trim(),
        klient_bankovni_ucet: cp.bankAccount || '',
      });
      setCurrentEntityDraft(null);
      handleStepComplete();
    },
    [entityStore, onFieldsUpdate, handleStepComplete]
  );

  // ── Apply template
  const handleSelectTemplate = useCallback(
    (tpl: WorkTemplate) => {
      setSelectedTemplate(tpl);
      entityStore.useTemplate(tpl.id);
      onFieldsUpdate({
        predmet_dila: tpl.description,
        cena: tpl.defaultPrice?.toString() || '',
      });
      handleStepComplete();
    },
    [entityStore, onFieldsUpdate, handleStepComplete]
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', height: '700px' }}
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
      >
        {/* Top Bar — Progress + ETA */}
        <div className="border-b border-zinc-800 bg-zinc-900/50">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h1 className="text-base font-medium text-zinc-100">
                  {stepTitle(contractType)}
                </h1>
                <p className="text-xs text-zinc-500">
                  Krok {flowState.completedSteps.length + 1} z {steps.length}
                  {etaMinutes > 0 && (
                    <>
                      <span className="mx-2">·</span>
                      <Clock className="w-3 h-3 inline mr-1" />
                      ~{etaMinutes} min
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-zinc-900 relative overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={flowState.currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              <StepContent
                step={currentStepDef}
                entityStore={entityStore}
                currentEntityDraft={currentEntityDraft}
                setCurrentEntityDraft={setCurrentEntityDraft}
                onEntityConfirm={handleEntityConfirm}
                onSelectExistingCp={handleSelectExistingCp}
                onSelectTemplate={handleSelectTemplate}
                selectedTemplate={selectedTemplate}
                selectedCounterparty={selectedCounterparty}
                currentFields={currentFields}
                onFieldsUpdate={onFieldsUpdate}
                onContinue={handleStepComplete}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom nav */}
        <div className="border-t border-zinc-800 px-6 py-3 flex items-center justify-between bg-zinc-900/30">
          <button
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Zpět na starý režim
          </button>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
            Adaptive Flow · {flowState.completedSteps.length} hotovo
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// STEP CONTENT ROUTER
// ──────────────────────────────────────────────────────────────────────────

interface StepContentProps {
  step: FlowStep;
  entityStore: ReturnType<typeof useEntityStore>;
  currentEntityDraft: { mode: 'me' | 'counterparty'; data: ParsedEntityData | null } | null;
  setCurrentEntityDraft: (draft: { mode: 'me' | 'counterparty'; data: ParsedEntityData | null } | null) => void;
  onEntityConfirm: (parsed: ParsedEntityData) => void;
  onSelectExistingCp: (cp: Counterparty) => void;
  onSelectTemplate: (tpl: WorkTemplate) => void;
  selectedTemplate: WorkTemplate | null;
  selectedCounterparty: Counterparty | null;
  currentFields: Record<string, string>;
  onFieldsUpdate: (updates: Record<string, string>) => void;
  onContinue: () => void;
}

function StepContent(props: StepContentProps) {
  const { step, entityStore, setCurrentEntityDraft, currentEntityDraft } = props;

  if (currentEntityDraft) {
    // SmartEntryPanel pro rozpracovaný entitní draft
    const isMe = currentEntityDraft.mode === 'me';
    return (
      <SmartEntryPanel
        mode={currentEntityDraft.mode}
        recentItems={isMe ? [] : entityStore.store?.counterparties || []}
        onSelectRecent={props.onSelectExistingCp}
        onConfirm={props.onEntityConfirm}
        onCancel={() => setCurrentEntityDraft(null)}
      />
    );
  }

  switch (step.id) {
    case 'intro':
      return <IntroStep onContinue={props.onContinue} />;

    case 'identify_me':
      return (
        <IdentifyMeStep
          hasProfile={Boolean(entityStore.store?.myProfile?.isComplete)}
          onFill={() => setCurrentEntityDraft({ mode: 'me', data: null })}
          onContinue={props.onContinue}
        />
      );

    case 'identify_counterparty':
      return (
        <IdentifyCounterpartyStep
          existingCount={entityStore.store?.counterparties.length || 0}
          topClients={
            (entityStore.store?.counterparties || [])
              .sort((a, b) => (b.useCount || 0) - (a.useCount || 0))
              .slice(0, 3) || []
          }
          onSelectExisting={props.onSelectExistingCp}
          onAddNew={() => setCurrentEntityDraft({ mode: 'counterparty', data: null })}
          onContinue={props.onContinue}
        />
      );

    case 'work_template':
      return (
        <WorkTemplateStep
          templates={entityStore.store?.workTemplates || []}
          onSelect={props.onSelectTemplate}
          onSkip={props.onContinue}
        />
      );

    case 'work_details':
      return (
        <WorkDetailsStep
          currentFields={props.currentFields}
          onUpdate={props.onFieldsUpdate}
          onContinue={props.onContinue}
        />
      );

    case 'pricing':
      return (
        <PricingStep
          currentFields={props.currentFields}
          onUpdate={props.onFieldsUpdate}
          onContinue={props.onContinue}
        />
      );

    case 'safeguards':
      return (
        <SafeguardsStep
          onContinue={props.onContinue}
        />
      );

    case 'preview':
      return (
        <PreviewStep
          contractType={props.currentFields.contractType as ContractType}
          fields={props.currentFields}
          onContinue={props.onContinue}
        />
      );

    case 'export':
      return <ExportStep />;

    default:
      return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// INDIVIDUAL STEPS — Každý krok je jednoduchá komponenta
// ──────────────────────────────────────────────────────────────────────────

function IntroStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-6"
      >
        <Zap className="w-10 h-10 text-zinc-950" />
      </motion.div>
      <h2 className="text-2xl font-light text-zinc-100 mb-3">Pojďme na to.</h2>
      <p className="text-zinc-400 max-w-md mb-8">
        Připravíme smlouvu o dílo. Appka si pamatuje tvoje údaje, takže to bude rychlé.
      </p>
      <button
        onClick={onContinue}
        className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-medium flex items-center gap-2 transition-colors"
      >
        Začít
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function IdentifyMeStep({
  hasProfile,
  onFill,
  onContinue,
}: {
  hasProfile: boolean;
  onFill: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="h-full flex flex-col p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-light text-zinc-100 mb-2">Tvoje údaje</h2>
      <p className="text-zinc-500 mb-8">
        {hasProfile ? 'Mám je uložené. Stačí potvrdit.' : 'Vyplň je jednou, appka si je pamatuje.'}
      </p>

      <div className="space-y-3 flex-1">
        <button
          onClick={onFill}
          className="w-full p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-left transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <User className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-zinc-100 font-medium">
                {hasProfile ? 'Upravit moje údaje' : 'Vyplnit mé údaje'}
              </p>
              <p className="text-xs text-zinc-500">
                Ctrl+V z dokumentu, nebo foto vizitky
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </div>
        </button>

        {hasProfile && (
          <button
            onClick={onContinue}
            className="w-full p-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Check className="w-4 h-4" />
            Údaje sedí, pokračovat
          </button>
        )}
      </div>
    </div>
  );
}

function IdentifyCounterpartyStep({
  existingCount,
  topClients,
  onSelectExisting,
  onAddNew,
  onContinue,
}: {
  existingCount: number;
  topClients: Counterparty[];
  onSelectExisting: (cp: Counterparty) => void;
  onAddNew: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="h-full flex flex-col p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-light text-zinc-100 mb-2">S kým to uzavíráme?</h2>
      <p className="text-zinc-500 mb-6">
        {existingCount > 0
          ? `Mám ${existingCount} uložených klientů.`
          : 'Zatím nemám žádné klienty uložené.'}
      </p>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {topClients.map((cp) => (
          <button
            key={cp.id}
            onClick={() => onSelectExisting(cp)}
            className="w-full p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-left flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-zinc-100">{cp.label}</p>
              <p className="text-xs text-zinc-500">{cp.businessName || cp.fullName}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
          </button>
        ))}

        <button
          onClick={onAddNew}
          className="w-full p-4 bg-zinc-900 hover:bg-zinc-800 border-2 border-dashed border-zinc-800 hover:border-cyan-500/40 rounded-xl text-left transition-colors"
        >
          <p className="text-sm text-zinc-100 font-medium">+ Přidat nového klienta</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Ctrl+V, foto vizitky, nebo URL webu
          </p>
        </button>
      </div>

      {existingCount === 0 && (
        <button
          onClick={onContinue}
          className="text-xs text-zinc-500 hover:text-zinc-300 underline mt-4 self-center"
        >
          Přeskočit, vyplním později
        </button>
      )}
    </div>
  );
}

function WorkTemplateStep({
  templates,
  onSelect,
  onSkip,
}: {
  templates: WorkTemplate[];
  onSelect: (tpl: WorkTemplate) => void;
  onSkip: () => void;
}) {
  return (
    <div className="h-full flex flex-col p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-light text-zinc-100 mb-2">Co děláme?</h2>
      <p className="text-zinc-500 mb-6">
        Pokud to děláš opakovaně, vyber šablonu. Ušetří čas.
      </p>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl)}
            className="w-full p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mt-0.5">
                <Hammer className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-zinc-100 font-medium">{tpl.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{tpl.description}</p>
                {tpl.defaultPrice && (
                  <p className="text-xs text-amber-400 mt-1.5">
                    ~{tpl.defaultPrice.toLocaleString('cs-CZ')} Kč
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onSkip}
        className="text-xs text-zinc-500 hover:text-zinc-300 underline mt-4 self-center"
      >
        Popsat ručně
      </button>
    </div>
  );
}

function WorkDetailsStep({
  currentFields,
  onUpdate,
  onContinue,
}: {
  currentFields: Record<string, string>;
  onUpdate: (updates: Record<string, string>) => void;
  onContinue: () => void;
}) {
  return (
    <div className="h-full flex flex-col p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-light text-zinc-100 mb-2">Co přesně a do kdy?</h2>
      <p className="text-zinc-500 mb-6">Detailní popis a termín dokončení.</p>

      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider font-medium">
            Popis díla
          </label>
          <textarea
            value={currentFields.predmet_dila || ''}
            onChange={(e) => onUpdate({ predmet_dila: e.target.value })}
            rows={4}
            placeholder="Co přesně má být výsledkem..."
            className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-700"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider font-medium">
            Termín dokončení
          </label>
          <input
            type="text"
            value={currentFields.termin_plneni || ''}
            onChange={(e) => onUpdate({ termin_plneni: e.target.value })}
            placeholder="např. 30. září 2026"
            className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </div>
      </div>

      <button
        onClick={onContinue}
        disabled={!currentFields.predmet_dila?.trim()}
        className="w-full mt-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
      >
        Pokračovat
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function PricingStep({
  currentFields,
  onUpdate,
  onContinue,
}: {
  currentFields: Record<string, string>;
  onUpdate: (updates: Record<string, string>) => void;
  onContinue: () => void;
}) {
  return (
    <div className="h-full flex flex-col p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-light text-zinc-100 mb-2">Cena a platba</h2>
      <p className="text-zinc-500 mb-6">Kolik to stojí a jak se platí.</p>

      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider font-medium">
            Částka (Kč)
          </label>
          <input
            type="number"
            value={currentFields.cena || ''}
            onChange={(e) => onUpdate({ cena: e.target.value })}
            placeholder="45000"
            className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider font-medium">
            Splatnost faktury (dny)
          </label>
          <input
            type="number"
            value={currentFields.datum_platby || ''}
            onChange={(e) => onUpdate({ datum_platby: e.target.value })}
            placeholder="14"
            className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 font-mono"
          />
        </div>
      </div>

      <button
        onClick={onContinue}
        disabled={!currentFields.cena?.trim()}
        className="w-full mt-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
      >
        Pokračovat
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function SafeguardsStep({ onContinue }: { onContinue: () => void }) {
  const [safeguards, setSafeguards] = useState({
    copyright: true,
    penalty: true,
    nda: true,
    jurisdiction: true,
  });

  const items = [
    { key: 'copyright' as const, label: 'Převod autorských práv', desc: 'Dílo je po zaplacení vaše.' },
    { key: 'penalty' as const, label: 'Smluvní pokuta za prodlení', desc: '0,05 % z ceny za každý den.' },
    { key: 'nda' as const, label: 'Mlčenlivost (NDA)', desc: 'Oba chráníme důvěrné informace.' },
    { key: 'jurisdiction' as const, label: 'České právo', desc: 'Smlouva se řídí českým právem.' },
  ];

  return (
    <div className="h-full flex flex-col p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-light text-zinc-100 mb-2">Klid v duši</h2>
      <p className="text-zinc-500 mb-6">Co chceš mít ošetřené?</p>

      <div className="space-y-2 flex-1">
        {items.map((item) => {
          const active = safeguards[item.key];
          return (
            <button
              key={item.key}
              onClick={() => setSafeguards((s) => ({ ...s, [item.key]: !s[item.key] }))}
              className={`w-full p-4 rounded-xl text-left flex items-center gap-3 border transition-colors ${
                active
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                  active ? 'bg-amber-500 border-amber-500' : 'border-zinc-700'
                }`}
              >
                {active && <Check className="w-3.5 h-3.5 text-zinc-950" />}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${active ? 'text-zinc-100' : 'text-zinc-300'}`}>
                  {item.label}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onContinue}
        className="w-full mt-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
      >
        Pokračovat
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function PreviewStep({
  contractType,
  fields,
  onContinue,
}: {
  contractType: ContractType;
  fields: Record<string, string>;
  onContinue: () => void;
}) {
  return (
    <div className="h-full flex flex-col p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-light text-zinc-100 mb-2">Tady je to.</h2>
      <p className="text-zinc-500 mb-6">Mrkni na preview vpravo. Všechno je připravené.</p>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-3 flex-1">
        <SummaryRow label="Předmět" value={fields.predmet_dila} />
        <SummaryRow label="Termín" value={fields.termin_plneni} />
        <SummaryRow label="Cena" value={fields.cena ? `${fields.cena} Kč` : null} />
        <SummaryRow label="Splatnost" value={fields.datum_platby ? `${fields.datum_platby} dní` : null} />
      </div>

      <button
        onClick={onContinue}
        className="w-full mt-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Download className="w-4 h-4" />
        Vygenerovat PDF
      </button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-zinc-200 text-right flex-1 truncate">
        {value || <span className="text-zinc-600 italic">—</span>}
      </span>
    </div>
  );
}

function ExportStep() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6"
      >
        <Check className="w-10 h-10 text-zinc-950" />
      </motion.div>
      <h2 className="text-2xl font-light text-zinc-100 mb-2">Hotovo!</h2>
      <p className="text-zinc-400 max-w-md">
        Smlouva je vygenerovaná. Můžeš ji stáhnout jako PDF nebo text.
      </p>
    </div>
  );
}

function stepTitle(contractType: ContractType): string {
  switch (contractType) {
    case 'nda':
      return 'Nová dohoda NDA';
    case 'rent':
      return 'Nová nájemní smlouva';
    case 'employment':
      return 'Nová pracovní smlouva';
    default:
      return 'Nová smlouva';
  }
}