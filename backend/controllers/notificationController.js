const Notification = require("../models/notificationModel");

// ============ GET UNREAD NOTIFICATIONS ONLY ============
const getNotifications = async (req, res) => {
    try {
        // ✅ Fetch ONLY unread notifications for this user
        const notifications = await Notification.find({ 
            userId: req.user.id,
            read: false  // ✅ Only unread
        }).sort({ createdAt: -1 });
        
        const unreadCount = notifications.length;

        res.status(200).json({
            success: true,
            notifications: notifications,
            unreadCount: unreadCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ MARK AS READ ============
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({ 
            _id: req.params.id, 
            userId: req.user.id  // ✅ ADD USER FILTER
        });
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        notification.read = true;
        await notification.save();

        res.status(200).json({
            success: true,
            message: "Notification marked as read"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ MARK ALL AS READ ============
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, read: false },
            { read: true }
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ DELETE NOTIFICATION ============
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOne({ 
            _id: req.params.id, 
            userId: req.user.id  // ✅ ADD USER FILTER
        });
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        await notification.deleteOne();

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ DELETE ALL NOTIFICATIONS ============
const deleteAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ userId: req.user.id });

        res.status(200).json({
            success: true,
            message: "All notifications deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ CREATE NOTIFICATION (Internal Use) ============
const createNotification = async (userId, title, message, type = "general", link = "/") => {
    try {
        await Notification.create({
            userId,
            title,
            message,
            type,
            link,
            read: false
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
    deleteAllNotifications,
};