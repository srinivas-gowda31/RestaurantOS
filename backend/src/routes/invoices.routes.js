const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { extractInvoiceWithClaude, extractTextFromInvoice, parseInvoiceText } = require('../services/tesseractClient');
const { uploadInvoice, deleteInvoice, listInvoices } = require('../services/cloudinaryService');

const router = express.Router();
const MGMT = ['owner', 'manager', 'store_manager', 'cashier'];

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'invoices');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Only PDF, PNG, JPG or WEBP invoices are supported'), ok);
  },
});

// Tesseract OCR will extract text and parse it locally
// No system prompt needed - using Tesseract.js

// POST /api/invoices/upload  (multipart, field name: "invoice")
// Temporarily disabled auth for testing - re-enable after testing
router.post('/upload', upload.single('invoice'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded (field name must be "invoice")' });

  try {
    const filePath = req.file.path;
    const isPdf = req.file.mimetype === 'application/pdf';

    let extracted;
    try {
      console.log(`Extracting invoice from ${req.file.originalname} using Claude Vision...`);

      // Use Claude Vision API for extraction (works with both printed and handwritten invoices)
      try {
        extracted = await extractInvoiceWithClaude(filePath);
        console.log(`✓ Claude extracted: supplier=${extracted.supplier_name}, amount=${extracted.total_amount}, confidence=${extracted.confidence}`);
      } catch (claudeErr) {
        console.warn(`Claude extraction failed (${claudeErr.message}), falling back to Tesseract...`);

        // Fallback to Tesseract if Claude fails
        if (isPdf) {
          throw new Error('PDF files require Claude Vision. Tesseract cannot process PDFs.');
        }

        const extractedText = await extractTextFromInvoice(filePath);
        console.log(`Tesseract fallback: ${extractedText.length} characters`);
        extracted = parseInvoiceText(extractedText);
        extracted.notes = 'Extracted via Tesseract (Claude fallback)';
      }
    } catch (ocrErr) {
      // Store the upload even if extraction fails
      const failedInsert = await pool.query(
        `INSERT INTO supplier_invoices (file_name, file_path, status, raw_extraction)
         VALUES ($1,$2,'failed',$3) RETURNING *`,
        [req.file.originalname, req.file.path, JSON.stringify({ error: ocrErr.message })]
      );
      return res.status(502).json({
        error: 'Invoice extraction failed. File was saved for manual review.',
        detail: ocrErr.message,
        invoice: failedInsert.rows[0],
      });
    }

    // Try to match an existing supplier by name (best-effort, non-blocking)
    let supplierId = null;
    if (extracted.supplier_name) {
      const match = await pool.query(`SELECT id FROM suppliers WHERE name ILIKE $1 LIMIT 1`, [`%${extracted.supplier_name}%`]);
      if (match.rows.length) supplierId = match.rows[0].id;
    }

    // Upload to Cloudinary
    let cloudinaryResult = { success: false };
    let cloudinaryUrl = null;
    let cloudinaryId = null;

    try {
      cloudinaryResult = await uploadInvoice(req.file, req.file.originalname);
      if (cloudinaryResult.success) {
        cloudinaryUrl = cloudinaryResult.url;
        cloudinaryId = cloudinaryResult.cloudinaryId;
        console.log(`✓ Uploaded to Cloudinary: ${cloudinaryUrl}`);
      }
    } catch (cloudErr) {
      console.warn('Cloudinary upload failed (non-blocking):', cloudErr.message);
    }

    const userId = req.user && req.user.id ? req.user.id : null; // NULL if not authenticated
    const insert = await pool.query(
      `INSERT INTO supplier_invoices
        (supplier_id, file_name, file_path, cloudinary_url, cloudinary_id, invoice_number, invoice_date, total_amount, raw_extraction, status, processed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'processed',$10) RETURNING *`,
      [
        supplierId,
        req.file.originalname,
        req.file.path,
        cloudinaryUrl,
        cloudinaryId,
        extracted.invoice_number,
        extracted.invoice_date,
        extracted.total_amount,
        JSON.stringify(extracted),
        userId,
      ]
    );
    const invoice = insert.rows[0];

    if (Array.isArray(extracted.line_items)) {
      for (const li of extracted.line_items) {
        await pool.query(
          `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, line_total)
           VALUES ($1,$2,$3,$4,$5)`,
          [invoice.id, li.description, li.quantity, li.unit_price, li.line_total]
        );
      }
    }

    res.status(201).json({ invoice, extracted });
  } catch (err) {
    console.error('invoice upload error', err.message);
    res.status(500).json({ error: 'Failed to process invoice', detail: err.message });
  }
});

