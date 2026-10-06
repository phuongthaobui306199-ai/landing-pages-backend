# Hannah Landing Pages Backend

Backend server cho landing pages - quản lý form submissions + QR code thanh toán.

## Tính năng

✅ **Form Submissions** - Lưu dữ liệu vào SQLite database
✅ **Admin Dashboard** - Quản lý danh sách người điền form (password: 1999)
✅ **QR Code Thanh Toán** - Tạo QR Vietcombank tự động
✅ **CORS Support** - Kết nối với frontend

## Installation

```bash
npm install
```

## Development

```bash
npm start
# Server sẽ chạy trên http://localhost:3000
```

## API Endpoints

### 1. Submit Form
**POST** `/api/submit-form`
```json
{
  "name": "Thao Bui",
  "phone": "0378637269",
  "email": "thao@example.com",
  "industry": "Dịch vụ",
  "goal": "Tìm hiểu khách hàng"
}
```

Response:
```json
{
  "success": true,
  "submissionId": 1,
  "qrUrl": "/api/qr?name=Thao%20Bui&phone=0378637269"
}
```

### 2. Generate QR Code
**GET** `/api/qr?name=ThaoB ui&phone=0378637269`

Response:
```json
{
  "success": true,
  "qrUrl": "https://qr.sepay.vn/img?acc=...",
  "bankAccount": "9378637269",
  "bankCode": "Vietcombank",
  "amount": "100000",
  "description": "Thao0378637269"
}
```

### 3. Admin Dashboard
**GET** `/admin` - Access với browser (password: 1999)

### 4. Get Submissions (Admin)
**GET** `/api/submissions?password=1999`

## Database

SQLite database: `submissions.db`

Table: `submissions`
- id (PRIMARY KEY)
- name (TEXT)
- phone (TEXT)
- email (TEXT)
- industry (TEXT)
- goal (TEXT)
- created_at (DATETIME)

## Deployment

### Vercel
```bash
npm i -g vercel
vercel
```

### Environment Variables
Không cần - SQLite embedded

## Frontend Integration

```javascript
// Submit form
fetch('https://your-backend.com/api/submit-form', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Thao Bui',
    phone: '0378637269',
    email: 'thao@example.com',
    industry: 'Dịch vụ',
    goal: 'Tìm hiểu khách hàng'
  })
})
.then(r => r.json())
.then(data => {
  // Redirect to QR or show QR image
  window.location.href = data.qrUrl;
});

// Get QR code
fetch(`https://your-backend.com${data.qrUrl}`)
  .then(r => r.json())
  .then(qr => {
    // Display QR image: <img src="qr.qrUrl" />
  });
```

## Security

⚠️ **Important:**
- Đổi password từ "1999" sang mật khẩu mạnh
- Không công khai database file
- Sử dụng HTTPS trên production
- Rate limit API endpoints (nếu deploy public)

## Author

Hannah Bui - hannah369
