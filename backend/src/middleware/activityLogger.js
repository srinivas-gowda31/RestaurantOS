const pool = require('../config/db');

/** Fire-and-forget audit logging for mutating requests. Attach after auth middleware. */
function activityLogger(req, res, next) {
  res.on('finish', () => {
    if (!req.user) return;
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return;
    if (res.statusCode >= 400) return;
    const entity = req.baseUrl.split('/').pop();
    pool
      .query(
        `INSERT INTO activity_logs (user_id, action, entity, entity_id, metadata) VALUES ($1,$2,$3,$4,$5)`,
        [req.user.id, `${req.method} ${req.originalUrl}`, entity, req.params.id || null, JSON.stringify({ body: req.body })]
      )
      .catch((err) => console.error('activity log error', err.message));
  });
  next();
}

module.exports = activityLogger;
