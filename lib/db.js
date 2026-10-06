const { createClient } = require('@libsql/client');

let db = null;

function getDb() {
  if (!db) {
    db = createClient({
      url: process.env.DATABASE_URL || 'file:./submissions.db',
      authToken: process.env.AUTH_TOKEN
    });
  }
  return db;
}

async function initDb() {
  const database = getDb();
  try {
    // Submissions table
    await database.execute(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        industry TEXT,
        goal TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Content drafts table
    await database.execute(`
      CREATE TABLE IF NOT EXISTS content_drafts (
        id INTEGER PRIMARY KEY,
        insight TEXT NOT NULL,
        communication_message TEXT NOT NULL,
        channel TEXT,
        format TEXT,
        tone TEXT,
        cta TEXT,
        angles TEXT,
        hooks TEXT,
        draft TEXT,
        draft_cta TEXT,
        review_note TEXT,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        approved_at DATETIME
      )
    `);
  } catch (err) {
    console.error('DB init error:', err);
  }
}

module.exports = { getDb, initDb };
