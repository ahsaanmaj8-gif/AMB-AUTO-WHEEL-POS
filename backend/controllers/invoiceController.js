const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Invoice = require("../models/invoiceModel");
const Service = require("../models/serviceModel");


// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
  .populate("service", "vehicleModel vehicleMake mileage notes")
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



// ============ UPDATE PAYMENT METHOD ============
// ============ UPDATE PAYMENT METHOD ============
const updatePaymentMethod = async (req, res) => {
    try {
        const { paymentMethod } = req.body;
        const invoice = await Invoice.findById(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        // Valid payment methods
        const validMethods = ['cash', 'card', 'bank-transfer', 'other'];
        if (!validMethods.includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        // Update invoice
        invoice.paymentMethod = paymentMethod;
        await invoice.save();

        // Also update the related service
        if (invoice.service) {
            await Service.findByIdAndUpdate(
                invoice.service,
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


// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
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

//

module.exports = {
    getInvoices,
    getInvoiceById,
    updatePaymentMethod
};