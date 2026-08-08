import React, { useState, useRef, useEffect } from 'react';
import { Message, ContractFields, ContractType } from '../types';
import { getFieldKeys } from '../lib/contracts';
import { Send, Bot, User, Loader2, Sparkles, Zap } from 'lucide-react';

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
    <div className="flex flex-col h-[calc(100vh-140px)] bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm" id="chat-panel">
      {/* Progress header */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-semibold text-zinc-300">Konverzační asistent</span>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 bg-zinc-800/80 text-zinc-400 rounded-full">
            {filledCount}/{totalCount}
          </span>
        </div>
        <div className="w-full bg-zinc-800/60 h-1 rounded-full overflow-hidden">
          <div
            className="bg-gold h-full transition-all duration-700 ease-out rounded-full"
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
                isAssistant ? 'bg-gold/20 text-gold' : 'bg-zinc-700 text-zinc-300'
              }`}>
                {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              {/* Bubble */}
              <div className={`px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                isAssistant
                  ? 'bg-zinc-800/80 text-zinc-200 rounded-2xl rounded-tl-sm border border-zinc-700/40'
                  : 'bg-gold/20 text-zinc-100 rounded-2xl rounded-tr-sm border border-gold/10'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex gap-2.5 max-w-[88%] mr-auto animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-gold/20 text-gold flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-zinc-800/80 border border-zinc-700/40 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
              <span className="text-[11px] text-zinc-400">DocBot zpracovává...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-3 border-t border-zinc-800/50">
        {/* Smart suggestion chips */}
        {nextSuggestedPrompts.length > 0 && !isGenerating && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {nextSuggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSendMessage(prompt)}
                className="text-[10px] bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-300 hover:text-zinc-100 px-2.5 py-1.5 rounded-full border border-zinc-700/40 transition-all cursor-pointer"
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
            className="w-full pl-4 pr-12 py-2.5 bg-zinc-800/60 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/50 rounded-xl focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isGenerating}
            className="absolute right-1.5 p-2 bg-gold/80 hover:bg-gold text-zinc-950 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-gold/80 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
