const bcrypt = require('bcryptjs');
const { db } = require('../db/client');

// Simplest possible admin auth: every protected request must include the
// admin password (in the JSON body for POST/PUT/DELETE, or as a ?password=
// query param for GET). No tokens, no sessions — it's just checked fresh
// against the stored bcrypt hash on every single request.
async function requireAdmin(req, res, next) {
  const password = (req.body && req.body.password) || req.query.password;

  if (!password) {
    return res.status(401).json({ error: 'Password is required' });
  }

  try {
    const result = await db.execute('SELECT password_hash FROM admin WHERE id = 1');
    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Admin account is not set up — run the seed script' });
    }

    const match = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });

    next();
  } catch (err) {
    console.error('requireAdmin error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { requireAdmin };
