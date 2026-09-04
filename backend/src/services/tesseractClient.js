/**
 * Extract text from invoice image using Tesseract OCR
 */
async function extractTextFromInvoice(filePath) {
  try {
    const Tesseract = require('tesseract.js');
    const result = await Tesseract.recognize(filePath, 'eng', {
      logger: (m) => console.log(`Tesseract progress: ${Math.round(m.progress * 100)}%`),
    });
    return result.data.text;
  } catch (error) {
    throw new Error(`Tesseract OCR failed: ${error.message}`);
  }
}

/**
 * Parse invoice text and extract structured data
 */
function parseInvoiceText(text) {
  const lines = text.split('\n').filter((line) => line.trim());

  const extracted = {
    supplier_name: null,
    invoice_number: null,
    invoice_date: null,
    total_amount: null,
    line_items: [],
    confidence: 0.5,
    notes: 'Extracted via Tesseract OCR (fallback)',
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!extracted.invoice_number && /inv[a-z]*[#:\s-]*(\d+)/i.test(trimmed)) {
      const match = trimmed.match(/inv[a-z]*[#:\s-]*(\d+)/i);
      if (match) extracted.invoice_number = match[1];
    }

    if (!extracted.invoice_date) {
      const dateMatch = trimmed.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/);
      if (dateMatch) extracted.invoice_date = dateMatch[1];
    }

    if (!extracted.total_amount) {
      const amountMatch = trimmed.match(/[₹$€£]?\s*(\d+[,.]?\d*)/);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0) extracted.total_amount = amount;
      }
    }

    if (!extracted.supplier_name && /^[A-Z][A-Za-z\s&,.-]+$/g.test(trimmed) && trimmed.length > 3) {
      extracted.supplier_name = trimmed;
    }
  }

  return extracted;
}

module.exports = {
  extractTextFromInvoice,
  parseInvoiceText,
};
