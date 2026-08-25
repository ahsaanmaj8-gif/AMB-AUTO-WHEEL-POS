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

        if (period === "today") {
            const start = new Date(now.setHours(0, 0, 0, 0));
            const end = new Date(now.setHours(23, 59, 59, 999));
            dateFilter = { $gte: start, $lte: end };
        } else if (period === "week") {
            const start = new Date(now);
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            dateFilter = { $gte: start, $lte: end };
        } else if (period === "month") {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            dateFilter = { $gte: start, $lte: end };
        } else if (startDate && endDate) {
            dateFilter = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
            };
        }

        const query = { status: "completed" };
        if (Object.keys(dateFilter).length > 0) {
            query.createdAt = dateFilter;
        }

        const services = await Service.find(query).sort({ createdAt: -1 });

        // console.log("Services fetched for revenue summary:", services);
        // ============ INITIALIZE VARIABLES ============
        let totalRevenue = 0;
        let totalExpenses = 0;
        let totalProfit = 0;
        let productRevenue = 0;
        let productProfit = 0;
        let laborRevenue = 0;
        let serviceRevenue = 0;
        let pendingAmount = 0;

        // ============ LOOP THROUGH SERVICES ============
        services.forEach((service) => {
            // ✅ REVENUE: Add ONLY ONCE from service total
            totalRevenue += service.billing?.totalAmount || 0;
            pendingAmount += service.billing?.balance || 0;

            // ============ 1. PARTS (PRODUCT) ============
            if (service.partsUsed && service.partsUsed.length > 0) {
                service.partsUsed.forEach((part) => {
                    try {
                        const sellingPrice = part.totalPrice || 0;
                        const purchasePrice = part.purchasePrice || 0;
                        const purchaseCost = purchasePrice * (part.quantity || 0);
                        const profit = sellingPrice - purchaseCost;

                        productRevenue += sellingPrice;
                        productProfit += profit;
                        totalExpenses += purchaseCost;  // Track expense
                    } catch (err) {
                        console.error("Part calculation error:", err);
                    }
                });
            }

            // ============ 2. ADDITIONAL CHARGES (SUBLET) ============
            if (service.additionalCharges && service.additionalCharges.length > 0) {
                service.additionalCharges.forEach((charge) => {
                    try {
                        const purchasePrice = charge.purchasePrice || 0;
                        const purchaseCost = purchasePrice * 1; // quantity = 1

                        
                        totalExpenses += purchaseCost;
                    } catch (err) {
                        console.error("Additional charge calculation error:", err);
                    }
                });
            }

            // ============ 3. LABOR REVENUE ============
            if (service.services && service.services.length > 0) {
                service.services.forEach((s) => {
                    laborRevenue += s.servicePrice || 0;
                });
            }

            serviceRevenue += service.billing?.totalAmount || 0;
        });

        // ============ CALCULATE TOTAL PROFIT ============
        totalProfit = totalRevenue - totalExpenses;

        // Get unique customers
        const uniqueCustomers = new Set(services.map((s) => s.customerPhone));

        // Get recent transactions
        const recentTransactions = services.slice(0, 10).map((s) => ({
            customerName: s.customerName,
            amount: s.billing?.totalAmount || 0,
            type: "service",
            status: s.billing?.paymentStatus || "unpaid",
            date: s.createdAt,
        }));

        // Chart data (weekly)
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const weeklyData = {
            labels: days,
            revenue: [],
            services: [],
        };

        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dayServices = services.filter((s) => {
                const sDate = new Date(s.createdAt);
                return sDate.toDateString() === date.toDateString();
            });
            weeklyData.services.push(dayServices.length);
            weeklyData.revenue.push(
                dayServices.reduce((sum, s) => sum + (s.billing?.totalAmount || 0), 0),
            );
        }

        res.status(200).json({
            totalRevenue,
            totalProfit,
            productRevenue,
            productProfit,
            laborRevenue,
            serviceRevenue,
            totalServices: services.length,
            totalCustomers: uniqueCustomers.size,
            pendingAmount,
            chartData: weeklyData,
            recentTransactions,
        });
    } catch (error) {
        console.error("Revenue error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = { getRevenueSummary };