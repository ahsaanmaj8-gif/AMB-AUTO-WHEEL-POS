const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin, isStaff } = require("../middleware/authMiddleware");
const Invoice = require("../models/invoiceModel");

// ============ CONTROLLER FUNCTIONS ============

// Get all invoices
const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('service', 'vehicleModel vehicleNumber customerName customerPhone') 
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

// Get single invoice
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

// Delete single invoice
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }
    await invoice.deleteOne();
    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete invoices by month
const deleteInvoicesByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const result = await Invoice.deleteMany({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} invoices deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete all invoices
const deleteAllInvoices = async (req, res) => {
  try {
    const result = await Invoice.deleteMany({});
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} invoices deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============ ROUTES ============
router.use(requireSignIn);

router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.delete("/:id", deleteInvoice);
router.delete("/month/:year/:month", deleteInvoicesByMonth);
router.delete("/all", deleteAllInvoices);

module.exports = router;