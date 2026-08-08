import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function screenshot(page, name) {
  await page.screenshot({ path: `e2e-${name}.png`, fullPage: true });
}

async function waitAndClick(page, text, options = {}) {
  const locator = page.locator('button', { hasText: text }).first();
  await locator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
  if (await locator.count() > 0) {
    await locator.click(options);
    return true;
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGEERROR:', err.message, err.stack));

  try {
    console.log('1. Open landing');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await screenshot(page, '01-landing');

    console.log('2. Click start');
    await waitAndClick(page, 'Začít');
    await page.waitForTimeout(800);
    await screenshot(page, '02-wizard-intro');

    console.log('3. Wizard intro: click start');
    await waitAndClick(page, 'Začít');
    await page.waitForTimeout(800);

    console.log('4. Identify me: click Vyplnit mé údaje');
    await waitAndClick(page, 'Vyplnit mé údaje');
    await page.waitForTimeout(800);
    await screenshot(page, '03-composer-empty');

    console.log('5. Add text source');
    await waitAndClick(page, 'Vložit text');
    await page.waitForTimeout(300);
    await page.locator('textarea').first().fill('Petr Piskaček, IČO 87654321, petr@piskacek.cz, +420 777 123 456, Ulice 42, Praha 5, 150 00');
    await waitAndClick(page, 'Přidat');
    await page.waitForTimeout(500);

    console.log('6. Click Analyzovat');
    await waitAndClick(page, 'Analyzovat');
    await page.waitForTimeout(8000);
    await screenshot(page, '04-composer-review');

    console.log('7. Click Použít');
    await waitAndClick(page, 'Použít');
    await page.waitForTimeout(1000);

    console.log('8. Continue to counterparty');
    await waitAndClick(page, 'Pokračovat');
    await page.waitForTimeout(800);

    console.log('9. Add counterparty via text');
    await waitAndClick(page, '+ Přidat nového klienta');
    await page.waitForTimeout(800);
    await waitAndClick(page, 'Vložit text');
    await page.waitForTimeout(300);
    await page.locator('textarea').first().fill('ACME s.r.o., IČO 12345678, info@acme.cz, Revoluční 12, Praha 1, 110 00');
    await waitAndClick(page, 'Přidat');
    await page.waitForTimeout(500);
    await waitAndClick(page, 'Analyzovat');
    await page.waitForTimeout(8000);
    await screenshot(page, '05-counterparty-review');
    await waitAndClick(page, 'Použít');
    await page.waitForTimeout(1000);

    console.log('10. Skip template / continue');
    const continueAfterTemplate = await waitAndClick(page, 'Pokračovat');
    if (!continueAfterTemplate) {
      await waitAndClick(page, 'Popsat ručně');
      await page.waitForTimeout(500);
    }
    await page.waitForTimeout(800);
    await screenshot(page, '06-work-details');

    console.log('11. Fill work details');
    const desc = page.locator('textarea').filter({ has: page.locator('') }).first();
    // Fill all visible text/number inputs
    const inputs = await page.locator('input, textarea').all();
    for (const input of inputs) {
      const tag = await input.evaluate(el => el.tagName.toLowerCase());
      const type = await input.evaluate(el => el.type);
      if (tag === 'textarea') {
        await input.fill('Vývoj webové prezentace na míru včetně responzivního designu.');
      } else if (type === 'text') {
        await input.fill('30. září 2026');
      } else if (type === 'number') {
        await input.fill('50000');
      }
    }
    await waitAndClick(page, 'Pokračovat');
    await page.waitForTimeout(800);

    console.log('12. Fill pricing');
    const pricingInputs = await page.locator('input').all();
    for (const input of pricingInputs) {
      const type = await input.evaluate(el => el.type);
      if (type === 'number') await input.fill('50000');
      else if (type === 'text') await input.fill('Záloha 50 %, zbytek po předání');
    }
    await waitAndClick(page, 'Pokračovat');
    await page.waitForTimeout(800);

    console.log('13. Safeguards');
    await waitAndClick(page, 'Pokračovat');
    await page.waitForTimeout(800);
    await screenshot(page, '07-preview');

    console.log('14. Close wizard');
    const xBtn = page.locator('div.fixed.inset-0.z-50 button').filter({ has: page.locator('svg') }).first();
    if (await xBtn.count() > 0) await xBtn.click();
    await page.waitForTimeout(800);
    await screenshot(page, '08-app');

    console.log('15. AI Kontrola');
    await waitAndClick(page, 'AI Kontrola');
    await page.waitForTimeout(500);
    await waitAndClick(page, 'Analyzovat rizika');
    await page.waitForTimeout(10000);
    await screenshot(page, '09-risk-analysis');

    const visibleText = await page.locator('body').innerText().catch(e => e.message);
    console.log('Final visible text:', visibleText.slice(0, 500));

    if (visibleText.includes('Skóre bezpečnosti')) {
      console.log('✅ FULL FLOW COMPLETED');
    } else {
      console.log('❌ RISK ANALYSIS NOT SHOWN');
    }
  } catch (e) {
    console.log('TEST ERROR:', e.message);
    await screenshot(page, 'ERROR');
  } finally {
    await browser.close();
  }
})();
