const express = require("express");
const router = express.Router();
const { requireSignIn, getWorkshopId } = require("../middleware/authMiddleware");
const {
    getSettings,
    updateSettings
} = require("../controllers/settingsController");
const cloudinaryFileUploader = require("../middleware/fileUploader");


router.use(requireSignIn);
router.use(getWorkshopId);

router.get("/", getSettings);
router.put("/",cloudinaryFileUploader.fields([
        { name: 'headerImage', maxCount: 1 },
        { name: 'footerImage', maxCount: 1 },
        { name: 'logo', maxCount: 1 }
    ]), updateSettings);

module.exports = router;