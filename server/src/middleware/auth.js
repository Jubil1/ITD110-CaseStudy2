const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sangkap-dev-secret-change-me';

/**
 * requireAuth — Express middleware.
 *
 * Looks for: "Authorization: Bearer <token>" on the incoming request.
 *   - If missing/invalid → 401
 *   - If valid → attaches decoded payload to req.user, calls next()
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;

  if (!token) {
    return res.status(401).json({ error: 'missing authorization token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

module.exports = { requireAuth, JWT_SECRET };
