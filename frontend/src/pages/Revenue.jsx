import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
    FaDollarSign, 
    FaWrench, 
    FaBox, 
    FaCalendar,
    FaFilter,
    FaDownload,
    FaUsers
} from 'react-icons/fa';
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Revenue = () => {
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('today');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [revenueData, setRevenueData] = useState({
        totalRevenue: 0,
        productRevenue: 0,
        laborRevenue: 0,
        serviceRevenue: 0,
        totalServices: 0,
        totalCustomers: 0,
        pendingAmount: 0
    });
    const [chartData, setChartData] = useState({
        labels: [],
        revenue: [],
        services: []
    });
    const [recentTransactions, setRecentTransactions] = useState([]);

    useEffect(() => {
        fetchRevenueData();
    }, [dateFilter, startDate, endDate]);

    const fetchRevenueData = async () => {
        setLoading(true);
        try {
            // Build query params
            let params = {};
            if (dateFilter === 'custom' && startDate && endDate) {
                params.startDate = startDate;
                params.endDate = endDate;
            } else if (dateFilter !== 'all' && dateFilter !== 'custom') {
                params.period = dateFilter;
            }

            const response = await axios.get(
                'https://amb-auto-wheel-pos.onrender.com/api/revenue/summary',
                { params }
            );
            
            setRevenueData(response.data);
            setChartData(response.data.chartData || { labels: [], revenue: [], services: [] });
            setRecentTransactions(response.data.recentTransactions || []);
        } catch (error) {
            console.error('Error fetching revenue:', error);
            toast.error('Failed to fetch revenue data');
            
            // Sample data for display
            setRevenueData({
                totalRevenue: 125000,
                productRevenue: 45000,
                laborRevenue: 35000,
                serviceRevenue: 45000,
                totalServices: 28,
                totalCustomers: 45,
                pendingAmount: 12000
            });
            setChartData({
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                revenue: [12000, 18000, 15000, 22000, 28000, 18000, 12000],
                services: [4, 6, 5, 8, 10, 6, 4]
            });
        } finally {
            setLoading(false);
        }
    };

    // ============ GET FILTER LABEL ============
    const getFilterLabel = () => {
        switch(dateFilter) {
            case 'today': return "Today's";
            case 'week': return "This Week's";
            case 'month': return "This Month's";
            case 'custom': return "Custom Range";
            default: return "Total";
        }
    };

    // ============ EXPORT TO EXCEL ============
    const handleExport = () => {
        const exportData = [
            ['Revenue Summary Report'],
            [''],
            ['Period:', getFilterLabel()],
            ['Date:', new Date().toLocaleDateString()],
            [''],
            ['Metric', 'Amount (PKR)'],
            ['Total Revenue', revenueData.totalRevenue],
            ['Product Revenue', revenueData.productRevenue],
            ['Labor Revenue', revenueData.laborRevenue],
            ['Service Revenue', revenueData.serviceRevenue],
            ['Pending Amount', revenueData.pendingAmount],
            [''],
            ['Services', revenueData.totalServices],
            ['Customers', revenueData.totalCustomers]
        ];

        const ws = XLSX.utils.aoa_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Revenue');
        
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const filename = `Revenue_${new Date().toISOString().split('T')[0]}.xlsx`;
        saveAs(data, filename);
        toast.success('Revenue report exported!');
    };

    // ============ CHART DATA ============
    const revenueChartData = {
        labels: chartData.labels || [],
        datasets: [
            {
                label: 'Revenue (PKR)',
                data: chartData.revenue || [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const servicesChartData = {
        labels: chartData.labels || [],
        datasets: [
            {
                label: 'Services',
                data: chartData.services || [],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const revenueDistribution = {
        labels: ['Product Revenue', 'Labor Revenue', 'Service Revenue'],
        datasets: [
            {
                data: [
                    revenueData.productRevenue || 0,
                    revenueData.laborRevenue || 0,
                    revenueData.serviceRevenue || 0
                ],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(234, 179, 8, 0.8)',
                    'rgba(34, 197, 94, 0.8)'
                ],
                borderWidth: 0
            }
        ]
    };

    return (
        <div>
            {/* ============ HEADER ============ */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Revenue & Payment Details</h2>
                    <p className="text-gray-500">Track your workshop earnings</p>
                </div>
                <button onClick={handleExport} className="btn-primary btn-sm">
                    <FaDownload /> Export Report
                </button>
            </div>

            {/* ============ FILTERS ============ */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="w-48">
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="input-field"
                    >
                        <option value="today">📅 Today</option>
                        <option value="week">📅 This Week</option>
                        <option value="month">📅 This Month</option>
                        <option value="all">📅 All Time</option>
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

                <div className="text-sm text-gray-500 self-center">
                    {getFilterLabel()} Revenue Summary
                </div>



<div className="w-48">
    <select
        value={paymentMethodFilter}
        onChange={(e) => setPaymentMethodFilter(e.target.value)}
        className="input-field"
    >
        <option value="all">💳 All Payments</option>
        <option value="cash">💵 Cash</option>
        <option value="card">💳 Card</option>
        <option value="bank-transfer">🏦 Bank Transfer</option>
        <option value="other">📱 Other</option>
    </select>
</div>

            </div>




            {/* ============ STATS CARDS ============ */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="spinner"></div>
                </div>
            ) : (
                <>
                    {/* Main Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="stat-card">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="stat-card label">Total Revenue</p>
                                    <p className="stat-card value">PKR {revenueData.totalRevenue?.toLocaleString() || 0}</p>
                                    <p className="text-xs text-gray-400">{getFilterLabel()}</p>
                                </div>
                                <div className="icon bg-blue-500">
                                    <FaDollarSign className="text-xl text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="stat-card label">Services Done</p>
                                    <p className="stat-card value">{revenueData.totalServices || 0}</p>
                                    <p className="text-xs text-gray-400">Total services</p>
                                </div>
                                <div className="icon bg-green-500">
                                    <FaWrench className="text-xl text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="stat-card label">Total Customers</p>
                                    <p className="stat-card value">{revenueData.totalCustomers || 0}</p>
                                    <p className="text-xs text-gray-400">Unique customers</p>
                                </div>
                                <div className="icon bg-purple-500">
                                    <FaUsers className="text-xl text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="stat-card label">Pending Amount</p>
                                    <p className="stat-card value text-red-600">PKR {revenueData.pendingAmount?.toLocaleString() || 0}</p>
                                    <p className="text-xs text-gray-400">Unpaid balance</p>
                                </div>
                                <div className="icon bg-orange-500">
                                    <FaCalendar className="text-xl text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Breakdown Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="card border-l-4 border-l-blue-500">
                            <p className="text-sm text-gray-500">Product Revenue</p>
                            <p className="text-2xl font-bold text-gray-800">PKR {revenueData.productRevenue?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-400">From parts sales</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div 
                                    className="bg-blue-500 h-1.5 rounded-full" 
                                    style={{ width: `${revenueData.totalRevenue ? (revenueData.productRevenue / revenueData.totalRevenue) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="card border-l-4 border-l-yellow-500">
                            <p className="text-sm text-gray-500">Labor Revenue</p>
                            <p className="text-2xl font-bold text-gray-800">PKR {revenueData.laborRevenue?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-400">From service labor</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div 
                                    className="bg-yellow-500 h-1.5 rounded-full" 
                                    style={{ width: `${revenueData.totalRevenue ? (revenueData.laborRevenue / revenueData.totalRevenue) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="card border-l-4 border-l-green-500">
                            <p className="text-sm text-gray-500">Service Revenue</p>
                            <p className="text-2xl font-bold text-gray-800">PKR {revenueData.serviceRevenue?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-400">From service charges</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div 
                                    className="bg-green-500 h-1.5 rounded-full" 
                                    style={{ width: `${revenueData.totalRevenue ? (revenueData.serviceRevenue / revenueData.totalRevenue) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid lg:grid-cols-3 gap-6 mb-8">
                        <div className="card lg:col-span-1">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Distribution</h3>
                            {revenueData.totalRevenue > 0 ? (
                                <Doughnut 
                                    data={revenueDistribution} 
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { position: 'bottom' }
                                        }
                                    }}
                                />
                            ) : (
                                <p className="text-center text-gray-500 py-8">No revenue data</p>
                            )}
                        </div>
                        <div className="card lg:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h3>
                            {chartData.labels?.length > 0 ? (
                                <Line 
                                    data={revenueChartData} 
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { display: false }
                                        },
                                        scales: {
                                            y: { beginAtZero: true }
                                        }
                                    }}
                                />
                            ) : (
                                <p className="text-center text-gray-500 py-8">No data available</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
                            <span className="text-xs text-gray-500">{getFilterLabel()}</span>
                        </div>
                        {recentTransactions.length > 0 ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Customer</th>
                                            <th>Amount</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTransactions.slice(0, 10).map((t, i) => (
                                            <tr key={i}>
                                                <td>{t.customerName || 'N/A'}</td>
                                                <td className="font-medium">PKR {t.amount?.toLocaleString() || 0}</td>
                                                <td>
                                                    <span className={`badge ${t.type === 'product' ? 'badge-info' : t.type === 'labor' ? 'badge-warning' : 'badge-success'}`}>
                                                        {t.type || 'Service'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${t.status === 'paid' ? 'badge-success' : t.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                                                        {t.status || 'unpaid'}
                                                    </span>
                                                </td>
                                                <td className="text-sm text-gray-500">
                                                    {new Date(t.date).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">No recent transactions</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Revenue;