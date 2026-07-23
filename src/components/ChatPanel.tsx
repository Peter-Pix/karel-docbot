import React, { useState, useRef, useEffect } from 'react';
import { Message, ContractFields, ContractType } from '../types';
import { Send, Bot, User, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  nextSuggestedPrompts: string[];
  currentFields: ContractFields;
  contractType: ContractType;
}

export function ChatPanel({
  messages,
  onSendMessage,
  isGenerating,
  nextSuggestedPrompts,
  currentFields,
  contractType,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGenerating) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  // Calculate parameters filling progress
  const getProgress = () => {
    const ndaKeys: (keyof ContractFields)[] = ['poskytovatel', 'prijemce', 'predmet_tajemstvi', 'smluvni_pokuta', 'doba_platnosti', 'rozhodne_pravo'];
    const rentKeys: (keyof ContractFields)[] = ['pronajimatel', 'najemce', 'predmet_najmu', 'vyska_najemneho', 'poplatky_sluzby', 'vratna_kauce', 'vypovedni_lhuta', 'datum_zacatku'];
    const empKeys: (keyof ContractFields)[] = ['zamestnavatel', 'zamestnanec', 'pracovni_pozice', 'misto_vykonu', 'datum_nastupu', 'mzda', 'zkusebni_doba', 'pracovni_doba'];

    const targetKeys = contractType === 'nda' ? ndaKeys : contractType === 'rent' ? rentKeys : empKeys;
    const filledCount = targetKeys.filter(k => currentFields[k] && currentFields[k]?.trim() !== '').length;
    const totalCount = targetKeys.length;
    const percentage = Math.round((filledCount / totalCount) * 100);

    return { filledCount, totalCount, percentage };
  };

  const { filledCount, totalCount, percentage } = getProgress();

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-gray-50/50 dark:bg-gray-900/10 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm" id="chat-panel">
      {/* Progress Header */}
      <div className="p-4 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Konverzační asistent
            </span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">
            {filledCount} z {totalCount} údajů ({percentage}%)
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              <div className={`p-2 rounded-xl flex-shrink-0 w-8 h-8 flex items-center justify-center ${
                isAssistant 
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' 
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}>
                {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                isAssistant 
                  ? 'bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm' 
                  : 'bg-emerald-600 text-white rounded-tr-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 w-8 h-8 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2 text-gray-500 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
              DocuGenius AI píše odpověď a zpracovává data...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompts & Input Area */}
      <div className="p-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        {/* Chips */}
        {nextSuggestedPrompts.length > 0 && !isGenerating && (
          <div className="flex flex-wrap gap-2 mb-3">
            {nextSuggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSendMessage(prompt)}
                className="text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/60 dark:hover:bg-gray-900 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-800 transition-colors cursor-pointer text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isGenerating}
            placeholder="Napište odpověď nebo dotaz k článku smlouvy..."
            id="chat-input-field"
            className="w-full pl-4 pr-12 py-3 bg-gray-50 focus:bg-white dark:bg-gray-900/50 dark:focus:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isGenerating}
            id="btn-send-message"
            className="absolute right-2 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-emerald-600 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
