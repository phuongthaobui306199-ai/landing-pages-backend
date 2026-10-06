const { getDb, initDb } = require('../lib/db');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDb();
    const db = getDb();

    // GET /api/drafts - List all drafts
    if (req.method === 'GET') {
      const result = await db.execute(
        'SELECT id, insight, communication_message, channel, status, created_at FROM content_drafts ORDER BY created_at DESC'
      );
      return res.json({ drafts: result.rows || [] });
    }

    // PATCH /api/drafts/:id/approve - Approve draft
    if (req.method === 'PATCH') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Draft ID required' });
      }

      await db.execute({
        sql: 'UPDATE content_drafts SET status = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: ['approved', id]
      });

      return res.json({ success: true, message: 'Draft approved' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Drafts error:', err);
    res.status(500).json({ error: err.message });
  }
}
