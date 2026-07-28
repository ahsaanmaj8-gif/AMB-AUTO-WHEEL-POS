import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSearch, FaFileExport } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ============ FETCH TRANSACTIONS ============
  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions');
      // ✅ Sort: Oldest first (ascending order)
      const sortedTransactions = response.data.transactions.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      console.log("transactions: ",response.data)
      setTransactions(sortedTransactions || []);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // ============ GET TRANSACTION TYPE BADGE ============
  const getTransactionTypeBadge = (type) => {
    const types = {
      'purchase-in': 'badge-success',
      'return-in': 'badge-info',
      'service-out': 'badge-warning',
      'sale-out': 'badge-danger',
      'adjustment': 'badge-purple',
      'wastage': 'badge-danger'
    };
    return types[type] || 'badge-info';
  };

  // ============ GET TRANSACTION LABEL ============
  const getTransactionLabel = (type) => {
    const labels = {
      'purchase-in': 'Purchase In',
      'return-in': 'Return In',
      'service-out': 'Service Out',
      'sale-out': 'Sale Out',
      'adjustment': 'Adjustment',
      'wastage': 'Wastage'
    };
    return labels[type] || type;
  };

  // ============ EXPORT TO EXCEL ============
  const handleExport = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    setExporting(true);

    try {
      // Step 1: Prepare data for export
      const exportData = transactions.map((transaction, index) => ({
        'S.No': index + 1,
        'Product': transaction.product?.name || 'N/A',
        'SKU': transaction.product?.sku || 'N/A',
        'Type': getTransactionLabel(transaction.type),
        'Quantity': transaction.quantity,
        'Previous Stock': transaction.previousQuantity || 0,
        'New Stock': transaction.newQuantity || 0,
        'Stock Change': transaction.newQuantity > transaction.previousQuantity ? 
          `+${transaction.newQuantity - transaction.previousQuantity}` : 
          `${transaction.newQuantity - transaction.previousQuantity}`,
        'Reference': transaction.reference || 'N/A',
        'Performed By': transaction.performedBy?.name || 
          JSON.parse(localStorage.getItem("user"))?.name || 
          'N/A',
        'Date': new Date(transaction.createdAt).toLocaleDateString(),
        'Time': new Date(transaction.createdAt).toLocaleTimeString(),
        'Notes': transaction.notes || ''
      }));

      // Step 2: Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Step 3: Set column widths
      ws['!cols'] = [
        { wch: 8 },   // S.No
        { wch: 25 },  // Product
        { wch: 15 },  // SKU
        { wch: 18 },  // Type
        { wch: 10 },  // Quantity
        { wch: 15 },  // Previous Stock
        { wch: 15 },  // New Stock
        { wch: 12 },  // Stock Change
        { wch: 18 },  // Reference
        { wch: 20 },  // Performed By
        { wch: 15 },  // Date
        { wch: 12 },  // Time
        { wch: 30 },  // Notes
      ];

      // Step 4: Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

      // Step 5: Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

      // Step 6: Download with filename
      const date = new Date();
      const filename = `Transactions_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.xlsx`;
      saveAs(data, filename);

      toast.success(`✅ Exported ${transactions.length} transactions successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  // ============ EXPORT TO CSV ============
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    setExporting(true);

    try {
      // Step 1: Prepare simple data
      const exportData = transactions.map((transaction, index) => ({
        'S.No': index + 1,
        'Product': transaction.product?.name || 'N/A',
        'Type': getTransactionLabel(transaction.type),
        'Quantity': transaction.quantity,
        'Stock Change': transaction.newQuantity > transaction.previousQuantity ? 
          `+${transaction.newQuantity - transaction.previousQuantity}` : 
          `${transaction.newQuantity - transaction.previousQuantity}`,
        'Reference': transaction.reference || 'N/A',
        'Performed By': transaction.performedBy?.name || 
          JSON.parse(localStorage.getItem("user"))?.name || 
          'N/A',
        'Date': new Date(transaction.createdAt).toLocaleDateString("en-GB")

      }));

      // Step 2: Convert to CSV
      const ws = XLSX.utils.json_to_sheet(exportData);
      const csvData = XLSX.utils.sheet_to_csv(ws);
      
      // Step 3: Create and download file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const date = new Date();
      const filename = `Transactions_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.csv`;
      saveAs(blob, filename);

      toast.success(`✅ Exported ${transactions.length} transactions as CSV!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  // ============ FILTER TRANSACTIONS ============
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch =
      t.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.reference?.toLowerCase().includes(search.toLowerCase()) ||
      t.product?.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || t.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      {/* ============ HEADER ============ */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
          <p className="text-gray-500">View all inventory transactions</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="btn-outline btn-sm"
            disabled={exporting}
          >
            <FaFileExport /> {exporting ? 'Exporting...' : 'CSV'}
          </button>
          <button 
            onClick={handleExport}
            className="btn-primary btn-sm"
            disabled={exporting}
          >
            <FaFileExport /> {exporting ? 'Exporting...' : 'Excel'}
          </button>
        </div>
      </div>

      {/* ============ SEARCH & FILTER ============ */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product, SKU, or reference..."
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
            <option value="all">📋 All Types</option>
            <option value="purchase-in">📥 Purchase In</option>
            <option value="return-in">🔄 Return In</option>
            <option value="service-out">🔧 Service Out</option>
            <option value="sale-out">💰 Sale Out</option>
            <option value="adjustment">📊 Adjustment</option>
            <option value="wastage">🗑️ Wastage</option>
          </select>
        </div>
        <div className="text-sm text-gray-500 self-center">
          {filteredTransactions.length} transactions found
        </div>
      </div>

      {/* ============ TRANSACTIONS TABLE ============ */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner"></div>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Stock Change</th>
                  <th>Reference</th>
                  <th>Performed By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td>
                      <div className="font-medium">{transaction.product?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">SKU: {transaction.product?.sku || 'N/A'}</div>
                    </td>
                    <td>
                      <span className={`badge ${getTransactionTypeBadge(transaction.type)}`}>
                        {getTransactionLabel(transaction.type)}
                      </span>
                    </td>
                    <td className="font-medium">{transaction.quantity}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">{transaction.previousQuantity || 0}</span>
                        <span className="text-gray-400">→</span>
                        <span className={transaction.newQuantity > transaction.previousQuantity ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {transaction.newQuantity || 0}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({transaction.newQuantity > transaction.previousQuantity ? '+' : ''}
                          {(transaction.newQuantity || 0) - (transaction.previousQuantity || 0)})
                        </span>
                      </div>
                    </td>
                    <td className="text-sm">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {transaction.reference || 'N/A'}
                      </span>
                    </td>
                    <td className="text-sm">
                      {transaction.performedBy?.name ||
                        JSON.parse(localStorage.getItem("user"))?.name ||
                        "N/A"}
                    </td>
                    <td className="text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">📭</p>
            <p>No transactions found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;