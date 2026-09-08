const multer = require('multer');
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require("dotenv").config();

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARYNAME,
    api_key: process.env.CLOUDINARYAPIKEY,
    api_secret: process.env.CLOUDINARYAPISECRET,
});

console.log("Cloudinary configured successfully");

// Configure Multer storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'invoice_settings', // ✅ Different folder for invoice settings
        allowed_formats: ['jpg', 'jpeg', 'png'],
        public_id: (req, file) => file.originalname.split(".")[0] + "-" + Date.now()
    },
});

const cloudinaryFileUploader = multer({ storage });

module.exports = cloudinaryFileUploader;