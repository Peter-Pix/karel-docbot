# Karel-DocBot — Current State Analysis & Next Steps

**Date:** 2026-08-08 (post Fix-It Sprint)  
**Analyst:** Doofy  
**Project:** karel-docbot (DocBot — AI právník na český smlouvy)  
**Live URL:** https://docbot.petrpiskacek.cloud  
**Stack:** Vite 6 + React 19 + Tailwind CSS 4 + Vercel Serverless (Ollama Cloud)

---

## 📊 Current State Snapshot

### Codebase
- **Total LOC:** 2,655 (src + api)
- **Components:** 9 (AppHeader, ChatPanel, DocumentPreview, DocumentSelection, FieldsEditorPanel, RiskAnalysisPanel, SettingsModal, Toast, icons)
- **Lib modules:** 4 (contracts, templateGenerator, sanitize, validation)
- **API routes:** 3 (chat, analyze-risks, health)
- **Contract types:** 3 (NDA, Rent, Employment)
- **Build:** ✅ Lint clean, build clean, 267 KB JS / 45 KB CSS (gzip: 80 KB / 8 KB)

### Deployment
- **Platform:** Vercel (project linked, `prj_wkkbJsUBwvKbDDb4RkzZHkH5DgJb`)
- **Domain:** `docbot.petrpiskacek.cloud`
- **OG image:** ✅ Present (`public/og-image.png`, 200 KB)
- **CSP headers:** ✅ Already configured in `vercel.json`
- **Env vars:** `.env.example` documented, `.gitignore` correct

### What Works Well
- ✅ Clean Apple-inspired design with gold accent
- ✅ Chat-guided contract creation with smart suggestions
- ✅ Real-time document preview with field highlighting
- ✅ AI risk analysis with actionable fix suggestions
- ✅ Demo data mode with intentional legal traps
- ✅ Dark/light theme toggle
- ✅ Model selector (DeepSeek V4 Flash / Kimi K2.7 Code)
- ✅ Toast notification system (post-sprint)
- ✅ HTML sanitization (post-sprint)
- ✅ SSOT for field definitions (post-sprint)
- ✅ Input validation with Czech legal context (post-sprint)

---

## 🔍 Fresh Issues Found (Post-Sprint)

### A. Dead Dependencies (Quick Win)

**`recharts` (9.3 MB in node_modules) is installed but NEVER imported.**

```
$ grep -rn "recharts" src/ --include="*.tsx" --include="*.ts"
(zero results)
```

This is 9.3 MB of dead weight. The risk analysis panel uses a simple percentage circle, not a chart library. Removing it saves install time and node_modules size.

**`motion` (772 KB) — `AnimatePresence` is imported in App.tsx but never used.**

```
$ grep -rn "AnimatePresence\|motion/" src/
src/App.tsx:2:import { AnimatePresence } from 'motion/react';
```

The import exists but `AnimatePresence` is never rendered. Either remove the import or actually use it for tab transitions.

**`lucide-react` — `Sparkles` imported in App.tsx but unused.**

Multiple components import icons they don't use. Tree-shaking handles this at build time, but it's noise in the source.

### B. API-Side Duplication (Tech Debt)

`api/chat.ts` still has its own `ndaFields`, `rentFields`, `employmentFields` arrays + `adviceDict` — 100+ lines of duplicated data that now also exists in `src/lib/contracts.ts`.

This can't be a simple import because API files run on Vercel serverless and `src/` is bundled for the client. Solution: create `shared/contracts.ts` at project root and import from both sides.

### C. No Error Boundaries

If any component throws during render, the entire app white-screens. React Error Boundaries should wrap the main panels (chat, preview, risk analysis) independently so one panel crashing doesn't kill the others.

### D. No Loading State for Document Preview

When switching contract types, the preview briefly shows the old contract before the new one renders. A subtle loading state would smooth this.

### E. Theme Toggle — Light Mode Incomplete

The toggle exists, `dark` class is added/removed, but the entire CSS is designed for dark mode. Light mode probably looks broken — most components use `zinc-950`, `zinc-900` hardcoded backgrounds.

### F. No Persistence

Filled fields are lost on page refresh. For a contract drafting tool, `localStorage` persistence would be a significant UX improvement — users might step away mid-contract.

### G. Print/Download Only as .txt

`handleDownload()` exports as plain text. For a legal document, PDF export would be expected. The `handlePrint()` function works but produces unstyled output.

### H. Mobile Layout — Unverified

The grid uses `lg:grid-cols-12` with left panel `lg:col-span-5` and right `lg:col-span-7`. On mobile this stacks, but the fixed heights (`h-[calc(100vh-140px)]`) may cause issues on small screens.

---

## 🎯 Recommended Next Steps (Prioritized)

### Tier 1: Quick Wins (1-3 hours each, high impact/effort ratio)

#### 1. Remove Dead Dependencies
- `npm uninstall recharts` (saves 9.3 MB)
- Remove `import { AnimatePresence } from 'motion/react'` from App.tsx (or use it)
- Remove `import { Sparkles } from 'lucide-react'` from App.tsx (unused)
- Audit all icon imports across components, remove unused
- **Effort:** 30 min
- **Impact:** Cleaner code, faster installs

