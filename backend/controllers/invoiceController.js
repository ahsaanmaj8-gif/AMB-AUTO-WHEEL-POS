const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Invoice = require("../models/invoiceModel");

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
};