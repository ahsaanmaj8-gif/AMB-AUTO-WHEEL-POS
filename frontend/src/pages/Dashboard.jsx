import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  FaBox, 
  FaWrench, 
  FaDollarSign, 
  FaExclamationTriangle,
  FaUsers,
  FaArrowUp,
  FaArrowDown,
  FaCalendarDay,
  FaFileInvoice
} from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);


const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="stat-card label">{title}</p>
        <p className="stat-card value">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`icon ${color}`}>
        <Icon className="text-xl text-white" />
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-1 mt-3 text-xs">
        {trend > 0 ? (
          <>
            <FaArrowUp className="text-green-500" />
            <span className="text-green-600">{trend}%</span>
            <span className="text-gray-400">from last month</span>
          </>
        ) : (
          <>
            <FaArrowDown className="text-red-500" />
            <span className="text-red-600">{Math.abs(trend)}%</span>
            <span className="text-gray-400">from last month</span>
          </>
        )}
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    todayServices: 0,
    todayRevenue: 0,
    lowStock: 0,
    totalCustomers: 0,
    pendingInvoices: 0,
    monthlyRevenue: 0,
    completedServices: 0
  });
  const [recentServices, setRecentServices] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [weeklyData, setWeeklyData] = useState({
    labels: [],
    services: [],
    revenue: []
  });
  const [topServices, setTopServices] = useState([]);
const navigate = useNavigate();


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get products
      const productsRes = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/products');
      
      // Get today's services
      const servicesRes = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/services/today');
      
      // Get low stock products
      const lowStockRes = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/products/low-stock');
      
      // Get all services for stats
      const allServicesRes = await axios.get('https://amb-auto-wheel-pos.onrender.com/api/services');
      const allServices = allServicesRes.data.services || [];
      
      // console.log(allServices)
      // Calculate additional stats


      // Calculate monthly revenue
      // const currentMonthh = new Date().getMonth();
      // const monthlyServicess = allServices.filter(s => {
      //   const date = new Date(s.createdAt);
      //   return date.getMonth() === currentMonthh && s.status === 'completed';
      // });
      // console.log("Monthly servicees:", monthlyServicess.length);

    //   const monthlyRevenue = monthlyServices.reduce((sum, s) => sum + (s.billing?.totalAmount || 0), 0);



    const now = new Date();

const monthlyServicess = allServices.filter((s) => {
  const date = new Date(s.createdAt);

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear() &&
    s.status === "completed"
  );
});


