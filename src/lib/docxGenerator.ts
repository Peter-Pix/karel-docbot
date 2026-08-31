// src/lib/docxGenerator.ts
// Generování formátovaného .docx exportu smlouvy pomocí `docx` npm balíku.
// Parsuje vygenerovaný HTML (z templateGenerator) do strukturovaného DOCX
// (nadpisy, odstavce, tučné části, zalomení řádků).

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import { ContractType } from '../types';
import { getContractTitle } from './templateGenerator';

/**
 * Nahradí placeholder "nedoplněno" (červené span) tečkami, aby export
 * neobsahoval HTML značky ani varovné texty — stejně jako tisk.
 */
function normalizePlaceholders(html: string): string {
  return html.replace(
    /<span class="[^"]*text-red[^"]*"[^>]*>\[\s*([^\]]*)\s*-\s*nedoplněno\s*\]\s*<\/span>/g,
    '........................'
  );
}

/**
 * Rozparsuje HTML fragment na pole bloků pro DOCX.
 * Podporuje: h1, h2, p (s vnořeným strong a br).
 */
function parseHtmlToBlocks(html: string): Paragraph[] {
  const blocks: Paragraph[] = [];
  // Obalíme fragment do plného dokumentu — v prohlížeči i v testech (linkedom)
  // se tak obsah spolehlivě dostane do <body>.
  const doc = new DOMParser().parseFromString(
    `<!doctype html><html><body>${html}</body></html>`,
    'text/html'
  );

  const walk = (node: ChildNode) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'h1') {
      blocks.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: el.textContent || '', bold: true })],
        })
      );
      return;
    }

    if (tag === 'h2') {
      blocks.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: el.textContent || '', bold: true })],
        })
      );
      return;
    }

    if (tag === 'p') {
      // Sestav runs z přímých textových uzlů a <strong>/<br/>.
      const runs: TextRun[] = [];
      el.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = (child.textContent || '').replace(/\s+/g, ' ');
          if (text.trim()) runs.push(new TextRun({ text }));
          return;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) return;
        const c = child as HTMLElement;
        const ctag = c.tagName.toLowerCase();
        if (ctag === 'br') {
          runs.push(new TextRun({ break: 1 }));
        } else if (ctag === 'strong' || ctag === 'b') {
          const text = (c.textContent || '').replace(/\s+/g, ' ');
          if (text.trim()) runs.push(new TextRun({ text, bold: true }));
        } else {
          const text = (c.textContent || '').replace(/\s+/g, ' ');
          if (text.trim()) runs.push(new TextRun({ text }));
        }
      });
      blocks.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
          children: runs.length ? runs : [new TextRun({ text: '' })],
        })
      );
      return;
    }

    // Ostatní elementy (div, span, ul...) — rekurzivně projdi děti.
    el.childNodes.forEach(walk);
  };

  // V prohlížeči je obsah v doc.body; linkedom (testy) ho dává do documentElement.
  const root =
    doc.body && doc.body.childNodes.length > 0
      ? doc.body
      : doc.documentElement;
  root.childNodes.forEach(walk);
  return blocks;
}

/**
 * Vygeneruje .docx Blob pro daný typ smlouvy a pole.
 */
export async function generateDocxBlob(
  contractType: ContractType,
  contractHTML: string
): Promise<Blob> {
  const title = getContractTitle(contractType);
  const normalized = normalizePlaceholders(contractHTML);
  const blocks = parseHtmlToBlocks(normalized);

  const doc = new Document({
    creator: 'Karel DocBot',
    title,
    description: `Vygenerovaná smlouva: ${title}`,
    sections: [
      {
        properties: {},
        children: blocks,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  return buffer;
}
