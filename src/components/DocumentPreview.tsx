import React, { useState } from 'react';
import { ContractType, ContractFields } from '../types';
import { generateContractHTML, getContractTitle } from '../lib/templateGenerator';
import { Copy, Download, Printer, FileText, Check, Eye, Code2 } from 'lucide-react';

interface DocumentPreviewProps {
  contractType: ContractType;
  fields: ContractFields;
  highlightField?: string;
}

export function DocumentPreview({
  contractType,
  fields,
  highlightField,
}: DocumentPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');
  const [isCopied, setIsCopied] = useState(false);

  const contractHTML = generateContractHTML(contractType, fields, highlightField);

  const getPlainText = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contractHTML;
    return tempDiv.innerText || tempDiv.textContent || '';
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getPlainText());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const title = getContractTitle(contractType);
    const element = document.createElement('a');
    const file = new Blob([getPlainText()], { type: 'text/plain;charset=utf-8' });
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
      <html><head><title>${getContractTitle(contractType)}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; padding: 40px; line-height: 1.6; color: #000; }
          h1 { text-align: center; text-transform: uppercase; font-size: 20px; margin-bottom: 30px; }
          h2 { font-size: 16px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px; }
          p { text-align: justify; margin-bottom: 10px; }
        </style>
      </head><body>
        ${contractHTML.replace(/<span class="[^"]*text-red[^"]*"[^>]*>\[\s*([^\]]*)\s*-\s*nedoplněno\s*\]<\/span>/g, '........................')}
        <script>window.onload=function(){window.print();window.close();}</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm" id="document-preview-panel">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
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
          <button onClick={handleCopy} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all cursor-pointer" title="Kopírovat">
            {isCopied ? <Check className="w-3.5 h-3.5 text-gold" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleDownload} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all cursor-pointer" title="Stáhnout">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={handlePrint} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all cursor-pointer" title="Tisk">
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-5 md:p-6 bg-zinc-950/60">
        {activeTab === 'preview' ? (
          <div className="max-w-2xl mx-auto p-8 md:p-10 bg-zinc-900 border border-zinc-800 shadow-xl rounded-sm min-h-[842px] relative">
            {/* Watermark */}
            <div className="absolute top-3 right-3 text-[8px] uppercase font-semibold tracking-widest text-gold/20 border border-gold/10 px-2 py-0.5 rounded">
              DocBot
            </div>
            <div
              className="prose prose-invert max-w-none text-xs leading-relaxed text-zinc-200 [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-center [&_h1]:uppercase [&_h1]:mb-6 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-zinc-700 [&_h2]:pb-1 [&_p]:text-justify [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: contractHTML }}
            />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto h-full">
            <textarea
              readOnly
              value={getPlainText()}
              className="w-full h-full min-h-[500px] p-5 font-mono text-xs text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg outline-none resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
