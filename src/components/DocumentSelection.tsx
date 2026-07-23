import React from 'react';
import { ContractType } from '../types';
import { FileText, ShieldAlert, Key, Briefcase } from 'lucide-react';

interface DocumentSelectionProps {
  onSelect: (type: ContractType) => void;
}

export function DocumentSelection({ onSelect }: DocumentSelectionProps) {
  const cards: {
    type: ContractType;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    fields: string[];
  }[] = [
    {
      type: 'nda',
      title: 'Dohoda o mlčenlivosti (NDA)',
      description: 'Chrání citlivé informace, obchodní tajemství a know-how před únikem či zneužitím při jednání s partnery nebo investory.',
      icon: <ShieldAlert className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      color: 'border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-950 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30',
      fields: ['Smluvní strany', 'Předmět tajemství', 'Smluvní pokuta', 'Doba trvání', 'Rozhodné právo'],
    },
    {
      type: 'rent',
      title: 'Nájemní smlouva na byt',
      description: 'Zajišťuje právní rovnováhu a jistotu mezi pronajímatelem nemovitosti a nájemcem podle nového občanského zákoníku.',
      icon: <Key className="w-6 h-6 text-sky-600 dark:text-sky-400" />,
      color: 'border-sky-100 bg-sky-50/50 hover:bg-sky-50 dark:border-sky-950 dark:bg-sky-950/20 dark:hover:bg-sky-950/30',
      fields: ['Pronajímatel & Nájemce', 'Předmět nájmu (adresa)', 'Měsíční nájemné', 'Služby a kauce', 'Výpovědní lhůta'],
    },
    {
      type: 'employment',
      title: 'Pracovní smlouva',
      description: 'Zakládá pracovní poměr v souladu se zákoníkem práce ČR, definuje pracovní pozici, mzdu a pracovní podmínky.',
      icon: <Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      color: 'border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 dark:border-indigo-950 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30',
      fields: ['Zaměstnavatel & Zaměstnanec', 'Pracovní pozice', 'Místo výkonu práce', 'Mzdové ujednání', 'Zkušební doba'],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center animate-fade-in" id="doc-selection">
      <div className="mb-10">
        <span className="px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40 rounded-full">
          Právní & Obchodní Šablony
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-3 tracking-tight">
          DocuGenius AI
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2 max-w-2xl mx-auto">
          Interaktivní platforma pro tvorbu právních dokumentů prostřednictvím inteligentního rozhovoru. Vyberte typ smlouvy a začněte tvořit.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 text-left">
        {cards.map((card) => (
          <button
            key={card.type}
            onClick={() => onSelect(card.type)}
            id={`btn-select-${card.type}`}
            className={`flex flex-col h-full border rounded-2xl p-6 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg text-left cursor-pointer group ${card.color}`}
          >
            <div className="p-3 bg-white dark:bg-gray-950 rounded-xl w-fit shadow-sm border border-gray-100 dark:border-gray-800 mb-4 group-hover:scale-110 transition-transform">
              {card.icon}
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {card.title}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 flex-grow">
              {card.description}
            </p>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 w-full">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
                Generovaná pole:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {card.fields.map((field, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-2 py-0.5 text-xs bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded border border-gray-100 dark:border-gray-700"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-12 text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
        <FileText className="w-4 h-4" />
        Smlouvy splňují legislativní požadavky ČR podle NOZ a Zákoníku práce.
      </div>
    </div>
  );
}
