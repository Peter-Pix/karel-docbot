import React from 'react';
import { RiskAnalysisResult, Risk } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, Loader2, Sparkles, ArrowRight, Zap } from 'lucide-react';

interface RiskAnalysisPanelProps {
  analysis: RiskAnalysisResult | null;
  isLoading: boolean;
  onRunAnalysis: () => void;
  onApplyFix: (riskId: string, targetText: string, replacementText: string) => void;
  onClose: () => void;
}

export function RiskAnalysisPanel({
  analysis,
  isLoading,
  onRunAnalysis,
  onApplyFix,
  onClose,
}: RiskAnalysisPanelProps) {

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-950/20';
    return 'text-red-400 border-red-500/30 bg-red-950/20';
  };

  const getRiskLevelBadge = (level: Risk['level']) => {
    switch (level) {
      case 'high':
        return <span className="apple-badge bg-red-950/60 text-red-300 border border-red-500/20"><ShieldAlert className="w-3 h-3" /> Vysoké</span>;
      case 'medium':
        return <span className="apple-badge bg-amber-950/60 text-amber-300 border border-amber-500/20"><AlertTriangle className="w-3 h-3" /> Střední</span>;
      case 'low':
        return <span className="apple-badge bg-sky-950/60 text-sky-300 border border-sky-500/20"><Info className="w-3 h-3" /> Nízké</span>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm" id="risk-analysis-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-gold" />
          <h2 className="text-sm font-semibold text-zinc-200">AI Kontrola rizik</h2>
        </div>
        <button onClick={onClose} className="text-[11px] text-zinc-500 hover:text-zinc-200 font-medium px-2 py-1 rounded-lg hover:bg-zinc-800/60 transition-all cursor-pointer">
          Zavřít
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-5">
        {/* State 1: Not run */}
        {!analysis && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4 max-w-xs mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100 mb-2">Zkontrolovat smlouvu</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              AI přečte text smlouvy, odhalí nevýhodné doložky a navrhne bezpečnější formulace.
            </p>
            <button
              onClick={onRunAnalysis}
              className="w-full flex items-center justify-center gap-2 bg-gold/80 hover:bg-gold text-zinc-950 font-semibold text-sm py-2.5 px-5 rounded-xl transition-all shadow-lg cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Analyzovat rizika
            </button>
          </div>
        )}

        {/* State 2: Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4 max-w-xs mx-auto text-center">
            <Loader2 className="w-8 h-8 text-gold animate-spin mb-4" />
            <h3 className="text-sm font-semibold text-zinc-100 mb-2">Právní analýza probíhá...</h3>
            <p className="text-xs text-zinc-500 animate-pulse">Kontrola souladu s občanským zákoníkem</p>
            <div className="mt-6 w-full space-y-2 text-left bg-zinc-800/40 p-3 rounded-xl border border-zinc-700/30 text-[10px] text-zinc-400">
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />Analýza výpovědních lhůt</div>
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />Kontrola smluvních pokut</div>
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />Formulace bezpečných doložek</div>
            </div>
          </div>
        )}

        {/* State 3: Results */}
        {analysis && !isLoading && (
          <div className="space-y-5 animate-fade-in">
            {/* Score card */}
            <div className={`p-4 border rounded-xl flex items-center gap-4 ${getScoreColor(analysis.safetyScore)}`}>
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full border-[3px] border-current font-bold text-lg flex-shrink-0">
                {analysis.safetyScore}%
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">Skóre bezpečnosti</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  {analysis.safetyScore >= 80 ? 'Smlouva je výborně vyvážená.' :
                   analysis.safetyScore >= 50 ? 'Nalezena mírně riziková ustanovení.' :
                   'Smlouva obsahuje kritické právní vady.'}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gold/5 border border-gold/10 p-3 rounded-xl text-[11px] leading-relaxed text-zinc-300">
              <span className="font-semibold text-zinc-100 block mb-1">Právní zhodnocení:</span>
              {analysis.summary}
            </div>

            {/* Risks */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-300 mb-3 flex items-center gap-1.5">
                Nalezená rizika ({analysis.risks.length})
              </h3>

              {analysis.risks.length === 0 ? (
                <div className="p-6 border border-dashed border-zinc-700 rounded-xl text-center text-xs text-zinc-500">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  Smlouva je čistá.
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.risks.map((risk) => (
                    <div key={risk.id} className="border border-zinc-800 rounded-xl p-3.5 bg-zinc-900/60 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-zinc-100">{risk.title}</h4>
                        {getRiskLevelBadge(risk.level)}
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed">{risk.description}</p>

                      <div className="text-[10px] text-gold/80 font-medium bg-gold/5 p-2 rounded border border-gold/10">
                        <strong>Doporučení:</strong> {risk.suggestion}
                      </div>

                      {/* Before/After */}
                      <div className="grid grid-cols-1 gap-1.5 text-[10px] font-mono">
                        <div className="p-2 bg-red-950/20 border border-red-500/10 rounded text-red-300">
                          <span className="font-bold uppercase text-[7px] tracking-wider text-red-400 block mb-0.5">Aktuálně:</span>
                          "{risk.targetText}"
                        </div>
                        <div className="p-2 bg-emerald-950/20 border border-emerald-500/10 rounded text-emerald-300">
                          <span className="font-bold uppercase text-[7px] tracking-wider text-emerald-400 block mb-0.5">Návrh:</span>
                          "{risk.replacementText}"
                        </div>
                      </div>

                      {/* Apply button */}
                      <button
                        onClick={() => !risk.applied && onApplyFix(risk.id, risk.targetText, risk.replacementText)}
                        disabled={risk.applied}
                        className={`w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2 px-3 rounded-lg border transition-all cursor-pointer ${
                          risk.applied
                            ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20'
                            : 'bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-200 border-zinc-700/50'
                        }`}
                      >
                        {risk.applied ? (
                          <><CheckCircle className="w-3 h-3" /> Opraveno</>
                        ) : (
                          <><Zap className="w-3 h-3" /> Použít bezpečnější znění</>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Re-run */}
            <div className="pt-3 border-t border-zinc-800/50">
              <button
                onClick={onRunAnalysis}
                className="w-full flex items-center justify-center gap-2 border border-zinc-700/50 hover:bg-zinc-800/60 text-zinc-400 text-[11px] font-medium py-2 px-3 rounded-xl transition-all cursor-pointer"
              >
                Analyzovat znovu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
