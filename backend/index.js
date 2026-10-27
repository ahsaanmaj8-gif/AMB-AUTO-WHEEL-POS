const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const QRCode = require("qrcode");
const path = require("path");

require("dotenv").config();
require("./config/db");

// ✅ WhatsApp imports (multi-tenant)
const {
    connectToWhatsApp,
    getSocket,
    getConnectionStatus,
    getLatestQR,
    disconnectWorkshop,
    connectAllEnabledWorkshops,
} = require("./whatsapp/whatsappClient");

const { startReminderCron } = require("./whatsapp/reminderCron");

// Initialize express
const app = express();

// For deployment
const _dirname = path.resolve();

// ============ MIDDLEWARE ============
const corsOptions = {
    origin: "https://amb-auto-wheel-pos.onrender.com",
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ IMPORT ROUTES ============
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const revenueRoutes = require("./routes/revenueRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const workshopRoutes = require("./routes/workshopRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const { requireSignIn, isAdmin } = require("./middleware/authMiddleware");

// ============ API ROUTES ============
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/workshop", workshopRoutes);
app.use("/api/settings", settingsRoutes);

// ============ WHATSAPP ROUTES (Multi-Tenant) ============

// ✅ Get QR for logged-in user's workshop
app.get("/api/whatsapp/qr", requireSignIn, async (req, res) => {
    res.set("Cache-Control", "no-store");

    try {
        const workshopId = req.user.workshopId;

        if (!workshopId) {
            return res.status(400).json({ message: "No workshop found for this user" });
        }

        // Already connected?
        if (getConnectionStatus(workshopId)) {
            return res.json({ connected: true });
        }

        // Try to get QR
        const qr = getLatestQR(workshopId);

        if (!qr) {
            // Trigger connection if not already started
            try {
                await connectToWhatsApp(workshopId);
            } catch (e) {
                console.error(`Workshop ${workshopId} connect error:`, e.message);
            }
            return res.json({
                connected: false,
                message: "QR not ready yet. Please wait...",
            });
        }

        // Convert QR to data URL
        const qrDataUrl = await QRCode.toDataURL(qr, {
            errorCorrectionLevel: "H",
            margin: 4,
            width: 420,
        });

        return res.json({
            connected: false,
            qr: qrDataUrl,
        });
    } catch (error) {
        console.error("WhatsApp QR API error:", error);
        return res.status(500).json({
            message: "Unable to generate WhatsApp QR code",
        });
    }
});

// ✅ Disconnect workshop
app.post("/api/whatsapp/disconnect", requireSignIn, isAdmin, async (req, res) => {
    try {
        const workshopId = req.user.workshopId;

        if (!workshopId) {
            return res.status(400).json({ message: "No workshop found" });
        }

        await disconnectWorkshop(workshopId);

        // Update workshop model
        const Workshop = require("./models/workshopModel");
        await Workshop.findByIdAndUpdate(workshopId, {
            "whatsapp.connected": false,
        });

        res.json({ success: true, message: "WhatsApp disconnected" });
    } catch (error) {
        console.error("Disconnect error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Check status
app.get("/api/whatsapp/status", requireSignIn, async (req, res) => {
    try {
        const workshopId = req.user.workshopId;

        if (!workshopId) {
            return res.status(400).json({ message: "No workshop found" });
        }

        const connected = getConnectionStatus(workshopId);

        res.json({ connected });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ============ FOR DEPLOYMENT ============
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get(/.*/, (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// ============ 404 ROUTE ============
app.use((req, res) => {
    res.status(404).send({
        success: false,
        message: "Route not found",
    });
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(500).send({
        success: false,
        message: "Something went wrong!",
        error: err.message,
    });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);

    // ✅ Connect all workshops that have whatsapp.enabled = true
    try {
        console.log("📱 Connecting enabled workshops to WhatsApp...");
        await connectAllEnabledWorkshops();
        console.log("📱 WhatsApp client(s) starting...");
    } catch (error) {
        console.error("❌ WhatsApp connection failed:", error.message);
    }

    // ✅ Start reminder cron
    try {
        startReminderCron();
    } catch (error) {
        console.error("❌ Cron start failed:", error.message);
    }

    console.log(`🔗 API: http://localhost:${PORT}/api`);
});