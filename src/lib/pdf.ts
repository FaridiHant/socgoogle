import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IncidentRegisterRow } from '../types';
import { IncidentFilters } from './incidents';

export function exportIncidentRegisterPDF(
  records: IncidentRegisterRow[],
  filters?: IncidentFilters
): void {
  // Use landscape orientation to accommodate detailed SOC columns
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const now = new Date();
  const dateFormatted = now.toISOString().slice(0, 10);
  const timeFormatted = now.toTimeString().slice(0, 5);

  // Header styling
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('SOC Incident Register', 40, 40);

  // Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Generated: ${dateFormatted} ${timeFormatted} UTC`, 40, 58);
  doc.text(`Total Records Exported: ${records.length}`, 40, 72);

  // Applied Filters summary
  const filterParts: string[] = [];
  if (filters?.search) filterParts.push(`Search: "${filters.search}"`);
  if (filters?.severity && filters.severity !== 'All') filterParts.push(`Severity: ${filters.severity}`);
  if (filters?.status && filters.status !== 'All') filterParts.push(`Status: ${filters.status}`);
  if (filters?.overdueOnly) filterParts.push('Overdue: Yes');

  const filterSummary = filterParts.length > 0 ? filterParts.join(' | ') : 'None (All Records)';
  doc.setFont('helvetica', 'italic');
  doc.text(`Applied Filters: ${filterSummary}`, 40, 86);

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(40, 96, doc.internal.pageSize.width - 40, 96);

  // Table Data
  const headers = [
    [
      'Case ID',
      'Severity',
      'Status',
      'Overdue',
      'Alert Name',
      'Affected Host',
      'Affected User',
      'Opened At',
      'Closed At',
      'Opened By',
      'Assigned L2',
    ],
  ];

  const rows = records.map((r) => [
    (r.case_id || '').substring(0, 8),
    r.severity || 'N/A',
    (r.status || 'open').toUpperCase(),
    r.overdue ? 'YES' : 'NO',
    r.alert_name || 'N/A',
    r.affected_host || 'N/A',
    r.affected_user || '-',
    r.opened_at ? new Date(r.opened_at).toLocaleString() : '-',
    r.closed_at ? new Date(r.closed_at).toLocaleString() : '-',
    r.opened_by || '-',
    r.assigned_l2 || 'Unassigned',
  ]);

  autoTable(doc, {
    startY: 106,
    head: headers,
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [248, 250, 252],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 55, font: 'courier' }, // Case ID
      1: { cellWidth: 50, fontStyle: 'bold' }, // Severity
      2: { cellWidth: 55 }, // Status
      3: { cellWidth: 45 }, // Overdue
      4: { cellWidth: 120 }, // Alert Name
      5: { cellWidth: 75, font: 'courier' }, // Host
      6: { cellWidth: 70 }, // User
      7: { cellWidth: 80 }, // Opened At
      8: { cellWidth: 80 }, // Closed At
      9: { cellWidth: 75 }, // Opened By
      10: { cellWidth: 75 }, // Assigned L2
    },
    didParseCell: (data) => {
      // Color-code Severity in the PDF
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw).toLowerCase();
        if (val === 'critical') {
          data.cell.styles.textColor = [220, 38, 38];
        } else if (val === 'high') {
          data.cell.styles.textColor = [234, 88, 12];
        } else if (val === 'medium') {
          data.cell.styles.textColor = [202, 138, 4];
        } else if (val === 'low') {
          data.cell.styles.textColor = [37, 99, 235];
        }
      }
      // Color-code Overdue
      if (data.section === 'body' && data.column.index === 3 && data.cell.raw === 'YES') {
        data.cell.styles.textColor = [220, 38, 38];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { top: 40, bottom: 40, left: 40, right: 40 },
  });

  const filename = `incident-register-${dateFormatted}.pdf`;
  doc.save(filename);
}
