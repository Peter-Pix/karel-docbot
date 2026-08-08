import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional label for the fallback UI (e.g. "chat", "náhled smlouvy") */
  label?: string;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that isolates component crashes.
 * If a child throws during render, only that panel shows a fallback
 * instead of the entire app white-screening.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console for debugging (could be extended to an error reporting service)
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-6 text-center bg-zinc-900/40 border border-zinc-800/50 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-950/30 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100 mb-1">
            {this.props.label ? `Něco se pokazilo v sekci „${this.props.label}“` : 'Něco se pokazilo'}
          </h3>
          <p className="text-xs text-zinc-400 mb-4 max-w-xs leading-relaxed">
            Došlo k neočekávané chybě. Ostatní části aplikace by měly fungovat dál.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 text-[11px] font-semibold bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-200 border border-zinc-700/50 py-2 px-4 rounded-lg transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Zkusit znovu
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}