#### 2. Add Error Boundaries
- Create `ErrorBoundary` component wrapping each panel independently
- Show fallback UI ("Něco se pokazilo — [Zkusit znovu]") instead of white screen
- Wrap: ChatPanel, DocumentPreview, RiskAnalysisPanel, FieldsEditorPanel
- **Effort:** 1 hour
- **Impact:** Dramatic reliability improvement

#### 3. Add localStorage Persistence
- Save `{ contractType, fields, messages }` to localStorage on every change
- Restore on mount — show "Obnovit rozpracovanou smlouvu?" prompt
- Clear on reset
- **Effort:** 1-2 hours
- **Impact:** Users don't lose work on refresh/crash

#### 4. Fix or Remove Light Theme
- Option A: Remove the toggle entirely (app is designed for dark)
- Option B: Actually implement light mode CSS (significant effort)
- Recommendation: **Remove for now** — half-working features are worse than no feature
- **Effort:** 15 min (remove) or 4+ hours (implement)
- **Impact:** No broken UX

### Tier 2: Product Polish (Half day each)

#### 5. PDF Export
- Use `window.print()` with a print-optimized stylesheet (already partially exists)
- OR add `jspdf` + `html2canvas` for client-side PDF generation
- Add "Stáhnout PDF" button next to existing "Stáhnout .txt"
- **Effort:** 2-3 hours
- **Impact:** Legal documents need PDF — this is expected functionality

#### 6. Shared Schema for API
- Create `shared/contracts.ts` at project root
- Extract field definitions, advice dictionary, and prompts there
- Both `src/lib/contracts.ts` and `api/chat.ts` import from it
- Eliminates the last major duplication
- **Effort:** 2 hours
- **Impact:** Single source of truth across client AND server

#### 7. Mobile Layout Audit
- Test on 375px width (iPhone SE)
- Replace `h-[calc(100vh-140px)]` with `h-[calc(100vh-200px)]` or `min-h-[600px]`
- Stack panels vertically with separate scroll containers
- Test tab switching on touch
- **Effort:** 2-3 hours
- **Impact:** Usable on mobile (currently unverified)

#### 8. Commit Sprint Changes
- The working tree is dirty with 7 modified + 8 untracked files
- Should be committed in logical commits:
  - `feat: toast notification system + alert replacement`
  - `feat: HTML sanitization for XSS prevention`
  - `refactor: centralize field definitions to SSOT (contracts.ts)`
  - `feat: input validation with Czech legal context`
  - `perf: memoize contract HTML generation`
  - `docs: analysis reports and fix-it sprint documentation`
- **Effort:** 30 min
- **Impact:** Clean git history, deployable state

### Tier 3: Strategic Moves (1-3 days)

#### 9. Add Test Infrastructure
- Install Vitest + React Testing Library
- Write tests for: `contracts.ts`, `validation.ts`, `sanitize.ts`, `templateGenerator.ts`
- Add `npm test` to CI/CD
- Target: 80% coverage on lib/ files
- **Effort:** 1 day
- **Impact:** Confidence in future changes, prevents regressions

#### 10. Streaming AI Responses
- Current: AI response returns all at once (can take 5-10 seconds)
- Improvement: Use Server-Sent Events or streaming fetch for token-by-token response
- Show typing animation, faster perceived response
- **Effort:** 1 day
- **Impact:** Dramatic UX improvement for the chat experience

#### 11. More Contract Types
- Current: NDA, Rent, Employment (3 types)
- Candidates: FPV (faktura), Smlouva o dílo (contract for work), Kupní smlouva (purchase agreement), Společenská smlouva (LLC agreement)
- Each requires: field schema in `contracts.ts`, template in `templateGenerator.ts`, risk patterns in `analyze-risks.ts`, demo data
- **Effort:** 2-3 hours per type (SSOT makes this much easier now)
- **Impact:** Broader product, more use cases

#### 12. User Analytics
- Track: contract type selection, completion rate, risk analysis usage, demo data usage, model preference
- Use Vercel Analytics or PostHog (privacy-friendly)
- Answer questions: "Which contract type is most popular?" "Do users finish contracts?" "Do they use risk analysis?"
- **Effort:** Half day
- **Impact:** Data-driven product decisions

---

## 📈 Recommended Execution Order

```
Week 1:
  Day 1: Commit sprint (30m) → Remove dead deps (30m) → Error boundaries (1h) → Fix light theme (15m)
  Day 2: localStorage persistence (1-2h) → Mobile layout audit (2-3h)
  Day 3: PDF export (2-3h) → Shared schema for API (2h)

Week 2:
  Day 4-5: Test infrastructure + core tests
  Day 6: Streaming AI responses
  Day 7: Analytics setup

Week 3+:
  Add new contract types (2-3h each, on demand)
```

---

## 🏁 Bottom Line

The Fix-It Sprint raised the codebase quality significantly — SSOT, validation, sanitization, and proper notifications are now in place. The project is in good shape for a V1.

The highest-leverage next moves are:
1. **Commit the sprint work** (unblock deploys)
2. **Remove dead deps + add error boundaries** (reliability)
3. **Add localStorage** (user retention)
4. **PDF export** (expected for legal docs)

After that, the product is ready for real users. The remaining Tier 3 items are about scaling and depth, not survival.