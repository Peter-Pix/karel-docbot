import React, { useState, useMemo, useEffect } from 'react';
import { ContractType, ContractFields } from '../types';
import { generateContractHTML, getContractTitle } from '../lib/templateGenerator';
import { sanitizeHTML } from '../lib/sanitize';
import { generateDocxBlob } from '../lib/docxGenerator';
import { Copy, Download, Printer, Check, Eye, Code2, FileText, RotateCcw, Pencil } from 'lucide-react';
import { DisclaimerBanner } from './DisclaimerBanner';

interface DocumentPreviewProps {
  contractType: ContractType;
  fields: ContractFields;
  highlightField?: string;
}

/**
 * B4: Formátovaná editace finálního dokumentu.
 * Uživatel může upravit libovolné pole/větu v "Text" záložce a úpravy se
 * promítnou do náhledu i všech exportů (TXT, DOCX, tisk, kopírování).
 */

/** Převod upraveného plain-textu zpět na HTML pro DOCX/tisk. */
function plainTextToHtml(text: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const lines = text.split(/\r?\n/);
  const blocks: string[] = [];
  let para: string[] = [];

  const flush = () => {
    if (para.length) {
      blocks.push(`<p>${para.join('<br/>')}</p>`);
      para = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (trimmed === '') {
      flush();
      continue;
    }
    // Nadpisy (Článek I., Název smlouvy) — tučně a větší.
    if (/^(Článek\s+[IVXLC]+\.|Dohoda|Nájemní|Smlouva|Pracovní)/i.test(trimmed)) {
      flush();
      blocks.push(`<h2>${escape(trimmed)}</h2>`);
      continue;
    }
    para.push(escape(line));
  }
  flush();
  return blocks.join('\n');
}

export function DocumentPreview({
  contractType,
  fields,
  highlightField,
}: DocumentPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');
  const [isCopied, setIsCopied] = useState(false);
  // B4: uživatelské úpravy finálního textu.
  const [editedText, setEditedText] = useState<string>('');
  const [isEdited, setIsEdited] = useState(false);

  const contractHTML = useMemo(() => {
    const raw = generateContractHTML(contractType, fields, highlightField);
    return sanitizeHTML(raw);
  }, [contractType, fields, highlightField]);

  const generatedPlainText = useMemo(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contractHTML;
    return tempDiv.innerText || tempDiv.textContent || '';
  }, [contractHTML]);

  // Když se změní generovaný text (nová pole), resetuj editaci.
  useEffect(() => {
    setEditedText(generatedPlainText);
    setIsEdited(false);
  }, [generatedPlainText]);

  // Text, který se používá pro exporty — upravený, pokud uživatel editoval.
  const exportText = isEdited ? editedText : generatedPlainText;

  // HTML pro náhled/export — upravený text převedeme zpět na HTML.
  const displayHTML = useMemo(() => {
    if (!isEdited) return contractHTML;
    return sanitizeHTML(plainTextToHtml(editedText));
  }, [isEdited, editedText, contractHTML]);

  const getPlainText = () => exportText;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const title = getContractTitle(contractType);
    const element = document.createElement('a');
    const file = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadDocx = async () => {
    const title = getContractTitle(contractType);
    try {
      const blob = await generateDocxBlob(contractType, displayHTML);
      const element = document.createElement('a');
      element.href = URL.createObjectURL(blob);
      element.download = `${title.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
    } catch (err) {
      console.error('Failed to generate DOCX', err);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${getContractTitle(contractType)}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; padding: 40px; line-height: 1.6; color: #000; }
          h1 { text-align: center; text-transform: uppercase; font-size: 20px; margin-bottom: 30px; }
          h2 { font-size: 16px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px; }
          p { text-align: justify; margin-bottom: 10px; }
        </style>
      </head><body>
        ${displayHTML.replace(/<span class="[^"]*text-red[^"]*"[^>]*>\[\s*([^\]]*)\s*-\s*nedoplněno\s*\]\u003c\/span>/g, '........................')}
        <script>window.onload=function(){window.print();window.close();}</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handleApplyEdits = () => {
    setIsEdited(true);
    setActiveTab('preview');
  };

  const handleReset = () => {
    setEditedText(generatedPlainText);
    setIsEdited(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm" id="document-preview-panel">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        {/* Tabs */}
        <div className="apple-tabs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`apple-tab ${activeTab === 'preview' ? 'active' : ''}`}
          >
            <Eye className="w-3 h-3 inline mr-1" />
            Náhled
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`apple-tab ${activeTab === 'raw' ? 'active' : ''}`}
          >
            <Code2 className="w-3 h-3 inline mr-1" />
            Text
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {isEdited && (
            <span className="text-[10px] text-[#c8962e] bg-[rgba(200,150,46,0.1)] border border-[rgba(200,150,46,0.2)] rounded-full px-2 py-0.5 mr-1">
              Upraveno
            </span>
          )}
          <button onClick={handleCopy} className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer" title="Kopírovat">
            {isCopied ? <Check className="w-3.5 h-3.5 text-[#c8962e]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleDownload} className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer" title="Stáhnout TXT">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleDownloadDocx} className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer" title="Stáhnout DOCX">
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button onClick={handlePrint} className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer" title="Tisk">
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-5 md:p-6 bg-[rgba(255,255,255,0.02)]">
        <DisclaimerBanner compact />
        {activeTab === 'preview' ? (
          <div className="max-w-2xl mx-auto p-8 md:p-10 bg-[#18181b] border border-[rgba(255,255,255,0.06)] shadow-xl rounded-sm min-h-[842px] relative">
            {/* Watermark */}
            <div className="absolute top-3 right-3 text-[8px] uppercase font-semibold tracking-widest text-[#c8962e]/20 border border-[rgba(200,150,46,0.1)] px-2 py-0.5 rounded">
              DocBot
            </div>
            <div
              className="prose prose-invert max-w-none text-xs leading-relaxed text-[#f4f4f5] [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-center [&_h1]:uppercase [&_h1]:mb-6 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-[rgba(255,255,255,0.08)] [&_h2]:pb-1 [&_p]:text-justify [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: displayHTML }}
            />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto h-full flex flex-col">
            {/* B4: editační lišta */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#71717a] flex items-center gap-1">
                <Pencil className="w-3 h-3" />
                Upravte libovolné pole/větu — změny se promítnou do exportu.
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#a1a1aa] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg hover:text-[#f4f4f5] hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
                  title="Vrátit na vygenerovaný text"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
                <button
                  onClick={handleApplyEdits}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#c8962e] bg-[rgba(200,150,46,0.1)] border border-[rgba(200,150,46,0.25)] rounded-lg hover:bg-[rgba(200,150,46,0.2)] transition-colors cursor-pointer"
                  title="Použít úpravy a zobrazit náhled"
                >
                  <Check className="w-3 h-3" />
                  Použít úpravy
                </button>
              </div>
            </div>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full flex-1 min-h-[500px] p-5 font-mono text-xs text-[#a1a1aa] bg-[#18181b] border border-[rgba(255,255,255,0.06)] rounded-lg outline-none resize-none focus:border-[rgba(200,150,46,0.4)] transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  );
}
