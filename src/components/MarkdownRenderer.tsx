import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content) {
    return <div className="text-xs text-slate-500 italic">No output content available.</div>;
  }

  // Parse lines into blocks (code blocks vs text blocks)
  const lines = content.split('\n');
  const elements: Array<{
    type: 'code' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'p' | 'hr';
    lang?: string;
    text: string;
    items?: string[];
  }> = [];

  let inCodeBlock = false;
  let codeLang = '';
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push({
          type: 'code',
          lang: codeLang || 'text',
          text: codeBuffer.join('\n'),
        });
        codeBuffer = [];
        inCodeBlock = false;
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = line.replace('```', '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      elements.push({ type: 'h1', text: trimmed.slice(2) });
    } else if (trimmed.startsWith('## ')) {
      elements.push({ type: 'h2', text: trimmed.slice(3) });
    } else if (trimmed.startsWith('### ')) {
      elements.push({ type: 'h3', text: trimmed.slice(4) });
    } else if (trimmed.startsWith('---') || trimmed.startsWith('***')) {
      elements.push({ type: 'hr', text: '' });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const lastElem = elements[elements.length - 1];
      if (lastElem && lastElem.type === 'ul') {
        lastElem.items?.push(trimmed.slice(2));
      } else {
        elements.push({ type: 'ul', text: '', items: [trimmed.slice(2)] });
      }
    } else if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^\d+\.\s(.*)/);
      const text = match ? match[1] : trimmed;
      const lastElem = elements[elements.length - 1];
      if (lastElem && lastElem.type === 'ol') {
        lastElem.items?.push(text);
      } else {
        elements.push({ type: 'ol', text: '', items: [text] });
      }
    } else {
      elements.push({ type: 'p', text: trimmed });
    }
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push({
      type: 'code',
      lang: codeLang || 'text',
      text: codeBuffer.join('\n'),
    });
  }

  // Format inline bold, italic, code
  const formatInline = (str: string) => {
    // Replace inline `code`
    const parts = str.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-xs border border-slate-700/60"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed font-sans">
      {elements.map((el, idx) => {
        switch (el.type) {
          case 'h1':
            return (
              <h1
                key={idx}
                className="text-base font-bold text-slate-100 border-b border-slate-800 pb-1.5 mt-4 first:mt-0 tracking-tight"
              >
                {el.text}
              </h1>
            );
          case 'h2':
            return (
              <h2
                key={idx}
                className="text-sm font-semibold text-slate-200 mt-3.5 first:mt-0 tracking-tight flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {el.text}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={idx} className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-2.5">
                {el.text}
              </h3>
            );
          case 'hr':
            return <hr key={idx} className="border-slate-800 my-3" />;
          case 'ul':
            return (
              <ul key={idx} className="list-disc pl-5 space-y-1.5 text-slate-300">
                {el.items?.map((item, itemIdx) => (
                  <li key={itemIdx}>{formatInline(item)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={idx} className="list-decimal pl-5 space-y-1.5 text-slate-300">
                {el.items?.map((item, itemIdx) => (
                  <li key={itemIdx}>{formatInline(item)}</li>
                ))}
              </ol>
            );
          case 'code':
            return (
              <div
                key={idx}
                className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden my-3 shadow-inner"
              >
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                  <span className="uppercase font-semibold tracking-wider text-blue-400">
                    {el.lang || 'SCRIPT / QUERY'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(el.text, idx)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-sans">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="font-sans">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 overflow-x-auto text-[11px] font-mono text-emerald-400/90 leading-relaxed selection:bg-blue-600">
                  <code>{el.text}</code>
                </pre>
              </div>
            );
          case 'p':
          default:
            return (
              <p key={idx} className="text-slate-300">
                {formatInline(el.text)}
              </p>
            );
        }
      })}
    </div>
  );
}
