// src/components/ContractHistory.tsx
// B3: Historie smluv — seznam uložených smluv (rozpracovaných i dokončených),
// ke kterým se uživatel může vrátit i po nové session.

import React from 'react';
import { Clock, CheckCircle2, FileText, Trash2, ChevronRight, History } from 'lucide-react';
import { ContractHistoryEntry } from '../lib/sessionStore';

interface ContractHistoryProps {
  entries: ContractHistoryEntry[];
  onOpen: (entry: ContractHistoryEntry) => void;
  onDelete: (id: string) => void;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  nda: '🤝',
  rent: '🏠',
  employment: '💼',
  work: '🔨',
};

function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function ContractHistory({ entries, onOpen, onDelete }: ContractHistoryProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-[#71717a]">
        <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Zatím žádné uložené smlouvy.</p>
        <p className="text-xs mt-1">Rozpracované i dokončené smlouvy se objeví tady.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="apple-card flex items-center gap-3 p-3 cursor-pointer group hover:border-[rgba(200,150,46,0.3)] transition-colors"
          onClick={() => onOpen(entry)}
        >
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-[rgba(200,150,46,0.1)] text-[#c8962e] border border-[rgba(200,150,46,0.2)] flex items-center justify-center shrink-0 text-lg">
            {TYPE_ICON[entry.contractType] ?? <FileText className="w-5 h-5" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#f4f4f5] truncate">
                {entry.title}
              </span>
              {entry.status === 'completed' ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Dokončeno
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5 shrink-0">
                  <Clock className="w-3 h-3" />
                  Rozpracováno
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#71717a] mt-0.5">
              Uloženo {formatDate(entry.savedAt)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-2 rounded-lg text-[#71717a] hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title="Smazat z historie"
              aria-label="Smazat z historie"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <ChevronRight className="w-4 h-4 text-[#71717a] group-hover:text-[#c8962e] transition-colors" />
          </div>
        </div>
      ))}
    </div>
  );
}
