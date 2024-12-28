const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;

// .env dosyasını yükle
dotenv.config({ path: "./.env" });

// Cloudinary yapılandırmasını yap
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary nesnesini dışa aktar
module.exports = { cloudinary };
