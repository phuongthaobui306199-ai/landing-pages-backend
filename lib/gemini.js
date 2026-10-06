const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateContentDraft(payload) {
  const {
    insight,
    communication_message,
    channel,
    format,
    tone,
    cta
  } = payload;

  if (!insight || !communication_message) {
    throw new Error('Insight và Communication Message là bắt buộc');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
Bạn là Content Marketing Expert. Tạo content draft dựa trên thông tin sau:

**Insight:** ${insight}
**Communication Message:** ${communication_message}
**Channel:** ${channel || 'Social Media'}
**Format:** ${format || 'Bài viết'}
**Tone:** ${tone || 'Chuyên nghiệp'}
**CTA:** ${cta || 'Tìm hiểu thêm'}

Hãy tạo:
1. **3 Content Angles** - 3 góc nhìn khác nhau để tiếp cận nội dung
2. **3 Hooks** - 3 mở đầu hấp dẫn để bắt sự chú ý
3. **Draft Hoàn Chỉnh** - Bản nháp nội dung đầy đủ (300-500 từ)
4. **CTA** - Call-to-action phù hợp
5. **Review Note** - Lưu ý để review sau

Format trả về JSON như này:
{
  "angles": ["Angle 1", "Angle 2", "Angle 3"],
  "hooks": ["Hook 1", "Hook 2", "Hook 3"],
  "draft": "Nội dung đầy đủ...",
  "cta": "Call-to-action...",
  "review_note": "Lưu ý cho review..."
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON từ response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Không thể parse response từ Gemini');
    }

    const content = JSON.parse(jsonMatch[0]);
    return content;
  } catch (err) {
    console.error('Gemini API error:', err);
    throw new Error('Lỗi khi gọi Gemini API: ' + err.message);
  }
}

module.exports = { generateContentDraft };
