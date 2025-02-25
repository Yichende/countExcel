// 使用 xlsx 和 turndown
import {read, utils, write} from 'xlsx';
import Turndown from 'turndown';

// Excel转Markdown
function excelToMarkdown(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const html = utils.sheet_to_html(sheet);
    
    const turndown = new Turndown();
    const markdown = turndown.turndown(html);
    return markdown;
  };
  reader.readAsArrayBuffer(file);
}

// Markdown转Excel
function markdownToExcel(markdownTable) {
  const rows = markdownTable.split('\n').filter(line => line.trim());
  const headers = rows[1].split('|').slice(1, -1).map(h => h.trim());
  const data = rows.slice(3).map(row => {
    return row.split('|').slice(1, -1).map(cell => cell.trim());
  });

  const worksheet = utils.aoa_to_sheet([headers, ...data]);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  writeFile(workbook, 'output.xlsx');
}

export {excelToMarkdown, markdownToExcel}