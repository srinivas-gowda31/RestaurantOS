const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { callClaude, extractJson } = require('../services/claudeClient');

const router = express.Router();
const MGMT = ['owner', 'manager', 'chef', 'store_manager'];

/**
 * All endpoints below follow the same pattern:
 * 1. Pull real operational data from Postgres.
 * 2. Hand it to Claude with a tightly-scoped prompt asking for structured JSON.
 * 3. Fall back to a deterministic rule-based heuristic if the AI call fails
 *    (e.g. no API key configured), so the feature always works end-to-end.
 */

// ---------- 1. Predict ingredient shortages ----------
router.get('/predict-shortages', authenticate, authorize(...MGMT), async (req, res) => {
  try {
    const { rows: ingredients } = await pool.query(`
      SELECT i.id, i.name, i.unit, i.current_stock, i.reorder_level, i.cost_per_unit,
        COALESCE(SUM(ri.quantity) FILTER (WHERE o.created_at > now() - interval '7 days'), 0) as used_last_7_days
      FROM ingredients i
      LEFT JOIN recipe_ingredients ri ON ri.ingredient_id = i.id
      LEFT JOIN recipes r ON r.id = ri.recipe_id
      LEFT JOIN order_items oi ON oi.menu_item_id = r.menu_item_id
      LEFT JOIN orders o ON o.id = oi.order_id
      GROUP BY i.id
      ORDER BY i.name
    `);

    let result;
    try {
      const prompt = `You are an inventory forecasting assistant for a restaurant.
Given this ingredient usage data (JSON), predict which ingredients are likely to run out within the next 7 days
and estimate days-until-stockout using current_stock, reorder_level and used_last_7_days as a weekly burn rate.
Return ONLY a JSON array, no prose, of objects: {id, name, risk: "high"|"medium"|"low", days_until_stockout, reasoning}.

Data: ${JSON.stringify(ingredients)}`;
      const text = await callClaude(prompt, { maxTokens: 1500 });
      result = extractJson(text);
    } catch (aiErr) {
      // Deterministic fallback heuristic
      result = ingredients.map((i) => {
        const dailyBurn = parseFloat(i.used_last_7_days) / 7 || 0;
        const daysLeft = dailyBurn > 0 ? Math.round(parseFloat(i.current_stock) / dailyBurn) : 999;
        const risk = daysLeft <= 2 ? 'high' : daysLeft <= 5 ? 'medium' : 'low';
        return { id: i.id, name: i.name, risk, days_until_stockout: daysLeft, reasoning: 'Rule-based estimate (AI unavailable): current_stock / avg daily usage.' };
      });
    }
    res.json({ predictions: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to predict shortages', detail: err.message });
  }
});

// ---------- 2. Recommend stock reorder quantities ----------
router.get('/reorder-recommendations', authenticate, authorize(...MGMT), async (req, res) => {
  try {
    const { rows: products } = await pool.query(`
      SELECT p.id, p.name, p.unit, p.reorder_level,
        COALESCE(SUM(CASE WHEN sm.movement_type='out' THEN sm.quantity ELSE 0 END) FILTER (WHERE sm.created_at > now() - interval '30 days'),0) as used_30_days,
        COALESCE(SUM(CASE WHEN sm.movement_type='in' THEN sm.quantity ELSE -sm.quantity END),0) as current_stock
      FROM products p
      LEFT JOIN stock_movements sm ON sm.product_id = p.id
      GROUP BY p.id
    `);

    let result;
    try {
      const prompt = `You are an inventory replenishment assistant. Given product stock data (JSON),
recommend an optimal reorder quantity for each product that is at or below its reorder level,
based on 30-day usage as a proxy for demand. Return ONLY a JSON array of
{id, name, recommended_order_qty, unit, justification}.

Data: ${JSON.stringify(products)}`;
      const text = await callClaude(prompt, { maxTokens: 1500 });
      result = extractJson(text);
    } catch (aiErr) {
      result = products
        .filter((p) => parseFloat(p.current_stock) <= parseFloat(p.reorder_level))
        .map((p) => ({
          id: p.id, name: p.name, unit: p.unit,
          recommended_order_qty: Math.max(Math.round(parseFloat(p.used_30_days) * 1.2), parseFloat(p.reorder_level)),
          justification: 'Rule-based estimate (AI unavailable): 120% of trailing 30-day usage.',
        }));
    }
    res.json({ recommendations: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate reorder recommendations', detail: err.message });
  }
});

// ---------- 3. Suggest menu pricing ----------
router.post('/menu-pricing', authenticate, authorize(...MGMT), async (req, res) => {
  try {
    const { menu_item_id } = req.body;
    const { rows } = await pool.query(
      `SELECT mi.*, COALESCE(SUM(oi.quantity),0) as units_sold_30d
       FROM menu_items mi
       LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
       LEFT JOIN orders o ON o.id = oi.order_id AND o.created_at > now() - interval '30 days'
       WHERE mi.id = $1 GROUP BY mi.id`,
      [menu_item_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Menu item not found' });
    const item = rows[0];

    let result;
    try {
      const prompt = `You are a restaurant menu pricing strategist. Given this menu item's cost, current price and 30-day sales velocity,
suggest an optimal price to maximize profit while remaining competitive for a mid-market restaurant. Consider a target
food cost percentage of 28-35%. Return ONLY JSON: {suggested_price, min_price, max_price, target_margin_pct, reasoning}.

Item: ${JSON.stringify(item)}`;
      const text = await callClaude(prompt, { maxTokens: 600 });
      result = extractJson(text);
    } catch (aiErr) {
      const cost = parseFloat(item.cost_price) || 0;
      const suggested = cost > 0 ? Math.ceil((cost / 0.3) / 5) * 5 : parseFloat(item.price);
      result = {
        suggested_price: suggested, min_price: Math.ceil(cost / 0.35), max_price: Math.ceil(cost / 0.25),
        target_margin_pct: 70, reasoning: 'Rule-based estimate (AI unavailable): priced at ~30% food cost ratio.',
      };
    }
    res.json({ item: { id: item.id, name: item.name, current_price: item.price }, ...result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to suggest pricing', detail: err.message });
  }
});

// ---------- 4. Estimate food preparation time ----------
router.post('/prep-time-estimate', authenticate, authorize(...MGMT, 'chef', 'waiter'), async (req, res) => {
  try {
    const { order_id } = req.body;
    const { rows: items } = await pool.query(
      `SELECT mi.name, mi.prep_time_minutes, oi.quantity
       FROM order_items oi JOIN menu_items mi ON mi.id = oi.menu_item_id
       WHERE oi.order_id = $1`,
      [order_id]
    );
    if (!items.length) return res.status(404).json({ error: 'No items found for this order' });

    let result;
    try {
      const prompt = `You are a kitchen operations assistant. Given these order items with individual prep times and quantities,
estimate the realistic total preparation time in minutes for the whole order, accounting for parallel cooking of items
that can be made simultaneously versus sequential bottleneck items. Return ONLY JSON: {estimated_minutes, bottleneck_item, notes}.

Items: ${JSON.stringify(items)}`;
      const text = await callClaude(prompt, { maxTokens: 400 });
      result = extractJson(text);
    } catch (aiErr) {
      const maxTime = Math.max(...items.map((i) => i.prep_time_minutes || 10));
      const total = items.reduce((sum, i) => sum + (i.prep_time_minutes || 10) * 0.3, maxTime * 0.7);
      result = { estimated_minutes: Math.round(total), bottleneck_item: items.sort((a,b)=>b.prep_time_minutes-a.prep_time_minutes)[0].name, notes: 'Rule-based estimate (AI unavailable): weighted bottleneck + parallel cooking model.' };
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to estimate prep time', detail: err.message });
  }
});

// ---------- 5. Analyze ingredient waste ----------
router.get('/waste-analysis', authenticate, authorize(...MGMT), async (req, res) => {
  try {
    const { rows: outMovements } = await pool.query(`
      SELECT p.name, SUM(sm.quantity) as total_out, sm.reference
      FROM stock_movements sm JOIN products p ON p.id = sm.product_id
      WHERE sm.movement_type = 'out' AND sm.created_at > now() - interval '30 days'
      GROUP BY p.name, sm.reference
      ORDER BY total_out DESC LIMIT 30
    `);

    let result;
    try {
      const prompt = `You are a food-waste analyst. Given these 30-day stock-out movements (JSON) where "reference" indicates the reason
(e.g. 'sale', 'spoilage', 'waste', 'expired'), identify waste patterns and give 3-5 actionable recommendations
to reduce ingredient waste. Return ONLY JSON: {waste_pct_estimate, top_waste_items: [{name, total_out, likely_reason}], recommendations: [string]}.

Data: ${JSON.stringify(outMovements)}`;
      const text = await callClaude(prompt, { maxTokens: 900 });
      result = extractJson(text);
    } catch (aiErr) {
      const wasteLike = outMovements.filter((m) => /waste|spoil|expired/i.test(m.reference || ''));
      result = {
        waste_pct_estimate: outMovements.length ? Math.round((wasteLike.length / outMovements.length) * 100) : 0,
        top_waste_items: wasteLike.slice(0, 5),
        recommendations: [
          'Rule-based fallback (AI unavailable):',
          'Review par stock levels for frequently wasted items.',
          'Introduce FIFO labeling in cold storage.',
          'Cross-check portion sizes against recipe specs.',
        ],
      };
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze waste', detail: err.message });
  }
});

module.exports = router;
