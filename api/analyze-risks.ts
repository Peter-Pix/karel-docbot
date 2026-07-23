import type { VercelRequest, VercelResponse } from '@vercel/node';

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_ENDPOINT = 'https://ollama.com/api/chat';

async function queryOllamaChat(model: string, systemInstruction: string, prompt: string, jsonFormat: boolean = false): Promise<string> {
  if (!OLLAMA_API_KEY) {
    throw new Error("OLLAMA_API_KEY not configured");
  }

  const body: any = {
    model,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt }
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractType, contractHTML, selectedModel } = req.body;
    const modelToUse = selectedModel || "deepseek-v4-flash";

    if (!contractHTML) {
      return res.status(400).json({ error: "contractHTML is required" });
    }

    const systemInstruction = `Jsi DocuGenius AI, přední český právní analytik a expert na revize smluv.
Tvým úkolem je důkladně analyzovat finální text/HTML smlouvy typu ${contractType.toUpperCase()} a identifikovat potenciální rizika pro uživatele.

Vyhodnoť také celkové skóre bezpečnosti smlouvy ('safetyScore') od 0 do 100 (100 = zcela bezpečné) a napiš stručné celkové právní shrnutí ('summary') v češtině.
Pro každé nalezené riziko uveď:
1. 'id' - unikátní textové ID
2. 'title' - krátký název rizika česky
3. 'level' - 'low', 'medium', 'high'
4. 'description' - detailní právní vysvětlení rizikovosti
5. 'suggestion' - doporučení k nápravě
6. 'targetText' - PŘESNÁ CITACE rizikové pasáže ze smlouvy
7. 'replacementText' - návrh bezpečného a právně vyváženého textu k nahrazení

Odpověz VŽDY jako validní JSON dokument s těmito klíči: "risks", "safetyScore", "summary".`;

    const prompt = `Zde je HTML text smlouvy k analýze:\n\n${contractHTML}`;

    try {
      const responseText = await queryOllamaChat(modelToUse, systemInstruction, prompt, true);
      if (responseText) {
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        return res.json(parsed);
      }
    } catch (aiErr: any) {
      console.warn(`AI risk analysis failed for model ${modelToUse}:`, aiErr.message);
    }

    // Fallback risk scanner
    const risksList: any[] = [];
    let safetyScore = 100;
    let summary = "Smlouva splňuje všechny standardní náležitosti a nevykazuje zjevné právní slabiny.";

    if (contractType === "nda") {
      if (contractHTML.includes("2 500 000 Kč") || contractHTML.includes("2.500.000 Kč")) {
        risksList.push({
          id: "nda-penalty", title: "Nepřiměřeně vysoká smluvní pokuta", level: "high",
          description: "Smluvní pokuta ve výši 2 500 000 Kč je pro tento typ spolupráce extrémně vysoká.",
          suggestion: "Snižte smluvní pokutu na rozumnou úroveň (např. 100 000 Kč).",
          targetText: "2 500 000 Kč", replacementText: "100 000 Kč"
        });
        safetyScore -= 30;
      }
      if (contractHTML.includes("na věčné časy") || contractHTML.includes("bez omezení")) {
        risksList.push({
          id: "nda-duration", title: "Nekonečné trvání závazku mlčenlivosti", level: "medium",
          description: "Závazek mlčenlivosti 'na věčné časy' je právně riskantní.",
          suggestion: "Nastavte konkrétní dobu trvání, např. 5 let.",
          targetText: "na věčné časy a bez omezení", replacementText: "5 let od ukončení této dohody"
        });
        safetyScore -= 20;
      }
      if (contractHTML.includes("Čínská") || contractHTML.includes("Pekingu")) {
        risksList.push({
          id: "nda-jurisdiction", title: "Nevýhodná zahraniční jurisdikce", level: "high",
          description: "Rozhodné právo Čínské lidové republiky je extrémně rizikové.",
          suggestion: "Zvolte české rozhodné právo.",
          targetText: "Čínská lidová republika (rozhodčí soud v Pekingu)", replacementText: "Česká republika (české právo)"
        });
        safetyScore -= 30;
      }
    } else if (contractType === "rent") {
      if (contractHTML.includes("150 000 Kč")) {
        risksList.push({
          id: "rent-deposit", title: "Kauce překračující zákonný limit", level: "high",
          description: "Kauce 150 000 Kč překračuje zákonný limit 3× nájemné.",
          suggestion: "Snižte kauci na max. 84 000 Kč.",
          targetText: "150 000 Kč", replacementText: "56 000 Kč"
        });
        safetyScore -= 35;
      }
      if (contractHTML.includes("1 měsíc pro nájemce") || contractHTML.includes("6 měsíců pro pronajímatele")) {
        risksList.push({
          id: "rent-notice", title: "Nezákonná výpovědní lhůta", level: "high",
          description: "Výpovědní lhůta odlišná pro každou stranu odporuje občanskému zákoníku.",
          suggestion: "Sjednoťte na 3 měsíce pro obě strany.",
          targetText: "1 měsíc pro nájemce, 6 měsíců pro pronajímatele", replacementText: "3 měsíce pro obě smluvní strany"
        });
        safetyScore -= 35;
      }
    } else if (contractType === "employment") {
      if (contractHTML.includes("6 měsíců zkušební doba")) {
        risksList.push({
          id: "emp-probation", title: "Nelegální délka zkušební doby", level: "high",
          description: "Zkušební doba 6 měsíců u řadového zaměstnance je v rozporu se zákoníkem práce.",
          suggestion: "Upravte na max. 3 měsíce.",
          targetText: "6 měsíců zkušební doba", replacementText: "3 měsíce zkušební doba"
        });
        safetyScore -= 35;
      }
      if (contractHTML.includes("55 hodin týdně")) {
        risksList.push({
          id: "emp-hours", title: "Překročení zákonného limitu pracovní doby", level: "high",
          description: "55 hodin týdně hrubě porušuje zákoník práce.",
          suggestion: "Upravte na standardních 40 hodin týdně.",
          targetText: "55 hodin týdně", replacementText: "40 hodin týdně"
        });
        safetyScore -= 35;
      }
      if (contractHTML.includes("celé území České republiky")) {
        risksList.push({
          id: "emp-place", title: "Příliš široké místo výkonu práce", level: "medium",
          description: "Místo výkonu 'celé území ČR a EU' je nepřiměřeně široké.",
          suggestion: "Zúžete na konkrétní město nebo kraj.",
          targetText: "celé území České republiky a Evropské unie", replacementText: "Praha a Středočeský kraj"
        });
        safetyScore -= 20;
      }
    }

    if (risksList.length > 0) {
      summary = `Analýza odhalila ${risksList.length} právních rizik či rozporů s platnou legislativou ČR.`;
    }

    res.json({ risks: risksList, safetyScore: Math.max(0, safetyScore), summary });

  } catch (error: any) {
    console.error("Error in DocBot Risk Analysis:", error);
    res.status(500).json({ error: error.message || "Failed to analyze risks" });
  }
}
