import React from 'react';
import { Scale, ArrowLeft, RefreshCw, FileText, Settings, Sparkles } from 'lucide-react';
import { ContractType } from '../types';
import { getContractTitle } from '../lib/templateGenerator';

interface AppHeaderProps {
  contractType: ContractType | null;
  onBackToSelection: () => void;
  onResetContract: () => void;
  selectedModel: string;
  onOpenSettings: () => void;
  onOpenWizard?: () => void;
}

export function AppHeader({
  contractType,
  onBackToSelection,
  onResetContract,
  selectedModel,
  onOpenSettings,
  onOpenWizard,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full glass-strong border-b border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between py-3 px-4 md:px-8 max-w-7xl mx-auto h-14">
        {/* Left */}
        <div className="flex items-center gap-3">
          {contractType ? (
            <button
              onClick={onBackToSelection}
              className="flex items-center gap-1.5 text-xs font-medium text-[#a1a1aa] hover:text-[#f4f4f5] px-2 py-1.5 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Zpět
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="bg-[rgba(200,150,46,0.15)] text-[#c8962e] p-2 rounded-xl">
                <Scale className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-[#f4f4f5]">
                Doc<span className="text-[#c8962e]">Bot</span>
              </span>
            </div>
          )}
        </div>

        {/* Center — contract badge */}
        {contractType && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[rgba(200,150,46,0.1)] text-[#c8962e] border border-[rgba(200,150,46,0.2)] rounded-full text-xs font-medium">
            <FileText className="w-3 h-3" />
            <span>{getContractTitle(contractType)}</span>
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {contractType && onOpenWizard && (
            <button
              onClick={onOpenWizard}
              className="flex items-center gap-1.5 text-xs font-medium text-[#c8962e] hover:text-[#e4b44a] px-2.5 py-1.5 rounded-xl bg-[rgba(200,150,46,0.1)] hover:bg-[rgba(200,150,46,0.15)] border border-[rgba(200,150,46,0.2)] transition-colors cursor-pointer"
              title="Nový adaptivní průvodce"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nový průvodce</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 text-xs font-medium text-[#a1a1aa] hover:text-[#f4f4f5] px-2.5 py-1.5 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[#c8962e]/70">{selectedModel}</span>
          </button>

          {contractType && (
            <button
              onClick={onResetContract}
              className="flex items-center gap-1.5 text-xs font-medium text-[#71717a] hover:text-red-400 px-2.5 py-1.5 rounded-xl hover:bg-red-950/30 transition-colors cursor-pointer"
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
