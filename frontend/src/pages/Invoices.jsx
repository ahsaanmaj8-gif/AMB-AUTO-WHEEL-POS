import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSearch, FaPrint, FaEye, FaDownload, FaTrash, FaCalendar } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Modal from '../components/Common/Modal';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // ============ NEW FILTER STATES ============
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [monthFilter, setMonthFilter] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  // ============ FETCH INVOICES ============
  const fetchInvoices = async () => {
    try {
      const response = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/invoices');
      const sortedInvoices = response.data.invoices.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );

      console.log("Fetched invoices: ", sortedInvoices)
      setInvoices(sortedInvoices || []);
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  // ============ DELETE SELECTED INVOICES ============
  const deleteSelectedInvoices = async () => {
    if (selectedInvoices.length === 0) {
      toast.error('No invoices selected');
      return;
    }

    if (!window.confirm(`Delete ${selectedInvoices.length} selected invoice(s)? This cannot be undone!`)) {
      return;
    }

    try {
      await Promise.all(
        selectedInvoices.map(id => 
          axios.delete(`https://amb-auto-wheel-pos.onrender.com/api/invoices/${id}`)
        )
      );
      toast.success(`${selectedInvoices.length} invoices deleted successfully`);
      setSelectedInvoices([]);
      setSelectAll(false);
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to delete invoices');
    }
  };

  // ============ DELETE SINGLE INVOICE ============
  const deleteSingleInvoice = async (id) => {
    if (!window.confirm('Delete this invoice? This cannot be undone!')) return;
    try {
      await axios.delete(`https://amb-auto-wheel-pos.onrender.com/api/invoices/${id}`);
      toast.success('Invoice deleted successfully');
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  // ============ DELETE INVOICES BY MONTH ============
  const deleteInvoicesByMonth = async () => {
    if (!monthFilter) {
      toast.error('Please select a month');
      return;
    }

    const [year, month] = monthFilter.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (!window.confirm(`Delete ALL invoices from ${monthNames[parseInt(month) - 1]} ${year}? This cannot be undone!`)) {
      return;
    }

    try {
      const response = await axios.delete(
        `https://amb-auto-wheel-pos.onrender.com/api/invoices/month/${year}/${month}`
      );
      toast.success(`${response.data.deletedCount} invoices deleted for ${monthNames[parseInt(month) - 1]} ${year}`);
      fetchInvoices();
      setMonthFilter('');
    } catch (error) {
      toast.error('Failed to delete invoices');
    }
  };

  // ============ DELETE ALL INVOICES ============
  const deleteAllInvoices = async () => {
    if (!window.confirm('⚠️ Delete ALL invoices? This cannot be undone!')) return;

    try {
      await axios.delete('https://amb-auto-wheel-pos.onrender.com/api/invoices/all');
      toast.success('All invoices deleted successfully');
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to delete invoices');
    }
  };

  // ============ TOGGLE SELECT ALL ============
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(inv => inv._id));
    }
    setSelectAll(!selectAll);
  };

  // ============ TOGGLE SELECT INVOICE ============
  const handleSelectInvoice = (id) => {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(selectedInvoices.filter(ids => ids !== id));

      // console.log(selectedInvoice)
    } else {
      setSelectedInvoices([...selectedInvoices, id]);
    }
  };

  // ============ GET MONTH OPTIONS ============
  const getMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
  };

  // ============ EXPORT TO EXCEL ============
  const handleExportAll = () => {
    if (invoices.length === 0) {
      toast.error('No invoices to export');
      return;
    }

    setExporting(true);

    try {
      const exportData = invoices.map((invoice, index) => ({
        'S.No': index + 1,
        'Invoice #': invoice.invoiceNumber || `INV-${invoice._id.slice(-6)}`,
        'Customer Name': invoice.customerName,
        'Customer Phone': invoice.customerPhone,
        'Vehicle Number': invoice.vehicleNumber,
        'Vehicle Model': invoice.vehicleModel || 'N/A',
        'Total Amount': invoice.totalAmount || 0,
        'Paid Amount': invoice.paidAmount || 0,
        'Balance': invoice.balance || 0,
        'Payment Status': invoice.paymentStatus || 'unpaid',
        'Payment Method': invoice.paymentMethod || 'cash',
        'Date': new Date(invoice.createdAt).toLocaleDateString(),
        'Time': new Date(invoice.createdAt).toLocaleTimeString(),
        'Items Count': invoice.items?.length || 0,
        'Subtotal': invoice.subtotal || 0,
        'Tax': invoice.tax || 0,
        'Discount': invoice.discount || 0,
        'Notes': invoice.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);

      const colWidths = [
        { wch: 8 }, { wch: 18 }, { wch: 25 }, { wch: 18 },
        { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
        { wch: 12 }, { wch: 30 }
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

      const date = new Date();
      const filename = `Invoices_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.xlsx`;
      saveAs(data, filename);
      toast.success(`Exported ${invoices.length} invoices successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export invoices');
    } finally {
      setExporting(false);
    }
  };

  // ============ EXPORT TO CSV ============
  const handleExportCSV = () => {
    if (invoices.length === 0) {
      toast.error('No invoices to export');
      return;
    }

    setExporting(true);

    try {
      const exportData = invoices.map((invoice, index) => ({
        'S.No': index + 1,
        'Invoice #': invoice.invoiceNumber || `INV-${invoice._id.slice(-6)}`,
        'Customer Name': invoice.customerName,
        'Customer Phone': invoice.customerPhone,
        'Vehicle Number': invoice.vehicleNumber,
        'Total Amount': invoice.totalAmount || 0,
        'Paid Amount': invoice.paidAmount || 0,
        'Balance': invoice.balance || 0,
        'Payment Status': invoice.paymentStatus || 'unpaid',
        'Date': new Date(invoice.createdAt).toLocaleDateString("en-GB")
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const csvData = XLSX.utils.sheet_to_csv(ws);
      
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const date = new Date();
      const filename = `Invoices_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.csv`;
      saveAs(blob, filename);
      toast.success(`Exported ${invoices.length} invoices as CSV!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export invoices');
    } finally {
      setExporting(false);
    }
  };

  // ============ PRINT INVOICE ============
 // In handlePrint function
const handlePrint = (invoice) => {
  console.log("invoice: ", invoice)
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Please allow popups for this site');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${invoice.invoiceNumber || `INV-${invoice._id.slice(-6)}`}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @media print {
          body { print-color-adjust: exact; }
          .no-print { display: none; }
        }
        body { font-family: Arial, sans-serif; padding: 40px; background: #fff; }
        .border-bottom { border-bottom: 2px solid #1e3a8a; }
        .bg-light { background: #f8fafc; }
        .bg-primary { background: #1e3a8a; }
        .text-primary { color: #1e3a8a; }
        .grand-total { font-size: 22px; color: #1e3a8a; border-top: 2px solid #1e3a8a; padding-top: 10px; margin-top: 10px; }
        .status-badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .status-paid { background: #d4edda; color: #155724; }
        .status-unpaid { background: #f8d7da; color: #721c24; }
        .status-partial { background: #fff3cd; color: #856404; }
        .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="max-w-5xl mx-auto bg-white p-8">
        
        <!-- ============ HEADER ============ -->
        <div class="flex items-center justify-between border-b-2 border-blue-900 pb-4 mb-4">
          <div class="flex items-center gap-3">
            <img src="./frontend/public/amblogoblack.jpg" class="w-16 h-16 object-contain" alt="Logo" />
            <div>
              <h1 class="text-2xl font-bold text-blue-900">Amb Auto Workshop</h1>
              <p class="text-gray-500 text-sm">Professional Auto Services</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500">Invoice #: <span class="font-bold text-gray-800">${invoice.invoiceNumber || `INV-${invoice._id.slice(-6)}`}</span></p>
            <p class="text-sm text-gray-500">Date: <span class="font-bold text-gray-800">${new Date(invoice.createdAt).toLocaleDateString()}</span></p>
          </div>
        </div>

        <!-- ============ BILLING HEADER ============ -->
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-800">Billing Invoice</h2>
          <span class="status-badge status-${invoice.paymentStatus || 'unpaid'}">
            ${(invoice.paymentStatus || 'UNPAID').toUpperCase()}
          </span>
        </div>

        <!-- ============ CUSTOMER DETAILS ============ -->
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 class="font-bold text-gray-700 mb-2">Customer Details</h3>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div><span class="font-medium">Name:</span> ${invoice.customerName}</div>
            <div><span class="font-medium">Contact Number:</span> ${invoice.customerPhone}</div>
            <div><span class="font-medium">Email Address:</span> ${invoice.service?.customerAddress || 'N/A'}</div>
            <div><span class="font-medium">Vehicle Registration:</span> ${invoice.vehicleNumber}</div>
            <div><span class="font-medium">Vehicle Make :</span> ${invoice.service?.vehicleMake || 'N/A'}</div>
            <div><span class="font-medium">Vehicle Model:</span> ${invoice.service?.vehicleModel || 'N/A'}</div>
          </div>
        </div>

        <!-- ============ PARTS DETAILS ============ -->
        <div class="mb-4">
          <h3 class="font-bold text-gray-700 mb-2">Parts Details</h3>
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-blue-900 text-white">
                <th class="p-2 text-left">S No.</th>
                <th class="p-2 text-left">Part Name</th>
                <th class="p-2 text-center">Quantity</th>
                <th class="p-2 text-right">Unit Price</th>
                <th class="p-2 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.filter(i => i.type === 'part').map((item, index) => `
                <tr class="border-b">
                  <td class="p-2">${index + 1}</td>
                  <td class="p-2">${item.description}</td>
                  <td class="p-2 text-center">${item.quantity}</td>
                  <td class="p-2 text-right">PKR ${item.unitPrice.toLocaleString()}</td>
                  <td class="p-2 text-right">PKR ${item.totalPrice.toLocaleString()}</td>
                </tr>
              `).join('')}
              ${!invoice.items?.filter(i => i.type === 'part').length ? `
                <tr><td colspan="5" class="p-2 text-center text-gray-400">No parts listed</td></tr>
              ` : ''}
            </tbody>
            <tfoot>
              <tr class="font-bold">
                <td colspan="4" class="p-2 text-right">Total</td>
                <td class="p-2 text-right">PKR ${invoice.items?.filter(i => i.type === 'part').reduce((sum, i) => sum + i.totalPrice, 0).toLocaleString() || 0}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- ============ LABOR DETAILS ============ -->
        <div class="mb-4">
          <h3 class="font-bold text-gray-700 mb-2">Labor Details</h3>
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-blue-900 text-white">
                <th class="p-2 text-left">S No.</th>
                <th class="p-2 text-left">Work Description</th>
                <th class="p-2 text-center">Hrs</th>
                <th class="p-2 text-right">Rate</th>
                <th class="p-2 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.filter(i => i.type === 'service').map((item, index) => `
                <tr class="border-b">
                  <td class="p-2">${index + 1}</td>
                  <td class="p-2">${item.description}</td>
                  <td class="p-2 text-center">${item.quantity || 1}</td>
                  <td class="p-2 text-right">PKR ${item.unitPrice.toLocaleString()}</td>
                  <td class="p-2 text-right">PKR ${item.totalPrice.toLocaleString()}</td>
                </tr>
              `).join('')}
              ${!invoice.items?.filter(i => i.type === 'service').length ? `
                <tr><td colspan="5" class="p-2 text-center text-gray-400">No labor listed</td></tr>
              ` : ''}
            </tbody>
            <tfoot>
              <tr class="font-bold">
                <td colspan="4" class="p-2 text-right">Total</td>
                <td class="p-2 text-right">PKR ${invoice.items?.filter(i => i.type === 'service').reduce((sum, i) => sum + i.totalPrice, 0).toLocaleString() || 0}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- ============ SUBLET DETAILS ============ -->
        <div class="mb-4">
          <h3 class="font-bold text-gray-700 mb-2">Sublet</h3>
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-blue-900 text-white">
                <th class="p-2 text-left">S No.</th>
                <th class="p-2 text-left">Description of Work</th>
                <th class="p-2 text-center">Qty</th>
                <th class="p-2 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.filter(i => i.type === 'charge').map((item, index) => `
                <tr class="border-b">
                  <td class="p-2">${index + 1}</td>
                  <td class="p-2">${item.description}</td>
                  <td class="p-2 text-center">${item.quantity || 1}</td>
                  <td class="p-2 text-right">PKR ${item.totalPrice.toLocaleString()}</td>
                </tr>
              `).join('')}
              ${!invoice.items?.filter(i => i.type === 'charge').length ? `
                <tr><td colspan="4" class="p-2 text-center text-gray-400">No sublet listed</td></tr>
              ` : ''}
            </tbody>
            <tfoot>
              <tr class="font-bold">
                <td colspan="3" class="p-2 text-right">Total</td>
                <td class="p-2 text-right">PKR ${invoice.items?.filter(i => i.type === 'charge').reduce((sum, i) => sum + i.totalPrice, 0).toLocaleString() || 0}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- ============ CEO CATEGORY (Summary) ============ -->
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <h3 class="font-bold text-gray-700 mb-2">CEO Category</h3>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div><span class="font-medium">Total Parts:</span> PKR ${invoice.items?.filter(i => i.type === 'part').reduce((sum, i) => sum + i.totalPrice, 0).toLocaleString() || 0}</div>
            <div><span class="font-medium">Total Labor:</span> PKR ${invoice.items?.filter(i => i.type === 'service').reduce((sum, i) => sum + i.totalPrice, 0).toLocaleString() || 0}</div>
            <div><span class="font-medium">Sublet:</span> PKR ${invoice.items?.filter(i => i.type === 'charge').reduce((sum, i) => sum + i.totalPrice, 0).toLocaleString() || 0}</div>
            <div class="font-bold text-blue-600 text-lg"><span class="font-medium">Grand Total:</span> PKR ${invoice.totalAmount?.toLocaleString() || 0}</div>
          </div>
        </div>

        <!-- ============ TERMS & CONDITIONS ============ -->
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 text-sm">
          <h3 class="font-bold text-gray-700 mb-2">Terms and Conditions:</h3>
          <ol class="list-decimal list-inside space-y-1 text-gray-600">
            <li>Payments must be made in full by the due date specified on the invoice.</li>
            <li>All products and services are provided "as-is" and are subject to availability.</li>
            <li>Claims regarding defective goods or services must be submitted within 7 days of receipt.</li>
            <li>Warranties are only applicable as per manufacturer's policy.</li>
            <li>Custom orders and special services are non-refundable.</li>
            <li>For support or queries, please contact us at [+92-3025434437, 311-4234211].</li>
          </ol>
        </div>

        

        <!-- ============ AUTHORIZED SIGNATURE ============ -->
        <div class="flex justify-between items-center mt-6 pt-4 border-t">
          <div>
            <p class="text-sm font-medium">Muhammad Nauman Majeed</p>
            <p class="text-xs text-gray-500">Authorized Signature</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500">Thank you for choosing Amb Auto Workshop!</p>
          </div>
        </div>

        <!-- ============ FOOTER ============ -->
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>

        <!-- ============ PRINT BUTTON ============ -->
        <div class="text-center mt-6 no-print">
          <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            🖨️ Print Invoice
          </button>
        </div>

      </div>
    </body>
    </html>
  `);
  
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
};

  // ============ FILTER INVOICES ============
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.vehicleNumber?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === 'all' || inv.paymentStatus === filter;
    
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const invoiceDate = new Date(inv.createdAt);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      matchesDate = invoiceDate >= start && invoiceDate <= end;
    }
    
    return matchesSearch && matchesFilter && matchesDate;
  });

  return (
    <div>
      {/* ============ HEADER ============ */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Invoices</h2>
          <p className="text-gray-500">Manage all customer invoices</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={handleExportCSV}
            className="btn-outline btn-sm"
            disabled={exporting}
          >
            <FaDownload /> {exporting ? 'Exporting...' : 'CSV'}
          </button>
          <button 
            onClick={handleExportAll}
            className="btn-primary btn-sm"
            disabled={exporting}
          >
            <FaDownload /> {exporting ? 'Exporting...' : 'Excel'}
          </button>
          {selectedInvoices.length > 0 && (
            <button 
              onClick={deleteSelectedInvoices}
              className="btn-danger btn-sm"
            >
              <FaTrash /> Delete ({selectedInvoices.length})
            </button>
          )}
        </div>
      </div>

      {/* ============ FILTERS ============ */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice #, customer, or vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="w-48">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Status</option>
            <option value="paid">✅ Paid</option>
            <option value="partial">⏳ Partial</option>
            <option value="unpaid">❌ Unpaid</option>
          </select>
        </div>

        <button
          onClick={() => setShowDateFilter(!showDateFilter)}
          className="btn-outline btn-sm"
        >
          <FaCalendar /> {showDateFilter ? 'Hide Date' : 'Date Range'}
        </button>

        <div className="relative group">
          <button className="btn-danger btn-sm flex items-center gap-2">
            <FaTrash /> Delete
          </button>
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border hidden group-hover:block z-50">
            <div className="p-3 space-y-2">
              <div className="border-b pb-2">
                <label className="text-xs text-gray-500 block mb-1">Delete by Month</label>
                <div className="flex gap-2">
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="flex-1 input-field text-sm py-1"
                  >
                    <option value="">Select Month</option>
                    {getMonthOptions().map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={deleteInvoicesByMonth}
                    className="btn-danger btn-sm text-xs px-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <button
                onClick={deleteAllInvoices}
                className="w-full text-left text-sm px-3 py-2 hover:bg-red-50 rounded-lg text-red-600 flex items-center gap-2"
              >
                <FaTrash /> Delete All Invoices
              </button>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 self-center">
          {filteredInvoices.length} invoices found
        </div>
      </div>

      {/* ============ DATE RANGE FILTER ============ */}
      {showDateFilter && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm text-gray-600">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="input-field"
            />
          </div>
          <button
            onClick={() => setDateRange({ start: '', end: '' })}
            className="btn-outline btn-sm"
          >
            Clear
          </button>
        </div>
      )}

      {/* ============ INVOICES TABLE ============ */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner"></div>
          </div>
        ) : filteredInvoices.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice._id)}
                        onChange={() => handleSelectInvoice(invoice._id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="font-medium text-blue-600">
                      {invoice.invoiceNumber || `INV-${invoice._id.slice(-6)}`}
                    </td>
                    <td>
                      <div className="font-medium">{invoice.customerName}</div>
                      <div className="text-xs text-gray-500">{invoice.customerPhone}</div>
                    </td>
                    <td>
                      <div>{invoice.vehicleNumber}</div>
                      <div className="text-xs text-gray-500">{invoice.vehicleModel || 'N/A'}</div>
                    </td>
                    <td className="font-medium">PKR {invoice.totalAmount?.toLocaleString() || 0}</td>
                    <td className="text-green-600">PKR {invoice.paidAmount?.toLocaleString() || 0}</td>
                    <td className={invoice.balance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      PKR {invoice.balance?.toLocaleString() || 0}
                    </td>
                    <td>
                      <span className={`badge ${
                        invoice.paymentStatus === 'paid' ? 'badge-success' :
                        invoice.paymentStatus === 'partial' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {invoice.paymentStatus || 'unpaid'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handlePrint(invoice)}
                          className="text-green-600 hover:text-green-800"
                          title="Print Invoice"
                        >
                          <FaPrint />
                        </button>
                        <button
                          onClick={() => deleteSingleInvoice(invoice._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Invoice"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">📄</p>
            <p>No invoices found</p>
            <p className="text-sm mt-1">Generate bills from the Services tab</p>
          </div>
        )}
      </div>

      {/* ============ INVOICE DETAILS MODAL ============ */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedInvoice(null);
        }}
        title="Invoice Details"
        size="lg"
        showFooter={true}
        onConfirm={() => {
          if (selectedInvoice) {

            // console.log(selectedInvoice)
            handlePrint(selectedInvoice);
          }
        }}
        confirmText="🖨️ Print Invoice"
        confirmVariant="success"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            {/* Header */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-bold text-gray-800">
                    {selectedInvoice.invoiceNumber || `INV-${selectedInvoice._id.slice(-6)}`}
                  </h4>
                  <p className="text-sm text-gray-500">
                    📅 {new Date(selectedInvoice.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`badge ${
                  selectedInvoice.paymentStatus === 'paid' ? 'badge-success' :
                  selectedInvoice.paymentStatus === 'partial' ? 'badge-warning' :
                  'badge-danger'
                }`}>
                  {selectedInvoice.paymentStatus || 'unpaid'}
                </span>
              </div>
            </div>

            {/* Customer & Vehicle */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">👤 Customer</p>
                <p className="font-medium">{selectedInvoice.customerName}</p>
                <p className="text-sm">{selectedInvoice.customerPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">🚗 Vehicle</p>
                <p className="font-medium">{selectedInvoice.vehicleNumber}</p>
                {/* <p className="text-sm">{selectedInvoice.vehicleModel || 'N/A'}</p> */}
                <p className="text-sm">{selectedInvoice.service?.vehicleModel || 'N/A'}</p>
              </div>
            </div>

            {/* Items */}
            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-700 mb-2">📋 Items</h5>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>PKR {item.unitPrice}</td>
                          <td>PKR {item.totalPrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Billing Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-semibold text-gray-700 mb-2">💰 Billing Summary</h5>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Subtotal</p>
                  <p className="font-semibold">PKR {selectedInvoice.subtotal?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tax</p>
                  <p className="font-semibold">PKR {selectedInvoice.tax?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Discount</p>
                  <p className="font-semibold">PKR {selectedInvoice.discount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-semibold text-lg text-blue-600">PKR {selectedInvoice.totalAmount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Paid</p>
                  <p className="font-semibold text-green-600">PKR {selectedInvoice.paidAmount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className={`font-semibold ${selectedInvoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    PKR {selectedInvoice.balance?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            {selectedInvoice.notes && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-500">📝 Notes</p>
                <p className="text-sm text-gray-700">{selectedInvoice.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;