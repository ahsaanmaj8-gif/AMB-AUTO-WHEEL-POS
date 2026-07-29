import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaDownload, FaCalendar, FaChartBar, FaChartPie, FaChartLine } from 'react-icons/fa';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({
    revenue: [],
    services: [],
    categories: [],
    topProducts: []
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Fetch data for reports
      const servicesRes = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/services');
      const productsRes = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/products');
      
      // Process data for reports
      // ... data processing logic
      
    } catch (error) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
          <p className="text-gray-500">View business performance insights</p>
        </div>
        <button className="btn-primary">
          <FaDownload /> Export Report
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="input-field"
            />
          </div>
          <button className="btn-primary">Apply Filter</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-800">PKR 0</p>
          <p className="text-xs text-green-600">↑ 12% from last month</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Services</p>
          <p className="text-2xl font-bold text-gray-800">0</p>
          <p className="text-xs text-green-600">↑ 8% from last month</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Avg. Service Value</p>
          <p className="text-2xl font-bold text-gray-800">PKR 0</p>
          <p className="text-xs text-green-600">↑ 5% from last month</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Active Customers</p>
          <p className="text-2xl font-bold text-gray-800">0</p>
          <p className="text-xs text-green-600">↑ 3% from last month</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <FaChartLine className="text-4xl" />
            <p className="ml-2">Data coming soon</p>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Distribution</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <FaChartPie className="text-4xl" />
            <p className="ml-2">Data coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;