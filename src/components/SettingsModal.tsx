import React from 'react';
import { X, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const AVAILABLE_MODELS = [
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', desc: 'Rychlý a levný, výchozí' },
  { id: 'kimi-k2.7-code', label: 'Kimi K2.7 Code', desc: 'Silnější model, pomalejší' },
];

export function SettingsModal({ isOpen, onClose, selectedModel, onSelectModel }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-lg">Nastavení AI modelu</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vyberte AI model pro generování smluv. Všechny modely běží na Ollama cloudu.
          </p>
          {AVAILABLE_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => { onSelectModel(model.id); onClose(); }}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                selectedModel === model.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{model.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{model.desc}</div>
                </div>
                {selectedModel === model.id && (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400">
            API klíč je nastaven na serveru. Model: <span className="font-mono text-emerald-600">{selectedModel}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
