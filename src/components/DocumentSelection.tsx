import React from 'react';
import { ContractType } from '../types';
import { ShieldAlert, Key, Briefcase, Sparkles } from 'lucide-react';

interface DocumentSelectionProps {
  onSelect: (type: ContractType) => void;
}

export function DocumentSelection({ onSelect }: DocumentSelectionProps) {
  const cards: {
    type: ContractType;
    title: string;
    description: string;
    icon: React.ReactNode;
    accent: string;
    fields: string[];
  }[] = [
    {
      type: 'nda',
      title: 'Dohoda o mlčenlivosti',
      description: 'Chrání citlivé informace, obchodní tajemství a know-how před únikem při jednání s partnery nebo investory.',
      icon: <ShieldAlert className="w-5 h-5" />,
      accent: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400',
      fields: ['Smluvní strany', 'Předmět tajemství', 'Smluvní pokuta', 'Doba trvání', 'Rozhodné právo'],
    },
    {
      type: 'rent',
      title: 'Nájemní smlouva na byt',
      description: 'Zajišťuje právní rovnováhu a jistotu mezi pronajímatelem a nájemcem podle občanského zákoníku.',
      icon: <Key className="w-5 h-5" />,
      accent: 'from-sky-500/20 to-sky-600/5 border-sky-500/20 text-sky-400',
      fields: ['Pronajímatel & Nájemce', 'Adresa bytu', 'Měsíční nájemné', 'Služby a kauce', 'Výpovědní lhůta'],
    },
    {
      type: 'employment',
      title: 'Pracovní smlouva',
      description: 'Zakládá pracovní poměr v souladu se zákoníkem práce ČR, definuje pozici, mzdu a pracovní podmínky.',
      icon: <Briefcase className="w-5 h-5" />,
      accent: 'from-violet-500/20 to-violet-600/5 border-violet-500/20 text-violet-400',
      fields: ['Zaměstnavatel', 'Pracovní pozice', 'Místo výkonu', 'Mzda', 'Zkušební doba'],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center animate-fade-in" id="doc-selection">
      {/* Eyebrow */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="apple-badge bg-gold/10 text-gold border border-gold/20">
          <Sparkles className="w-3 h-3" />
          AI Právní asistent
        </span>
      </div>

      <h1 className="headline-xl text-zinc-100 mb-3">
        Vyberte typ smlouvy
      </h1>
      <p className="text-sm text-zinc-400 max-w-xl mx-auto mb-12 leading-relaxed">
        Interaktivní platforma pro tvorbu právních dokumentů. Asistent vás provede krok za krokem, pak smlouvu zkontroluje na rizika.
      </p>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-4 text-left">
        {cards.map((card) => (
          <button
            key={card.type}
            onClick={() => onSelect(card.type)}
            className="apple-card flex flex-col p-6 text-left cursor-pointer group"
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.accent} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>

            <h3 className="text-base font-semibold text-zinc-100 mb-2">
              {card.title}
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed mb-5 flex-grow">
              {card.description}
            </p>

            {/* Field tags */}
            <div className="border-t border-zinc-800/60 pt-4">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-2">
                Generovaná pole
              </span>
              <div className="flex flex-wrap gap-1.5">
                {card.fields.map((field, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-2 py-0.5 text-[10px] bg-zinc-800/60 text-zinc-300 rounded-md border border-zinc-700/50"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-10 text-[11px] text-zinc-600 flex items-center justify-center gap-1.5">
        <span className="w-1 h-1 rounded-full bg-gold/50" />
        Smlouvy splňují legislativní požadavky ČR (NOZ a Zákoník práce)
      </p>
    </div>
  );
}
