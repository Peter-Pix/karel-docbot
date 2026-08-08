import React, { useState, useEffect } from 'react';
import { ContractType, ContractFields } from '../types';
import { getFieldKeys, getFieldLabel, getFieldPlaceholder } from '../lib/contracts';
import { validateField } from '../lib/validation';
import { Edit3, Clipboard, RefreshCw, AlertTriangle } from 'lucide-react';

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
  const targetKeys = getFieldKeys(contractType);
  const filled = targetKeys.filter(k => fields[k]?.trim()).length;
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Re-validate on field changes
  useEffect(() => {
    const errors: Record<string, string> = {};
    for (const key of targetKeys) {
      const error = validateField(key, (fields[key] as string) || '');
      if (error) errors[key as string] = error;
    }
    setValidationErrors(errors);
  }, [fields, targetKeys]);

  const errorCount = Object.keys(validationErrors).length;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm" id="fields-editor-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-gold" />
          <h2 className="text-sm font-semibold text-zinc-200">Ruční úprava</h2>
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 ml-1">
              <AlertTriangle className="w-3 h-3" />
              {errorCount} {errorCount === 1 ? 'varování' : 'varování'}
            </span>
          )}
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
            const error = validationErrors[key as string];
            const hasError = !!error;

            return (
              <div
                key={key}
                className={`transition-all duration-500 p-2.5 rounded-xl border ${
                  isHighlighted
                    ? 'border-gold/40 bg-gold/5 scale-[1.01]'
                    : hasError
                    ? 'border-amber-500/20 bg-amber-950/5'
                    : 'border-transparent'
                }`}
              >
                <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">
                  {getFieldLabel(key)}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onUpdateFields({ [key]: e.target.value })}
                    placeholder={getFieldPlaceholder(key) || `Zadejte ${getFieldLabel(key).toLowerCase()}...`}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `error-${key}` : undefined}
                    className={`w-full px-3 py-2 bg-zinc-800/60 text-sm text-zinc-100 placeholder-zinc-500 border rounded-xl focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all ${
                      hasError
                        ? 'border-amber-500/40 focus:border-amber-500/60 focus:ring-amber-500/20'
                        : value ? 'border-zinc-700' : 'border-zinc-800 border-dashed'
                    }`}
                  />
                  {value && !hasError && (
                    <button
                      onClick={() => onUpdateFields({ [key]: '' })}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-red-400 text-xs transition-colors"
                      aria-label={`Vymazat pole ${getFieldLabel(key)}`}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                  {value && hasError && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                {/* Inline validation error */}
                {hasError && (
                  <p id={`error-${key}`} className="mt-1 text-[10px] text-amber-400/80 leading-relaxed flex items-start gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Validation summary */}
        {errorCount > 0 && (
          <div className="bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl text-[10px] text-amber-300/80 leading-relaxed">
            <strong className="text-amber-300">Nalezena varování:</strong> Některá pole obsahují hodnoty, které mohou být právně sporné nebo neplatné. K úplné kontrole použijte záložku "AI Kontrola".
          </div>
        )}
      </div>
    </div>
  );
}