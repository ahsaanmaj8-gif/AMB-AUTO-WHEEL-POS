const Invoice = require("../models/invoiceModel");
const Service = require("../models/serviceModel");

// ============ GET ALL INVOICES ============
const getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ 
            workshopId: req.user.workshopId 
        })
            .populate("service", "customerAddress vehicleModel vehicleMake mileage notes")
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: invoices.length,
            invoices: invoices,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============ GET SINGLE INVOICE ============
const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ 
            _id: req.params.id, 
            workshopId: req.user.workshopId 
        });
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
        }
        res.status(200).json({
            success: true,
            invoice: invoice,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============ UPDATE PAYMENT METHOD ============
const updatePaymentMethod = async (req, res) => {
    try {
        const { paymentMethod } = req.body;
        
        // ✅ Find invoice with workshopId check
        const invoice = await Invoice.findOne({ 
            _id: req.params.id, 
            workshopId: req.user.workshopId 
        });
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        const validMethods = ['cash', 'card', 'bank-transfer', 'other'];
        if (!validMethods.includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        invoice.paymentMethod = paymentMethod;
        await invoice.save();

        // Also update the related service
        if (invoice.service) {
            await Service.findOneAndUpdate(
                { 
                    _id: invoice.service, 
                    workshopId: req.user.workshopId 
                },
                { "billing.paymentMethod": paymentMethod }
            );
        }

        res.status(200).json({
            success: true,
            message: "Payment method updated successfully",
            invoice: invoice
        });
    } catch (error) {
        console.error("Update payment method error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ DELETE SINGLE INVOICE ============
const deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ 
            _id: req.params.id, 
            workshopId: req.user.workshopId 
        });
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }
        await invoice.deleteOne();
        res.status(200).json({
            success: true,
            message: "Invoice deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ DELETE INVOICES BY MONTH ============
const deleteInvoicesByMonth = async (req, res) => {
    try {
        const { year, month } = req.params;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        
        const result = await Invoice.deleteMany({
            workshopId: req.user.workshopId,
            createdAt: { $gte: startDate, $lte: endDate }
        });
        
        res.status(200).json({
            success: true,
            message: `${result.deletedCount} invoices deleted`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ DELETE ALL INVOICES ============
const deleteAllInvoices = async (req, res) => {
    try {
        const result = await Invoice.deleteMany({ 
            workshopId: req.user.workshopId 
        });
        res.status(200).json({
            success: true,
            message: `${result.deletedCount} invoices deleted`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getInvoices,
    getInvoiceById,
    updatePaymentMethod,
    deleteInvoice,
    deleteInvoicesByMonth,
    deleteAllInvoices
};