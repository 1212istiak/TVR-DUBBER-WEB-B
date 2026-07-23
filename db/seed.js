const bcrypt = require('bcryptjs');
const { db, initSchema } = require('./client');

// Shared seed logic — used by both the CLI script (scripts/seed.js, for
// people who have shell/SSH access) and the one-time HTTP setup route
// (routes/setup.js, for Render's free tier, which has no shell access at
// all). Safe to run more than once: every part only fills in rows that
// don't already exist.
const DEFAULT_SETTINGS = {
  website_title: 'TVR Dubbers',
  motto: 'We Believe in Quality',
  special_folder_thumbnail: '',
  special_folder_label: 'Season 1 · Special Episodes',
  countdown_target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  facebook: 'https://facebook.com/dubtvr',
  youtube: 'https://youtube.com/@tvr_dubbers',
  telegram: 'https://t.me/TVR_Dubbers',
  whatsapp: '',
  instagram: '',
  dailymotion: '',
  rumble: '',
};

const VOICE_ARTISTS = [
  'Md Afsin',
  'Argho Shekhar',
  'Yousa Mahin',
  'Redwan Ahmed',
  'Amjad Hussain',
  'Meherima Jahan',
  'Saurav Talukder',
  'Shehzana Rahman',
  'Bushrath Jahan',
  'Kamonika Paul',
  'Sabrina Ahmed',
];

async function runSeed(adminPassword) {
  const log = [];

  log.push('Creating tables (if not already present)...');
  await initSchema();

  log.push('Seeding admin account...');
  let adminCreated = false;
  const existingAdmin = await db.execute('SELECT id FROM admin WHERE id = 1');
  if (existingAdmin.rows.length === 0) {
    const password = adminPassword || 'rocky@2025-CHANGE-ME';
    const hash = await bcrypt.hash(password, 12);
    await db.execute({ sql: 'INSERT INTO admin (id, password_hash) VALUES (1, ?)', args: [hash] });
    adminCreated = true;
    log.push(
      adminPassword
        ? '  Admin account created with the password you provided.'
        : `  No password provided — used placeholder "${password}". Change it immediately.`
    );
  } else {
    log.push('  Admin account already exists — leaving password untouched.');
  }

  log.push('Seeding default settings (only keys that are still empty)...');
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await db.execute({ sql: 'SELECT value FROM settings WHERE key = ?', args: [key] });
    if (existing.rows.length === 0) {
      await db.execute({ sql: 'INSERT INTO settings (key, value) VALUES (?, ?)', args: [key, value] });
    }
  }

  log.push('Seeding voice artist roster (only if the table is empty)...');
  let artistsAdded = 0;
  const existingArtists = await db.execute('SELECT COUNT(*) as c FROM voice_artists');
  if (Number(existingArtists.rows[0].c) === 0) {
    for (let i = 0; i < VOICE_ARTISTS.length; i++) {
      await db.execute({
        sql: 'INSERT INTO voice_artists (name, display_order) VALUES (?, ?)',
        args: [VOICE_ARTISTS[i], i],
      });
    }
    artistsAdded = VOICE_ARTISTS.length;
    log.push(`  Added ${artistsAdded} voice artists.`);
  } else {
    log.push('  Voice artist table already has entries — leaving as-is.');
  }

  log.push('Done.');
  return { log, adminCreated };
}

module.exports = { runSeed };
