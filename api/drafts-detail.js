const { getDb, initDb } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDb();
    const db = getDb();

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Draft ID required' });
    }

    const result = await db.execute({
      sql: 'SELECT * FROM content_drafts WHERE id = ?',
      args: [id]
    });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const draft = result.rows[0];

    // Parse JSON fields
    draft.angles = JSON.parse(draft.angles || '[]');
    draft.hooks = JSON.parse(draft.hooks || '[]');

    res.json({ success: true, draft });
  } catch (err) {
    console.error('Get draft error:', err);
    res.status(500).json({ error: err.message });
  }
}
