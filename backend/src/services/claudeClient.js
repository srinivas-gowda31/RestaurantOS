const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

/**
 * Calls the Anthropic Messages API.
 * @param {Array} content - array of content blocks (text/image/document) OR a plain string
 * @param {Object} opts - { system, maxTokens }
 */
async function callClaude(content, opts = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server');
  }

  const messages = [
    {
      role: 'user',
      content: typeof content === 'string' ? content : content,
    },
  ];

  const body = {
    model: MODEL,
    max_tokens: opts.maxTokens || 1500,
    messages,
  };
  if (opts.system) body.system = opts.system;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textBlocks = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text);
  return textBlocks.join('\n');
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

module.exports = { callClaude, extractJson };
