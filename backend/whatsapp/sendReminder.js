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
        // WhatsApp connected hai?
        if (!getConnectionStatus()) {
            return {
                success: false,
                error: "WhatsApp not connected"
            };
        }

        const sock = getSocket();
        if (!sock) {
            return {
                success: false,
                error: "WhatsApp socket not available"
            };
        }

        // Phone number format karo
        const phone = formatPhone(reminder.customerPhone);
        const jid = `${phone}@s.whatsapp.net`; // WhatsApp JID format

        // Message banao
        const message = reminder.customMessage || buildDefaultMessage(reminder);



        reminder.lastAttemptAt = new Date();
reminder.retryCount = (reminder.retryCount || 0) + 1;
await reminder.save();

        // Message bhejo
        await sock.sendMessage(jid, { text: message });

        // Database update karo
        reminder.status = "sent";
        reminder.sentAt = new Date();
        reminder.errorMessage = "";
        await reminder.save();

        // console.log(`✅ Reminder sent to ${reminder.customerName} (${phone})`);

        return {
            success: true,
            phone
        };

    } catch (error) {
        console.error(`❌ Failed to send to ${reminder.customerName}:`, error.message);

        // Database update karo (failed)
        reminder.status = "failed";
        reminder.errorMessage = error.message;
        await reminder.save();

        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    sendSingleReminder,
    formatPhone,
    buildDefaultMessage
};