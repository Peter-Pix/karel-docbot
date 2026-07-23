import React from 'react';
import { ContractType, ContractFields } from '../types';
import { getFieldNameLabel } from '../lib/templateGenerator';
import { Edit3, Sparkles, Check, RefreshCw, Clipboard } from 'lucide-react';

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
  // Determine which fields belong to this contract type
  const getNdaKeys = (): (keyof ContractFields)[] => [
    'poskytovatel',
    'prijemce',
    'predmet_tajemstvi',
    'smluvni_pokuta',
    'doba_platnosti',
    'rozhodne_pravo',
  ];

  const getRentKeys = (): (keyof ContractFields)[] => [
    'pronajimatel',
    'najemce',
    'predmet_najmu',
    'vyska_najemneho',
    'poplatky_sluzby',
    'vratna_kauce',
    'vypovedni_lhuta',
    'datum_zacatku',
  ];

  const getEmploymentKeys = (): (keyof ContractFields)[] => [
    'zamestnavatel',
    'zamestnanec',
    'pracovni_pozice',
    'misto_vykonu',
    'datum_nastupu',
    'mzda',
    'zkusebni_doba',
    'pracovni_doba',
  ];

  const targetKeys =
    contractType === 'nda'
      ? getNdaKeys()
      : contractType === 'rent'
      ? getRentKeys()
      : getEmploymentKeys();

  const handleInputChange = (key: keyof ContractFields, value: string) => {
    onUpdateFields({ [key]: value });
  };

  const getFieldProgress = () => {
    const filled = targetKeys.filter((k) => fields[k] && fields[k]!.trim() !== '').length;
    return { filled, total: targetKeys.length };
  };

  const { filled, total } = getFieldProgress();

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm" id="fields-editor-panel">
      {/* Header */}
      <div className="p-4 bg-gray-50/50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-md font-bold text-gray-800 dark:text-gray-200">
            Ruční úprava údajů
          </h2>
        </div>
        <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">
          {filled} z {total} vyplněno
        </span>
      </div>

      {/* Editor scrollable content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {/* Helper Banner */}
        <div className="bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/40 dark:border-emerald-950/30 p-3 rounded-xl text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          Zde můžete hodnoty smlouvy vyplnit přímo. Všechny změny se v reálném čase přenesou do náhledu napravo. Pokud chcete vyzkoušet testovací scénáře s chybami, načtěte demo data.
        </div>

        {/* Demo data injector */}
        <button
          type="button"
          onClick={onLoadDemoData}
          className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-850 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
        >
          <Clipboard className="w-3.5 h-3.5 text-emerald-500" />
          Načíst vzorová Demo data s riziky
        </button>

        {/* Inputs */}
        <div className="space-y-3.5">
          {targetKeys.map((key) => {
            const isHighlighted = highlightField === key;
            const value = (fields[key] as string) || '';

            return (
              <div
                key={key}
                className={`transition-all duration-300 p-2.5 rounded-xl border ${
                  isHighlighted
                    ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/20 scale-[1.01]'
                    : 'border-transparent bg-transparent'
                }`}
              >
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                  {getFieldNameLabel(key)}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    placeholder={`Zadejte hodnotu pro ${getFieldNameLabel(key).toLowerCase()}...`}
                    className={`w-full px-3 py-2 bg-gray-50 focus:bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-850 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors ${
                      value ? 'border-gray-300 dark:border-gray-700' : 'border-dashed'
                    }`}
                  />
                  {value && (
                    <button
                      type="button"
                      onClick={() => handleInputChange(key, '')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-xs transition-colors"
                      title="Vymazat pole"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
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
