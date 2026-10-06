const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./submissions.db', (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});

// Create table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    industry TEXT,
    goal TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// API: Submit form
app.post('/api/submit-form', (req, res) => {
  const { name, phone, email, industry, goal } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone required' });
  }

  db.run(
    'INSERT INTO submissions (name, phone, email, industry, goal) VALUES (?, ?, ?, ?, ?)',
    [name, phone, email || '', industry || '', goal || ''],
    function(err) {
      if (err) {
        console.error('Insert error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({
        success: true,
        message: 'Form submitted successfully',
        submissionId: this.lastID,
        qrUrl: `/api/qr?name=${encodeURIComponent(name)}&phone=${phone}`
      });
    }
  );
});

// API: Generate QR code for payment
app.get('/api/qr', async (req, res) => {
  const { name, phone } = req.query;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone required' });
  }

  try {
    // QR content format: name + phone (e.g., "Thao0378637269")
    const content = `${name}${phone}`;

    // Generate QR using sepay format
    const qrUrl = `https://qr.sepay.vn/img?acc=9378637269&bank=970436&amount=100000&des=${encodeURIComponent(content)}`;

    res.json({
      success: true,
      qrUrl: qrUrl,
      bankAccount: '9378637269',
      bankCode: 'Vietcombank',
      amount: '100000',
      description: content
    });
  } catch (err) {
    console.error('QR error:', err);
    res.status(500).json({ error: 'QR generation error' });
  }
});

// API: Get all submissions (admin)
app.get('/api/submissions', (req, res) => {
  const { password } = req.query;

  // Simple password check
  if (password !== '1999') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  db.all(
    'SELECT * FROM submissions ORDER BY created_at DESC',
    (err, rows) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ submissions: rows || [] });
    }
  );
});

// API: Delete submission (admin)
app.delete('/api/submissions/:id', (req, res) => {
  const { password } = req.query;
  const { id } = req.params;

  if (password !== '1999') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  db.run(
    'DELETE FROM submissions WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Delete error' });
      }
      res.json({ success: true, message: 'Deleted' });
    }
  );
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
  db.close((err) => {
    if (err) console.error('Database close error:', err);
    else console.log('Database closed');
    process.exit(0);
  });
});
