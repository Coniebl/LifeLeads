const ExcelJS = require('exceljs');

async function test() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Test');
  
  ws.columns = [
    { header: 'A', key: 'a' },
    { header: 'B', key: 'b' },
    { header: 'C', key: 'c' }
  ];
  ws.addRow({a: 1, b: 2, c: 3});
  
  ws.autoFilter = {
    from: 'A1',
    to: 'C1',
    columns: [
      { filterColumn: 0, hiddenButton: 1 }
    ]
  };
  await wb.xlsx.writeFile('test_columns.xlsx');
}

test().catch(console.error);
