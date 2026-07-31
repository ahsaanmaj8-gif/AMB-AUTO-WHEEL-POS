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

      console.log(selectedInvoice)
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
  const handlePrint = (invoice) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${invoice.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 40px; background: #fff; }
            .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 28px; font-weight: bold; color: #1e3a8a; }
            .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
            .invoice-info { display: flex; justify-content: space-between; margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
            .details { margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
            .row { display: flex; justify-content: space-between; padding: 5px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th { background: #1e3a8a; color: white; padding: 12px; text-align: left; font-size: 13px; }
            .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            .table tr:nth-child(even) { background: #f8fafc; }
            .total-section { margin-top: 20px; padding: 20px; background: #f0f9ff; border-radius: 8px; border: 1px solid #bae6fd; }
            .total-row { display: flex; justify-content: flex-end; padding: 5px 0; }
            .total-row .label { font-weight: bold; margin-right: 40px; }
            .total-row .value { font-weight: bold; }
            .grand-total { font-size: 22px; color: #1e3a8a; margin-top: 10px; padding-top: 10px; border-top: 2px solid #1e3a8a; }
            .status-badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .status-paid { background: #d4edda; color: #155724; }
            .status-unpaid { background: #f8d7da; color: #721c24; }
            .status-partial { background: #fff3cd; color: #856404; }
            .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .footer p { margin: 5px 0; }
            .thank-you { font-size: 16px; color: #1e3a8a; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">🚗 Amb Auto Workshop</div>
            <div class="subtitle">Professional Auto Services </div>
          </div>

          <div class="invoice-info">
            <div>
              <strong>Invoice #:</strong> ${invoice.invoiceNumber}<br>
              <strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}
            </div>
            <div>
              <span class="status-badge status-${invoice.paymentStatus}">
                ${invoice.paymentStatus?.toUpperCase() || 'UNPAID'}
              </span>
            </div>
          </div>

          <div class="details">
            <div class="row"><strong>Customer Name:</strong> ${invoice.customerName}</div>
            <div class="row"><strong>Phone:</strong> ${invoice.customerPhone}</div>
            <div class="row"><strong>Vehicle:</strong> ${invoice.vehicleNumber}</div>
            <div class="row"><strong>Vehicle Model:</strong> ${invoice.vehicleModel || 'N/A'}</div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Description</th>
                <th style="width: 80px; text-align: center;">Qty</th>
                <th style="width: 120px; text-align: right;">Price</th>
                <th style="width: 120px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.description}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">PKR ${item.unitPrice.toLocaleString()}</td>
                  <td style="text-align: right;">PKR ${item.totalPrice.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row"><span class="label">Subtotal:</span> <span class="value">PKR ${invoice.subtotal?.toLocaleString() || 0}</span></div>
            ${invoice.tax > 0 ? `<div class="total-row"><span class="label">Tax:</span> <span class="value">PKR ${invoice.tax?.toLocaleString() || 0}</span></div>` : ''}
            ${invoice.discount > 0 ? `<div class="total-row"><span class="label">Discount:</span> <span class="value">PKR ${invoice.discount?.toLocaleString() || 0}</span></div>` : ''}
            <div class="total-row grand-total"><span class="label">Total Amount:</span> <span class="value">PKR ${invoice.totalAmount?.toLocaleString() || 0}</span></div>
            <div class="total-row"><span class="label">Paid:</span> <span class="value" style="color: #16a34a;">PKR ${invoice.paidAmount?.toLocaleString() || 0}</span></div>
            <div class="total-row"><span class="label">Balance:</span> <span class="value" style="color: ${invoice.balance > 0 ? '#dc2626' : '#16a34a'};">PKR ${invoice.balance?.toLocaleString() || 0}</span></div>
          </div>

          ${invoice.notes ? `<div style="margin-top: 20px; padding: 15px; background: #fef9e7; border-radius: 8px; border-left: 4px solid #f59e0b;"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}

          <div class="footer">
            <p class="thank-you">Thank you for choosing Amb Auto Workshop!</p>
            <p>For inquiries, please contact us at: noumanbajwa418@gmail.com | 0302-5434437</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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