const express = require("express");
const cors = require("cors");
const { connectToWhatsApp } = require("./whatsapp/whatsappClient");
const { startReminderCron } = require("./whatsapp/reminderCron");


const path = require("path")

require("dotenv").config();
require("./config/db");

// Initialize express
const app = express();



//for deployement
const _dirname = path.resolve();

// ============ MIDDLEWARE ============

const corsOptions = {
    origin: "https://amb-auto-wheel-pos.onrender.com",
    credentials:true
};
app.use(cors(corsOptions));
// app.use(cors());
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

// server.js mein temporary
// const { processPendingReminders } = require("./whatsapp/reminderCron");
// app.get("/test-reminders", async (req, res) => {
//     await processPendingReminders();
//     res.json({ success: true });
// });

// ============ ROUTES ============
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

// ============ TEST ROUTE ============
// app.get("/", (req, res) => {
//     res.send({
//         success: true,
//         message: "Auto Workshop Inventory API is running",
//     });
// });




//for deployement
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

// ============ ERROR HANDLING MIDDLEWARE ============
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
app.listen(PORT, async() => {
    console.log(`🚀 Server running on port ${PORT}`);


    
     // ✅ WhatsApp connect karo
    try {
        await connectToWhatsApp();
        console.log("📱 WhatsApp client starting...");
    } catch (error) {
        console.error("❌ WhatsApp connection failed:", error.message);
    }

    // ✅ Reminder cron start karo
    try {
        startReminderCron();
    } catch (error) {
        console.error("❌ Cron start failed:", error.message);
    }

     // ✅ TEST: 2 second baad auto-run
    // setTimeout(async () => {
    //     console.log("\n🧪 AUTO TEST REMINDER RUNNING...");
    //     const { processPendingReminders } = require("./whatsapp/reminderCron");
    //     await processPendingReminders();
    // }, 2000); // 2 seconds

    // console.log(`📦 Database: ${process.env.MONGO_URI}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
});