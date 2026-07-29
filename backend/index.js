const express = require("express");
const cors = require("cors");

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


// ============ ROUTES ============
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);




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
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    // console.log(`📦 Database: ${process.env.MONGO_URI}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
});