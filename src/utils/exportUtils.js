/**
 * Converts an array of objects into a CSV string and triggers a download.
 * @param {Array} data - Array of objects to export
 * @param {string} filename - The desired filename (e.g., 'report.csv')
 */
export const exportToCSV = (data, filename) => {
  if (!data || !data.length) {
    alert("No data available to export.");
    return;
  }

  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Construct CSV rows
  const csvRows = [];
  csvRows.push(headers.join(',')); // Add header row

  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '\\"');
      return `"${escaped}"`; // Enclose in quotes to handle commas within fields
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Triggers the browser's native print dialog for PDF export / printing.
 */
export const printReport = () => {
  window.print();
};
