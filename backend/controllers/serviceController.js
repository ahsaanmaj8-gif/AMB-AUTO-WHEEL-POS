const Service = require("../models/serviceModel");
const Product = require("../models/productModel");
const Transaction = require("../models/transactionModel");
const Invoice = require("../models/invoiceModel");
const { createNotification } = require("./notificationController");

// ============ HELPER FUNCTIONS ============

// Calculate billing totals
const calculateBilling = (
  services,
  partsUsed,
  additionalCharges,
  taxRate,
  discount,
  discountType,
) => {
  // Calculate services total
  let servicesTotal = 0;
  services.forEach((service) => {
    servicesTotal += Number(service.servicePrice || 0);
  });

  // Calculate parts total
  let partsTotal = 0;
  partsUsed.forEach((part) => {
    part.totalPrice = Number(part.quantity * part.unitPrice);
    partsTotal += part.totalPrice;
  });

  // Calculate additional charges
  let additionalTotal = 0;
  additionalCharges.forEach((charge) => {
    additionalTotal += Number(charge.amount || 0);
  });


//   console.log("Services Total: ", typeof  parseInt(servicesTotal));
//   console.log("Parts Total: ", typeof partsTotal);
//   console.log("Additional Charges Total: ", typeof parseInt(additionalTotal));

  // Subtotal
  let subtotal = servicesTotal + partsTotal + additionalTotal;

  // Tax
  let tax = (subtotal * (taxRate || 0)) / 100;

  // Total before discount
  let total = subtotal + tax;

  // Discount
  let discountAmount = 0;
  if (discount > 0) {
    if (discountType === "percentage") {
      discountAmount = (total * discount) / 100;
    } else {
      discountAmount = discount;
    }
  }

  // Final total
  let finalTotal = total - discountAmount;



//   console.log("Total Bill: ",finalTotal)


  return {
    subtotal: subtotal,
    tax: tax,
    discount: discountAmount,
    totalAmount: finalTotal,
  };
};

// ============ SERVICE CONTROLLERS ============

