const express = require("express");
const router = express.Router();
const { requireSignIn } = require("../middleware/authMiddleware");
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
     deleteNotification,
    deleteAllNotifications
} = require("../controllers/notificationController");



// All routes require authentication
router.use(requireSignIn);

router.get("/", getNotifications);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);


// ✅ Delete single notification (mark as read)
router.delete("/:id", deleteNotification);

// ✅ Delete all notifications (clear all)
router.delete("/", deleteAllNotifications);

module.exports = router;