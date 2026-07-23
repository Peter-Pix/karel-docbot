import { ContractType, ContractFields } from '../types';

export function getFieldNameLabel(field: keyof ContractFields): string {
  const labels: Record<string, string> = {
    poskytovatel: 'Poskytovatel informací',
    prijemce: 'Příjemce informací',
    predmet_tajemstvi: 'Předmět tajemství / Účel',
    smluvni_pokuta: 'Smluvní pokuta',
    doba_platnosti: 'Doba platnosti / Trvání',
    rozhodne_pravo: 'Rozhodné právo',
    
    pronajimatel: 'Pronajímatel',
    najemce: 'Nájemce',
    predmet_najmu: 'Předmět nájmu / Adresa',
    vyska_najemneho: 'Výše měsíčního nájemného',
    poplatky_sluzby: 'Zálohy na služby a energie',
    vratna_kauce: 'Vratná kauce (Jistota)',
    vypovedni_lhuta: 'Výpovědní lhůta',
    datum_zacatku: 'Datum začátku nájmu',
    
    zamestnavatel: 'Zaměstnavatel',
    zamestnanec: 'Zaměstnanec',
    pracovni_pozice: 'Pracovní pozice',
    misto_vykonu: 'Místo výkonu práce',
    datum_nastupu: 'Datum nástupu do práce',
    mzda: 'Mzda (Hrubý měsíční plat)',
    zkusebni_doba: 'Zkušební doba',
    pracovni_doba: 'Týdenní pracovní doba',
  };
  return labels[field as string] || (field as string);
}

export function getDefaultFields(type: ContractType): ContractFields {
  if (type === 'nda') {
    return {
      contractType: 'nda',
      poskytovatel: '',
      prijemce: '',
      predmet_tajemstvi: '',
      smluvni_pokuta: '50 000 Kč',
      doba_platnosti: '3 roky od podpisu',
      rozhodne_pravo: 'Česká republika (české právo)',
    };
  } else if (type === 'rent') {
    return {
      contractType: 'rent',
      pronajimatel: '',
      najemce: '',
      predmet_najmu: '',
      vyska_najemneho: '',
      poplatky_sluzby: '',
      vratna_kauce: '',
      vypovedni_lhuta: '3 měsíce',
      datum_zacatku: '',
    };
  } else {
    return {
      contractType: 'employment',
      zamestnavatel: '',
      zamestnanec: '',
      pracovni_pozice: '',
      misto_vykonu: '',
      datum_nastupu: '',
      mzda: '',
      zkusebni_doba: '3 měsíce',
      pracovni_doba: '40 hodin týdně',
    };
  }
}

export function getContractTitle(type: ContractType): string {
  switch (type) {
    case 'nda':
      return 'Dohoda o ochraně důvěrných informací (NDA)';
    case 'rent':
      return 'Nájemní smlouva na byt';
    case 'employment':
      return 'Pracovní smlouva';
  }
}

