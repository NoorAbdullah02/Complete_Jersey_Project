"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAllRegistrations = generateAllRegistrations;
exports.generatePaidReport = generatePaidReport;
exports.generateUnpaidReport = generateUnpaidReport;
exports.generateBatchReport = generateBatchReport;
exports.generateFinancialReport = generateFinancialReport;
exports.generateExpensesReport = generateExpensesReport;
const exceljs_1 = __importDefault(require("exceljs"));
function styleHeader(sheet) {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF667EEA' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;
}
/** Write workbook to buffer, then send as response — prevents stream corruption */
async function sendWorkbook(wb, res, filename) {
    const buffer = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Length', buffer.byteLength.toString());
    res.end(Buffer.from(buffer));
}
async function generateAllRegistrations(orders, res) {
    const wb = new exceljs_1.default.Workbook();
    const ws = wb.addWorksheet('All Registrations');
    ws.columns = [
        { header: '#', key: 'idx', width: 6 },
        { header: 'Order ID', key: 'oid', width: 10 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Mobile', key: 'mobile', width: 15 },
        { header: 'Jersey #', key: 'jersey', width: 10 },
        { header: 'Jersey Name', key: 'jerseyName', width: 15 },
        { header: 'Batch', key: 'batch', width: 10 },
        { header: 'Size', key: 'size', width: 8 },
        { header: 'Collar', key: 'collar', width: 12 },
        { header: 'Sleeve', key: 'sleeve', width: 12 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Txn ID', key: 'txn', width: 18 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Date', key: 'date', width: 18 },
    ];
    let rowIndex = 1;
    orders.forEach((o) => {
        if (o.items && o.items.length > 0) {
            o.items.forEach((item) => {
                ws.addRow({
                    idx: rowIndex++, oid: o.id, name: o.name, mobile: o.mobile_number,
                    jersey: item.jersey_number, jerseyName: item.jersey_name || '-',
                    batch: item.batch || '-',
                    size: item.size, collar: item.collar_type, sleeve: item.sleeve_type,
                    email: o.email, txn: o.transaction_id || '-',
                    status: o.status, date: new Date(o.created_at).toLocaleDateString(),
                });
            });
        }
        else {
            ws.addRow({
                idx: rowIndex++, oid: o.id, name: o.name, mobile: o.mobile_number,
                jersey: 'N/A', jerseyName: '-', batch: '-', size: '-', collar: '-', sleeve: '-',
                email: o.email, txn: o.transaction_id || '-',
                status: o.status, date: new Date(o.created_at).toLocaleDateString(),
            });
        }
    });
    styleHeader(ws);
    await sendWorkbook(wb, res, 'all-registrations.xlsx');
}
async function generatePaidReport(orders, res) {
    const paid = orders.filter((o) => o.status === 'done');
    const wb = new exceljs_1.default.Workbook();
    const ws = wb.addWorksheet('Paid Users');
    ws.columns = [
        { header: '#', key: 'idx', width: 6 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Mobile', key: 'mobile', width: 15 },
        { header: 'Jersey #', key: 'jersey', width: 15 },
        { header: 'Items Count', key: 'count', width: 12 },
        { header: 'Txn ID', key: 'txn', width: 18 },
        { header: 'Total Price', key: 'price', width: 15 },
        { header: 'Date', key: 'date', width: 18 },
    ];
    paid.forEach((o, i) => {
        const jerseys = o.items ? o.items.map(it => it.jersey_number).join(', ') : '-';
        ws.addRow({
            idx: i + 1, name: o.name, mobile: o.mobile_number, jersey: jerseys,
            count: o.items?.length || 0, txn: o.transaction_id || '-',
            price: parseFloat(o.final_price), date: new Date(o.created_at).toLocaleDateString(),
        });
    });
    styleHeader(ws);
    await sendWorkbook(wb, res, 'paid-users.xlsx');
}
async function generateUnpaidReport(orders, res) {
    const unpaid = orders.filter((o) => o.status === 'pending');
    const wb = new exceljs_1.default.Workbook();
    const ws = wb.addWorksheet('Unpaid Users');
    ws.columns = [
        { header: '#', key: 'idx', width: 6 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Mobile', key: 'mobile', width: 15 },
        { header: 'Jersey #', key: 'jersey', width: 15 },
        { header: 'Items Count', key: 'count', width: 12 },
        { header: 'Total Price', key: 'price', width: 15 },
        { header: 'Date', key: 'date', width: 18 },
    ];
    unpaid.forEach((o, i) => {
        const jerseys = o.items ? o.items.map(it => it.jersey_number).join(', ') : '-';
        ws.addRow({
            idx: i + 1, name: o.name, mobile: o.mobile_number, jersey: jerseys,
            count: o.items?.length || 0,
            price: parseFloat(o.final_price), date: new Date(o.created_at).toLocaleDateString(),
        });
    });
    styleHeader(ws);
    await sendWorkbook(wb, res, 'unpaid-users.xlsx');
}
async function generateBatchReport(orders, res) {
    const wb = new exceljs_1.default.Workbook();
    const itemsByBatch = {};
    orders.forEach(o => {
        if (o.items) {
            o.items.forEach(item => {
                const batch = item.batch || 'No Batch';
                if (!itemsByBatch[batch])
                    itemsByBatch[batch] = [];
                itemsByBatch[batch].push({
                    ...item, orderName: o.name, orderMobile: o.mobile_number, orderStatus: o.status,
                });
            });
        }
    });
    // If no batches at all, add a placeholder sheet (Excel requires at least 1 worksheet)
    if (Object.keys(itemsByBatch).length === 0) {
        const ws = wb.addWorksheet('No Data');
        ws.columns = [{ header: 'Info', key: 'info', width: 40 }];
        ws.addRow({ info: 'No batch data available' });
        styleHeader(ws);
    }
    else {
        for (const [batchName, items] of Object.entries(itemsByBatch)) {
            const sanitizedName = batchName.replace(/[\\/?*[\]:]/g, '_').substring(0, 31);
            const ws = wb.addWorksheet(sanitizedName);
            ws.columns = [
                { header: '#', key: 'idx', width: 6 },
                { header: 'Name', key: 'name', width: 20 },
                { header: 'Mobile', key: 'mobile', width: 15 },
                { header: 'Jersey #', key: 'jersey', width: 10 },
                { header: 'Jersey Name', key: 'jerseyName', width: 15 },
                { header: 'Size', key: 'size', width: 8 },
                { header: 'Status', key: 'status', width: 10 },
            ];
            items.forEach((item, i) => {
                ws.addRow({
                    idx: i + 1, name: item.orderName, mobile: item.orderMobile,
                    jersey: item.jersey_number, jerseyName: item.jersey_name || '-',
                    size: item.size, status: item.orderStatus,
                });
            });
            styleHeader(ws);
        }
    }
    await sendWorkbook(wb, res, 'batch-report.xlsx');
}
async function generateFinancialReport(orders, expenses, res) {
    const wb = new exceljs_1.default.Workbook();
    const summary = wb.addWorksheet('Financial Summary');
    const totalRevenue = orders.filter((o) => o.status === 'done').reduce((s, o) => s + parseFloat(o.final_price), 0);
    const pendingRevenue = orders.filter((o) => o.status === 'pending').reduce((s, o) => s + parseFloat(o.final_price), 0);
    const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalJerseys = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
    summary.columns = [
        { header: 'Category', key: 'category', width: 30 },
        { header: 'Amount', key: 'amount', width: 20 },
    ];
    summary.addRow({ category: 'Total Orders', amount: orders.length });
    summary.addRow({ category: 'Total Jerseys Sold', amount: totalJerseys });
    summary.addRow({ category: 'Paid Orders', amount: orders.filter((o) => o.status === 'done').length });
    summary.addRow({ category: 'Pending Orders', amount: orders.filter((o) => o.status === 'pending').length });
    summary.addRow({ category: '', amount: '' });
    summary.addRow({ category: 'Total Revenue (Paid)', amount: totalRevenue });
    summary.addRow({ category: 'Pending Revenue', amount: pendingRevenue });
    summary.addRow({ category: 'Total Expenses', amount: totalExpenses });
    summary.addRow({ category: 'Net Balance', amount: totalRevenue - totalExpenses });
    styleHeader(summary);
    await sendWorkbook(wb, res, 'financial-summary.xlsx');
}
async function generateExpensesReport(expenses, res) {
    const wb = new exceljs_1.default.Workbook();
    const ws = wb.addWorksheet('Expenses');
    ws.columns = [
        { header: '#', key: 'idx', width: 6 },
        { header: 'Description', key: 'desc', width: 30 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Created By', key: 'by', width: 15 },
    ];
    expenses.forEach((e, i) => {
        ws.addRow({
            idx: i + 1, desc: e.description, amount: parseFloat(e.amount),
            category: e.category, date: e.date || '-', by: e.created_by || '-',
        });
    });
    const totalRow = ws.addRow({ idx: '', desc: 'TOTAL', amount: expenses.reduce((s, e) => s + parseFloat(e.amount), 0) });
    totalRow.font = { bold: true };
    styleHeader(ws);
    await sendWorkbook(wb, res, 'expenses-report.xlsx');
}
//# sourceMappingURL=reports.js.map