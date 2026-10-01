import { useState } from 'react';
import { Download, FileText, Check } from 'lucide-react';
import { IncidentRegisterRow } from '../types';
import { exportIncidentRegisterPDF } from '../lib/pdf';
import { IncidentFilters } from '../lib/incidents';

interface PdfExportButtonProps {
  records: IncidentRegisterRow[];
  filters?: IncidentFilters;
  disabled?: boolean;
}

export function PdfExportButton({ records, filters, disabled }: PdfExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleExport = () => {
    if (disabled || records.length === 0) return;
    setIsExporting(true);
    try {
      exportIncidentRegisterPDF(records, filters);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || records.length === 0 || isExporting}
      title={records.length === 0 ? 'No incidents match current filters to export' : 'Export current filtered register to PDF'}
      className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {downloaded ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400">PDF Generated</span>
        </>
      ) : isExporting ? (
        <>
          <FileText className="w-3.5 h-3.5 animate-bounce text-blue-400" />
          <span>Generating PDF...</span>
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span>Download PDF ({records.length})</span>
        </>
      )}
    </button>
  );
}