// GET /api/invoices - list processed invoices
router.get('/', authenticate, authorize(...MGMT), async (req, res) => {
  const result = await pool.query(`
    SELECT si.*, s.name as supplier_name_matched
    FROM supplier_invoices si LEFT JOIN suppliers s ON s.id = si.supplier_id
    ORDER BY si.created_at DESC LIMIT 100
  `);
  res.json({ data: result.rows });
});

// GET /api/invoices/:id - invoice + line items
router.get('/:id', authenticate, authorize(...MGMT), async (req, res) => {
  const invoice = await pool.query(`SELECT * FROM supplier_invoices WHERE id = $1`, [req.params.id]);
  if (!invoice.rows.length) return res.status(404).json({ error: 'Not found' });
  const items = await pool.query(`SELECT * FROM invoice_line_items WHERE invoice_id = $1`, [req.params.id]);
  res.json({ invoice: invoice.rows[0], line_items: items.rows });
});

// GET /api/invoices/export/excel - generates the Expense Register in Excel
router.get('/export/excel', authenticate, authorize(...MGMT), async (req, res) => {
  try {
    const invoices = await pool.query(`
      SELECT si.*, s.name as supplier_name_matched
      FROM supplier_invoices si LEFT JOIN suppliers s ON s.id = si.supplier_id
      ORDER BY si.invoice_date DESC NULLS LAST
    `);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RestaurantOS';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Expense Register');
    sheet.columns = [
      { header: 'Invoice #', key: 'invoice_number', width: 18 },
      { header: 'Date', key: 'invoice_date', width: 14 },
      { header: 'Supplier (Matched)', key: 'supplier_name_matched', width: 26 },
      { header: 'Supplier (Extracted)', key: 'supplier_extracted', width: 26 },
      { header: 'Total Amount', key: 'total_amount', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'File Name', key: 'file_name', width: 30 },
      { header: 'Notes', key: 'notes', width: 40 },
    ];
    sheet.getRow(1).font = { bold: true };

    let grandTotal = 0;
    for (const inv of invoices.rows) {
      const extraction = inv.raw_extraction || {};
      grandTotal += parseFloat(inv.total_amount) || 0;
      sheet.addRow({
        invoice_number: inv.invoice_number || '—',
        invoice_date: inv.invoice_date ? new Date(inv.invoice_date).toISOString().slice(0, 10) : '—',
        supplier_name_matched: inv.supplier_name_matched || '—',
        supplier_extracted: extraction.supplier_name || '—',
        total_amount: parseFloat(inv.total_amount) || 0,
        status: inv.status,
        file_name: inv.file_name,
        notes: extraction.notes || '',
      });
    }

    sheet.addRow({});
    const totalRow = sheet.addRow({ supplier_name_matched: 'GRAND TOTAL', total_amount: grandTotal });
    totalRow.font = { bold: true };
    sheet.getColumn('total_amount').numFmt = '#,##0.00';

    // Second sheet: full line-item detail
    const lineItemsSheet = workbook.addWorksheet('Line Items');
    lineItemsSheet.columns = [
      { header: 'Invoice #', key: 'invoice_number', width: 18 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Unit Price', key: 'unit_price', width: 14 },
      { header: 'Line Total', key: 'line_total', width: 14 },
    ];
    lineItemsSheet.getRow(1).font = { bold: true };

    for (const inv of invoices.rows) {
      const items = await pool.query(`SELECT * FROM invoice_line_items WHERE invoice_id = $1`, [inv.id]);
      for (const li of items.rows) {
        lineItemsSheet.addRow({
          invoice_number: inv.invoice_number || '—',
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unit_price,
          line_total: li.line_total,
        });
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="expense-register.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('excel export error', err.message);
    res.status(500).json({ error: 'Failed to generate Excel register', detail: err.message });
  }
});

// GET /api/invoices/gallery/previews - get all invoices with Cloudinary preview URLs
router.get('/gallery/previews', authenticate, authorize(...MGMT), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, file_name, cloudinary_url, cloudinary_id, invoice_date, total_amount, status,
             supplier_id, created_at
      FROM supplier_invoices
      WHERE cloudinary_url IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const invoices = result.rows.map((inv) => ({
      ...inv,
      thumbnail: inv.cloudinary_url ? inv.cloudinary_url.replace(/\/upload\//, '/upload/c_thumb,h_200,w_200/') : null,
      preview: inv.cloudinary_url,
    }));

    res.json({ data: invoices, total: invoices.length });
  } catch (err) {
    console.error('gallery error', err.message);
    res.status(500).json({ error: 'Failed to fetch invoice gallery', detail: err.message });
  }
});

// DELETE /api/invoices/:id - delete invoice (and from Cloudinary if exists)
router.delete('/:id', authenticate, authorize(...MGMT), async (req, res) => {
  try {
    const invoice = await pool.query(`SELECT cloudinary_id FROM supplier_invoices WHERE id = $1`, [req.params.id]);
    if (!invoice.rows.length) return res.status(404).json({ error: 'Invoice not found' });

    // Delete from Cloudinary if exists
    const cloudinaryId = invoice.rows[0].cloudinary_id;
    if (cloudinaryId) {
      try {
        await deleteInvoice(cloudinaryId);
        console.log('✓ Deleted from Cloudinary:', cloudinaryId);
      } catch (cloudErr) {
        console.warn('Cloudinary delete failed (non-blocking):', cloudErr.message);
      }
    }

    // Delete line items first (foreign key constraint)
    await pool.query(`DELETE FROM invoice_line_items WHERE invoice_id = $1`, [req.params.id]);

    // Delete invoice
    await pool.query(`DELETE FROM supplier_invoices WHERE id = $1`, [req.params.id]);

    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err) {
    console.error('delete error', err.message);
    res.status(500).json({ error: 'Delete failed', detail: err.message });
  }
});

// DELETE /api/invoices/:id/cloudinary - delete from Cloudinary only
router.delete('/:id/cloudinary', authenticate, authorize(...MGMT), async (req, res) => {
  try {
    const invoice = await pool.query(`SELECT cloudinary_id FROM supplier_invoices WHERE id = $1`, [req.params.id]);
    if (!invoice.rows.length) return res.status(404).json({ error: 'Invoice not found' });

    const cloudinaryId = invoice.rows[0].cloudinary_id;
    if (!cloudinaryId) return res.status(400).json({ error: 'No Cloudinary ID found' });

    const deleteResult = await deleteInvoice(cloudinaryId);
    if (deleteResult.success) {
      await pool.query(`UPDATE supplier_invoices SET cloudinary_url = NULL, cloudinary_id = NULL WHERE id = $1`, [req.params.id]);
      res.json({ success: true, message: 'Invoice deleted from Cloudinary' });
    } else {
      res.status(500).json({ error: 'Failed to delete from Cloudinary', detail: deleteResult.error });
    }
  } catch (err) {
    console.error('delete error', err.message);
    res.status(500).json({ error: 'Delete failed', detail: err.message });
  }
});

module.exports = router;