// @desc    Create new service
// @route   POST /api/services
// @access  Private
const createService = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      vehicleNumber,
      vehicleModel,
      vehicleMake,
      mileage,
      services,
      partsUsed,
      additionalCharges,
      billing,
      notes,
      assignedTo,
    } = req.body;

    // Calculate billing
    const billingTotals = calculateBilling(
      services || [],
      partsUsed || [],
      additionalCharges || [],
      billing?.taxRate || 0,
      billing?.discount || 0,
      billing?.discountType || "fixed",
    );

    // Calculate balance
    const totalAmount = billingTotals.totalAmount;
    const paidAmount = billing?.paidAmount || 0;
    const balance = totalAmount - paidAmount;

    // ============ DETERMINE STATUSES ============
    // Service Status: If fully paid, mark as completed, else pending
    let serviceStatus = "pending";
    if (balance <= 0 && totalAmount > 0) {
      serviceStatus = "completed"; // ✅ Fully paid = Completed
    }

    // Payment Status
    let paymentStatus;
    if (balance <= 0) {
      paymentStatus = "paid";
    } else if (paidAmount > 0) {
      paymentStatus = "partial";
    } else {
      paymentStatus = "unpaid";
    }

    // ============ CREATE SERVICE ============
    const service = new Service({
      customerName,
      customerPhone,
      customerAddress,
      vehicleNumber,
      vehicleModel,
      vehicleMake,
      mileage,
      services: services || [],
      partsUsed: partsUsed || [],
      additionalCharges: additionalCharges || [],
      billing: {
        subtotal: billingTotals.subtotal,
        tax: billingTotals.tax,
        taxRate: billing?.taxRate || 0,
        discount: billingTotals.discount,
        discountType: billing?.discountType || "fixed",
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        balance: balance,
        paymentStatus: paymentStatus,
        paymentMethod: billing?.paymentMethod || "cash",
      },
      notes: notes || "",
      assignedTo: assignedTo || req.user._id || "Staff",
      performedBy: req.user._id ? req.user._id : req.user.id,
      status: serviceStatus, // ✅ Set status based on payment
      completedAt: serviceStatus === "completed" ? new Date() : null, // ✅ Set completed date if fully paid
    });

    // ============ DEDUCT INVENTORY FOR PARTS USED ============
    if (partsUsed && partsUsed.length > 0) {
      for (let part of partsUsed) {
        if (part.fromInventory && part.product) {
          const product = await Product.findById(part.product);
          if (!product) {
            return res.status(404).json({
              success: false,
              message: `Product ${part.productName} not found in inventory`,
            });
          }

          if (product.quantity < part.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Required: ${part.quantity}`,
            });
          }

          const previousQuantity = product.quantity;
          product.quantity = product.quantity - part.quantity;
          await product.save();

          // Check low stock
          if (product.quantity <= product.minQuantity) {
            await createNotification(
              req.user.id,
              "⚠️ Low Stock Alert",
              `${product.name} is running low (${product.quantity} units left, Min: ${product.minQuantity})`,
              "low-stock",
              "/products"
            );
          }

          await Transaction.create({
            product: product._id,
            type: "service-out",
            quantity: part.quantity,
            previousQuantity: previousQuantity,
            newQuantity: product.quantity,
            reference: `SVC-${service._id}`,
            notes: `Used in service for ${customerName} - ${vehicleNumber}`,
            serviceId: service._id,
            performedBy: req.user._id ? req.user._id : req.user.id,
            unitPrice: part.unitPrice,
            totalPrice: part.quantity * part.unitPrice,
          });
        }
      }
    }

    // ============ SAVE SERVICE ============
    await service.save();

    // ============ CREATE NOTIFICATION FOR NEW SERVICE ============
    await createNotification(
      req.user.id,
      "🔧 New Service Created",
      `Service created for ${customerName} - ${vehicleNumber}`,
      "service",
      "/services"
    );

    // ============ GENERATE INVOICE NUMBER ============
    const year = new Date().getFullYear();
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;

    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split("-");
      nextNumber = parseInt(parts[2]) + 1;
    }

    const invoiceNumber = `INV-${year}-${String(nextNumber).padStart(5, "0")}`;

    // ============ CREATE INVOICE ============
    const invoice = new Invoice({
      invoiceNumber,
      service: service._id,
      customerName: service.customerName,
      customerPhone: service.customerPhone,
      vehicleNumber: service.vehicleNumber,
      vehicleModel: service.vehicleModel,
      items: [
        ...service.services.map((s) => ({
          type: "service",
          description: s.serviceName,
          quantity: s.laborHours || 1,
          unitPrice: s.servicePrice / (s.laborHours || 1),
          totalPrice: s.servicePrice,
        })),
        ...service.partsUsed.map((p) => ({
          type: "part",
          description: p.productName,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          totalPrice: p.totalPrice,
        })),
        ...(service.additionalCharges || []).map((c) => ({
          type: "charge",
          description: c.description,
          quantity: 1,
          unitPrice: c.amount,
          totalPrice: c.amount,
        })),
      ],
      subtotal: service.billing.subtotal,
      tax: service.billing.tax,
      taxRate: service.billing.taxRate,
      discount: service.billing.discount,
      discountType: service.billing.discountType,
      totalAmount: service.billing.totalAmount,
      paidAmount: service.billing.paidAmount,
      balance: service.billing.balance,
      paymentStatus: service.billing.paymentStatus,
      paymentMethod: service.billing.paymentMethod,
      issuedBy: req.user._id ? req.user._id : req.user.id,
      status: service.billing.balance <= 0 ? "paid" : "issued",
      notes: service.notes
    });

    await invoice.save();

    // ============ NOTIFICATION FOR BILL GENERATED ============
    await createNotification(
      req.user.id,
      "📄 Bill Generated",
      `Invoice ${invoiceNumber} generated for ${service.customerName} - PKR ${service.billing.totalAmount}`,
      "invoice",
      "/invoices"
    );

    res.status(201).json({
      success: true,
      message: serviceStatus === "completed" 
        ? "Service created and paid successfully" 
        : "Service created successfully",
      service: service,
      invoice: invoice,
    });
  } catch (error) {
    console.error("Create Service Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ============ PAY REMAINING BALANCE ============
const payRemaining = async (req, res) => {
  try {
    const { paidAmount, paymentMethod } = req.body;
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    // Check if service is completed
    if (service.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: "Service must be completed before making payment"
      });
    }

    // Check if balance exists
    if (service.billing.balance <= 0) {
      return res.status(400).json({
        success: false,
        message: "No balance remaining to pay"
      });
    }

    // Validate payment amount
    const amount = parseFloat(paidAmount);
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than 0"
      });
    }

    if (amount > service.billing.balance) {
      return res.status(400).json({
        success: false,
        message: `Amount cannot exceed balance of PKR ${service.billing.balance}`
      });
    }

    // ============ UPDATE PAYMENT ============
    service.billing.paidAmount = service.billing.paidAmount + amount;
    service.billing.balance = service.billing.totalAmount - service.billing.paidAmount;
    service.billing.paymentMethod = paymentMethod || service.billing.paymentMethod || "cash";

    // ============ UPDATE PAYMENT STATUS ============
    if (service.billing.balance <= 0) {
      service.billing.paymentStatus = "paid";
    } else {
      service.billing.paymentStatus = "partial";
    }

    await service.save();

    // ============ UPDATE INVOICE ============
    await Invoice.findOneAndUpdate(
      { service: service._id },
      {
        paidAmount: service.billing.paidAmount,
        balance: service.billing.balance,
        paymentStatus: service.billing.paymentStatus,
        paymentMethod: service.billing.paymentMethod,
        status: service.billing.balance <= 0 ? "paid" : "issued"
      }
    );

    // ============ CREATE NOTIFICATION ============
    await createNotification(
      req.user.id,
      "💰 Payment Received",
      `Payment of PKR ${amount.toLocaleString()} received for ${service.customerName}`,
      "invoice",
      "/invoices"
    );

    res.status(200).json({
      success: true,
      message: "Payment received successfully",
      service: service,
      payment: {
        amount: amount,
        paidAmount: service.billing.paidAmount,
        balance: service.billing.balance,
        paymentStatus: service.billing.paymentStatus
      }
    });

  } catch (error) {
    console.error("Pay remaining error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};






// @desc    Get all services
// @route   GET /api/services
// @access  Private
const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({})
      .populate("assignedTo", "name email")
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: services.length,
      services: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// @desc    Get today's services
// @route   GET /api/services/today
// @access  Private
const getTodayServices = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const services = await Service.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).populate("assignedTo", "name");

    // Calculate summary
    let totalRevenue = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    let completed = 0;
    let pending = 0;
    let inProgress = 0;

    services.forEach((service) => {
      totalRevenue += service.billing.totalAmount || 0;
      totalPaid += service.billing.paidAmount || 0;
      totalBalance += service.billing.balance || 0;

      if (service.status === "completed") completed++;
      else if (service.status === "pending") pending++;
      else if (service.status === "in-progress") inProgress++;
    });


    console.log(totalRevenue, totalPaid, totalBalance, completed, pending, inProgress);

    res.status(200).json({
      success: true,
      date: new Date().toDateString(),
      summary: {
        totalServices: services.length,
        totalRevenue: totalRevenue,
        totalPaid: totalPaid,
        totalBalance: totalBalance,
        completed: completed,
        pending: pending,
        inProgress: inProgress,
      },
      services: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Private
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("performedBy", "name email")
      .populate("partsUsed.product", "name sku price");

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Get invoice
    const invoice = await Invoice.findOne({ service: service._id });

    res.status(200).json({
      success: true,
      service: service,
      invoice: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private
const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Update fields
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    // Update invoice
    await Invoice.findOneAndUpdate(
      { service: service._id },
      {
        customerName: updatedService.customerName,
        customerPhone: updatedService.customerPhone,
        vehicleNumber: updatedService.vehicleNumber,
      },
    );

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Generate bill for service
// @route   POST /api/services/:id/generate-bill
// @access  Private
const generateBill = async (req, res) => {
  try {
    const { paidAmount, paymentMethod } = req.body;
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // ============ UPDATE PAYMENT ============
    // If paidAmount is provided, add it to existing paidAmount
    // Otherwise keep existing paidAmount
    if (paidAmount !== undefined && paidAmount !== null) {
      service.billing.paidAmount = (service.billing.paidAmount || 0) + parseFloat(paidAmount);
    }
    
    // Calculate balance
    service.billing.balance = service.billing.totalAmount - service.billing.paidAmount;
    
    // Update payment method if provided
    if (paymentMethod) {
      service.billing.paymentMethod = paymentMethod;
    }

    // ============ SET PAYMENT STATUS ============
    if (service.billing.balance <= 0) {
      service.billing.paymentStatus = "paid";
    } else if (service.billing.paidAmount > 0) {
      service.billing.paymentStatus = "partial";
    } else {
      service.billing.paymentStatus = "unpaid";
    }

    // ============ UPDATE SERVICE STATUS ============
    service.status = "completed";
    service.completedAt = new Date();

    await service.save();

    // ============ UPDATE OR CREATE INVOICE ============
    let invoice = await Invoice.findOne({ service: service._id });
    
    if (!invoice) {
      // Create new invoice
      const year = new Date().getFullYear();
      const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
      let nextNumber = 1;
      
      if (lastInvoice) {
        const parts = lastInvoice.invoiceNumber.split("-");
        nextNumber = parseInt(parts[2]) + 1;
      }
      
      const invoiceNumber = `INV-${year}-${String(nextNumber).padStart(5, "0")}`;

      invoice = new Invoice({
        invoiceNumber,
        service: service._id,
        customerName: service.customerName,
        customerPhone: service.customerPhone,
        vehicleNumber: service.vehicleNumber,
        vehicleModel: service.vehicleModel,
        items: [
          ...service.services.map((s) => ({
            type: "service",
            description: s.serviceName,
            quantity: s.laborHours || 1,
            unitPrice: s.servicePrice / (s.laborHours || 1),
            totalPrice: s.servicePrice,
          })),
          ...service.partsUsed.map((p) => ({
            type: "part",
            description: p.productName,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            totalPrice: p.totalPrice,
          })),
          ...(service.additionalCharges || []).map((c) => ({
            type: "charge",
            description: c.description,
            quantity: 1,
            unitPrice: c.amount,
            totalPrice: c.amount,
          })),
        ],
        subtotal: service.billing.subtotal,
        tax: service.billing.tax,
        taxRate: service.billing.taxRate,
        discount: service.billing.discount,
        discountType: service.billing.discountType,
        totalAmount: service.billing.totalAmount,
        paidAmount: service.billing.paidAmount,
        balance: service.billing.balance,
        paymentStatus: service.billing.paymentStatus,
        paymentMethod: service.billing.paymentMethod,
        issuedBy: req.user.id,
        status: service.billing.balance <= 0 ? "paid" : "issued",
        notes: service.notes
      });
      
      await invoice.save();
    } else {
      // Update existing invoice
      invoice.paidAmount = service.billing.paidAmount;
      invoice.balance = service.billing.balance;
      invoice.paymentStatus = service.billing.paymentStatus;
      invoice.paymentMethod = service.billing.paymentMethod;
      invoice.status = service.billing.balance <= 0 ? "paid" : "issued";
      await invoice.save();
    }

    // ============ CREATE NOTIFICATION ============
    await createNotification(
      req.user.id,
      "📄 Bill Generated",
      `Invoice ${invoice.invoiceNumber} generated for ${service.customerName} - PKR ${service.billing.totalAmount}`,
      "invoice",
      "/invoices"
    );

    res.status(200).json({
      success: true,
      message: "Bill generated successfully",
      service: service,
      invoice: invoice,
      bill: {
        customerName: service.customerName,
        vehicleNumber: service.vehicleNumber,
        totalAmount: service.billing.totalAmount,
        paidAmount: service.billing.paidAmount,
        balance: service.billing.balance,
        serviceStatus: service.status,
        paymentStatus: service.billing.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Error generating bill: ", error);    
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get service statistics
// @route   GET /api/services/stats
// @access  Private
const getServiceStats = async (req, res) => {
  try {
    const totalServices = await Service.countDocuments();
    const completedServices = await Service.countDocuments({
      status: "completed",
    });
    const pendingServices = await Service.countDocuments({ status: "pending" });
    const inProgressServices = await Service.countDocuments({
      status: "in-progress",
    });

    // Total revenue
    const result = await Service.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$billing.totalAmount" },
          totalPaid: { $sum: "$billing.paidAmount" },
          totalBalance: { $sum: "$billing.balance" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalServices: totalServices,
        completedServices: completedServices,
        pendingServices: pendingServices,
        inProgressServices: inProgressServices,
        totalRevenue: result[0]?.totalRevenue || 0,
        totalPaid: result[0]?.totalPaid || 0,
        totalBalance: result[0]?.totalBalance || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createService,
  getAllServices,
  getTodayServices,
  getServiceById,
  updateService,
  generateBill,
  getServiceStats,
  payRemaining,
};
