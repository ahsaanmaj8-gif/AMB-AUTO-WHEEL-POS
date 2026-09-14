import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaPlus, FaTrash, FaEdit, FaSearch, FaDownload } from 'react-icons/fa';
import Modal from '../components/Common/Modal';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        category: 'other',
        notes: ''
    });

    useEffect(() => {
        fetchExpenses();
    }, [dateFilter, startDate, endDate]);

   const fetchExpenses = async () => {
    setLoading(true);
    try {
        let params = {};
        
        // ✅ Handle all date filters
        const now = new Date();
        
        if (dateFilter === 'today') {
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            params.startDate = start.toISOString().split('T')[0];
            params.endDate = end.toISOString().split('T')[0];
        } else if (dateFilter === 'week') {
            const start = new Date(now);
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            params.startDate = start.toISOString().split('T')[0];
            params.endDate = end.toISOString().split('T')[0];
        } else if (dateFilter === 'month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            params.startDate = start.toISOString().split('T')[0];
            params.endDate = end.toISOString().split('T')[0];
        } else if (dateFilter === 'custom' && startDate && endDate) {
            params.startDate = startDate;
            params.endDate = endDate;
        }

        const response = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/expenses', { params });
        setExpenses(response.data.expenses || []);
        setTotalExpenses(response.data.totalExpenses || 0);
    } catch (error) {
        toast.error('Failed to fetch expenses');
    } finally {
        setLoading(false);
    }
};

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingExpense) {
                await axios.put(`https://amb-auto-wheel-pos.onrender.com/api/expenses/${editingExpense._id}`, formData);
                toast.success('Expense updated successfully');
            } else {
                await axios.post('https://amb-auto-wheel-pos.onrender.com/api/expenses', formData);
                toast.success('Expense added successfully');
            }
            setShowModal(false);
            resetForm();
            fetchExpenses();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save expense');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        try {
            await axios.delete(`https://amb-auto-wheel-pos.onrender.com/api/expenses/${id}`);
            toast.success('Expense deleted');
            fetchExpenses();
        } catch (error) {
            toast.error('Failed to delete expense');
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData({
            date: new Date(expense.date).toISOString().split('T')[0],
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            notes: expense.notes || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingExpense(null);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            description: '',
            amount: '',
            category: 'other',
            notes: ''
        });
    };

    const filteredExpenses = expenses.filter(e =>
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Daily Expenses</h2>
                    <p className="text-gray-500">Track all your daily expenses</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="btn-primary"
                >
                    <FaPlus /> Add Expense
                </button>
            </div>

            {/* Summary Card */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-600">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-600">
                            PKR {totalExpenses.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-sm text-gray-500">
                        {expenses.length} entries
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>
                </div>
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
                    </div>
                )}
            </div>

            {/* Expenses Table */}
            <div className="card">
                {loading ? (
                    <div className="flex justify-center py-8"><div className="spinner"></div></div>
                ) : filteredExpenses.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Added By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map((expense) => (
                                    <tr key={expense._id}>
                                        <td>{new Date(expense.date).toLocaleDateString()}</td>
                                        <td>{expense.description}</td>
                                        <td>
                                            <span className="badge badge-info">{expense.category}</span>
                                        </td>
                                        <td className="font-medium text-red-600">
                                            PKR {expense.amount.toLocaleString()}
                                        </td>
                                        <td className="text-sm">{expense.addedBy || 'N/A'}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(expense)}
                                                    className="text-yellow-600 hover:text-yellow-800"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense._id)}
                                                    className="text-red-600 hover:text-red-800"
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
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-4xl mb-2">💰</p>
                        <p>No expenses found</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); resetForm(); }}
                title={editingExpense ? 'Edit Expense' : 'Add Expense'}
                onConfirm={handleSubmit}
                confirmText={editingExpense ? 'Update' : 'Add'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="e.g., Electricity Bill"
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Amount (PKR)</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="5000"
                            required
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="label">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option value="rent">🏠 Rent</option>
                            <option value="electricity">💡 Electricity</option>
                            <option value="salaries">👥 Salaries</option>
                            <option value="stationery">📝 Stationery</option>
                            <option value="maintenance">🔧 Maintenance</option>
                            <option value="marketing">📢 Marketing</option>
                            <option value="other">📦 Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Notes (Optional)</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="input-field"
                            rows="2"
                            placeholder="Additional notes..."
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Expenses;