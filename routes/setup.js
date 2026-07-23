const express = require('express');
const rateLimit = require('express-rate-limit');
const { runSeed } = require('../db/seed');

const router = express.Router();

// One-time setup route for hosts with no shell access (e.g. Render's free
// tier, which doesn't support the Shell/SSH tab at all). Visit
// /api/setup/seed?key=YOUR_SETUP_KEY once in a browser after your first
// deploy to create the database tables, your admin account, and the
// starter data — the same thing `npm run seed` does locally.
//
// Protected by the SETUP_KEY env var so a stranger can't hit this and
// re-seed your site. If SETUP_KEY isn't set, this route refuses to run at
// all. Once you've used it, it's fine to leave in place (re-running it is
// a no-op — it only fills in rows that don't exist yet) but you can also
// delete SETUP_KEY from your Render env vars afterward to fully lock it.
const setupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
});

router.get('/seed', setupLimiter, async (req, res) => {
  if (!process.env.SETUP_KEY) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.query.key !== process.env.SETUP_KEY) {
    return res.status(401).json({ error: 'Invalid setup key' });
  }

  try {
    const { log, adminCreated } = await runSeed(process.env.ADMIN_INITIAL_PASSWORD);
    res.json({
      success: true,
      adminCreated,
      log,
      note: adminCreated
        ? 'Admin account created. You can log in now with the password you set in ADMIN_INITIAL_PASSWORD.'
        : 'Admin account already existed, so it was left untouched.',
    });
  } catch (err) {
    console.error('GET /setup/seed error:', err);
    res.status(500).json({ error: 'Seeding failed', detail: err.message });
  }
});

module.exports = router;
