import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { AppHeader } from './components/AppHeader';
import { DocumentSelection } from './components/DocumentSelection';
import { ChatPanel } from './components/ChatPanel';
import { DocumentPreview } from './components/DocumentPreview';
import { RiskAnalysisPanel } from './components/RiskAnalysisPanel';
import { FieldsEditorPanel } from './components/FieldsEditorPanel';
import { SettingsModal } from './components/SettingsModal';
import { ContractType, Message, ContractFields, RiskAnalysisResult } from './types';
import { getDefaultFields, getContractTitle, generateContractHTML } from './lib/templateGenerator';
import { ShieldCheck, MessageSquare, AlertCircle, Sparkles, Edit3 } from 'lucide-react';

export default function App() {
  const [contractType, setContractType] = useState<ContractType | null>(null);
  const [fields, setFields] = useState<ContractFields>(() => getDefaultFields('nda'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nextSuggestedPrompts, setNextSuggestedPrompts] = useState<string[]>([]);
  const [highlightField, setHighlightField] = useState<string | undefined>(undefined);
  
  // Theme switcher state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Model & settings configuration
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.6-flash');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Risk analysis & Tabs state
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysisResult | null>(null);
  const [isAnalyzingRisks, setIsAnalyzingRisks] = useState(false);
  const [leftTab, setLeftTab] = useState<'chat' | 'editor' | 'risk'>('chat');

  // Initialize a new contract drafting session
  const handleSelectContract = (type: ContractType) => {
    setContractType(type);
    const initialFields = getDefaultFields(type);
    setFields(initialFields);
    setRiskAnalysis(null);
    setLeftTab('chat');

    // Initial greeting customized for selected contract
    let greeting = '';
    let suggestions: string[] = [];
    
    if (type === 'nda') {
      greeting = 'Vítejte v DocuGenius AI! Pomohu vám sestavit Dohodu o ochraně důvěrných informací (NDA) podle českého práva.\n\nZačneme prvním krokem: Jaké je prosím jméno nebo název firmy Poskytovatele důvěrných informací?';
      suggestions = ['Inovativní Startup s.r.o.', 'Chci načíst vzorová Demo data', 'Jaká rizika umíš najít?'];
    } else if (type === 'rent') {
      greeting = 'Dobrý den! Připravíme společně Nájemní smlouvu na byt v souladu s občanským zákoníkem ČR.\n\nNejprve se zeptám: Kdo je Pronajímatelem bytu? Uveďte prosím celé jméno nebo název firmy.';
      suggestions = ['Jaroslav Bohatý', 'Chci načíst vzorová Demo data', 'Jaké jsou obvyklé podmínky?'];
    } else {
      greeting = 'Dobrý den! Rád vám pomohu vytvořit profesionální Pracovní smlouvu podle zákoníku práce ČR.\n\nZačněme základním údajem: Jaký je přesný název nebo jméno Zaměstnavatele?';
      suggestions = ['Rychlá Logistika a.s.', 'Chci načíst vzorová Demo data', 'Co musí obsahovat smlouva?'];
    }

    setMessages([
      {
        id: 'init',
        sender: 'assistant',
        text: greeting,
        timestamp: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setNextSuggestedPrompts(suggestions);
  };

  // Inject sample data containing legal issues to quickly demonstrate Risk Check
  const handleLoadDemoData = () => {
    if (!contractType) return;

    let demoFields: ContractFields;
    let demoText = '';

    if (contractType === 'nda') {
      demoFields = {
        contractType: 'nda',
        poskytovatel: 'Inovativní Startup s.r.o.',
        prijemce: 'Vývojář Jan Horký',
        predmet_tajemstvi: 'předání zdrojových kódů a designových podkladů k nové bankovní aplikaci',
        smluvni_pokuta: '2 500 000 Kč', // Extremely disproportionate penalty
        doba_platnosti: 'na věčné časy a bez omezení', // Disproportionate duration
        rozhodne_pravo: 'Čínská lidová republika (rozhodčí soud v Pekingu)', // Highly unfavorable jurisdiction
      };
      demoText = 'Načetl jsem pro vás ukázkové podklady pro NDA.\n\nPozor, tato data záměrně obsahují několik vážných právních rizik:\n1. Extrémní smluvní pokuta (2,5 milionu Kč).\n2. Nekonečné trvání mlčenlivosti.\n3. Jurisdikce v Číně.\n\nKlikněte nyní na zelenou záložku „AI Kontrola rizik“ nebo stiskněte tlačítko pro vyhodnocení, abyste viděli, jak s nimi AI naloží!';
    } else if (contractType === 'rent') {
      demoFields = {
        contractType: 'rent',
        pronajimatel: 'Jaroslav Bohatý',
        najemce: 'Květoslav Chudý',
        predmet_najmu: 'Spálená 23, Praha 1 (byt č. 4)',
        vyska_najemneho: '28 000 Kč',
        poplatky_sluzby: '5 500 Kč',
        vratna_kauce: '150 000 Kč', // Exceeds lawful 3x limit (high risk)
        vypovedni_lhuta: '1 měsíc pro nájemce, 6 měsíců pro pronajímatele', // Violates civil code minimums (illegal)
        datum_zacatku: '1. srpna 2026',
      };
      demoText = 'Připravil jsem vzorová data pro Nájemní smlouvu.\n\nTento draft záměrně obsahuje závažné právní chyby:\n1. Kauce překračující zákonný limit (150 000 Kč).\n2. Nezákonně nastavené výpovědní lhůty (občanský zákoník garantuje minimálně 3 měsíce pro obě strany).\n\nZkuste ihned spustit „AI Kontrolu rizik“ a vyřešit tyto problémy na jeden klik!';
    } else {
      demoFields = {
        contractType: 'employment',
        zamestnavatel: 'Rychlá Logistika a.s.',
        zamestnanec: 'Pavel Rychlý',
        pracovni_pozice: 'Kurýr zásilek',
        misto_vykonu: 'celé území České republiky a Evropské unie', // Unreasonably wide place of performance
        datum_nastupu: '1. srpna 2026',
        mzda: '18 500 Kč hrubého měsíčně',
        zkusebni_doba: '6 měsíců zkušební doba', // Unlawful length for regular worker (law limits to 3 months)
        pracovni_doba: '55 hodin týdně', // Exceeds statutory weekly limits
      };
      demoText = 'Doplnil jsem vzorové hodnoty do Pracovní smlouvy.\n\nTento draft obsahuje doložky, které odporují zákoníku práce ČR:\n1. Zkušební doba 6 měsíců (povolené maximum je 3 měsíce).\n2. Týdenní doba 55 hodin (zákonný limit je 40 hodin).\n3. Absurdně široké místo výkonu práce.\n\nKlikněte nahoře na „AI Kontrola rizik“ k odhalení těchto pastí a opravte je bezpečným ujednáním.';
    }

    setFields(demoFields);
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        sender: 'user',
        text: 'Chci načíst vzorová Demo data',
        timestamp: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: Math.random().toString(),
        sender: 'assistant',
        text: demoText,
        timestamp: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setNextSuggestedPrompts(['Analyzovat rizika smlouvy', 'Jaká je optimální výše pokuty?']);
  };

  // Send message to Gemini chat endpoint
  const handleSendMessage = async (text: string) => {
    if (text.includes('vzorová Demo data') || text.includes('vzorová demo data')) {
      handleLoadDemoData();
      return;
    }

    if (text === 'Analyzovat rizika smlouvy') {
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
        body: JSON.stringify({
          contractType,
          messages: updatedMessages,
          currentFields: fields,
          selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Chyba při komunikaci s backendem');
      }

      const data = await response.json();

      // Process extracted parameters
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

      // Highlight the updated field
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
      setNextSuggestedPrompts(data.nextSuggestedPrompts || []);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'assistant',
          text: 'Omlouvám se, ale nepodařilo se mi spojit s AI službou. Zkontrolujte prosím připojení k síti a zkuste to znovu.',
          timestamp: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Run AI Risk Check
  const handleRunRiskAnalysis = async () => {
    setIsAnalyzingRisks(true);
    setRiskAnalysis(null);

    const contractHTML = generateContractHTML(contractType!, fields);

    try {
      const response = await fetch('/api/analyze-risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractType,
          contractHTML,
          selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Chyba při analýze rizik');
      }

      const data = await response.json();
      setRiskAnalysis(data);
    } catch (err) {
      console.error(err);
      alert('Chyba při analýze rizik. Ujistěte se, že vybraný model je správně nakonfigurován.');
    } finally {
      setIsAnalyzingRisks(false);
    }
  };

  // Apply safer legal phrasing replacement
  const handleApplyRiskFix = (riskId: string, targetText: string, replacementText: string) => {
    setFields(prev => {
      const updated = { ...prev };
      let found = false;

      for (const k in updated) {
        const key = k as keyof ContractFields;
        if (key === 'contractType') continue;
        const val = updated[key];
        if (typeof val === 'string' && val.includes(targetText)) {
          updated[key] = val.replace(targetText, replacementText);
          found = true;
          setHighlightField(key);
          setTimeout(() => setHighlightField(undefined), 3000);
          break;
        }
      }

      // If exact substring didn't match perfectly, let's do a soft update 
      if (!found) {
        // E.g. find field by name mapping or if it contains any subset
        for (const k in updated) {
          const key = k as keyof ContractFields;
          if (key === 'contractType') continue;
          const val = updated[key];
          if (typeof val === 'string' && (targetText.includes(val) || val.includes(targetText.split(' ')[0]))) {
            updated[key] = replacementText;
            setHighlightField(key);
            setTimeout(() => setHighlightField(undefined), 3000);
            break;
          }
        }
      }

      return updated;
    });

    // Mark risk as resolved in the list
    if (riskAnalysis) {
      const updatedRisks = riskAnalysis.risks.map(r => 
        r.id === riskId ? { ...r, applied: true } : r
      );
      setRiskAnalysis({
        ...riskAnalysis,
        risks: updatedRisks,
        safetyScore: Math.min(100, riskAnalysis.safetyScore + 15), // Increase safety score dynamically!
      });
    }
  };

  const handleResetContract = () => {
    if (window.confirm('Opravdu chcete vymazat všechny zadané údaje a začít rozhovor znovu?')) {
      handleSelectContract(contractType!);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 flex flex-col transition-colors">
      <AppHeader 
        contractType={contractType} 
        onBackToSelection={() => setContractType(null)} 
        onResetContract={handleResetContract} 
        selectedModel={selectedModel}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col">
        {!contractType ? (
          <DocumentSelection onSelect={handleSelectContract} />
        ) : (
          <div className="grid lg:grid-cols-12 gap-6 items-start h-full">
            {/* Left Side: Chat Panel, Fields Editor Panel, or Risk Analysis Panel */}
            <div className="lg:col-span-5 flex flex-col h-full space-y-4">
              {/* Selector Tabs for Left Screen */}
              <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl font-bold text-xs shadow-inner">
                <button
                  onClick={() => setLeftTab('chat')}
                  className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    leftTab === 'chat'
                      ? 'bg-white dark:bg-gray-850 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Průvodce
                </button>
                <button
                  onClick={() => setLeftTab('editor')}
                  className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    leftTab === 'editor'
                      ? 'bg-white dark:bg-gray-850 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                  Úprava údajů
                </button>
                <button
                  onClick={() => setLeftTab('risk')}
                  id="tab-risk-analysis"
                  className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer relative ${
                    leftTab === 'risk'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  AI Kontrola
                  {riskAnalysis && riskAnalysis.risks.filter(r => !r.applied).length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  )}
                </button>
              </div>

              {/* Panel Renderer */}
              {leftTab === 'chat' && (
                <ChatPanel
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isGenerating={isGenerating}
                  nextSuggestedPrompts={nextSuggestedPrompts}
                  currentFields={fields}
                  contractType={contractType}
                />
              )}

              {leftTab === 'editor' && (
                <FieldsEditorPanel
                  contractType={contractType}
                  fields={fields}
                  onUpdateFields={(updated) => setFields(prev => ({ ...prev, ...updated }))}
                  onLoadDemoData={handleLoadDemoData}
                  highlightField={highlightField}
                />
              )}

              {leftTab === 'risk' && (
                <RiskAnalysisPanel
                  analysis={riskAnalysis}
                  isLoading={isAnalyzingRisks}
                  onRunAnalysis={handleRunRiskAnalysis}
                  onApplyFix={handleApplyRiskFix}
                  onClose={() => setLeftTab('chat')}
                />
              )}
            </div>

            {/* Right Side: Split-Screen Document Preview */}
            <div className="lg:col-span-7 h-full">
              <DocumentPreview
                contractType={contractType}
                fields={fields}
                highlightField={highlightField}
              />
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
    </div>
  );
}
