// ============================================================
// MESSAGE BHEJNE KA FUNCTION
// ============================================================

const { getSocket, getConnectionStatus } = require("./whatsappClient");
const Reminder = require("../models/reminderModel");

// ============================================================
// PHONE NUMBER FORMAT KARO
// 0300-1234567 → 923001234567
// ============================================================
const formatPhone = (phone) => {
    // Sirf digits rakho
    let cleaned = phone.replace(/\D/g, "");

    // Agar 0 se start ho raha hai (local format)
    if (cleaned.startsWith("0")) {
        cleaned = "92" + cleaned.slice(1); // Pakistan code 92 add karo
    }

    // Agar 92 se start nahi ho raha
    if (!cleaned.startsWith("92")) {
        cleaned = "92" + cleaned;
    }

    return cleaned;
};

// ============================================================
// DEFAULT MESSAGE TEMPLATE
// ============================================================

const buildDefaultMessage = (reminder) => {
    const customerName = reminder.customerName || "Customer";
    const vehicle =
        reminder.vehicleModel || reminder.vehicleNumber || "your vehicle";

    const lastDate = reminder.lastOilChangeDate
        ? new Date(reminder.lastOilChangeDate).toLocaleDateString("en-GB")
        : null;

    const companyName =
        reminder.workshopId?.invoiceSettings?.companyName || "Auto Workshop";

    const companyPhone =
        reminder.workshopId?.invoiceSettings?.companyPhone;

    return `Assalam-o-Alaikum ${customerName}! 👋

🚗 Aap ki gaari (${vehicle}) ka ${
        lastDate ? `last oil change ${lastDate} ko hua tha` : "oil change due hai"
    }.

🔧 Ab oil change karwane ka time aa gaya hai! Baraye meharbani apni sahulat ke mutabiq workshop tashreef layein.

Shukriya! ❤️
*${companyName}*
${companyPhone ? `📞 ${companyPhone}` : ""}`;
};


// ============================================================
// SINGLE REMINDER BHEJO
// ============================================================
const sendSingleReminder = async (reminder) => {
    try {
        const workshopId = reminder.workshopId?._id || reminder.workshopId;
        
        if (!getConnectionStatus(workshopId)) {
            return { success: false, error: "Workshop WhatsApp not connected" };
        }

        const sock = getSocket(workshopId);
        if (!sock) {
            return { success: false, error: "Socket not available" };
        }

        const phone = formatPhone(reminder.customerPhone);
        const jid = `${phone}@s.whatsapp.net`;
        const message = reminder.customMessage || buildDefaultMessage(reminder);

        reminder.lastAttemptAt = new Date();
        reminder.retryCount = (reminder.retryCount || 0) + 1;
        await reminder.save();

        await sock.sendMessage(jid, { text: message });

        reminder.status = "sent";
        reminder.sentAt = new Date();
        await reminder.save();

        return { success: true, phone };
    } catch (error) {
        reminder.status = "failed";
        reminder.errorMessage = error.message;
        await reminder.save();
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendSingleReminder,
    formatPhone,
    buildDefaultMessage
};