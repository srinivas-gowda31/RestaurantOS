const { callGeminiWithFile, extractJson } = require('./geminiClient');
const { extractTextFromInvoice, parseInvoiceText } = require('./tesseractClient');

const EXTRACTION_PROMPT = `You are an OCR and data-extraction assistant for restaurant supplier invoices.
Read the attached invoice (image or PDF) and extract structured data.
Return ONLY a single JSON object, no prose, no markdown fences, with this shape:
{
  "supplier_name": string|null,
  "invoice_number": string|null,
  "invoice_date": string|null (format YYYY-MM-DD if determinable, else null),
  "total_amount": number|null,
  "line_items": [ { "description": string, "quantity": number, "unit_price": number, "line_total": number } ],
  "confidence": number (0-1, your confidence in the extraction),
  "notes": string
}
If a field cannot be determined, use null. Do not invent data that is not on the invoice.`;

/**
 * Extracts structured invoice data from a file using Gemini vision (preferred),
 * falling back to local Tesseract OCR + regex parsing if Gemini is unavailable.
 */
async function extractInvoiceData(filePath, mimeType) {
  try {
    const text = await callGeminiWithFile(filePath, mimeType, EXTRACTION_PROMPT);
    const parsed = extractJson(text);
    return {
      supplier_name: parsed.supplier_name ?? null,
      invoice_number: parsed.invoice_number ?? null,
      invoice_date: parsed.invoice_date ?? null,
      total_amount: parsed.total_amount ?? null,
      line_items: Array.isArray(parsed.line_items) ? parsed.line_items : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
      notes: parsed.notes || 'Extracted via Gemini Flash (AI vision OCR)',
    };
  } catch (geminiErr) {
    console.warn(`Gemini extraction failed, falling back to Tesseract: ${geminiErr.message}`);

    if (mimeType === 'application/pdf') {
      return {
        supplier_name: null,
        invoice_number: null,
        invoice_date: null,
        total_amount: null,
        line_items: [],
        confidence: 0,
        notes: `Gemini unavailable and Tesseract cannot read PDFs directly: ${geminiErr.message}`,
      };
    }

    const extractedText = await extractTextFromInvoice(filePath);
    const parsed = parseInvoiceText(extractedText);
    parsed.notes = `Gemini unavailable, used Tesseract fallback. (${geminiErr.message})`;
    return parsed;
  }
}

module.exports = { extractInvoiceData };
