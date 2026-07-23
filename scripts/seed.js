require('dotenv').config();
const { runSeed } = require('../db/seed');

// CLI entry point — for local development or any host where you have shell
// access. On Render's free tier (no shell access), use the one-time HTTP
// setup route instead: see routes/setup.js.
runSeed(process.env.ADMIN_INITIAL_PASSWORD)
  .then(({ log }) => {
    console.log(log.join('\n'));
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
