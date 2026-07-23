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
    <header className="sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-800/60">
      <div className="flex items-center justify-between py-3 px-4 md:px-8 max-w-7xl mx-auto h-14">
        {/* Left */}
        <div className="flex items-center gap-3">
          {contractType ? (
            <button
              onClick={onBackToSelection}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 px-2 py-1.5 rounded-xl hover:bg-zinc-800/60 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Zpět
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="bg-gold/20 text-gold p-2 rounded-xl">
                <Scale className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-zinc-100">
                DocuGenius <span className="text-gold">AI</span>
              </span>
            </div>
          )}
        </div>

        {/* Center — contract badge */}
        {contractType && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gold/10 text-gold border border-gold/20 rounded-full text-xs font-medium">
            <FileText className="w-3 h-3" />
            <span>{getContractTitle(contractType)}</span>
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all cursor-pointer"
            title={theme === 'light' ? 'Tmavý režim' : 'Světlý režim'}
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/60 transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-gold/70">{selectedModel}</span>
          </button>

          {contractType && (
            <button
              onClick={onResetContract}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-red-400 px-2.5 py-1.5 rounded-xl hover:bg-red-950/30 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
