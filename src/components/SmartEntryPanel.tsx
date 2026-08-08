// src/components/SmartEntryPanel.tsx
// Nový adaptivní vstupní panel — JÁDRO NOVÉHO UX.
// Uživatel sem může hodit Ctrl+V (text), fotku vizitky, nebo vybrat existující entitu.
// AI naparsuje, potvrdí, a flow si sám označí kroky jako hotové.

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardPaste,
  Camera,
  Link2,
  Sparkles,
  Check,
  X,
  Loader2,
  User,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { Counterparty, ParsedEntityData, MyProfile } from '../lib/entities';
import { parseEntityData } from '../lib/aiParser';

// ──────────────────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────────────────

interface SmartEntryPanelProps {
  mode: 'me' | 'counterparty';
  initialValue?: Partial<MyProfile> | Partial<Counterparty>;
  // Co dělat s naparsovanými daty
  onConfirm: (data: ParsedEntityData) => void;
  // Co máme v obchodě pro rychlý výběr (klienti / šablony)
  recentItems?: Counterparty[];
  onSelectRecent?: (item: Counterparty) => void;
  onCancel?: () => void;
}

// ──────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────────────

export function SmartEntryPanel({
  mode,
  initialValue,
  onConfirm,
  recentItems = [],
  onSelectRecent,
  onCancel,
}: SmartEntryPanelProps) {
  const [stage, setStage] = useState<'input' | 'parsing' | 'review'>('input');
  const [pastedText, setPastedText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedEntityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'paste' | 'photo' | 'url'>('paste');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMe = mode === 'me';
  const titleText = isMe ? 'Tvoje údaje' : 'Druhá strana';
  const accentColor = isMe ? 'amber' : 'cyan';

  // ── Run parser ──
  const runParse = useCallback(async (payload: {
    text?: string;
    imageBase64?: string;
    imageMimeType?: string;
    url?: string;
  }) => {
    setStage('parsing');
    setError(null);

    try {
      const result = await parseEntityData({
        ...payload,
        contractType: 'work',
        hint: isMe ? 'Toto jsou údaje o MĚ (uživatel)' : 'Toto jsou údaje o DRUHÉ STRANĚ',
      });

      if (!result.success || !result.data) {
        setError(result.error || 'Nepodařilo se naparsovat data.');
        setStage('input');
        return;
      }

      setParsedData(result.data);
      setStage('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba');
      setStage('input');
    }
  }, [isMe]);

  // ── Paste handler ──
  const handlePaste = useCallback(async () => {
    if (!pastedText.trim()) {
      setError('Nejdřív vlož nějaký text (Ctrl+V).');
      return;
    }
    runParse({ text: pastedText });
  }, [pastedText, runParse]);

  // ── Photo handler ──
  const handlePhotoUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('To musí být obrázek (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      runParse({ imageBase64: base64, imageMimeType: file.type });
    };
    reader.readAsDataURL(file);
  }, [runParse]);

  // ── Reset ──
  const reset = useCallback(() => {
    setStage('input');
    setPastedText('');
    setParsedData(null);
    setError(null);
  }, []);

  const accentClasses: Record<string, string> = {
    amber: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${accentClasses[accentColor]}`}>
            {isMe ? <User className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm font-medium text-zinc-100">{titleText}</h2>
            <p className="text-xs text-zinc-500">
              {stage === 'input' && 'Hodit sem text, fotku, nebo vyber ze seznamu.'}
              {stage === 'parsing' && 'AI parsuje...'}
              {stage === 'review' && 'Zkontroluj, co jsem našel.'}
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <AnimatePresence mode="wait">
          {stage === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Quick select from library */}
              {!isMe && recentItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                    Poslední klienti
                  </p>
                  <div className="space-y-1.5">
                    {recentItems.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onSelectRecent?.(item)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 bg-zinc-800/60 hover:bg-zinc-800 rounded-lg text-left transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-medium">
                          {item.label.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-100 truncate">{item.label}</p>
                          <p className="text-xs text-zinc-500 truncate">
                            {item.businessName || item.fullName}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                      nebo nový
                    </span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'paste' as const, icon: ClipboardPaste, label: 'Ctrl+V' },
                  { id: 'photo' as const, icon: Camera, label: 'Foto' },
                  { id: 'url' as const, icon: Link2, label: 'URL' },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                        active
                          ? `bg-zinc-800 text-zinc-100 border border-zinc-700`
                          : 'bg-zinc-900/40 text-zinc-500 hover:text-zinc-300 border border-zinc-800/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Input area based on tab */}
              {activeTab === 'paste' && (
                <div className="space-y-2">
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Vlož sem vizitku, fakturu, e-mail, cokoliv...&#10;&#10;Např:&#10;Jan Novák&#10;IČO: 12345678&#10;ACME s.r.o.&#10;Bankovní účet: 123456789/0100&#10;jan@novak.cz&#10;+420 777 123 456"
                    rows={8}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-700 font-mono"
                  />
                  <button
                    onClick={handlePaste}
                    disabled={!pastedText.trim()}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      pastedText.trim()
                        ? `bg-${accentColor}-500 text-zinc-950 hover:bg-${accentColor}-400`
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                    style={
                      pastedText.trim()
                        ? {
                            backgroundColor: isMe ? '#f59e0b' : '#06b6d4',
                            color: '#0a0a0a',
                          }
                        : undefined
                    }
                  >
                    <Sparkles className="w-4 h-4" />
                    Analyzovat
                  </button>
                </div>
              )}

              {activeTab === 'photo' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl py-8 px-4 text-center cursor-pointer transition-colors group"
                >
                  <Camera className="w-8 h-8 mx-auto mb-3 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  <p className="text-sm text-zinc-300 mb-1">Vyfotit nebo vybrat obrázek</p>
                  <p className="text-xs text-zinc-600">Vizitka, faktura, jakýkoliv dokument</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }}
                  />
                </div>
              )}

              {activeTab === 'url' && (
                <UrlInputForm onSubmit={(url) => runParse({ url })} accentColor={accentColor} />
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}
            </motion.div>
          )}

          {stage === 'parsing' && (
            <motion.div
              key="parsing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-transparent"
                  style={{ borderTopColor: isMe ? '#f59e0b' : '#06b6d4' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <p className="text-sm text-zinc-400">AI hledá údaje...</p>
              <p className="text-xs text-zinc-600">Trvá to 2–5 sekund</p>
            </motion.div>
          )}

          {stage === 'review' && parsedData && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <ReviewSection
                title={isMe ? 'Tvoje údaje' : 'Co jsem našel'}
                data={isMe ? parsedData.myProfile : parsedData.counterparty}
                isMe={isMe}
              />

              {parsedData.confidence < 0.6 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">
                  ⚠️ Nejsem si úplně jistý. Zkontroluj pečlivě.
                </div>
              )}

              {parsedData.missingFields.length > 0 && (
                <div className="p-3 bg-zinc-800/50 rounded-lg text-xs text-zinc-400">
                  <p className="font-medium text-zinc-300 mb-1">Chybí mi:</p>
                  <p>{parsedData.missingFields.join(', ')}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={reset}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Zkusit znovu
                </button>
                <button
                  onClick={() => onConfirm(parsedData)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 text-zinc-950"
                  style={{
                    backgroundColor: isMe ? '#f59e0b' : '#06b6d4',
                  }}
                >
                  <Check className="w-4 h-4" />
                  Použít
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// URL INPUT
// ──────────────────────────────────────────────────────────────────────────

function UrlInputForm({ onSubmit, accentColor }: { onSubmit: (url: string) => void; accentColor: string }) {
  const [url, setUrl] = useState('');

  return (
    <div className="space-y-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://firma.cz/kontakt"
        className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
      />
      <button
        onClick={() => url.trim() && onSubmit(url.trim())}
        disabled={!url.trim()}
        className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
          url.trim() ? 'text-zinc-950' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
        }`}
        style={
          url.trim()
            ? {
                backgroundColor: accentColor === 'amber' ? '#f59e0b' : '#06b6d4',
              }
            : undefined
        }
      >
        <Sparkles className="w-4 h-4" />
        Načíst stránku
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// REVIEW SECTION — Zobrazení naparsovaných dat
// ──────────────────────────────────────────────────────────────────────────

function ReviewSection({
  title,
  data,
  isMe,
}: {
  title: string;
  data: any;
  isMe: boolean;
}) {
  if (!data) {
    return (
      <div className="p-4 bg-zinc-800/50 rounded-lg text-sm text-zinc-500 text-center">
        Žádné údaje k zobrazení.
      </div>
    );
  }

  const fields = [
    { key: 'fullName', label: 'Jméno' },
    { key: 'businessName', label: 'Firma' },
    { key: 'ico', label: 'IČO' },
    { key: 'dic', label: 'DIČ' },
    { key: 'street', label: 'Ulice' },
    { key: 'city', label: 'Město' },
    { key: 'zip', label: 'PSČ' },
    { key: 'bankAccount', label: 'Bankovní účet' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefon' },
  ];

  const visibleFields = fields.filter((f) => data[f.key] && String(data[f.key]).trim());

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{title}</p>
      <div className="bg-zinc-950 rounded-lg border border-zinc-800 divide-y divide-zinc-800/50">
        {visibleFields.map((field) => (
          <div key={field.key} className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-zinc-500">{field.label}</span>
            <span className="text-sm text-zinc-200 font-mono">{String(data[field.key])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}