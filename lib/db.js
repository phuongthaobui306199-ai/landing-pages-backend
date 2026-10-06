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
  } catch (err) {
    console.error('DB init error:', err);
  }
}

module.exports = { getDb, initDb };
