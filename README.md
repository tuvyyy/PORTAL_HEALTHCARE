# Patient – Doctor Portal (Node.js + SQL Server + EJS)

## Yêu cầu
- Node.js 20+
- SQL Server (Express cũng được)
- VS Code

## Cài đặt
```bash
# 1) Tạo DB và chạy script
#   - sql/01_schema.sql
#   - sql/02_seed.sql

# 2) Cấu hình biến môi trường
cp .env.example .env
# Cập nhật DB_* và SESSION_SECRET

# 3) Cài thư viện & chạy
npm i
npm run dev   # hoặc: npm start
# Mở http://localhost:3000
```

### Tài khoản mẫu
- Doctor: doctor1@demo.com / 123456
- Patient: patient1@demo.com / 123456

## Cấu trúc thư mục
```
src/
  server.js
  config/db.js
  middlewares/auth.js
  validators/
  controllers/
  routes/
  models/
  services/
views/
public/
sql/
```

## Ghi chú
- Đây là bản cơ bản đủ chạy end-to-end (đăng nhập, đặt lịch, xem ca, tạo hồ sơ khám, kê toa, nhắn tin kiểu AJAX).
- Nếu cần Socket.IO realtime chat, có thể mở rộng trong `src/server.js` và `routes/messages.js`.
