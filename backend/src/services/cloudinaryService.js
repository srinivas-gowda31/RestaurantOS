const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadInvoice(file, invoiceName) {
  try {
    // file.path is from multer, file.tempFilePath is from express-fileupload
    const filePath = file.path || file.tempFilePath;

    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'restaurantos/invoices',
      resource_type: 'auto',
      public_id: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tags: ['invoice', 'restaurantos'],
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      cloudinaryId: result.public_id,
      size: result.bytes,
      format: result.format,
    };
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return { success: false, error: err.message };
  }
}

async function deleteInvoice(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return { success: result.result === 'ok' };
  } catch (err) {
    console.error('Cloudinary delete error:', err);
    return { success: false, error: err.message };
  }
}

async function getInvoiceUrl(publicId, transformations = {}) {
  try {
    const url = cloudinary.url(publicId, {
      secure: true,
      ...transformations,
    });
    return url;
  } catch (err) {
    console.error('Cloudinary URL error:', err);
    return null;
  }
}

async function listInvoices() {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'restaurantos/invoices',
      max_results: 100,
    });
    return result.resources;
  } catch (err) {
    console.error('Cloudinary list error:', err);
    return [];
  }
}

module.exports = {
  uploadInvoice,
  deleteInvoice,
  getInvoiceUrl,
  listInvoices,
  cloudinary,
};
