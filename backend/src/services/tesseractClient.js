const fs = require('fs');
const { callClaude, extractJson } = require('./claudeClient');

/**
 * Extract invoice data using Claude Vision API
 * Handles both printed and handwritten invoices
 */
async function extractInvoiceWithClaude(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');
    const mimeType = filePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

    const systemPrompt = `You are an expert invoice data extraction specialist.
Analyze invoices (both printed and handwritten) and extract structured data.
Be thorough and extract ALL information visible on the invoice.`;

    const userPrompt = `Extract all invoice data from this invoice image. Return ONLY valid JSON in this format:
{
  "supplier_name": "Company name from invoice (required)",
  "invoice_number": "Invoice/Bill number if visible (string)",
  "invoice_date": "Date in YYYY-MM-DD format if visible (string)",
  "total_amount": "Total amount as number (e.g., 90224)",
  "line_items": [
    {
      "description": "Item description",
      "quantity": "Number (e.g., 10)",
      "unit_price": "Price per unit (e.g., 50)",
      "line_total": "Total for line (quantity × unit_price)"
    }
  ],
  "confidence": "Confidence score 0.0-1.0 based on clarity and completeness",
  "notes": "Any special notes or issues with extraction"
}

IMPORTANT:
- Extract ALL visible line items (check left and right columns)
- For handwritten items, read carefully even if messy
- If a field is not visible, set it to null
- Total amount should be a number, not a string
- Confidence: 0.95+ for clear printed, 0.7-0.9 for handwritten, <0.7 if unclear`;

    const content = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType,
          data: base64,
        },
      },
      {
        type: 'text',
        text: userPrompt,
      },
    ];

    const response = await callClaude(content, {
      system: systemPrompt,
      maxTokens: 2000,
    });

    const extracted = extractJson(response);
    return extracted;
  } catch (error) {
    throw new Error(`Claude Vision extraction failed: ${error.message}`);
  }
}

/**
 * Fallback: Extract text using Tesseract (if Claude fails)
 * @deprecated - Use Claude Vision instead
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
 * Parse invoice text (fallback for Tesseract)
 * @deprecated - Use Claude Vision instead
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
  extractInvoiceWithClaude,
  extractTextFromInvoice,
  parseInvoiceText,
};
