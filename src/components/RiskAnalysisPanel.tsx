import React from 'react';
import { RiskAnalysisResult, Risk } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, Loader2, Sparkles, Zap } from 'lucide-react';

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
    if (score >= 50) return 'text-[#c8962e] border-[rgba(200,150,46,0.3)] bg-[rgba(200,150,46,0.05)]';
    return 'text-red-400 border-red-500/30 bg-red-950/20';
  };

  const getRiskLevelBadge = (level: Risk['level']) => {
    switch (level) {
      case 'high':
        return <span className="apple-badge bg-red-950/60 text-red-300 border border-red-500/20"><ShieldAlert className="w-3 h-3" /> Vysoké</span>;
      case 'medium':
        return <span className="apple-badge bg-[rgba(200,150,46,0.1)] text-[#c8962e] border border-[rgba(200,150,46,0.2)]"><AlertTriangle className="w-3 h-3" /> Střední</span>;
      case 'low':
      default:
        return <span className="apple-badge bg-sky-950/60 text-sky-300 border border-sky-500/20"><Info className="w-3 h-3" /> Nízké</span>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm" id="risk-analysis-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#c8962e]" />
          <h2 className="text-sm font-semibold text-[#f4f4f5]">AI Kontrola rizik</h2>
        </div>
        <button onClick={onClose} className="text-[11px] text-[#71717a] hover:text-[#f4f4f5] font-medium px-2 py-1 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer">
          Zavřít
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-5">
        {/* State 1: Not run */}
        {!analysis && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4 max-w-xs mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(200,150,46,0.1)] border border-[rgba(200,150,46,0.2)] flex items-center justify-center text-[#c8962e] mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[#f4f4f5] mb-2">Zkontrolovat smlouvu</h3>
            <p className="text-xs text-[#71717a] mb-6 leading-relaxed">
              AI přečte text smlouvy, odhalí nevýhodné doložky a navrhne bezpečnější formulace.
            </p>
            <button
              onClick={onRunAnalysis}
              className="w-full flex items-center justify-center gap-2 bg-[#c8962e] hover:bg-[#e4b44a] text-[#09090b] font-semibold text-sm py-2.5 px-5 rounded-xl transition-all shadow-lg cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Analyzovat rizika
            </button>
          </div>
        )}

        {/* State 2: Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4 max-w-xs mx-auto text-center">
            <Loader2 className="w-8 h-8 text-[#c8962e] animate-spin mb-4" />
            <h3 className="text-sm font-semibold text-[#f4f4f5] mb-2">Právní analýza probíhá...</h3>
            <p className="text-xs text-[#71717a] animate-pulse">Kontrola souladu s občanským zákoníkem</p>
            <div className="mt-6 w-full space-y-2 text-left bg-[rgba(255,255,255,0.03)] p-3 rounded-xl border border-[rgba(255,255,255,0.06)] text-[10px] text-[#71717a]">
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#c8962e] animate-pulse" />Analýza výpovědních lhůt</div>
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#c8962e] animate-pulse" />Kontrola smluvních pokut</div>
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#c8962e] animate-pulse" />Formulace bezpečných doložek</div>
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
                <h4 className="text-sm font-semibold text-[#f4f4f5]">Skóre bezpečnosti</h4>
                <p className="text-[11px] text-[#71717a] mt-0.5 leading-relaxed">
                  {analysis.safetyScore >= 80 ? 'Smlouva je výborně vyvážená.' :
                   analysis.safetyScore >= 50 ? 'Nalezena mírně riziková ustanovení.' :
                   'Smlouva obsahuje kritické právní vady.'}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[rgba(200,150,46,0.05)] border border-[rgba(200,150,46,0.1)] p-3 rounded-xl text-[11px] leading-relaxed text-[#a1a1aa]">
              <span className="font-semibold text-[#f4f4f5] block mb-1">Právní zhodnocení:</span>
              {analysis.summary}
            </div>

            {/* Risks */}
            <div>
              <h3 className="text-xs font-semibold text-[#a1a1aa] mb-3 flex items-center gap-1.5">
                Nalezená rizika ({analysis?.risks?.length || 0})
              </h3>

              {(!analysis?.risks || analysis.risks.length === 0) ? (
                <div className="p-6 border border-dashed border-[rgba(255,255,255,0.08)] rounded-xl text-center text-xs text-[#71717a]">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  Smlouva je čistá.
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.risks.map((risk) => (
                    <div key={risk.id} className="border border-[rgba(255,255,255,0.06)] rounded-xl p-3.5 bg-[rgba(255,255,255,0.03)] space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-[#f4f4f5]">{risk.title}</h4>
                        {getRiskLevelBadge(risk.level)}
                      </div>

                      <p className="text-[11px] text-[#71717a] leading-relaxed">{risk.description}</p>

                      <div className="text-[10px] text-[#c8962e]/80 font-medium bg-[rgba(200,150,46,0.05)] p-2 rounded border border-[rgba(200,150,46,0.1)]">
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
                            : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] text-[#f4f4f5] border-[rgba(255,255,255,0.08)]'
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
            <div className="pt-3 border-t border-[rgba(255,255,255,0.06)]">
              <button
                onClick={onRunAnalysis}
                className="w-full flex items-center justify-center gap-2 border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.05)] text-[#71717a] text-[11px] font-medium py-2 px-3 rounded-xl transition-colors cursor-pointer"
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