// console.log("Monthly servicejjs:", monthlyServicess.length);
      const completedServices = monthlyServicess;

      // console.log("Completed services:", completedServices);


      const pendingInvoices = allServices.filter(s => s.billing?.paymentStatus === 'unpaid' || s.billing?.paymentStatus === 'partial');
      
      // Calculate monthly revenue
      const currentMonth = new Date().getMonth();
      const monthlyServices = allServices.filter(s => {
        const date = new Date(s.createdAt);
        return date.getMonth() === currentMonth && s.status === 'completed';
      });
      // console.log("Monthly services:", monthlyServices);
      const monthlyRevenue = monthlyServices.reduce((sum, s) => sum + (s.billing?.totalAmount || 0), 0);
      


      // console.log("Products fetched:", productsRes.data , servicesRes.data, lowStockRes.data, allServicesRes.data , completedServices, pendingInvoices, monthlyRevenue);


      // Get unique customers
    //   A Set automatically removes duplicate values
      const uniqueCustomers = new Set(allServices.map(s => s.customerPhone));
      
      setStats({
        totalProducts: productsRes.data.total || 0,
        todayServices: servicesRes.data.summary?.totalServices || 0,
        todayRevenue: servicesRes.data.summary?.totalRevenue || 0,
        lowStock: lowStockRes.data.count || 0,
        totalCustomers: uniqueCustomers.size,
        pendingInvoices: pendingInvoices.length,
        monthlyRevenue: monthlyRevenue,
        completedServices: completedServices.length
      });
      
      setRecentServices(servicesRes.data.services || []);
      setLowStockProducts(lowStockRes.data.products || []);
      
      // Prepare weekly chart data
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      
      const weekServices = [];
      const weekRevenue = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dayServices = allServices.filter(s => {
          const sDate = new Date(s.createdAt);
          return sDate.toDateString() === date.toDateString();
        });
        weekServices.push(dayServices.length);
        weekRevenue.push(dayServices.reduce((sum, s) => sum + (s.billing?.totalAmount || 0), 0));
      }
      
      setWeeklyData({
        labels: days,
        services: weekServices,
        revenue: weekRevenue
      });
      
      // Get top services
      const serviceCount = {};
      allServices.forEach(s => {
        s.services?.forEach(service => {
          const name = service.serviceName;
          serviceCount[name] = (serviceCount[name] || 0) + 1;
        });
      });
      const sortedServices = Object.entries(serviceCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
      setTopServices(sortedServices);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const serviceChartData = {
    labels: weeklyData.labels,
    datasets: [
      {
        label: 'Services',
        data: weeklyData.services,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const revenueChartData = {
    labels: weeklyData.labels,
    datasets: [
      {
        label: 'Revenue (PKR)',
        data: weeklyData.revenue,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const topServicesData = {
    labels: topServices.map(s => s.name),
    datasets: [
      {
        data: topServices.map(s => s.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500">Welcome back, {user?.name}! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={FaBox}
          color="bg-blue-500"
          subtitle={`${stats.lowStock} low stock alerts`}
          trend={5}
        />
        <StatCard
          title="Today's Services"
          value={stats.todayServices}
          icon={FaWrench}
          color="bg-green-500"
          subtitle={`${stats.completedServices} completed this month`}
          trend={12}
        />
        <StatCard
          title="Today's Revenue"
          value={`PKR ${stats.todayRevenue.toLocaleString()}`}
          icon={FaDollarSign}
          color="bg-purple-500"
          subtitle={`Monthly: PKR ${stats.monthlyRevenue.toLocaleString()}`}
          trend={8}
        />
        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          icon={FaUsers}
          color="bg-orange-500"
          subtitle={`${stats.pendingInvoices} pending invoices`}
          trend={3}
        />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Services</h3>
          <Line 
            data={serviceChartData} 
            options={{
              responsive: true,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
              }
            }}
          />
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Revenue</h3>
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
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="card lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Services</h3>
          {topServices.length > 0 ? (
            <Doughnut 
              data={topServicesData} 
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }}
            />
          ) : (
            <p className="text-center text-gray-500 py-8">No services data</p>
          )}
        </div>
        <div className="card lg:col-span-2">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

    <button
      onClick={() => navigate('/services')}
      className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
    >
      <div className="text-2xl mb-1">🔧</div>
      <div className="text-sm font-medium text-gray-700">New Service</div>
    </button>

    <button
      onClick={() => navigate('/products')}
      className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
    >
      <div className="text-2xl mb-1">📦</div>
      <div className="text-sm font-medium text-gray-700">Add Product</div>
    </button>

    <button
      onClick={() => navigate('/dashboard')}
      className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
    >
      <div className="text-2xl mb-1">📊</div>
      <div className="text-sm font-medium text-gray-700">View Reports</div>
    </button>

    <button
      onClick={() => navigate('/invoices')}
      className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-center"
    >
      <div className="text-2xl mb-1">📄</div>
      <div className="text-sm font-medium text-gray-700">Invoices</div>
    </button>

    <button
      onClick={() => navigate('/products')}
      className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-center"
    >
      <div className="text-2xl mb-1">⚠️</div>
      <div className="text-sm font-medium text-gray-700">Low Stock</div>
    </button>

    <button
      onClick={() => navigate('/services')}
      className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors text-center"
    >
      <div className="text-2xl mb-1">👥</div>
      <div className="text-sm font-medium text-gray-700">Customers</div>
    </button>

  </div>
</div>

      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="card border-red-200 bg-red-50 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FaExclamationTriangle className="text-red-500 text-xl" />
            <h3 className="text-lg font-semibold text-red-700">Low Stock Alert</h3>
            <span className="ml-auto text-sm text-red-600">{lowStockProducts.length} products need attention</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.slice(0, 6).map((product) => (
              <div key={product._id} className="bg-white p-4 rounded-lg shadow-sm border border-red-100">
                <p className="font-medium text-gray-800">{product.name}</p>
                <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-red-600 font-medium">
                    Stock: {product.quantity}
                  </span>
                  <span className="text-xs text-gray-400">
                    Min: {product.minQuantity}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-red-500 h-1.5 rounded-full" 
                    style={{ width: `${(product.quantity / product.minQuantity) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Services */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Services</h3>
          <button className="text-sm text-blue-600 hover:underline">View All</button>
        </div>
        
        {recentServices.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentServices.slice(0, 5).map((service) => (
                  <tr key={service._id}>
                    <td className="font-medium">{service.customerName}</td>
                    <td>{service.vehicleNumber}</td>
                    <td className="font-medium">PKR {service.billing?.totalAmount?.toLocaleString() || 0}</td>
                    <td>
                      <span className={`badge ${
                        service.status === 'completed' ? 'badge-success' :
                        service.status === 'in-progress' ? 'badge-warning' :
                        service.status === 'pending' ? 'badge-info' :
                        'badge-danger'
                      }`}>
                        {service.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        service.billing?.paymentStatus === 'paid' ? 'badge-success' :
                        service.billing?.paymentStatus === 'partial' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {service.billing?.paymentStatus || 'unpaid'}
                      </span>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {new Date(service.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaWrench className="text-4xl mx-auto mb-2 text-gray-300" />
            <p>No services today</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;