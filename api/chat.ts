import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  SCHEMAS,
  ADVICE_DICT,
  FieldDefinition,
  ContractType,
  getFieldsForType,
  getFieldKeys,
  getAdvice,
} from '../shared/contracts';
import { checkRateLimit, getClientIP } from '../shared/rateLimit';

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_ENDPOINT = process.env.OLLAMA_API_ENDPOINT || 'https://ollama.com/api/chat';

// ─── Fallback Logic ─────────────────────────────────────────────────

function smartLocalChatFallback(contractType: string, messages: any[], currentFields: any) {
  const fieldsList = getFieldsForType(contractType as ContractType);
  const emptyFields = fieldsList.filter(f => !currentFields[f.key] || currentFields[f.key].trim() === '');
  const userMessage = messages[messages.length - 1];
  const userText = userMessage ? userMessage.text.trim() : "";
  const isQuestion = userText.endsWith("?") || /co je|vysvětli|jak|proč|kdy|kolik|kde|porad|doporuč|stane|musím|co to/i.test(userText);

  if (emptyFields.length > 0) {
    const currentField = emptyFields[0];
    if (isQuestion) {
      const advice = getAdvice(currentField.key) || "S tímto údajem vám rád poradím. Uveďte prosím standardní text nebo hodnotu.";
      return {
        reply: `${advice}\n\n**Zadejte prosím:** ${currentField.prompt}`,
        extractedFields: {},
        lastUpdatedField: "",
        isFinished: false,
        nextSuggestedPrompts: ["Použít doporučené", "Vysvětlit více", "Přeskočit"],
        _fallback: true,
      };
    }
    const cleanVal = userText.replace(/^(jmenuji se|jmenuje se|bude to|bude|nazev je|název je|je to|je|nastav na|nastav|hodnota je)\s+/i, "").trim();
    const updatedExtracted: Record<string, string> = { [currentField.key]: cleanVal };
    const remainingEmpty = emptyFields.slice(1);
    if (remainingEmpty.length > 0) {
      const nextField = remainingEmpty[0];
      return {
        reply: `Uložil(a) jsem hodnotu pro **${fieldsList.find(f => f.key === currentField.key)?.label || currentField.key}**: „${cleanVal}".\n\nNyní přejdeme k dalšímu kroku:\n**${nextField.prompt}**`,
        extractedFields: updatedExtracted,
        lastUpdatedField: currentField.key,
        isFinished: false,
        nextSuggestedPrompts: ["Ano, rozumím", "Vysvětlit tento krok", "Resetovat údaje"],
        _fallback: true,
      };
    } else {
      return {
        reply: `Skvělé! Všechny potřebné údaje byly úspěšně shromážděny. Vaše smlouva je kompletní a připravena v pravém panelu k náhledu.\n\nDoporučuji nyní nahoře přepnout na záložku „AI Kontrola rizik" a nechat smlouvu zkontrolovat na případné nevýhodné doložky.`,
        extractedFields: updatedExtracted,
        lastUpdatedField: currentField.key,
        isFinished: true,
        nextSuggestedPrompts: ["Analyzovat rizika smlouvy", "Resetovat smlouvu", "Jaká jsou rizika?"],
        _fallback: true,
      };
    }
  }

  // No empty fields — check for update intent
  const fieldPatterns: [RegExp, string][] = [
    [/pokut/i, "smluvni_pokuta"], [/poskytovatel/i, "poskytovatel"],
    [/příjemce|prijemce/i, "prijemce"], [/doba|platnost|trvání|trvani/i, "doba_platnosti"],
    [/právo|pravo|jurisdikce/i, "rozhodne_pravo"], [/pronajímatel|pronajimatel/i, "pronajimatel"],
    [/nájemce|najemce/i, "najemce"], [/předmět nájmu|predmet najmu|adresa|byt/i, "predmet_najmu"],
    [/nájemné|najemne|výše nájmu/i, "vyska_najemneho"], [/služby|sluzby|poplatky/i, "poplatky_sluzby"],
    [/kauce|jistot/i, "vratna_kauce"], [/výpověď|vypoved/i, "vypovedni_lhuta"],
    [/začátek|zacatek|datum začátku/i, "datum_zacatku"], [/zaměstnavatel|zamestnavatel/i, "zamestnavatel"],
    [/zaměstnanec|zamestnanec/i, "zamestnanec"], [/pozice|druh práce/i, "pracovni_pozice"],
    [/místo výkonu|misto vykonu/i, "misto_vykonu"], [/nástup|nastup|datum nástupu/i, "datum_nastupu"],
    [/mzda|plat/i, "mzda"], [/zkušební|zkusebni/i, "zkusebni_doba"],
    [/pracovní doba|pracovni doba/i, "pracovni_doba"],
    [/zhotovitel/i, "employerName"], [/objednatel/i, "clientName"],
    [/předmět díla|predmet dla|popis praci|popis práci|co dodáš/i, "workDescription"],
    [/termín|termin|deadline/i, "workDeadline"], [/cena|honorář|honorar/i, "workPrice"],
    [/DPH|vat/i, "workVat"], [/platba|záloha|zbytek|splátk/i, "paymentTerms"],
    [/místo plnění|misto plneni/i, "workPlace"], [/mlčenlivost|mlcenlivost|NDA/i, "safeguardNDA"],
    [/autorská práva|autorska prava|převod práv/i, "safeguardIP"],
    [/sankce|prodlení|prodeleni|penále/i, "safeguardPenalty"]
  ];

  for (const [pattern, fieldKey] of fieldPatterns) {
    if (pattern.test(userText)) {
      const extractedValue = userText.replace(/.*(na |bude |změň|zmen|uprav|je )\s*/i, "").trim();
      return {
        reply: `Úspěšně jsem upravil(a) pole **${fieldsList.find(f => f.key === fieldKey)?.label || fieldKey}** na: „${extractedValue}". Smlouva se automaticky aktualizovala.`,
        extractedFields: { [fieldKey]: extractedValue },
        lastUpdatedField: fieldKey,
        isFinished: true,
        nextSuggestedPrompts: ["Spustit analýzu rizik", "Změnit jiný údaj", "Vytisknout smlouvu"],
        _fallback: true,
      };
    }
  }

  return {
    reply: `Smlouva je již kompletně sestavena! Můžete si ji prohlédnout v pravém panelu, stáhnout nebo vytisknout. Pokud chcete nějaké údaje změnit, stačí mi napsat (např. 'Změň smluvní pokutu na 80 000 Kč').`,
    extractedFields: {},
    lastUpdatedField: "",
    isFinished: true,
    nextSuggestedPrompts: ["Spustit analýzu rizik", "Jaká jsou rizika?", "Resetovat smlouvu"],
    _fallback: true,
  };
}

