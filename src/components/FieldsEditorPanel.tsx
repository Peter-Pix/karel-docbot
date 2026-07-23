import React from 'react';
import { ContractType, ContractFields } from '../types';
import { getFieldNameLabel } from '../lib/templateGenerator';
import { Edit3, Clipboard, RefreshCw, CheckCircle } from 'lucide-react';

interface FieldsEditorPanelProps {
  contractType: ContractType;
  fields: ContractFields;
  onUpdateFields: (updatedFields: Partial<ContractFields>) => void;
  onLoadDemoData: () => void;
  highlightField?: string;
}

export function FieldsEditorPanel({
  contractType,
  fields,
  onUpdateFields,
  onLoadDemoData,
  highlightField,
}: FieldsEditorPanelProps) {
  const getKeys = (): (keyof ContractFields)[] => {
    if (contractType === 'nda') return ['poskytovatel', 'prijemce', 'predmet_tajemstvi', 'smluvni_pokuta', 'doba_platnosti', 'rozhodne_pravo'];
    if (contractType === 'rent') return ['pronajimatel', 'najemce', 'predmet_najmu', 'vyska_najemneho', 'poplatky_sluzby', 'vratna_kauce', 'vypovedni_lhuta', 'datum_zacatku'];
    return ['zamestnavatel', 'zamestnanec', 'pracovni_pozice', 'misto_vykonu', 'datum_nastupu', 'mzda', 'zkusebni_doba', 'pracovni_doba'];
  };

  const targetKeys = getKeys();
  const filled = targetKeys.filter(k => fields[k]?.trim()).length;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm" id="fields-editor-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-gold" />
          <h2 className="text-sm font-semibold text-zinc-200">Ruční úprava</h2>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 bg-zinc-800/80 text-zinc-400 rounded-full">
          {filled}/{targetKeys.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {/* Hint */}
        <div className="bg-gold/5 border border-gold/10 p-3 rounded-xl text-[11px] text-zinc-400 leading-relaxed">
          Změny se projeví v náhledu v reálném čase. Pro testovací scénáře s chybami načtěte demo data.
        </div>

        {/* Demo data button */}
        <button
          onClick={onLoadDemoData}
          className="w-full flex items-center justify-center gap-2 bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-300 border border-zinc-700/50 text-[11px] font-medium py-2.5 px-4 rounded-xl transition-all cursor-pointer"
        >
          <Clipboard className="w-3.5 h-3.5 text-gold" />
          Načíst demo data s riziky
        </button>

        {/* Fields */}
        <div className="space-y-3">
          {targetKeys.map((key) => {
            const isHighlighted = highlightField === key;
            const value = (fields[key] as string) || '';

            return (
              <div
                key={key}
                className={`transition-all duration-500 p-2.5 rounded-xl border ${
                  isHighlighted
                    ? 'border-gold/40 bg-gold/5 scale-[1.01]'
                    : 'border-transparent'
                }`}
              >
                <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">
                  {getFieldNameLabel(key)}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onUpdateFields({ [key]: e.target.value })}
                    placeholder={`Zadejte ${getFieldNameLabel(key).toLowerCase()}...`}
                    className={`w-full px-3 py-2 bg-zinc-800/60 text-sm text-zinc-100 placeholder-zinc-500 border rounded-xl focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all ${
                      value ? 'border-zinc-700' : 'border-zinc-800 border-dashed'
                    }`}
                  />
                  {value && (
                    <button
                      onClick={() => onUpdateFields({ [key]: '' })}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-red-400 text-xs transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
