# Karel Docbot

AI asistent pro tvorbu českých smluv. Konverzační generování dokumentů s právní korektností.

## Co to dělá

- **Generování smluv** — konverzační flow pro typy: NDA, nájemní, pracovní, dílo
- **AI parsing** — extrakce polí z konverzace (aiParser)
- **Šablony** — templateGenerator pro jednotlivé typy smluv
- **Flow engine** — řízený konverzační flow (flowEngine)
- **Obnova rozpracované smlouvy** — sessionStore umožňuje pokračovat v nedokončené smlouvě
- **Multi-input composer** — skládání vstupů z více zdrojů
- **Sanitizace** — bezpečné zpracování uživatelského vstupu (sanitize)
- **Error reporting** — sledování chyb

## Tech stack

- React + TypeScript (Vite)
- AI parser přes LLM
- localStorage/session persistence (sessionStore, storage)

## Spuštění

```bash
npm install
npm run dev        # Vite + API
npm run dev:api    # jen API
npm run dev:full   # vše
npm test
```

## Architektura

```
src/
  App.tsx               # hlavní komponenta
  components/           # UI
  lib/
    aiParser.ts         # AI parsing polí
    contracts.ts        # typy smluv
    templateGenerator.ts# šablony
    flowEngine.ts       # konverzační flow
    sessionStore.ts     # obnova session
    sanitize.ts         # sanitizace vstupu
    storage.ts          # persistence
```