export function generateContractHTML(
  type: ContractType,
  fields: ContractFields,
  highlightField?: string
): string {
  const renderVal = (key: keyof ContractFields, fallbackLabel: string) => {
    const val = fields[key];
    const isHighlighted = highlightField === key;
    
    const highlightClass = isHighlighted 
      ? 'bg-amber-100 dark:bg-amber-900 border-b-2 border-amber-500 font-bold px-1 rounded transition-all duration-700 inline-block animate-pulse'
      : '';

    if (!val || val.trim() === '') {
      return `<span class="text-red-500 font-semibold border-b border-dashed border-red-400 cursor-help ${highlightClass}" title="${fallbackLabel}">[ ${fallbackLabel} - nedoplněno ]</span>`;
    }
    
    return `<span class="text-gray-900 dark:text-gray-100 font-medium border-b border-gray-300 dark:border-gray-700 ${highlightClass}">${val}</span>`;
  };

  if (type === 'nda') {
    return `
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white uppercase mb-2">Dohoda o ochraně důvěrných informací</h1>
        <p class="text-sm text-gray-500 italic">(Non-Disclosure Agreement - NDA)</p>
      </div>

      <div class="space-y-6 text-justify leading-relaxed">
        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek I. Smluvní strany</h2>
          <p class="mb-2"><strong>1. Poskytovatel důvěrných informací:</strong></p>
          <p class="pl-4 mb-3">
            Subjekt: ${renderVal('poskytovatel', 'Poskytovatel informací')} <br/>
            (dále jen jako „Poskytovatel“ na straně jedné)
          </p>
          <p class="mb-2"><strong>2. Příjemce důvěrných informací:</strong></p>
          <p class="pl-4">
            Subjekt: ${renderVal('prijemce', 'Příjemce informací')} <br/>
            (dále jen jako „Příjemce“ na straně druhé)
          </p>
          <p class="mt-3">Smluvní strany uzavírají níže uvedeného dne, měsíce a roku tuto dohodu o ochraně důvěrných informací.</p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek II. Předmět dohody a důvěrné informace</h2>
          <p class="mb-2">
            1. Za důvěrné informace se pro účely této dohody považují veškeré informace, které si strany předají v souvislosti s účelem: 
            <strong>${renderVal('predmet_tajemstvi', 'Předmět tajemství / Účel spolupráce')}</strong>.
          </p>
          <p>
            2. Důvěrnými informacemi jsou zejména obchodní tajemství, technické specifikace, zdrojové kódy, know-how, marketingové strategie, finanční údaje a osobní data předaná v jakékoliv formě (písemně, ústně, elektronicky).
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek III. Závazky smluvních stran</h2>
          <p class="mb-2">1. Příjemce se zavazuje, že důvěrné informace uchová v přísné tajnosti a neuvolní je ani nezpřístupní žádné třetí osobě bez předchozího písemného souhlasu Poskytovatele.</p>
          <p class="mb-2">2. Příjemce použije důvěrné informace výhradně pro účely definované v Článku II. této dohody a zajistí jejich adekvátní ochranu před zneužitím.</p>
          <p>3. Povinnost mlčenlivosti se nevztahuje na informace, které se staly veřejně dostupnými bez zavinění Příjemce, nebo u kterých povinnost zveřejnění ukládá právní předpis.</p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek IV. Smluvní pokuta</h2>
          <p>
            V případě porušení jakékoliv povinnosti ochrany důvěrných informací stanovené v této dohodě se Příjemce zavazuje zaplatit Poskytovateli smluvní pokutu ve výši 
            <strong>${renderVal('smluvni_pokuta', 'Výše smluvní pokuty')}</strong> za každé jednotlivé porušení. Zaplacením smluvní pokuty není dotčen nárok na náhradu vzniklé škody v plné výši.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek V. Platnost a rozhodné právo</h2>
          <p class="mb-2">
            1. Tato dohoda nabývá platnosti a účinnosti dnem jejího podpisu oběma smluvními stranami. Závazek mlčenlivosti trvá po dobu 
            <strong>${renderVal('doba_platnosti', 'Doba platnosti mlčenlivosti')}</strong> od ukončení spolupráce.
          </p>
          <p>
            2. Tato dohoda se řídí právním řádem: 
            <strong>${renderVal('rozhodne_pravo', 'Rozhodné právo')}</strong>. Veškeré spory budou řešeny věcně a místně příslušnými soudy.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek VI. Podpisy smluvních stran</h2>
          <p class="mb-6">Na důkaz souhlasu s celým obsahem této dohody připojují smluvní strany své vlastnoruční podpisy.</p>
          <div class="grid grid-cols-2 gap-8 pt-8 text-center text-sm">
            <div>
              <div class="border-t border-gray-400 w-48 mx-auto mt-4 pt-1">
                <strong>Poskytovatel</strong><br/>
                ${fields.poskytovatel || '........................................'}
              </div>
            </div>
            <div>
              <div class="border-t border-gray-400 w-48 mx-auto mt-4 pt-1">
                <strong>Příjemce</strong><br/>
                ${fields.prijemce || '........................................'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (type === 'rent') {
    return `
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white uppercase mb-2">Nájemní smlouva na byt</h1>
        <p class="text-sm text-gray-500 italic">(uzavřená dle občanského zákoníku č. 89/2012 Sb.)</p>
      </div>

      <div class="space-y-6 text-justify leading-relaxed">
        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek I. Smluvní strany</h2>
          <p class="mb-2"><strong>1. Pronajímatel:</strong></p>
          <p class="pl-4 mb-3">
            Jméno/Název: ${renderVal('pronajimatel', 'Pronajímatel')} <br/>
            (dále jen jako „Pronajímatel“ na straně jedné)
          </p>
          <p class="mb-2"><strong>2. Nájemce:</strong></p>
          <p class="pl-4">
            Jméno/Název: ${renderVal('najemce', 'Nájemce')} <br/>
            (dále jen jako „Nájemce“ na straně druhé)
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek II. Předmět nájmu</h2>
          <p>
            1. Pronajímatel prohlašuje, že je výlučným vlastníkem nemovitosti nacházející se na adrese: 
            <strong>${renderVal('predmet_najmu', 'Adresa a specifikace bytu')}</strong> (dále jen „Předmět nájmu“).
          </p>
          <p class="mt-2">
            2. Pronajímatel tímto přenechává Nájemci Předmět nájmu k dočasnému užívání za účelem bydlení a Nájemce jej do nájmu přijímá a zavazuje se platit sjednané nájemné.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek III. Nájemné, zálohy na služby a vratná kauce</h2>
          <p class="mb-2">
            1. Nájemce se zavazuje hradit Pronajímateli měsíční nájemné ve výši 
            <strong>${renderVal('vyska_najemneho', 'Výše nájemného')}</strong>.
          </p>
          <p class="mb-2">
            2. Vedle nájemného je Nájemce povinen platit zálohy na služby a energie (voda, vytápění, elektřina atd.) ve výši 
            <strong>${renderVal('poplatky_sluzby', 'Výše záloh na služby')}</strong> měsíčně.
          </p>
          <p>
            3. Nájemce se zavazuje při podpisu smlouvy složit Pronajímateli vratnou kauci (jistotu) ve výši 
            <strong>${renderVal('vratna_kauce', 'Výše vratné kauce')}</strong> k zajištění případných dluhů na nájemném nebo škod na Předmětu nájmu.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek IV. Doba trvání a výpověď</h2>
          <p class="mb-2">
            1. Nájem se sjednává na dobu určitou s počátkem ode dne 
            <strong>${renderVal('datum_zacatku', 'Datum počátku nájmu')}</strong>.
          </p>
          <p>
            2. Smluvní strany sjednávají výpovědní lhůtu pro ukončení nájmu v délce 
            <strong>${renderVal('vypovedni_lhuta', 'Výpovědní lhůta')}</strong>. Výpověď musí být písemná a doručena druhé smluvní straně.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek V. Práva a povinnosti stran</h2>
          <p class="mb-2">1. Nájemce je povinen užívat byt řádně, provádět běžnou údržbu a drobné opravy spojené s užíváním bytu.</p>
          <p>2. Nájemce nesmí bez písemného souhlasu Pronajímatele provádět v bytě stavební úpravy ani podnajmout byt třetím osobám.</p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek VI. Podpisy smluvních stran</h2>
          <p class="mb-6">Smlouva je sepsána ve dvou stejnopisech s platností originálu, z nichž každá strana obdrží jeden.</p>
          <div class="grid grid-cols-2 gap-8 pt-8 text-center text-sm">
            <div>
              <div class="border-t border-gray-400 w-48 mx-auto mt-4 pt-1">
                <strong>Pronajímatel</strong><br/>
                ${fields.pronajimatel || '........................................'}
              </div>
            </div>
            <div>
              <div class="border-t border-gray-400 w-48 mx-auto mt-4 pt-1">
                <strong>Nájemce</strong><br/>
                ${fields.najemce || '........................................'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white uppercase mb-2">Pracovní smlouva</h1>
        <p class="text-sm text-gray-500 italic">(uzavřená dle zákoníku práce č. 262/2006 Sb.)</p>
      </div>

      <div class="space-y-6 text-justify leading-relaxed">
        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek I. Smluvní strany</h2>
          <p class="mb-2"><strong>1. Zaměstnavatel:</strong></p>
          <p class="pl-4 mb-3">
            Název firmy/Jméno: ${renderVal('zamestnavatel', 'Zaměstnavatel')} <br/>
            (dále jen jako „Zaměstnavatel“ na straně jedné)
          </p>
          <p class="mb-2"><strong>2. Zaměstnanec:</strong></p>
          <p class="pl-4">
            Jméno a příjmení: ${renderVal('zamestnanec', 'Zaměstnanec')} <br/>
            (dále jen jako „Zaměstnanec“ na straně druhé)
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek II. Druh práce a místo výkonu</h2>
          <p class="mb-2">
            1. Zaměstnanec se zavazuje vykonávat pro Zaměstnavatele práci na pracovní pozici: 
            <strong>${renderVal('pracovni_pozice', 'Pracovní pozice')}</strong>.
          </p>
          <p>
            2. Místem výkonu práce se sjednává: 
            <strong>${renderVal('misto_vykonu', 'Místo výkonu práce')}</strong>.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek III. Den nástupu a zkušební doba</h2>
          <p class="mb-2">
            1. Den nástupu Zaměstnance do práce se sjednává na: 
            <strong>${renderVal('datum_nastupu', 'Datum nástupu do práce')}</strong>. Tímto dnem vzniká pracovní poměr.
          </p>
          <p class="mb-2">2. Pracovní poměr se sjednává na dobu neurčitou.</p>
          <p>
            3. Smluvní strany sjednávají zkušební dobu v délce: 
            <strong>${renderVal('zkusebni_doba', 'Délka zkušební doby')}</strong>.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek IV. Pracovní doba a mzda</h2>
          <p class="mb-2">
            1. Týdenní pracovní doba Zaměstnance činí: 
            <strong>${renderVal('pracovni_doba', 'Pracovní doba týdně')}</strong>. Rozvržení pracovní doby určuje Zaměstnavatel.
          </p>
          <p>
            2. Za vykonanou práci náleží Zaměstnanci měsíční mzda ve výši: 
            <strong>${renderVal('mzda', 'Měsíční mzda')}</strong>. Mzda je splatná zpětně do patnáctého dne následujícího měsíce.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek V. Závěrečná ustanovení</h2>
          <p class="mb-2">1. Práva a povinnosti stran neupravené touto smlouvou se řídí zákoníkem práce České republiky a souvisejícími předpisy.</p>
          <p>2. Tato smlouva se vyhotovuje ve dvou originálech, z nichž každá smluvní strana obdrží po jednom vyhotovení.</p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Článek VI. Podpisy smluvních stran</h2>
          <p class="mb-6">Smluvní strany prohlašují, že si smlouvu přečetly, s jejím obsahem souhlasí a na důkaz toho připojují své podpisy.</p>
          <div class="grid grid-cols-2 gap-8 pt-8 text-center text-sm">
            <div>
              <div class="border-t border-gray-400 w-48 mx-auto mt-4 pt-1">
                <strong>Zaměstnavatel</strong><br/>
                ${fields.zamestnavatel || '........................................'}
              </div>
            </div>
            <div>
              <div class="border-t border-gray-400 w-48 mx-auto mt-4 pt-1">
                <strong>Zaměstnanec</strong><br/>
                ${fields.zamestnanec || '........................................'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
