const Workshop = require("../models/workshopModel");

// ============ GET WORKSHOP SETTINGS ============
const getSettings = async (req, res) => {
    try {
        const workshop = await Workshop.findById(req.user.workshopId);
        if (!workshop) {
            return res.status(404).json({
                success: false,
                message: "Workshop not found"
            });
        }

        res.status(200).json({
            success: true,
            settings: workshop.invoiceSettings || {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ UPDATE WORKSHOP SETTINGS ============
const updateSettings = async (req, res) => {
    try {
        const {
            companyName,
            companyPhone,
            companyEmail,
            companyAddress,
            signatureName,
            termsAndConditions,
            paymentDetails
        } = req.body;

        const workshop = await Workshop.findById(req.user.workshopId);
        if (!workshop) {
            return res.status(404).json({
                success: false,
                message: "Workshop not found"
            });
        }

        // ✅ Get uploaded file URLs
        const headerImage = req.files?.headerImage?.[0]?.path || workshop.invoiceSettings?.headerImage || "";
        const footerImage = req.files?.footerImage?.[0]?.path || workshop.invoiceSettings?.footerImage || "";
        const logo = req.files?.logo?.[0]?.path || workshop.invoiceSettings?.logo || "";

        // Update invoice settings
        workshop.invoiceSettings = {
            headerImage,
            footerImage,
            logo,
            companyName: companyName || workshop.invoiceSettings?.companyName || "",
            companyPhone: companyPhone || workshop.invoiceSettings?.companyPhone || "",
            companyEmail: companyEmail || workshop.invoiceSettings?.companyEmail || "",
            companyAddress: companyAddress || workshop.invoiceSettings?.companyAddress || "",
            signatureName: signatureName || workshop.invoiceSettings?.signatureName || "",
            termsAndConditions: termsAndConditions || workshop.invoiceSettings?.termsAndConditions || "",
            paymentDetails: {
                bankName: paymentDetails?.bankName || workshop.invoiceSettings?.paymentDetails?.bankName || "",
                accountName: paymentDetails?.accountName || workshop.invoiceSettings?.paymentDetails?.accountName || "",
                accountNumber: paymentDetails?.accountNumber || workshop.invoiceSettings?.paymentDetails?.accountNumber || "",
                iban: paymentDetails?.iban || workshop.invoiceSettings?.paymentDetails?.iban || ""
            }
        };

        await workshop.save();

        res.status(200).json({
            success: true,
            message: "Settings updated successfully",
            settings: workshop.invoiceSettings
        });
    } catch (error) {
        console.error("Update settings error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getSettings,
    updateSettings
};