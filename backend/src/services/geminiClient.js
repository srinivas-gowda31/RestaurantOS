const fs = require('fs');

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * Sends a text-only prompt to Gemini and returns the response text.
 * @param {string} prompt - the prompt to send
 * @param {Object} opts - { system, maxTokens }
 */
async function callGemini(prompt, opts = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }

  const body = {
    contents: [
      {
        parts: [{ text: opts.system ? `${opts.system}\n\n${prompt}` : prompt }],
      },
    ],
    generationConfig: { temperature: 0, maxOutputTokens: opts.maxTokens || 1500 },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('\n');
}

/**
 * Sends a local file (image or PDF) plus a text prompt to Gemini and returns the response text.
 * @param {string} filePath - path to the invoice file on disk
 * @param {string} mimeType - the file's mime type
 * @param {string} prompt - instructions for what to extract
 */
async function callGeminiWithFile(filePath, mimeType, prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }

  const fileData = fs.readFileSync(filePath).toString('base64');

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: fileData } },
        ],
      },
    ],
    generationConfig: { temperature: 0 },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('\n');
}

/** Extracts the first JSON object/array found in a string (handles ```json fences). */
function extractJson(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse JSON from AI response: ' + text.slice(0, 300));
  }
}

module.exports = { callGemini, callGeminiWithFile, extractJson };
