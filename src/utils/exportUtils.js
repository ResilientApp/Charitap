/**
 * Export utilities for generating CSV and PDF from activity data
 * Updated to handle tab-specific exports (donated vs collected)
 */

// Shared HTML escaping helper to prevent XSS in PDF templates
function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Shared CSV cell escaper: wraps in quotes and escapes embedded quotes (RFC 4180)
function csvCell(value) {
  const str = value == null ? '' : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

// Shared popup helper with null-guard (handles popup-blocked case)
function printHtml(htmlContent) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.warn('[Charitap] Popup blocked: cannot open PDF preview.');
    return;
  }
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); }, 250);
}

// Shared CSV download helper — revokes blob URL to prevent memory leaks
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // release memory
}

// CSV Export for Donated Tab
export function exportDonatedCSV(activities, filename = 'charitap-donations.csv') {
  const headers = ['Date', 'Charity', 'Amount'];

  const rows = activities.map(activity => [
    new Date(activity.date).toLocaleString(),
    activity.charity,
    activity.amount,
  ]);

  const csvContent = [
    headers.map(csvCell).join(','),
    ...rows.map(row => row.map(csvCell).join(',')),
  ].join('\n');

  downloadCSV(csvContent, filename);
}

// CSV Export for Collected Tab
export function exportCollectedCSV(activities, filename = 'charitap-collected.csv') {
  const headers = ['Date', 'Purchase Amount', 'Round-Up Amount'];

  const rows = activities.map(activity => [
    new Date(activity.date).toLocaleString(),
    activity.purchaseAmount ? `$${parseFloat(activity.purchaseAmount).toFixed(2)}` : '-',
    activity.amount,
  ]);

  const csvContent = [
    headers.map(csvCell).join(','),
    ...rows.map(row => row.map(csvCell).join(',')),
  ].join('\n');

  downloadCSV(csvContent, filename);
}

// PDF Export for Donated Tab
export function exportDonatedPDF(activities) {
  const rows = activities.map(activity => `
    <tr>
      <td>${escapeHtml(new Date(activity.date).toLocaleDateString())}</td>
      <td>${escapeHtml(activity.charity)}</td>
      <td>${escapeHtml(activity.amount)}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Charitap Donation Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #333; border-bottom: 3px solid #FCD34D; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #FCD34D; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total { font-weight: bold; background-color: #FEF3C7; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Charitap Donation Report</h1>
        <p>Generated on: ${escapeHtml(new Date().toLocaleDateString())}</p>
        <table>
          <thead>
            <tr><th>Date</th><th>Charity</th><th>Amount</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="total">Total Transactions: ${activities.length}</p>
      </body>
    </html>
  `;

  printHtml(htmlContent);
}

// PDF Export for Collected Tab
export function exportCollectedPDF(activities) {
  const rows = activities.map(activity => `
    <tr>
      <td>${escapeHtml(new Date(activity.date).toLocaleDateString())}</td>
      <td>${escapeHtml(activity.purchaseAmount ? `$${parseFloat(activity.purchaseAmount).toFixed(2)}` : '-')}</td>
      <td>${escapeHtml(activity.amount)}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Charitap Collection Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #333; border-bottom: 3px solid #FCD34D; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #FCD34D; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total { font-weight: bold; background-color: #FEF3C7; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Charitap Collection Report</h1>
        <p>Generated on: ${escapeHtml(new Date().toLocaleDateString())}</p>
        <table>
          <thead>
            <tr><th>Date</th><th>Purchase Amount</th><th>Round-Up Amount</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="total">Total Transactions: ${activities.length}</p>
      </body>
    </html>
  `;

  printHtml(htmlContent);
}

// Legacy exports for backward compatibility (will be removed in a future release)
export function exportToCSV(activities, filename = 'charitap-export.csv') {
  const headers = ['Date', 'Type', 'Charity', 'Category', 'Amount'];

  const rows = activities.map(activity => [
    new Date(activity.date).toLocaleString(),
    activity.type === 'donation' ? 'Donation' : 'Round-Up Collection',
    activity.charity,
    activity.category,
    activity.amount,
  ]);

  const csvContent = [
    headers.map(csvCell).join(','),
    ...rows.map(row => row.map(csvCell).join(',')),
  ].join('\n');

  downloadCSV(csvContent, filename);
}

export function exportToPDF(activities) {
  const rows = activities.map(activity => `
    <tr>
      <td>${escapeHtml(new Date(activity.date).toLocaleDateString())}</td>
      <td>${escapeHtml(activity.type === 'donation' ? 'Donation' : 'Round-Up')}</td>
      <td>${escapeHtml(activity.charity)}</td>
      <td>${escapeHtml(activity.category)}</td>
      <td>${escapeHtml(activity.amount)}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Charitap Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #333; border-bottom: 3px solid #FCD34D; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #FCD34D; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total { font-weight: bold; background-color: #FEF3C7; }
        </style>
      </head>
      <body>
        <h1>Charitap Report</h1>
        <p>Generated on: ${escapeHtml(new Date().toLocaleDateString())}</p>
        <table>
          <thead>
            <tr><th>Date</th><th>Type</th><th>Charity</th><th>Category</th><th>Amount</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="total">Total Transactions: ${activities.length}</p>
      </body>
    </html>
  `;

  printHtml(htmlContent);
}