// ─── Ollama API ──────────────────────────────────────────────────────

async function queryOllamaChat(model: string, systemInstruction: string, messages: any[], jsonFormat: boolean = false): Promise<string> {
  if (!OLLAMA_API_KEY) {
    throw new Error("OLLAMA_API_KEY not configured");
  }

  const body: any = {
    model,
    messages: [
      { role: "system", content: systemInstruction },
      ...messages.map((m: any) => ({
        role: m.sender === "assistant" ? "assistant" : "user",
        content: m.text
      }))
    ],
    stream: false,
    options: { temperature: 0.3 }
  };

  if (jsonFormat) {
    body.format = "json";
  }

  const response = await fetch(OLLAMA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OLLAMA_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama API error ${response.status}: ${errText}`);
  }

  const data = await response.json() as any;
  return data?.message?.content || "";
}

// ─── Build fields prompt from shared schema ─────────────────────────

function buildFieldsPrompt(contractType: string): string {
  const fields = getFieldsForType(contractType as ContractType);
  return fields.map(f => `        - ${f.key}: ${f.label}`).join('\n');
}

// ─── Handler ─────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Rate limit: 20 requests per minute per IP for chat (most expensive endpoint)
  const ip = getClientIP(req);
  const rateLimit = checkRateLimit(`chat:${ip}`, 20, 60_000);
  
  res.setHeader('X-RateLimit-Limit', '20');
  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
  res.setHeader('X-RateLimit-Reset', String(rateLimit.resetAt));
  
  if (!rateLimit.allowed) {
    return res.status(429).json({ 
      error: 'Příliš mnoho požadavků. Zkuste to prosím za chvíli.',
      retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractType, messages, currentFields, selectedModel } = req.body;
    const modelToUse = selectedModel || "deepseek-v4-flash";

    if (!contractType) {
      return res.status(400).json({ error: "contractType is required" });
    }

    const fieldsToCollect = buildFieldsPrompt(contractType);

    const systemInstruction = `Jsi DocuGenius AI, vysoce kvalifikovaný a zkušený právní asistent pro tvorbu smluv v České republice.
Tvým úkolem je vést s uživatelem přátelský rozhovor a pomoci mu krok za krokem sestavit kvalitní smlouvu typu: ${contractType.toUpperCase()}.

Zde jsou pole, která se snažíme posbírat:
${fieldsToCollect}

Aktuální hodnoty, které již známe:
${JSON.stringify(currentFields, null, 2)}

Tvoje striktní pravidla chování:
1. Komunikuj výhradně česky, srozumitelně, přátelsky a profesionálně.
2. Ptej se VŽDY na JEDNU informaci po druhé.
3. Pokud ti uživatel poskytne hodnotu, vytáhni ji a přidej ji do objektu 'extractedFields' v odpovědi.
4. Pokud ti uživatel položí dotaz týkající se nějakého ustanovení, vysvětli mu ho lidsky a poraď mu.
5. Objekt 'extractedFields' smí obsahovat POUZE nově zjištěná nebo upravená pole v tomto kroku.
6. V 'lastUpdatedField' uveď název klíče, který byl v tomto kroku úspěšně zapsán.
7. V 'nextSuggestedPrompts' navrhni 2 až 3 krátké, kontextové české fráze.
8. Když jsou všechna důležitá pole vyplněna, nastav 'isFinished' na true.

Odpověz VŽDY jako validní JSON dokument s těmito klíči: "reply", "extractedFields", "lastUpdatedField", "isFinished", "nextSuggestedPrompts".`;

    try {
      const responseText = await queryOllamaChat(modelToUse, systemInstruction, messages, true);
      if (responseText) {
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        return res.json(parsed);
      }
    } catch (aiErr: any) {
      console.warn(`AI call failed for model ${modelToUse}:`, aiErr.message);
    }

    // Fallback
    const fallbackRes = smartLocalChatFallback(contractType, messages, currentFields);
    res.json(fallbackRes);

  } catch (error: any) {
    console.error("Error in DocBot Chat API:", error);
    res.status(500).json({ error: error.message || "Failed to process chat" });
  }
}
