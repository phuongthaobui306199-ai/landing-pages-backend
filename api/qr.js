module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
}
