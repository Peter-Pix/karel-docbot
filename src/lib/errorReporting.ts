// Global error reporting helpers so we never get a silent black screen again.

export function installGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    console.error('[GLOBAL ERROR]', event.error?.message, event.error?.stack);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[UNHANDLED REJECTION]', event.reason?.message, event.reason?.stack);
  });
}
