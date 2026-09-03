const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const MGMT = ['owner', 'manager', 'store_manager'];

// GET /api/dashboard/summary - one-shot bundle for the dashboard home page
router.get('/summary', authenticate, async (req, res) => {
  try {
    const [
      salesOverview,
      activeOrders,
      tableOccupancy,
      lowStockItems,
      monthlyExpenses,
      purchaseSummary,
      profitOverview,
      supplierSummary,
    ] = await Promise.all([
      pool.query(`
        SELECT date_trunc('day', created_at) as day, SUM(total_amount) as total, COUNT(*) as orders
        FROM orders WHERE status = 'paid' AND created_at > now() - interval '14 days'
        GROUP BY 1 ORDER BY 1
      `),
      pool.query(`
        SELECT status, COUNT(*) as count FROM orders
        WHERE status IN ('open','preparing','served') GROUP BY status
      `),
      pool.query(`
        SELECT status, COUNT(*) as count FROM restaurant_tables GROUP BY status
      `),
      pool.query(`
        SELECT id, name, current_stock, reorder_level, unit FROM ingredients
        WHERE current_stock <= reorder_level ORDER BY (current_stock - reorder_level) ASC LIMIT 10
      `),
      pool.query(`
        SELECT date_trunc('month', expense_date) as month, SUM(amount) as total
        FROM expenses WHERE expense_date > now() - interval '6 months'
        GROUP BY 1 ORDER BY 1
      `),
      pool.query(`
        SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount),0) as total
        FROM purchase_orders GROUP BY status
      `),
      pool.query(`
        SELECT
          COALESCE((SELECT SUM(total_amount) FROM orders WHERE status='paid' AND created_at > now() - interval '30 days'),0) as revenue,
          COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date > now() - interval '30 days'),0) as expenses
      `),
      pool.query(`
        SELECT s.id, s.name, COUNT(po.id) as orders_count, COALESCE(SUM(po.total_amount),0) as total_spent
        FROM suppliers s LEFT JOIN purchase_orders po ON po.supplier_id = s.id
        GROUP BY s.id, s.name ORDER BY total_spent DESC LIMIT 10
      `),
    ]);

    const revenue = parseFloat(profitOverview.rows[0].revenue);
    const expensesTotal = parseFloat(profitOverview.rows[0].expenses);

    res.json({
      salesOverview: salesOverview.rows,
      activeOrders: activeOrders.rows,
      tableOccupancy: tableOccupancy.rows,
      lowStockItems: lowStockItems.rows,
      monthlyExpenses: monthlyExpenses.rows,
      purchaseSummary: purchaseSummary.rows,
      profitOverview: {
        revenue,
        expenses: expensesTotal,
        profit: revenue - expensesTotal,
        marginPct: revenue > 0 ? (((revenue - expensesTotal) / revenue) * 100).toFixed(1) : 0,
      },
      supplierSummary: supplierSummary.rows,
    });
  } catch (err) {
    console.error('dashboard summary error', err.message);
    res.status(500).json({ error: 'Failed to load dashboard', detail: err.message });
  }
});

module.exports = router;
