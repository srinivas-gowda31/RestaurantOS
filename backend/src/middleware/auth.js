const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/** Verifies the Bearer token or cookie and attaches req.user = { id, role, email, name } */
function authenticate(req, res, next) {
  // Check cookie first (http-only cookie), then fallback to Authorization header for API compatibility
  let token = req.cookies?.auth_token;

  if (!token) {
    const header = req.headers.authorization || '';
    token = header.startsWith('Bearer ') ? header.slice(7) : null;
  }

  if (!token) return res.status(401).json({ error: 'Missing authentication token' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * RBAC guard. Usage: authorize('owner', 'manager')
 * 'owner' implicitly always passes since they administer the whole system.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.role === 'owner') return next(); // owner has full access
    if (allowedRoles.includes(req.user.role)) return next();
    return res.status(403).json({ error: `Role '${req.user.role}' is not permitted to perform this action` });
  };
}

module.exports = { authenticate, authorize, JWT_SECRET };
