const express = require("express");
const router = express.Router();
const { requireSignIn, isAdmin, isStaff } = require("../middleware/authMiddleware");
const { getInvoices, getInvoiceById } = require("../controllers/invoiceController");


router.use(requireSignIn);

router.get("/", getInvoices);
router.get("/:id", getInvoiceById);


module.exports = router;