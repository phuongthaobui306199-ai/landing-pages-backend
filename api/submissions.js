const { getDb, initDb } = require('../lib/db');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { password, id } = req.query;

  if (password !== '1999') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    await initDb();
    const db = getDb();

    if (req.method === 'GET') {
      const result = await db.execute(
        'SELECT id, name, phone, email, industry, goal, created_at FROM submissions ORDER BY created_at DESC'
      );
      return res.json({ submissions: result.rows || [] });
    }

    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'ID required' });
      }
      await db.execute({
        sql: 'DELETE FROM submissions WHERE id = ?',
        args: [id]
      });
      return res.json({ success: true, message: 'Deleted' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
}
