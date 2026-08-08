import React, { useState, useCallback, useMemo } from 'react';
import { AppHeader } from './components/AppHeader';
import { DocumentSelection } from './components/DocumentSelection';
import { ChatPanel } from './components/ChatPanel';
import { DocumentPreview } from './components/DocumentPreview';
import { RiskAnalysisPanel } from './components/RiskAnalysisPanel';
import { FieldsEditorPanel } from './components/FieldsEditorPanel';
import { SettingsModal } from './components/SettingsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useToast } from './components/Toast';
import { AdaptiveFlowWizard } from './components/AdaptiveFlowWizard';
import { LandingPage } from './components/LandingPage';
import { ContractType, Message, ContractFields, RiskAnalysisResult } from './types';
import { getDefaultFields, getContractTitle, generateContractHTML } from './lib/templateGenerator';
import { getFieldKeys } from './lib/contracts';
import { ShieldCheck, MessageSquare, Edit3 } from 'lucide-react';

// ─── Smart Suggestions Engine ────────────────────────────────────────────────
type SuggestionContext = {
  contractType: ContractType;
  fields: ContractFields;
  messages: Message[];
  lastAssistantMsg: string;
};

function generateSmartSuggestions(ctx: SuggestionContext): string[] {
  const { contractType, fields, lastAssistantMsg } = ctx;

  // Detect if we're in early stage (first few messages)
  const isEarlyStage = ctx.messages.length <= 3;

  // Detect if user just asked a question
  const isQuestion = lastAssistantMsg.includes('?');

  // Detect if we're in demo data mode
  const hasDemoData = Object.values(fields).some(v => 
    typeof v === 'string' && (v.includes('2 500 000') || v.includes('150 000') || v.includes('55 hodin'))
  );

  // Detect if all fields are filled
  const targetKeys = getFieldKeys(contractType);

  const filledCount = targetKeys.filter(k => fields[k as keyof ContractFields]?.trim()).length;
  const allFilled = filledCount === targetKeys.length;

  // ── Context-aware suggestions ──
  if (hasDemoData) {
    return ['🔍 Analyzovat rizika smlouvy', '⚡ Opravit všechny chyby', '📋 Srovnání s běžnou praxí'];
  }

  if (allFilled) {
    return ['🔍 Analyzovat rizika smlouvy', '📥 Stáhnout jako text', '🔄 Začít znovu s jiným typem'];
  }

  if (isEarlyStage && isQuestion) {
    return ['💡 Použít doporučenou hodnotu', '❓ Vysvětlit tento pojem', '⏭️ Přeskočit a zeptat se později'];
  }

  if (isEarlyStage) {
    return ['✅ Ano, pokračovat', '❓ Vysvětlit podrobněji', '📋 Načíst vzorová data'];
  }

  // Mid-stage — suggest next field or risk check
  if (filledCount >= targetKeys.length / 2) {
    return ['📝 Upravit ručně v editoru', '🔍 Předběžná kontrola rizik', '❓ Mám dotaz k ustanovení'];
  }

  return ['✅ Rozumím, pokračovat', '❓ Vysvětlit', '📋 Načíst demo data'];
}

