
const cron = require("node-cron");
const Reminder = require("../models/reminderModel");
const { sendSingleReminder } = require("./sendReminder");
const { getConnectionStatus } = require("./whatsappClient");



let isProcessing = false;

const processPendingReminders = async () => {
    if (isProcessing) {
        console.log(" ⏭️ Previous batch still running. Skipping this run.");
       
        return;
    }

    isProcessing = true;

    try {
        console.log("Checking due reminders...");

        if (!getConnectionStatus()) {
            // console.log("WhatsApp disconnected. Will retry on a later check.");
            return;
        }

        const now = new Date();
        const retryBefore = new Date(Date.now() - 60 * 60 * 1000);

        console.log("Before reminder . find")
        const reminders = await Reminder.find({
            status: { $in: ["pending", "failed"] },
            reminderDate: { $lte: now },
            $or: [
                { lastAttemptAt: { $exists: false } },
                { lastAttemptAt: null },
                { lastAttemptAt: { $lte: retryBefore } }
            ]
        })
            .sort({ lastAttemptAt: 1, reminderDate: 1 })
            .limit(20)
            .populate("workshopId", "invoiceSettings");

        console.log(`Found ${reminders.length} reminders to process.`);

        for (const reminder of reminders) {
            const workshopId = reminder.workshopId?._id || reminder.workshopId;
            if (!getConnectionStatus()) {
                // console.log("WhatsApp disconnected during batch. Stopping.");
                continue;
                // break;
            }

            const result = await sendSingleReminder(reminder);
            console.log(
                `Reminder for ${reminder.customerName}:`,
                result.success ? "Sent" : "Failed; will retry"
            );

            // Delay between messages
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    } catch (error) {
        console.error("Reminder cron error:", error);
         console.error("Stack trace:", error.stack);
    } finally {
        isProcessing = false;
    }
};

const startReminderCron = () => {
    cron.schedule("*/5 * * * *", () => {
        // console.log("Every 5 minutes reminder check started.");
        processPendingReminders();
    });

    console.log("Reminder cron started.");

    // First check 30 seconds after server startup
    setTimeout(() => {
        processPendingReminders();
    }, 30000);
};

module.exports = {
    startReminderCron,
    processPendingReminders
};
