const Tesseract = require('tesseract.js');
const fs = require('fs');

/**
 * Extract text from invoice image using Tesseract OCR
 */
async function extractTextFromInvoice(filePath) {
  try {
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

  // Simple parsing logic - can be enhanced
  const extracted = {
    supplier_name: null,
    invoice_number: null,
    invoice_date: null,
    total_amount: null,
    line_items: [],
    confidence: 0.6,
    notes: 'Extracted via Tesseract OCR (local)',
  };

  // Look for common patterns
  for (const line of lines) {
    const trimmed = line.trim();

    // Invoice number pattern (e.g., "INV-001", "Invoice #12345")
    if (!extracted.invoice_number && /inv[a-z]*[#:\s-]*(\d+)/i.test(trimmed)) {
      const match = trimmed.match(/inv[a-z]*[#:\s-]*(\d+)/i);
      if (match) extracted.invoice_number = match[1];
    }

    // Date pattern (YYYY-MM-DD or DD/MM/YYYY)
    if (!extracted.invoice_date) {
      const dateMatch = trimmed.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/);
      if (dateMatch) extracted.invoice_date = dateMatch[1];
    }

    // Amount pattern (currency symbol + number)
    if (!extracted.total_amount) {
      const amountMatch = trimmed.match(/[₹$€£]?\s*(\d+[,.]?\d*)/);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0) extracted.total_amount = amount;
      }
    }

    // Supplier name (often at top or after "from", "supplier", "vendor")
    if (!extracted.supplier_name && /^[A-Z][A-Za-z\s&,.-]+$/g.test(trimmed) && trimmed.length > 3) {
      extracted.supplier_name = trimmed;
    }
  }

  // Extract potential line items (simple heuristic)
  const itemPattern = /([A-Za-z\s]+?)\s+(\d+\.?\d*)\s+x?\s*([₹$€£]?\d+[,.]?\d*)/g;
  let match;
  while ((match = itemPattern.exec(text)) !== null) {
    extracted.line_items.push({
      description: match[1].trim(),
      quantity: parseFloat(match[2]),
      unit_price: parseFloat(match[3].replace(/[₹$€£]/g, '').replace(/,/g, '')),
      line_total: parseFloat(match[2]) * parseFloat(match[3].replace(/[₹$€£]/g, '').replace(/,/g, '')),
    });
  }

  return extracted;
}

module.exports = {
  extractTextFromInvoice,
  parseInvoiceText,
};
