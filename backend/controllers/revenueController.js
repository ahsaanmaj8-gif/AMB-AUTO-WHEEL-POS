// backend/controllers/revenueController.js
const Service = require("../models/serviceModel");
const Transaction = require("../models/transactionModel");
const Invoice = require("../models/invoiceModel");

// ============ GET REVENUE SUMMARY ============
const getRevenueSummary = async (req, res) => {
    try {
        const { period, startDate, endDate } = req.query;
        
        let dateFilter = {};
        const now = new Date();
        
        if (period === 'today') {
            const start = new Date(now.setHours(0, 0, 0, 0));
            const end = new Date(now.setHours(23, 59, 59, 999));
            dateFilter = { $gte: start, $lte: end };
        } else if (period === 'week') {
            const start = new Date(now);
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            dateFilter = { $gte: start, $lte: end };
        } else if (period === 'month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            dateFilter = { $gte: start, $lte: end };
        } else if (startDate && endDate) {
            dateFilter = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }
        
        // Get completed services
        const services = await Service.find({
            status: 'completed',
            createdAt: dateFilter
        });
        
        // Calculate revenue
        let totalRevenue = 0;
        let productRevenue = 0;
        let laborRevenue = 0;
        let serviceRevenue = 0;
        let pendingAmount = 0;
        
        services.forEach(service => {
            totalRevenue += service.billing?.totalAmount || 0;
            pendingAmount += service.billing?.balance || 0;
            
            // Calculate product revenue from parts
            service.partsUsed?.forEach(part => {
                productRevenue += part.totalPrice || 0;
            });
            
            // Calculate labor revenue
            service.services?.forEach(s => {
                laborRevenue += s.servicePrice || 0;
            });
            
            // Service revenue (additional charges + labor)
            serviceRevenue += service.billing?.totalAmount || 0;
        });
        
        // Get unique customers
        const uniqueCustomers = new Set(services.map(s => s.customerPhone));
        
        // Get recent transactions
        const recentTransactions = services.slice(0, 10).map(s => ({
            customerName: s.customerName,
            amount: s.billing?.totalAmount || 0,
            type: 'service',
            status: s.billing?.paymentStatus || 'unpaid',
            date: s.createdAt
        }));
        
        // Chart data (weekly)
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weeklyData = {
            labels: days,
            revenue: [],
            services: []
        };
        
        // Calculate weekly data
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dayServices = services.filter(s => {
                const sDate = new Date(s.createdAt);
                return sDate.toDateString() === date.toDateString();
            });
            weeklyData.services.push(dayServices.length);
            weeklyData.revenue.push(dayServices.reduce((sum, s) => sum + (s.billing?.totalAmount || 0), 0));
        }
        
        res.status(200).json({
            totalRevenue,
            productRevenue,
            laborRevenue,
            serviceRevenue,
            totalServices: services.length,
            totalCustomers: uniqueCustomers.size,
            pendingAmount,
            chartData: weeklyData,
            recentTransactions
        });
        
    } catch (error) {
        console.error('Revenue error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { getRevenueSummary };