// src/components/DisclaimerBanner.tsx
// Právní disclaimer banner — viditelné upozornění, že DocBot není právní poradna.

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DisclaimerBannerProps {
  /** Kompaktní varianta pro dokument preview (menší, méně rušivá). */
  compact?: boolean;
}

export function DisclaimerBanner({ compact = false }: DisclaimerBannerProps) {
  return (
    <div
      role="note"
      aria-label="Právní upozornění"
      className={`flex items-start gap-2.5 rounded-xl border border-[rgba(200,150,46,0.25)] bg-[rgba(200,150,46,0.08)] text-[#d4a94e] ${
        compact ? 'px-3 py-2' : 'px-4 py-3'
      }`}
    >
      <AlertTriangle className={`shrink-0 mt-0.5 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
      <p className={`leading-snug ${compact ? 'text-[11px]' : 'text-xs'}`}>
        <strong className="font-semibold">Nejsme právní poradna.</strong>{' '}
        Vygenerovaný dokument je návrh — před podpisem ho prověřte advokátem.
      </p>
    </div>
  );
}
