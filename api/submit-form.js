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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, industry, goal } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone required' });
  }

  try {
    await initDb();
    const db = getDb();

    const result = await db.execute({
      sql: 'INSERT INTO submissions (name, phone, email, industry, goal) VALUES (?, ?, ?, ?, ?)',
      args: [name, phone, email || '', industry || '', goal || '']
    });

    res.json({
      success: true,
      message: 'Form submitted successfully',
      submissionId: result.lastInsertRowid,
      qrUrl: `/api/qr?name=${encodeURIComponent(name)}&phone=${phone}`
    });
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
}
