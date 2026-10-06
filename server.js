const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

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

// Supabase Setup
const SUPABASE_URL = 'https://cfuiahrrebttellltcgs.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdWlhaHJyZWJ0dGVsbGx0Y2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2NDEzNzksImV4cCI6MjA0ODIxNzM3OX0.4rH8Zp2Y3wF7xK9mL6qR5sT2uV8aB1cD4eF9gH2jK3';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Connected to Supabase');

// API: Submit form
app.post('/api/submit-form', async (req, res) => {
  const { name, phone, email, industry, goal } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone required' });
  }

  try {
    const { data, error } = await supabase
      .from('submissions')
      .insert([{ name, phone, email: email || '', industry: industry || '', goal: goal || '' }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error: ' + error.message });
    }

    res.json({
      success: true,
      message: 'Form submitted successfully',
      submissionId: data[0]?.id,
      qrUrl: `/api/qr?name=${encodeURIComponent(name)}&phone=${phone}`
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API: Generate QR code for payment
app.get('/api/qr', async (req, res) => {
  const { name, phone } = req.query;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone required' });
  }

  try {
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
  } catch (err) {
    console.error('QR error:', err);
    res.status(500).json({ error: 'QR generation error' });
  }
});

// API: Get all submissions (admin)
app.get('/api/submissions', async (req, res) => {
  const { password } = req.query;

  if (password !== '1999') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Query error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ submissions: data || [] });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
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
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Delete error' });
    }
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
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
