// src/components/MultiInputComposer.tsx
// "Dementozdorný" composer: Uživatel může házet cokoliv — fotky, text, URL.
// Postupně se přidávají do "drop zóny", AI to analyzuje najednou a sjednotí.

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardPaste,
  Camera,
  Link2,
  Plus,
  Sparkles,
  Check,
  X,
  Loader2,
  FileText,
  Image as ImageIcon,
  Globe,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { Counterparty, ParsedEntityData, MyProfile } from '../lib/entities';
import { parseMultipleEntityData, parseEntityData } from '../lib/aiParser';
import { mergeParsedData, fuzzyNormalize } from '../lib/multiInputComposer';

// ──────────────────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────────────────

type SourceKind = 'text' | 'image' | 'url';

interface ComposerSource {
  id: string;
  kind: SourceKind;
  preview: string; // náhled textu, image data URL, nebo URL
  label?: string;
  status: 'idle' | 'analyzing' | 'done' | 'error';
  result?: ParsedEntityData;
}

interface MultiInputComposerProps {
  mode: 'me' | 'counterparty';
  initialValue?: Partial<MyProfile> | Partial<Counterparty>;
  onConfirm: (data: ParsedEntityData) => void;
  onCancel?: () => void;
}

// ──────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────────────

export function MultiInputComposer({
  mode,
  onConfirm,
  onCancel,
}: MultiInputComposerProps) {
  const [sources, setSources] = useState<ComposerSource[]>([]);
  const [stage, setStage] = useState<'collecting' | 'analyzing' | 'review'>('collecting');
  const [mergedData, setMergedData] = useState<ParsedEntityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeInput, setActiveInput] = useState<SourceKind | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMe = mode === 'me';
  const accentColor = isMe ? 'amber' : 'cyan';

  // ── Přidej zdroj ──
  const addSource = useCallback((source: Omit<ComposerSource, 'id' | 'status'>) => {
    const id = `src_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setSources((prev) => [...prev, { ...source, id, status: 'idle' }]);
  }, []);

  // ── Odeber zdroj ──
  const removeSource = useCallback((id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // ── Analyzuj VŠECHNY zdroje najednou ──
  const analyzeAll = useCallback(async () => {
    if (sources.length === 0) {
      setError('Přidej aspoň jeden zdroj.');
      return;
    }

    setStage('analyzing');
    setError(null);

    try {
      // Pokud je jen jeden zdroj, použij single parser
      if (sources.length === 1) {
        const s = sources[0];
        let req: any = { contractType: 'work', hint: isMe ? 'údaje o mně' : 'údaje o protistraně' };

        if (s.kind === 'text') req.text = s.preview;
        else if (s.kind === 'image') {
          req.imageBase64 = s.preview.split(',')[1];
          req.imageMimeType = 'image/jpeg';
        }
        else if (s.kind === 'url') req.url = s.preview;

        const result = await parseEntityData(req);
        if (!result.success || !result.data) {
          setError(result.error || 'Nepodařilo se analyzovat.');
          setStage('collecting');
          return;
        }

        setMergedData(result.data);
        setStage('review');
        return;
      }

      // Více zdrojů: multi-source parser
      const reqSources = sources.map((s) => {
        if (s.kind === 'text') return { text: s.preview, label: s.label };
        if (s.kind === 'image') return { imageBase64: s.preview.split(',')[1], imageMimeType: 'image/jpeg', label: s.label };
        if (s.kind === 'url') return { url: s.preview, label: s.label };
        return { text: '', label: s.label };
      });

      const result = await parseMultipleEntityData({
        sources: reqSources,
        contractType: 'work',
        mode,
      });

      if (!result.success || !result.data) {
        // Fallback: merge na klientu
        console.warn('Multi-parser failed, falling back to client-side merge');

        const singleResults: ParsedEntityData[] = [];
        for (const s of sources) {
          let req: any = { contractType: 'work', hint: isMe ? 'údaje o mně' : 'údaje o protistraně' };
          if (s.kind === 'text') req.text = s.preview;
          else if (s.kind === 'image') {
            req.imageBase64 = s.preview.split(',')[1];
            req.imageMimeType = 'image/jpeg';
          }
          else if (s.kind === 'url') req.url = s.preview;

          const r = await parseEntityData(req);
          if (r.success && r.data) singleResults.push(r.data);
        }

        if (singleResults.length === 0) {
          setError('Nepodařilo se analyzovat žádný zdroj.');
          setStage('collecting');
          return;
        }

        const merged = mergeParsedData(singleResults);
        setMergedData(merged);
        setStage('review');
        return;
      }

      // Aplikuj fuzzy normalizaci na výsledek
      const normalized = normalizeResult(result.data);
      setMergedData(normalized);
      setStage('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba');
      setStage('collecting');
    }
  }, [sources, isMe, mode]);

  // ── Reset ──
  const reset = useCallback(() => {
    setSources([]);
    setMergedData(null);
    setStage('collecting');
    setError(null);
  }, []);

  return (
    <div className="flex flex-col h-full bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-100">
            {stage === 'collecting' && (isMe ? 'Tvoje údaje' : 'Druhá strana')}
            {stage === 'analyzing' && 'Analyzuji...'}
            {stage === 'review' && 'Hotovo — zkontroluj'}
          </h2>
          <p className="text-xs text-zinc-500">
            {stage === 'collecting' && 'Hoď sem cokoliv. Text, fotku, URL — v libovolném pořadí.'}
            {stage === 'analyzing' && `Slévám ${sources.length} ${sources.length === 1 ? 'zdroj' : sources.length < 5 ? 'zdroje' : 'zdrojů'} dohromady`}
            {stage === 'review' && 'Pokud něco chybí, můžeš přidat další zdroj.'}
          </p>
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
          {stage === 'collecting' && (
            <motion.div
              key="collecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Drop zone pro všechno */}
              {sources.length === 0 ? (
                <EmptyState
                  onAddText={() => setActiveInput('text')}
                  onAddPhoto={() => fileInputRef.current?.click()}
                  onAddUrl={() => setActiveInput('url')}
                  accentColor={accentColor}
                />
              ) : (
                <div className="space-y-3">
                  {sources.map((source) => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      onRemove={() => removeSource(source.id)}
                    />
                  ))}

                  <button
                    onClick={() => setActiveInput(null)}
                    className="w-full p-3 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Přidat další zdroj
                  </button>
                </div>
              )}

              {/* Inline input forms */}
              <AnimatePresence>
                {activeInput === 'text' && (
                  <TextInputForm
                    onSubmit={(text, label) => {
                      addSource({ kind: 'text', preview: text, label });
                      setActiveInput(null);
                    }}
                    onCancel={() => setActiveInput(null)}
                  />
                )}

                {activeInput === 'url' && (
                  <UrlInputForm
                    onSubmit={(url) => {
                      addSource({ kind: 'url', preview: url });
                      setActiveInput(null);
                    }}
                    onCancel={() => setActiveInput(null)}
                  />
                )}
              </AnimatePresence>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = () => {
                    addSource({
                      kind: 'image',
                      preview: reader.result as string,
                      label: file.name,
                    });
                  };
                  reader.readAsDataURL(file);
                }}
              />

              {/* Akce */}
              {sources.length > 0 && (
                <button
                  onClick={analyzeAll}
                  className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-zinc-950 transition-colors"
                  style={{
                    backgroundColor: isMe ? '#f59e0b' : '#06b6d4',
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Analyzovat {sources.length > 1 ? `(${sources.length} zdroje)` : ''}
                </button>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}
            </motion.div>
          )}

          {stage === 'analyzing' && (
            <motion.div
              key="analyzing"
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
              <p className="text-sm text-zinc-400">Slévám zdroje dohromady...</p>
              <p className="text-xs text-zinc-600">Trvá to 3–8 sekund</p>
            </motion.div>
          )}

          {stage === 'review' && mergedData && (
            <ReviewPanel
              data={mergedData}
              isMe={isMe}
              sourceCount={sources.length}
              onConfirm={() => onConfirm(mergedData)}
              onAddMore={reset}
              onCancel={() => setStage('collecting')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ──────────────────────────────────────────────────────────────────────────

function EmptyState({
  onAddText,
  onAddPhoto,
  onAddUrl,
  accentColor,
}: {
  onAddText: () => void;
  onAddPhoto: () => void;
  onAddUrl: () => void;
  accentColor: string;
}) {
  const items = [
    { icon: ClipboardPaste, label: 'Vložit text', sublabel: 'Ctrl+V z e-mailu', onClick: onAddText },
    { icon: Camera, label: 'Vyfotit', sublabel: 'Vizitka, billboard, letáček', onClick: onAddPhoto },
    { icon: Link2, label: 'Zadat URL', sublabel: 'Web firmy', onClick: onAddUrl },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
        Jak chceš zadat údaje?
      </p>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-full p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-left transition-colors group flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center border"
              style={{
                borderColor: accentColor === 'amber' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(6, 182, 212, 0.3)',
                backgroundColor: accentColor === 'amber' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                color: accentColor === 'amber' ? '#fbbf24' : '#22d3ee',
              }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-zinc-100 font-medium">{item.label}</p>
              <p className="text-xs text-zinc-500">{item.sublabel}</p>
            </div>
            <Plus className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </button>
        );
      })}

      <p className="text-xs text-zinc-600 text-center pt-2">
        💡 Můžeš přidat víc zdrojů najednou — AI je spojí dohromady.
      </p>
    </div>
  );
}

function SourceCard({
  source,
  onRemove,
}: {
  source: ComposerSource;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const Icon = source.kind === 'text' ? FileText : source.kind === 'image' ? ImageIcon : Globe;
  const iconColor = source.kind === 'text' ? 'text-blue-400' : source.kind === 'image' ? 'text-purple-400' : 'text-green-400';

  let previewText = source.preview;
  if (source.kind === 'image') previewText = 'Obrázek';
  if (source.kind === 'url') previewText = source.preview;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden"
    >
      <div className="p-3 flex items-center gap-3">
        {source.kind === 'image' ? (
          <img
            src={source.preview}
            alt="preview"
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className={`w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            {source.kind === 'text' ? 'Text' : source.kind === 'image' ? 'Fotka' : 'URL'}
            {source.label && ` · ${source.label}`}
          </p>
          <p className="text-sm text-zinc-200 truncate font-mono">
            {previewText.length > 50 ? previewText.slice(0, 50) + '...' : previewText}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-500"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={onRemove}
          className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-zinc-500 hover:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && source.kind !== 'image' && (
        <div className="px-3 pb-3">
          <pre className="text-xs text-zinc-400 bg-zinc-900 rounded p-2 max-h-32 overflow-y-auto whitespace-pre-wrap">
            {source.preview}
          </pre>
        </div>
      )}
    </motion.div>
  );
}

function TextInputForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (text: string, label?: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2"
    >
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Vlož text... (Ctrl+V)"
        rows={5}
        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-700 font-mono"
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300"
        >
          Zrušit
        </button>
        <button
          onClick={() => text.trim() && onSubmit(text.trim())}
          disabled={!text.trim()}
          className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 rounded-lg text-sm font-medium"
        >
          Přidat
        </button>
      </div>
    </motion.div>
  );
}

function UrlInputForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (url: string) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2"
    >
      <input
        autoFocus
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://firma.cz/kontakt"
        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300"
        >
          Zrušit
        </button>
        <button
          onClick={() => url.trim() && onSubmit(url.trim())}
          disabled={!url.trim()}
          className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 rounded-lg text-sm font-medium"
        >
          Přidat
        </button>
      </div>
    </motion.div>
  );
}

function ReviewPanel({
  data,
  isMe,
  sourceCount,
  onConfirm,
  onAddMore,
  onCancel,
}: {
  data: ParsedEntityData;
  isMe: boolean;
  sourceCount: number;
  onConfirm: () => void;
  onAddMore: () => void;
  onCancel: () => void;
}) {
  const targetData = isMe ? data.myProfile : data.counterparty;

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

  const visibleFields = targetData
    ? fields.filter((f) => (targetData as any)[f.key] && String((targetData as any)[f.key]).trim())
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }}
        >
          <Check className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-zinc-100 font-medium">
            Spojeno ze {sourceCount} {sourceCount === 1 ? 'zdroje' : 'zdrojů'}
          </p>
          <p className="text-xs text-zinc-500">
            Jistota: {Math.round((data.confidence || 0) * 100)}%
          </p>
        </div>
      </div>

      {visibleFields.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
            Co jsem našel
          </p>
          <div className="bg-zinc-950 rounded-lg border border-zinc-800 divide-y divide-zinc-800/50">
            {visibleFields.map((field) => (
              <div key={field.key} className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-zinc-500">{field.label}</span>
                <span className="text-sm text-zinc-200 font-mono">
                  {String((targetData as any)[field.key])}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-zinc-900/50 rounded-lg text-sm text-zinc-500 text-center">
          Nic se nepodařilo najít. Zkus jiné zdroje.
        </div>
      )}

      {data.missingFields.length > 0 && (
        <div className="p-3 bg-zinc-900/50 rounded-lg text-xs text-zinc-400">
          <p className="font-medium text-zinc-300 mb-1">Chybí:</p>
          <p>{data.missingFields.join(', ')}</p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
        >
          Upravit zdroje
        </button>
        <button
          onClick={onAddMore}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
        >
          + Přidat další
        </button>
        <button
          onClick={onConfirm}
          disabled={visibleFields.length === 0}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 text-zinc-950 disabled:opacity-50"
          style={{
            backgroundColor: isMe ? '#f59e0b' : '#06b6d4',
          }}
        >
          <Check className="w-4 h-4" />
          Použít
        </button>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// FUZZY NORMALIZATION na výsledku
// ──────────────────────────────────────────────────────────────────────────

function normalizeResult(data: ParsedEntityData): ParsedEntityData {
  const normalized = { ...data };

  if (normalized.myProfile) {
    if (normalized.myProfile.ico) {
      normalized.myProfile.ico = fuzzyNormalize(normalized.myProfile.ico, 'ico');
    }
    if (normalized.myProfile.phone) {
      normalized.myProfile.phone = fuzzyNormalize(normalized.myProfile.phone, 'phone');
    }
    if (normalized.myProfile.bankAccount) {
      normalized.myProfile.bankAccount = fuzzyNormalize(normalized.myProfile.bankAccount, 'bankAccount');
    }
  }

  if (normalized.counterparty) {
    if (normalized.counterparty.ico) {
      normalized.counterparty.ico = fuzzyNormalize(normalized.counterparty.ico, 'ico');
    }
    if (normalized.counterparty.phone) {
      normalized.counterparty.phone = fuzzyNormalize(normalized.counterparty.phone, 'phone');
    }
    if (normalized.counterparty.bankAccount) {
      normalized.counterparty.bankAccount = fuzzyNormalize(normalized.counterparty.bankAccount, 'bankAccount');
    }
  }

  return normalized;
}