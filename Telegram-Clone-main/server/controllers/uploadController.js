const catchAsyncError = require("../utilities/catchAsyncError.js");
const ReqError = require("../utilities/ReqError.js");
const { cloudinary } = require("../utilities/Cloudinary.js");

module.exports = catchAsyncError(async (req, res, next) => {
  const fileBase64 = req.body.data;
  const fileType = req.body.fileType;

  // Gelen verilerin kontrolü
  if (!fileBase64 || !fileType) {
    return next(new ReqError(400, "Data or fileType is missing"));
  }

  try {
    // Cloudinary'ye yükleme işlemi
    const uploadData = await cloudinary.uploader.upload(fileBase64, {
      upload_preset: "telegram_preset",
      resource_type: fileType,
      width: 400,
      height: 400,
      crop: "limit",
    });

    // Yükleme işlemi başarısız olursa hata döndür
    if (!uploadData || !uploadData.secure_url) {
      return next(new ReqError(500, "Upload failed"));
    }

    // Başarılı sonuç döndür
    res.status(200).json({
      status: "success",
      data: {
        uploadData,
      },
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error.message);
    return next(new ReqError(500, "Upload failed during processing"));
  }
});
