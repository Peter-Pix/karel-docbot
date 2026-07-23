import React from 'react';
import { RiskAnalysisResult, Risk } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, Loader2, Sparkles, ArrowRight } from 'lucide-react';

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
  
  // Helper for safety score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400 border-amber-200 bg-amber-50 dark:bg-amber-950/20';
    return 'text-red-600 dark:text-red-400 border-red-200 bg-red-50 dark:bg-red-950/20';
  };

  const getRiskLevelBadge = (level: Risk['level']) => {
    switch (level) {
      case 'high':
        return (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            Vysoké riziko
          </span>
        );
      case 'medium':
        return (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            Střední riziko
          </span>
        );
      case 'low':
        return (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
            <Info className="w-3.5 h-3.5" />
            Nízké riziko
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm" id="risk-analysis-panel">
      {/* Panel Header */}
      <div className="p-4 bg-gray-50/50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <h2 className="text-md font-bold text-gray-800 dark:text-gray-200">
            AI Kontrola rizik a revize
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Zavřít
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {/* State 1: Not run yet */}
        {!analysis && !isLoading && (
          <div className="flex flex-col items-center justify-center text-center h-full py-12 px-4 max-w-sm mx-auto">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl text-emerald-600 dark:text-emerald-400 mb-4 border border-emerald-100 dark:border-emerald-950">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Zkontrolujte smlouvu s AI
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Náš právní AI asistent podrobně přečte aktuální text smlouvy, upozorní vás na nevýhodné lhůty či pokuty a navrhne bezpečnější formulace.
            </p>
            <button
              onClick={onRunAnalysis}
              id="btn-trigger-risk-analysis"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Analyzovat rizika smlouvy
            </button>
          </div>
        )}

        {/* State 2: Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4 max-w-sm mx-auto text-center">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Právní analýza probíhá...
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed animate-pulse">
              AI asistent skenuje text, ověřuje soulad s občanským zákoníkem a vyhodnocuje optimální smluvní rovnováhu.
            </p>
            <div className="w-full space-y-2 text-left bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Analýza výpovědních lhůt a odstupného</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Kontrola výše smluvních pokut a kaucí</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Formulování vyvážených doložek</span>
              </div>
            </div>
          </div>
        )}

        {/* State 3: Analysis Results */}
        {analysis && !isLoading && (
          <div className="space-y-6 animate-fade-in">
            {/* Safety Score Card */}
            <div className={`p-4 border rounded-xl flex items-center gap-4 ${getScoreColor(analysis.safetyScore)}`}>
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full border-4 border-current font-extrabold text-xl">
                {analysis.safetyScore}%
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                  Skóre bezpečnosti smlouvy
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                  {analysis.safetyScore >= 80 
                    ? 'Smlouva je výborně vyvážená a splňuje standardní ochranná doporučení.' 
                    : analysis.safetyScore >= 50 
                    ? 'Bylo nalezeno několik mírně riskantních či nevyvážených ustanovení.' 
                    : 'Pozor! Smlouva obsahuje kritická nebo právně neplatná ustanovení.'}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-950/40 p-4 rounded-xl text-xs leading-relaxed text-gray-700 dark:text-gray-300">
              <span className="font-bold block text-gray-800 dark:text-gray-200 mb-1">
                Celkové právní zhodnocení:
              </span>
              {analysis.summary}
            </div>

            {/* Title */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-1.5">
                Nalezená rizika ({analysis.risks.length})
              </h3>

              {analysis.risks.length === 0 ? (
                <div className="p-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center text-sm text-gray-500">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  Nebylo nalezeno žádné významné riziko. Smlouva je připravena!
                </div>
              ) : (
                <div className="space-y-4">
                  {analysis.risks.map((risk) => (
                    <div 
                      key={risk.id}
                      className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-950 space-y-3"
                    >
                      {/* Risk top bar */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                          {risk.title}
                        </h4>
                        {getRiskLevelBadge(risk.level)}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {risk.description}
                      </p>

                      {/* Suggestion explanation */}
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded border border-emerald-100/30 dark:border-emerald-950/30">
                        <strong>Doporučení:</strong> {risk.suggestion}
                      </div>

                      {/* Before / After comparison */}
                      <div className="grid grid-cols-1 gap-2 text-[10px] font-mono leading-relaxed pt-1">
                        <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-100/30 dark:border-red-950/30 rounded text-red-800 dark:text-red-300">
                          <span className="font-bold uppercase block text-[8px] tracking-wider mb-1 text-red-500">
                            Aktuální znění ve smlouvě:
                          </span>
                          "{risk.targetText}"
                        </div>
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-950/30 rounded text-emerald-800 dark:text-emerald-300">
                          <span className="font-bold uppercase block text-[8px] tracking-wider mb-1 text-emerald-500">
                            Navržené bezpečné znění:
                          </span>
                          "{risk.replacementText}"
                        </div>
                      </div>

                      {/* Fix action */}
                      <button
                        type="button"
                        onClick={() => !risk.applied && onApplyFix(risk.id, risk.targetText, risk.replacementText)}
                        disabled={risk.applied}
                        className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-4 rounded-lg border transition-all cursor-pointer ${
                          risk.applied
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950'
                            : 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-850 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-850 shadow-sm'
                        }`}
                      >
                        {risk.applied ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            Bezpečné znění aplikováno
                          </>
                        ) : (
                          <>
                            Použít bezpečnější formulaci
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer run again */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={onRunAnalysis}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
              >
                Přepočítat / Analyzovat znovu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