// ─── App Component ────────────────────────────────────────────────────────────
export default function App() {
  const { showToast } = useToast();
  const [contractType, setContractType] = useState<ContractType | null>(null);
  const [fields, setFields] = useState<ContractFields>(() => getDefaultFields('nda'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nextSuggestedPrompts, setNextSuggestedPrompts] = useState<string[]>([]);
  const [highlightField, setHighlightField] = useState<string | undefined>(undefined);

  // Model — deepseek-v4-flash as primary
  const [selectedModel, setSelectedModel] = useState<string>('deepseek-v4-flash');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Adaptive Flow Wizard
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  // Risk analysis
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysisResult | null>(null);
  const [isAnalyzingRisks, setIsAnalyzingRisks] = useState(false);
  const [leftTab, setLeftTab] = useState<'chat' | 'editor' | 'risk'>('chat');

  // Memoized contract HTML for risk analysis (avoids regenerating on every render)
  const contractHTML = useMemo(() => {
    if (!contractType) return '';
    return generateContractHTML(contractType, fields);
  }, [contractType, fields]);

  // ── Initialize contract session ──
  const handleSelectContract = useCallback((type: ContractType) => {
    setContractType(type);
    setFields(getDefaultFields(type));
    setMessages([]);
    setRiskAnalysis(null);
    setShowLanding(false);
    setIsWizardOpen(true);
  }, []);

  // ── Load demo data ──
  const handleLoadDemoData = useCallback(() => {
    if (!contractType) return;

    let demoFields: ContractFields;
    let demoText = '';

    if (contractType === 'nda') {
      demoFields = {
        contractType: 'nda',
        poskytovatel: 'Inovativní Startup s.r.o.',
        prijemce: 'Vývojář Jan Horký',
        predmet_tajemstvi: 'předání zdrojových kódů a designových podkladů k nové bankovní aplikaci',
        smluvni_pokuta: '2 500 000 Kč',
        doba_platnosti: 'na věčné časy a bez omezení',
        rozhodne_pravo: 'Čínská lidová republika (rozhodčí soud v Pekingu)',
      };
      demoText = 'Načetl jsem ukázková data pro NDA. ⚠️ **Tato data záměrně obsahují právní pasti:**\n\n1. 💰 Extrémní smluvní pokuta (2,5 mil. Kč)\n2. ⏳ Nekonečné trvání mlčenlivosti\n3. 🌏 Jurisdikce v Číně\n\n👉 Přepněte na záložku **AI Kontrola** a uvidíte, jak je AI odhalí!';
    } else if (contractType === 'rent') {
      demoFields = {
        contractType: 'rent',
        pronajimatel: 'Jaroslav Bohatý',
        najemce: 'Květoslav Chudý',
        predmet_najmu: 'Spálená 23, Praha 1 (byt č. 4)',
        vyska_najemneho: '28 000 Kč',
        poplatky_sluzby: '5 500 Kč',
        vratna_kauce: '150 000 Kč',
        vypovedni_lhuta: '1 měsíc pro nájemce, 6 měsíců pro pronajímatele',
        datum_zacatku: '1. srpna 2026',
      };
      demoText = 'Připravil jsem vzorová data pro Nájemní smlouvu. ⚠️ **Obsahuje záměrné chyby:**\n\n1. 💰 Kauce překračující zákonný limit\n2. ⚖️ Nezákonné výpovědní lhůty\n\n👉 Zkuste **AI Kontrolu rizik**!';
    } else {
      demoFields = {
        contractType: 'employment',
        zamestnavatel: 'Rychlá Logistika a.s.',
        zamestnanec: 'Pavel Rychlý',
        pracovni_pozice: 'Kurýr zásilek',
        misto_vykonu: 'celé území České republiky a Evropské unie',
        datum_nastupu: '1. srpna 2026',
        mzda: '18 500 Kč hrubého měsíčně',
        zkusebni_doba: '6 měsíců zkušební doba',
        pracovni_doba: '55 hodin týdně',
      };
      demoText = 'Doplnil jsem vzorové hodnoty do Pracovní smlouvy. ⚠️ **Obsahuje nelegální doložky:**\n\n1. ⏱️ Zkušební doba 6 měsíců (max 3)\n2. 📊 Týdenní doba 55 hodin (max 40)\n3. 🌍 Absurdně široké místo výkonu\n\n👉 Spusťte **AI Kontrolu rizik**!';
    }

    setFields(demoFields);
    setMessages(prev => [
      ...prev,
      { id: Math.random().toString(), sender: 'user', text: '📋 Načíst vzorová data', timestamp: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }) },
      { id: Math.random().toString(), sender: 'assistant', text: demoText, timestamp: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setNextSuggestedPrompts(['🔍 Analyzovat rizika smlouvy', '⚡ Jaká je optimální výše pokuty?']);
  }, [contractType]);

  // ── Send message ──
  const handleSendMessage = useCallback(async (text: string) => {
    if (text.includes('vzorová') || text.includes('demo')) {
      handleLoadDemoData();
      return;
    }

    if (text.includes('Analyzovat rizika') || text.includes('Kontrola rizik')) {
      setLeftTab('risk');
      handleRunRiskAnalysis();
      return;
    }

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractType, messages: updatedMessages, currentFields: fields, selectedModel }),
      });

      if (!response.ok) throw new Error('Chyba při komunikaci s backendem');

      const data = await response.json();

      if (data.extractedFields && Object.keys(data.extractedFields).length > 0) {
        setFields(prev => {
          const merged = { ...prev };
          for (const key in data.extractedFields) {
            const val = data.extractedFields[key];
            if (val !== undefined && val !== null && val.trim() !== '') {
              merged[key as keyof ContractFields] = val;
            }
          }
          return merged;
        });
      }

      if (data.lastUpdatedField) {
        setHighlightField(data.lastUpdatedField);
        setTimeout(() => setHighlightField(undefined), 3000);
      }

      const assistantMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Generate smart suggestions based on context
      const suggestions = generateSmartSuggestions({
        contractType: contractType!,
        fields: { ...fields, ...(data.extractedFields || {}) },
        messages: [...updatedMessages, assistantMsg],
        lastAssistantMsg: data.reply,
      });
      setNextSuggestedPrompts(suggestions);
    } catch (error) {
      console.error(error);
      showToast('error', 'AI služba je nedostupná. Zkontrolujte připojení a zkuste to znovu.');
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'assistant',
        text: 'Omlouvám se, nepodařilo se spojit s AI službou. Zkuste to prosím znovu.',
        timestamp: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsGenerating(false);
    }
  }, [contractType, messages, fields, selectedModel, handleLoadDemoData]);

  // ── Risk analysis ──
  const handleRunRiskAnalysis = useCallback(async () => {
    if (!contractType) return;
    setIsAnalyzingRisks(true);
    setRiskAnalysis(null);

    try {
      const response = await fetch('/api/analyze-risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractType, contractHTML, selectedModel }),
      });

      if (!response.ok) throw new Error('Chyba při analýze rizik');

      const data = await response.json();
      setRiskAnalysis(data);
      showToast('info', `Analýza dokončena: ${data.risks?.length || 0} rizik nalezeno. Skóre: ${data.safetyScore}%.`);
    } catch (err) {
      console.error(err);
      showToast('error', 'Nepodařilo se spojit s AI službou. Zkuste to prosím znovu za chvíli.');
    } finally {
      setIsAnalyzingRisks(false);
    }
  }, [contractType, contractHTML, selectedModel, showToast]);

  // ── Apply risk fix ──
  const handleApplyRiskFix = useCallback((riskId: string, targetText: string, replacementText: string) => {
    setFields(prev => {
      const updated = { ...prev };
      for (const k in updated) {
        const key = k as keyof ContractFields;
        if (key === 'contractType') continue;
        const val = updated[key];
        if (typeof val === 'string' && val.includes(targetText)) {
          updated[key] = val.replace(targetText, replacementText);
          setHighlightField(key);
          setTimeout(() => setHighlightField(undefined), 3000);
          break;
        }
      }
      return updated;
    });

    if (riskAnalysis) {
      const updatedRisks = riskAnalysis.risks.map(r =>
        r.id === riskId ? { ...r, applied: true } : r
      );
      setRiskAnalysis({
        ...riskAnalysis,
        risks: updatedRisks,
        safetyScore: Math.min(100, riskAnalysis.safetyScore + 15),
      });
    }

    showToast('success', 'Oprava byla úspěšně aplikována na smlouvu.');
  }, [riskAnalysis, showToast]);

  const handleResetContract = useCallback(() => {
    if (window.confirm('Opravdu chcete vymazat všechny údaje a začít znovu?')) {
      handleSelectContract(contractType!);
    }
  }, [contractType, handleSelectContract]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col transition-colors">
      {showLanding && !contractType ? (
        <LandingPage onStart={() => handleSelectContract('work')} />
      ) : (
        <>
          <AppHeader
            contractType={contractType}
            onBackToSelection={() => {
              setContractType(null);
              setShowLanding(true);
              setIsWizardOpen(false);
            }}
            onResetContract={handleResetContract}
            selectedModel={selectedModel}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenWizard={contractType ? () => setIsWizardOpen(true) : undefined}
          />

          <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col">
            {!contractType && !showLanding ? (
              <ErrorBoundary label="výběr smlouvy">
                <DocumentSelection onSelect={handleSelectContract} />
              </ErrorBoundary>
            ) : (
          <div className="grid lg:grid-cols-12 gap-5 items-start h-full">
            {/* Left Panel */}
            <div className="lg:col-span-5 flex flex-col h-full space-y-4">
              {/* Apple-style tab bar */}
              <div className="apple-tabs">
                <button
                  onClick={() => setLeftTab('chat')}
                  className={`apple-tab ${leftTab === 'chat' ? 'active' : ''}`}
                >
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
                  Průvodce
                </button>
                <button
                  onClick={() => setLeftTab('editor')}
                  className={`apple-tab ${leftTab === 'editor' ? 'active' : ''}`}
                >
                  <Edit3 className="w-3.5 h-3.5 inline mr-1.5" />
                  Údaje
                </button>
                <button
                  onClick={() => setLeftTab('risk')}
                  className={`apple-tab ${leftTab === 'risk' ? 'active' : ''}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5" />
                  AI Kontrola
                  {riskAnalysis && riskAnalysis.risks.filter(r => !r.applied).length > 0 && (
                    <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                  )}
                </button>
              </div>

              {leftTab === 'chat' && (
                <ErrorBoundary label="chat">
                  <ChatPanel
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isGenerating={isGenerating}
                    nextSuggestedPrompts={nextSuggestedPrompts}
                    currentFields={fields}
                    contractType={contractType}
                  />
                </ErrorBoundary>
              )}
              {leftTab === 'editor' && (
                <ErrorBoundary label="údaje">
                  <FieldsEditorPanel
                    contractType={contractType}
                    fields={fields}
                    onUpdateFields={(updated) => setFields(prev => ({ ...prev, ...updated }))}
                    onLoadDemoData={handleLoadDemoData}
                    highlightField={highlightField}
                  />
                </ErrorBoundary>
              )}
              {leftTab === 'risk' && (
                <ErrorBoundary label="AI kontrola">
                  <RiskAnalysisPanel
                    analysis={riskAnalysis}
                    isLoading={isAnalyzingRisks}
                    onRunAnalysis={handleRunRiskAnalysis}
                    onApplyFix={handleApplyRiskFix}
                    onClose={() => setLeftTab('chat')}
                  />
                </ErrorBoundary>
              )}
            </div>

            {/* Right Panel — Document Preview */}
            <div className="lg:col-span-7 h-full">
              <ErrorBoundary label="náhled smlouvy">
                <DocumentPreview
                  contractType={contractType}
                  fields={fields}
                  highlightField={highlightField}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
      />

      {/* Adaptive Flow Wizard — nový adaptivní UX */}
      {isWizardOpen && contractType && (
        <AdaptiveFlowWizard
          contractType={contractType}
          currentFields={fields as unknown as Record<string, string>}
          onFieldsUpdate={(updates) => {
            setFields((prev) => ({ ...prev, ...updates }));
          }}
          onClose={() => setIsWizardOpen(false)}
        />
      )}
        </>
      )}
    </div>
  );
}
