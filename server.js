const express = require('express');
const { createClient } = require('@libsql/client');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:8000', 'http://localhost:3000', 'https://hannah369.phuongthaobui306199.workers.dev', 'https://landing-pages-backend-fawn.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Turso Database
const db = createClient({
  url: process.env.DATABASE_URL || 'file:./submissions.db',
  authToken: process.env.AUTH_TOKEN
});

// Create table if not exists
(async () => {
  try {
    await db.execute(`
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
    console.log('✅ Connected to Turso');
  } catch (err) {
    console.error('Database setup error:', err);
  }
})();

// API: Submit form
app.post('/api/submit-form', async (req, res) => {
  const { name, phone, email, industry, goal } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone required' });
  }

  try {
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
    res.status(500).json({ error: 'Database error' });
  }
});

// API: Generate QR code for payment
app.get('/api/qr', (req, res) => {
  const { name, phone } = req.query;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone required' });
  }

  const content = `${name}${phone}`;
  const qrUrl = `https://qr.sepay.vn/img?acc=9378637269&bank=970436&amount=100000&des=${encodeURIComponent(content)}`;

  res.json({
    success: true,
    qrUrl: qrUrl,
    bankAccount: '9378637269',
    bankCode: 'Vietcombank',
    amount: '100000',
    description: content
  });
});

// API: Get all submissions (admin)
app.get('/api/submissions', async (req, res) => {
  const { password } = req.query;

  if (password !== '1999') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const result = await db.execute(
      'SELECT id, name, phone, email, industry, goal, created_at FROM submissions ORDER BY created_at DESC'
    );
    res.json({ submissions: result.rows || [] });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// API: Delete submission (admin)
app.delete('/api/submissions/:id', async (req, res) => {
  const { password } = req.query;
  const { id } = req.params;

  if (password !== '1999') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    await db.execute({
      sql: 'DELETE FROM submissions WHERE id = ?',
      args: [id]
    });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Delete error' });
  }
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve form submission page
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'form-submission.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin`);
  console.log(`📝 Submit form: POST http://localhost:${PORT}/api/submit-form`);
});

process.on('SIGINT', () => {
  console.log('Server shutting down');
  process.exit(0);
});
