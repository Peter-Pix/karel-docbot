import React from 'react';
import { Scale, ArrowLeft, RefreshCw, FileText, Settings, Sun, Moon } from 'lucide-react';
import { ContractType } from '../types';
import { getContractTitle } from '../lib/templateGenerator';

interface AppHeaderProps {
  contractType: ContractType | null;
  onBackToSelection: () => void;
  onResetContract: () => void;
  selectedModel: string;
  onOpenSettings: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function AppHeader({
  contractType,
  onBackToSelection,
  onResetContract,
  selectedModel,
  onOpenSettings,
  theme,
  onToggleTheme,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between py-4 px-4 md:px-8 max-w-7xl mx-auto h-16">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          {contractType ? (
            <button
              onClick={onBackToSelection}
              id="btn-back-to-selection"
              className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Zpět na výběr
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm">
                <Scale className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white">
                DocuGenius <span className="text-emerald-600">AI</span>
              </span>
            </div>
          )}
        </div>

        {/* Current Contract Status info */}
        {contractType && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-950/40 rounded-full text-xs font-semibold max-w-md truncate">
            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{getContractTitle(contractType)}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Toggler */}
          <button
            onClick={onToggleTheme}
            id="btn-toggle-theme"
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer shadow-sm"
            title={theme === 'light' ? 'Přepnout do tmavého režimu' : 'Přepnout do světlého režimu'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Settings / Model selector button */}
          <button
            onClick={onOpenSettings}
            id="btn-open-settings"
            className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer border border-gray-200 dark:border-gray-800 shadow-sm"
            title="Nastavení AI modelů z Ollama"
          >
            <Settings className="w-3.5 h-3.5 animate-spin-hover" />
            <span className="hidden xs:inline">{selectedModel}</span>
          </button>

          {contractType && (
            <button
              onClick={onResetContract}
              id="btn-reset-contract"
              className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title="Resetovat rozhovor a smazat zadané údaje"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Resetovat údaje
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
