import React from 'react';
import { X, Cpu, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const AVAILABLE_MODELS = [
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', desc: 'Rychlý a levný, výchozí model' },
  { id: 'kimi-k2.7-code', label: 'Kimi K2.7 Code', desc: 'Silnější model pro komplexní analýzu' },
];

export function SettingsModal({ isOpen, onClose, selectedModel, onSelectModel }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-gold" />
            </div>
            <h2 className="text-sm font-semibold text-zinc-100">AI Model</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-2.5">
          <p className="text-[11px] text-zinc-500 mb-3">
            Všechny modely běží na Ollama cloudu. Výchozí model je DeepSeek V4 Flash.
          </p>
          {AVAILABLE_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => { onSelectModel(model.id); onClose(); }}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                selectedModel === model.id
                  ? 'border-gold/40 bg-gold/5'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-100">{model.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{model.desc}</div>
                </div>
                {selectedModel === model.id && (
                  <div className="w-5 h-5 rounded-full bg-gold/20 text-gold flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-950/50 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-600">
            Model: <span className="font-mono text-gold/70">{selectedModel}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
