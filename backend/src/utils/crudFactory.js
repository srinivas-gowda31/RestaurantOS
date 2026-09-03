const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Builds a fully working REST CRUD router for a Postgres table.
 *
 * config = {
 *   table: 'menu_items',                // required
 *   columns: ['name','price', ...],      // insertable/updatable columns (excludes id/timestamps)
 *   searchable: ['name'],                 // columns matched with ILIKE for ?search=
 *   orderBy: 'created_at DESC',           // default ordering
 *   permissions: {                        // per-verb RBAC. Owner always allowed.
 *     read:   ['owner','manager','chef','waiter','cashier','store_manager'],
 *     create: ['owner','manager'],
 *     update: ['owner','manager'],
 *     delete: ['owner','manager'],
 *   },
 *   joins: 'LEFT JOIN suppliers s ON s.id = ingredients.supplier_id', // optional, for GET list enrichment
 *   selectExtra: 's.name as supplier_name',                            // optional extra select columns
 * }
 */
function buildCrudRouter(config) {
  const router = express.Router();
  const {
    table,
    columns,
    searchable = [],
    orderBy = 'created_at DESC',
    permissions = {},
    joins = '',
    selectExtra = '',
  } = config;

  const perm = (verb, fallback) => permissions[verb] || fallback;

  const baseSelect = selectExtra ? `${table}.*, ${selectExtra}` : `${table}.*`;

  // LIST (paginated, searchable, filterable)
  router.get('/', authenticate, authorize(...perm('read', [])), async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 25, 200);
      const offset = (page - 1) * limit;

      const whereClauses = [];
      const values = [];

      if (req.query.search && searchable.length) {
        const searchConds = searchable.map((col) => {
          values.push(`%${req.query.search}%`);
          return `${table}.${col} ILIKE $${values.length}`;
        });
        whereClauses.push(`(${searchConds.join(' OR ')})`);
      }

      // Generic exact-match filters: ?status=open etc. (only for known columns)
      for (const col of columns) {
        if (req.query[col] !== undefined) {
          values.push(req.query[col]);
          whereClauses.push(`${table}.${col} = $${values.length}`);
        }
      }

      const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const listQuery = `
        SELECT ${baseSelect} FROM ${table}
        ${joins}
        ${whereSql}
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${offset}
      `;
      const countQuery = `SELECT COUNT(*) FROM ${table} ${joins} ${whereSql}`;

      const [rows, count] = await Promise.all([
        pool.query(listQuery, values),
        pool.query(countQuery, values),
      ]);

      res.json({
        data: rows.rows,
        pagination: {
          page,
          limit,
          total: parseInt(count.rows[0].count, 10),
          totalPages: Math.ceil(parseInt(count.rows[0].count, 10) / limit),
        },
      });
    } catch (err) {
      console.error(`[${table}] list error`, err.message);
      res.status(500).json({ error: 'Failed to fetch records', detail: err.message });
    }
  });

  // GET ONE
  router.get('/:id', authenticate, authorize(...perm('read', [])), async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT ${baseSelect} FROM ${table} ${joins} WHERE ${table}.id = $1`,
        [req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch record', detail: err.message });
    }
  });

  // CREATE
  router.post('/', authenticate, authorize(...perm('create', [])), async (req, res) => {
    try {
      const cols = columns.filter((c) => req.body[c] !== undefined);
      if (!cols.length) return res.status(400).json({ error: 'No valid fields provided' });
      const values = cols.map((c) => req.body[c]);
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      const result = await pool.query(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(`[${table}] create error`, err.message);
      res.status(400).json({ error: 'Failed to create record', detail: err.message });
    }
  });

  // UPDATE
  router.put('/:id', authenticate, authorize(...perm('update', [])), async (req, res) => {
    try {
      const cols = columns.filter((c) => req.body[c] !== undefined);
      if (!cols.length) return res.status(400).json({ error: 'No valid fields provided' });
      const setSql = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
      const values = cols.map((c) => req.body[c]);
      values.push(req.params.id);
      const hasUpdatedAt = await columnExists(table, 'updated_at');
      const result = await pool.query(
        `UPDATE ${table} SET ${setSql}${hasUpdatedAt ? ', updated_at = now()' : ''} WHERE id = $${values.length} RETURNING *`,
        values
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(`[${table}] update error`, err.message);
      res.status(400).json({ error: 'Failed to update record', detail: err.message });
    }
  });

  // DELETE
  router.delete('/:id', authenticate, authorize(...perm('delete', [])), async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [req.params.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true, id: result.rows[0].id });
    } catch (err) {
      console.error(`[${table}] delete error`, err.message);
      res.status(400).json({ error: 'Failed to delete record (it may be referenced elsewhere)', detail: err.message });
    }
  });

  return router;
}

const columnCache = {};
async function columnExists(table, column) {
  const key = `${table}.${column}`;
  if (columnCache[key] !== undefined) return columnCache[key];
  const result = await pool.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  columnCache[key] = result.rows.length > 0;
  return columnCache[key];
}

module.exports = { buildCrudRouter };
