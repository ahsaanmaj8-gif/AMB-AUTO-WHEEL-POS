import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSearch, FaFileExport, FaTrash, FaCalendar } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [exporting, setExporting] = useState(false);

    // ============ DATE FILTER STATES ============
    const [dateFilter, setDateFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // ============ SELECT/DELETE STATES ============
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, []);

    // ============ FETCH TRANSACTIONS ============
    const fetchTransactions = async () => {
        try {
            const response = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/transactions');
            const sortedTransactions = response.data.transactions.sort((a, b) =>
                new Date(a.createdAt) - new Date(b.createdAt)
            );
            setTransactions(sortedTransactions || []);
        } catch (error) {
            toast.error('Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    // ============ DELETE SINGLE TRANSACTION ============
    const deleteSingleTransaction = async (id) => {
        if (!window.confirm('Delete this transaction? This cannot be undone!')) return;
        try {
            await axios.delete(`https://amb-auto-wheel-pos.onrender.com/api/transactions/${id}`);
            toast.success('Transaction deleted successfully');
            fetchTransactions();
        } catch (error) {
            toast.error('Failed to delete transaction');
        }
    };

    // ============ DELETE SELECTED TRANSACTIONS ============
    const deleteSelectedTransactions = async () => {
        if (selectedTransactions.length === 0) {
            toast.error('No transactions selected');
            return;
        }

        if (!window.confirm(`Delete ${selectedTransactions.length} selected transaction(s)? This cannot be undone!`)) {
            return;
        }

        try {
            await Promise.all(
                selectedTransactions.map(id =>
                    axios.delete(`https://amb-auto-wheel-pos.onrender.com/api/transactions/${id}`)
                )
            );
            toast.success(`${selectedTransactions.length} transactions deleted successfully`);
            setSelectedTransactions([]);
            setSelectAll(false);
            fetchTransactions();
        } catch (error) {
            toast.error('Failed to delete transactions');
        }
    };

    // ============ DELETE ALL TRANSACTIONS ============
    const deleteAllTransactions = async () => {
        if (!window.confirm('⚠️ Delete ALL transactions? This cannot be undone!')) return;

        try {
            await axios.delete('https://amb-auto-wheel-pos.onrender.com/api/transactions/all');
            toast.success('All transactions deleted successfully');
            fetchTransactions();
        } catch (error) {
            toast.error('Failed to delete transactions');
        }
    };

    // ============ DELETE BY MONTH ============
    const deleteTransactionsByMonth = async () => {
        if (!monthFilter) {
            toast.error('Please select a month');
            return;
        }

        const [year, month] = monthFilter.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (!window.confirm(`Delete ALL transactions from ${monthNames[parseInt(month) - 1]} ${year}? This cannot be undone!`)) {
            return;
        }

        try {
            const response = await axios.delete(
                `https://amb-auto-wheel-pos.onrender.com/api/transactions/month/${year}/${month}`
            );
            toast.success(`${response.data.deletedCount} transactions deleted for ${monthNames[parseInt(month) - 1]} ${year}`);
            fetchTransactions();
            setMonthFilter('');
        } catch (error) {
            toast.error('Failed to delete transactions');
        }
    };

    // ============ SELECT FUNCTIONS ============
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedTransactions([]);
        } else {
            setSelectedTransactions(filteredTransactions.map(t => t._id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectTransaction = (id) => {
        if (selectedTransactions.includes(id)) {
            setSelectedTransactions(selectedTransactions.filter(ids => ids !== id));
        } else {
            setSelectedTransactions([...selectedTransactions, id]);
        }
    };

    // ============ GET MONTH OPTIONS ============
    const [monthFilter, setMonthFilter] = useState('');
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

    // ============ DATE FILTER FUNCTION ============
    const getDateFilter = (transactionDate) => {
        const date = new Date(transactionDate);
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        switch (dateFilter) {
            case 'today':
                return date.toDateString() === today.toDateString();
            case 'week':
                return date >= weekStart && date <= today;
            case 'month':
                return date >= monthStart && date <= today;
            case 'custom':
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    return date >= start && date <= end;
                }
                return true;
            default:
                return true;
        }
    };

    // ============ GET TRANSACTION TYPE ============
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

            const ws = XLSX.utils.json_to_sheet(exportData);
            ws['!cols'] = [
                { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 18 },
                { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
                { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
                { wch: 30 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

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
            const exportData = transactions.map((transaction, index) => ({
                'S.No': index + 1,
                'Product': transaction.product?.name || 'N/A',
                'Type': getTransactionLabel(transaction.type),
                'Quantity': transaction.quantity,
                'Stock Change': transaction.newQuantity > transaction.previousQuantity ?
                    `+${transaction.newQuantity - transaction.previousQuantity}` :
                    `${transaction.newQuantity - transaction.previousQuantity}`,
                'Reference': transaction.reference || 'N/A',
                'Performed By': transaction.performedBy?.name || 'N/A',
                'Date': new Date(transaction.createdAt).toLocaleDateString()
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const csvData = XLSX.utils.sheet_to_csv(ws);

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
        const matchesDate = getDateFilter(t.createdAt);

        return matchesSearch && matchesFilter && matchesDate;
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
                    {selectedTransactions.length > 0 && (
                        <button
                            onClick={deleteSelectedTransactions}
                            className="btn-danger btn-sm"
                        >
                            <FaTrash /> Delete ({selectedTransactions.length})
                        </button>
                    )}
                </div>
            </div>

            {/* ============ FILTERS ============ */}
            <div className="flex flex-wrap gap-4 mb-6">
                {/* Search */}
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

                {/* Type Filter */}
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

                {/* Date Filter */}
                <div className="w-48">
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="input-field"
                    >
                        <option value="all">📅 All Dates</option>
                        <option value="today">📅 Today</option>
                        <option value="week">📅 This Week</option>
                        <option value="month">📅 This Month</option>
                        <option value="custom">📅 Custom Range</option>
                    </select>
                </div>

                {/* Custom Date Range */}
                {dateFilter === 'custom' && (
                    <div className="flex gap-2 items-end">
                        <div>
                            <label className="text-xs text-gray-500">From</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="input-field py-1 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">To</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input-field py-1 text-sm"
                            />
                        </div>
                        <button
                            onClick={() => {
                                setDateFilter('all');
                                setStartDate('');
                                setEndDate('');
                            }}
                            className="btn-outline btn-sm"
                        >
                            Clear
                        </button>
                    </div>
                )}

                {/* Delete Dropdown */}
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
                                        onClick={deleteTransactionsByMonth}
                                        className="btn-danger btn-sm text-xs px-2"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={deleteAllTransactions}
                                className="w-full text-left text-sm px-3 py-2 hover:bg-red-50 rounded-lg text-red-600 flex items-center gap-2"
                            >
                                <FaTrash /> Delete All Transactions
                            </button>
                        </div>
                    </div>
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
                                    <th className="w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300"
                                        />
                                    </th>
                                    <th>Product</th>
                                    <th>Type</th>
                                    <th>Quantity</th>
                                    <th>Stock Change</th>
                                    <th>Reference</th>
                                    <th>Performed By</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((transaction) => (
                                    <tr key={transaction._id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedTransactions.includes(transaction._id)}
                                                onChange={() => handleSelectTransaction(transaction._id)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
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
                                            {new Date(transaction.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => deleteSingleTransaction(transaction._id)}
                                                className="text-red-600 hover:text-red-800"
                                                title="Delete"
                                            >
                                                <FaTrash />
                                            </button>
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