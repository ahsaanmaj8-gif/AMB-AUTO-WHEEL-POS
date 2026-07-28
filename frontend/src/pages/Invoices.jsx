import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSearch, FaPrint, FaEye, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Modal from '../components/Common/Modal';
// import { invoices } from './Invoices';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  // ============ FETCH INVOICES ============
  const fetchInvoices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/invoices');
       // ✅ Sort: Oldest first (ascending order)
      const sortedInvoices = response.data.invoices.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      setInvoices(sortedInvoices || []);
    //   setInvoices(response.data.invoices || []);
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  // ============ EXPORT TO EXCEL ============
  const handleExportAll = () => {
    if (invoices.length === 0) {
      toast.error('No invoices to export');
      return;
    }

    setExporting(true);
// console.log("yess: ",invoices[0].createdAt)
    try {
      // Prepare data for export
      const exportData = invoices.map((invoice, index) => ({
        'S.No': index + 1,
        'Invoice #': invoice.invoiceNumber || `INV-${invoice._id.slice(-6)}`,
        'Customer Name': invoice.customerName,
        'Customer Phone': invoice.customerPhone,
        'Vehicle Number': invoice.vehicleNumber,
        'Vehicle Model': invoice.service?.vehicleModel || 'N/A',
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
        'Notes': invoice.service?.notes || ''
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 8 },   // S.No
        { wch: 18 },  // Invoice #
        { wch: 25 },  // Customer Name
        { wch: 18 },  // Customer Phone
        { wch: 15 },  // Vehicle Number
        { wch: 25 },  // Vehicle Model
        { wch: 15 },  // Total Amount
        { wch: 15 },  // Paid Amount
        { wch: 15 },  // Balance
        { wch: 15 },  // Payment Status
        { wch: 15 },  // Payment Method
        { wch: 15 },  // Date
        { wch: 12 },  // Time
        { wch: 12 },  // Items Count
        { wch: 15 },  // Subtotal
        { wch: 12 },  // Tax
        { wch: 12 },  // Discount
        { wch: 30 },  // Notes
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

      // Generate filename with current date
      const date = new Date();
      const filename = `Invoices_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.xlsx`;
      
      // Download file
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

//  console.log("invoices",invoices)
// console.log("yess: ",invoices[0].createdAt.toLocaleDateString())
console.log(
  "Date:",
  new Date(invoices[0].createdAt).toLocaleDateString("en-GB")
);

    try {
      // Prepare data
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
            <div class="title">🚗 AutoWorkshop</div>
            <div class="subtitle">Professional Auto Services & Inventory Management</div>
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
            <div class="row"><strong>Vehicle Model:</strong> ${invoice.service?.vehicleModel || 'N/A'}</div>
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
            <p class="thank-you">Thank you for choosing AutoWorkshop!</p>
            <p>For inquiries, please contact us at: info@autoworkshop.com | +92-300-1234567</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.vehicleNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || inv.paymentStatus === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Invoices</h2>
          <p className="text-gray-500">Manage all customer invoices</p>
        </div>
        <div className="flex gap-3">
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
        </div>
      </div>

      {/* Filters */}
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
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
        <div className="text-sm text-gray-500 self-center">
          {filteredInvoices.length} invoices found
        </div>
      </div>

      {/* Invoices Table */}
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

      {/* Invoice Details Modal */}
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
        confirmText="Print Invoice"
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
                    Date: {new Date(selectedInvoice.createdAt).toLocaleString()}
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
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{selectedInvoice.customerName}</p>
                <p className="text-sm">{selectedInvoice.customerPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vehicle</p>
                <p className="font-medium">{selectedInvoice.vehicleNumber}</p>
                <p className="text-sm">{selectedInvoice.service?.vehicleModel || 'N/A'}</p>
              </div>
            </div>

            {/* Items */}
            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-700 mb-2">Items</h5>
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
                <p className="text-sm text-gray-500">Notes</p>
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