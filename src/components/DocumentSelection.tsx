import React from 'react';
import { ContractType } from '../types';
import { ShieldAlert, Key, Briefcase, Sparkles, Hammer, FileText } from 'lucide-react';

interface DocumentSelectionProps {
  onSelect: (type: ContractType) => void;
}

export function DocumentSelection({ onSelect }: DocumentSelectionProps) {
  const cards: {
    type: ContractType;
    title: string;
    description: string;
    icon: React.ReactNode;
    fields: string[];
  }[] = [
    {
      type: 'work',
      title: 'Smlouva o dílo',
      description: 'Pro freelancery a dodavatele. Jasně definuje předmět díla, cenu, termín a převod práv.',
      icon: <Hammer className="w-5 h-5" />,
      fields: ['Zhotovitel', 'Objednatel', 'Předmět díla', 'Cena a DPH', 'Termín'],
    },
    {
      type: 'nda',
      title: 'Dohoda o mlčenlivosti',
      description: 'Chrání citlivé informace, obchodní tajemství a know-how před únikem při jednání s partnery.',
      icon: <ShieldAlert className="w-5 h-5" />,
      fields: ['Smluvní strany', 'Předmět tajemství', 'Smluvní pokuta', 'Doba trvání', 'Rozhodné právo'],
    },
    {
      type: 'rent',
      title: 'Nájemní smlouva na byt',
      description: 'Zajišťuje právní rovnováhu mezi pronajímatelem a nájemcem podle občanského zákoníku.',
      icon: <Key className="w-5 h-5" />,
      fields: ['Pronajímatel & Nájemce', 'Adresa bytu', 'Nájemné', 'Kauce', 'Výpovědní lhůta'],
    },
    {
      type: 'employment',
      title: 'Pracovní smlouva',
      description: 'Zakládá pracovní poměr v souladu se zákoníkem práce ČR — pozice, mzda, podmínky.',
      icon: <Briefcase className="w-5 h-5" />,
      fields: ['Zaměstnavatel', 'Pracovní pozice', 'Místo výkonu', 'Mzda', 'Zkušební doba'],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-center animate-fade-in" id="doc-selection">
      {/* Eyebrow */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="apple-badge bg-[rgba(200,150,46,0.1)] text-[#c8962e] border border-[rgba(200,150,46,0.2)]">
          <Sparkles className="w-3 h-3" />
          AI právní asistent
        </span>
      </div>

      <h1 className="headline-xl text-[#f4f4f5] mb-3">
        Vyberte typ smlouvy
      </h1>
      <p className="text-sm text-[#a1a1aa] max-w-xl mx-auto mb-12 leading-relaxed">
        Interaktivní platforma pro tvorbu právních dokumentů. Asistent vás provede krok za krokem, pak smlouvu zkontroluje na rizika.
      </p>

      {/* Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {cards.map((card) => (
          <button
            key={card.type}
            onClick={() => onSelect(card.type)}
            className="apple-card flex flex-col p-6 text-left cursor-pointer group"
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-[rgba(200,150,46,0.1)] text-[#c8962e] border border-[rgba(200,150,46,0.2)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              {card.icon}
            </div>

            <h3 className="text-base font-semibold text-[#f4f4f5] mb-2">
              {card.title}
            </h3>

            <p className="text-xs text-[#71717a] leading-relaxed mb-5 flex-grow">
              {card.description}
            </p>

            {/* Field tags */}
            <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
              <span className="text-[10px] font-medium text-[#71717a] uppercase tracking-wider block mb-2">
                Generovaná pole
              </span>
              <div className="flex flex-wrap gap-1.5">
                {card.fields.map((field, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-2 py-0.5 text-[10px] bg-[rgba(255,255,255,0.05)] text-[#a1a1aa] rounded-md border border-[rgba(255,255,255,0.08)]"
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
      <p className="mt-10 text-[11px] text-[#71717a] flex items-center justify-center gap-1.5">
        <FileText className="w-3 h-3 text-[#c8962e]" />
        Smlouvy splňují legislativní požadavky ČR (NOZ a Zákoník práce)
      </p>
    </div>
  );
}
