import React, { useState, useRef, useEffect } from 'react';
import { Message, ContractFields, ContractType } from '../types';
import { getFieldKeys } from '../lib/contracts';
import { Send, Bot, User, Loader2, Sparkles, AlertTriangle } from 'lucide-react';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  nextSuggestedPrompts: string[];
  currentFields: ContractFields;
  contractType: ContractType;
  isFallback?: boolean;
}

export function ChatPanel({
  messages,
  onSendMessage,
  isGenerating,
  nextSuggestedPrompts,
  currentFields,
  contractType,
  isFallback,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGenerating) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  // Progress calculation
  const getProgress = () => {
    const targetKeys = getFieldKeys(contractType);
    const filledCount = targetKeys.filter(k => currentFields[k] && currentFields[k]?.trim() !== '').length;
    return { filledCount, totalCount: targetKeys.length, percentage: Math.round((filledCount / targetKeys.length) * 100) };
  };

  const { filledCount, totalCount, percentage } = getProgress();

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm" id="chat-panel">
      {/* Progress header */}
      <div className="px-4 pt-4 pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#c8962e]" />
            <span className="text-xs font-semibold text-[#a1a1aa]">Konverzační asistent</span>
            {isFallback && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400/80 bg-amber-950/30 px-1.5 py-0.5 rounded-full border border-amber-500/20" title="AI je nedostupná, používám lokální logiku">
                <AlertTriangle className="w-3 h-3" />
                offline
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 bg-[rgba(255,255,255,0.05)] text-[#a1a1aa] rounded-full border border-[rgba(255,255,255,0.08)]">
            {filledCount}/{totalCount}
          </span>
        </div>
        <div className="w-full bg-[rgba(255,255,255,0.05)] h-1 rounded-full overflow-hidden">
          <div
            className="bg-[#c8962e] h-full transition-all duration-700 ease-out rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[88%] animate-slide-in ${isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              style={{ animationDelay: '0ms' }}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isAssistant ? 'bg-[rgba(200,150,46,0.15)] text-[#c8962e]' : 'bg-[rgba(255,255,255,0.08)] text-[#a1a1aa]'
              }`}>
                {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              {/* Bubble */}
              <div className={`px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                isAssistant
                  ? 'bg-[rgba(255,255,255,0.05)] text-[#f4f4f5] rounded-2xl rounded-tl-sm border border-[rgba(255,255,255,0.08)]'
                  : 'bg-[rgba(200,150,46,0.1)] text-[#f4f4f5] rounded-2xl rounded-tr-sm border border-[rgba(200,150,46,0.2)]'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex gap-2.5 max-w-[88%] mr-auto animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-[rgba(200,150,46,0.15)] text-[#c8962e] flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c8962e]" />
              <span className="text-[11px] text-[#71717a]">DocBot zpracovává...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
        {/* Smart suggestion chips */}
        {nextSuggestedPrompts.length > 0 && !isGenerating && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {nextSuggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSendMessage(prompt)}
                className="text-[10px] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] text-[#a1a1aa] hover:text-[#f4f4f5] px-2.5 py-1.5 rounded-full border border-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isGenerating}
            placeholder="Napište odpověď..."
            className="w-full pl-4 pr-12 py-2.5 bg-[rgba(255,255,255,0.05)] text-sm text-[#f4f4f5] placeholder-[#71717a] border border-[rgba(255,255,255,0.08)] rounded-xl focus:outline-none focus:border-[#c8962e]/50 focus:ring-1 focus:ring-[#c8962e]/20 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isGenerating}
            className="absolute right-1.5 p-2 bg-[#c8962e]/80 hover:bg-[#c8962e] text-[#09090b] rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-[#c8962e]/80 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
