import React, { useState } from 'react';
import { ContractType, ContractFields } from '../types';
import { generateContractHTML, getContractTitle } from '../lib/templateGenerator';
import { Copy, Download, Printer, Edit2, FileText, Check } from 'lucide-react';

interface DocumentPreviewProps {
  contractType: ContractType;
  fields: ContractFields;
  highlightField?: string;
  onManualTextChange?: (htmlContent: string) => void;
}

export function DocumentPreview({
  contractType,
  fields,
  highlightField,
}: DocumentPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');
  const [isCopied, setIsCopied] = useState(false);

  // Generate the clean HTML of the contract
  const contractHTML = generateContractHTML(contractType, fields, highlightField);

  // Strip HTML tags to get raw clean plain text for clipboard
  const getPlainText = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contractHTML;
    return tempDiv.innerText || tempDiv.textContent || '';
  };

  const handleCopy = async () => {
    try {
      const text = getPlainText();
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const title = getContractTitle(contractType);
    const text = getPlainText();
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${getContractTitle(contractType)}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 40px; line-height: 1.6; color: #000; }
            h1 { text-align: center; text-transform: uppercase; font-size: 20px; margin-bottom: 30px; }
            h2 { font-size: 16px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px; }
            p { text-align: justify; margin-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; text-align: center; }
            .border-t { border-top: 1px solid #000; width: 200px; margin: 50px auto 0; padding-top: 5px; }
          </style>
        </head>
        <body>
          ${contractHTML.replace(/<span class="text-red-500[^>]*>\[\s*([^\]]*)\s*-\s*nedoplněno\s*\]<\/span>/g, '........................')}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm" id="document-preview-panel">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950">
        {/* Left tabs */}
        <div className="flex bg-gray-200/60 dark:bg-gray-800/80 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Papírový náhled (A4)
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'raw'
                ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            Čistý text smlouvy
          </button>
        </div>

        {/* Right action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            title="Kopírovat text"
            id="btn-copy-contract"
            className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer border border-gray-200 dark:border-gray-800"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            title="Stáhnout textový soubor"
            id="btn-download-contract"
            className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer border border-gray-200 dark:border-gray-800"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            title="Tisknout / PDF"
            id="btn-print-contract"
            className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer border border-gray-200 dark:border-gray-800"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sheet Container */}
      <div className="flex-grow overflow-y-auto p-6 md:p-8 bg-gray-100/60 dark:bg-gray-950/40">
        {activeTab === 'preview' ? (
          <div 
            id="a4-sheet"
            className="max-w-2xl mx-auto p-8 md:p-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md rounded-sm min-h-[842px] relative font-serif text-gray-800 dark:text-gray-200"
          >
            {/* Stamp / Decorative watermark */}
            <div className="absolute top-4 right-4 text-[10px] uppercase font-sans font-bold tracking-widest text-emerald-600/30 dark:text-emerald-400/20 border border-emerald-500/20 px-2 py-0.5 rounded">
              DocuGenius AI Draft
            </div>

            {/* Inner HTML contract */}
            <div 
              className="prose dark:prose-invert max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: contractHTML }}
            />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto h-full">
            <textarea
              readOnly
              value={getPlainText()}
              className="w-full h-full min-h-[500px] p-6 font-mono text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-inner outline-none focus:ring-0 resize-none"
              placeholder="Zde se objeví čistý text generované smlouvy..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
