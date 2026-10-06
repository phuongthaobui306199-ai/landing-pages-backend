const { getDb, initDb } = require('../lib/db');
const { generateContentDraft } = require('../lib/gemini');

module.exports = async function handler(req, res) {
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

  const {
    insight,
    communication_message,
    channel,
    format,
    tone,
    cta
  } = req.body;

  // Validate required fields
  if (!insight || !communication_message) {
    return res.status(400).json({
      error: 'Insight và Communication Message là bắt buộc'
    });
  }

  try {
    await initDb();
    const db = getDb();

    // Check Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key chưa được cấu hình'
      });
    }

    // Generate content using Gemini
    const content = await generateContentDraft({
      insight,
      communication_message,
      channel,
      format,
      tone,
      cta
    });

    // Save to database
    const result = await db.execute({
      sql: `INSERT INTO content_drafts
            (insight, communication_message, channel, format, tone, cta, angles, hooks, draft, draft_cta, review_note, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      args: [
        insight,
        communication_message,
        channel || '',
        format || '',
        tone || '',
        cta || '',
        JSON.stringify(content.angles || []),
        JSON.stringify(content.hooks || []),
        content.draft || '',
        content.cta || '',
        content.review_note || ''
      ]
    });

    res.json({
      success: true,
      draftId: result.lastInsertRowid,
      content: {
        angles: content.angles,
        hooks: content.hooks,
        draft: content.draft,
        cta: content.cta,
        review_note: content.review_note
      }
    });
  } catch (err) {
    console.error('Generate content error:', err);
    res.status(500).json({
      error: err.message || 'Lỗi khi tạo nội dung'
    });
  }
}
