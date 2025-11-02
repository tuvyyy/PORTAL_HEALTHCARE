import { registerSchema, loginSchema } from '../validators/schemas.js';
import { findUserByEmail, createPatientUser } from '../models/userModel.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { pool } from '../config/db.js';

// 🖥️ Hiển thị trang đăng nhập (dùng fetch, không cần axios)
export async function showLogin(req, res) {
  try {
    const response = await fetch("http://localhost:3000/api/tasks");

    let data = [];
    if (response.ok) {
      data = await response.json();
    }

    const notifications = data || [];

    res.render("auth/login", {
      layout: false,
      title: "Đăng nhập",
      notifications,
    });
  } catch (error) {
    console.error("⚠️ Lỗi khi tải thông báo:", error.message);

    res.render("auth/login", {
      layout: false,
      title: "Đăng nhập",
      notifications: [],
    });
  }
}


// 🧾 Hiển thị trang đăng ký
export async function showRegister(req, res) {
  res.render('auth/register', {
    layout: false,
    title: 'Đăng ký',
  });
}

// 🧩 Đăng ký tài khoản bệnh nhân mới
export async function register(req, res) {
  try {
    const { value, error } = registerSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .render('auth/register', { title: 'Đăng ký', error: error.message });

    const existing = await findUserByEmail(value.email);
    if (existing)
      return res
        .status(400)
        .render('auth/register', {
          title: 'Đăng ký',
          error: 'Email đã tồn tại',
        });

    const passwordHash = await hashPassword(value.password);
    const user = await createPatientUser({
      email: value.email,
      passwordHash,
      fullName: value.fullName,
    });

    req.session.user = user;
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}

// 🔐 Xử lý đăng nhập
export async function login(req, res) {
  try {
    const { value, error } = loginSchema.validate(req.body);
    if (error)
      return res.status(400).render('auth/login', {
        layout: false,
        title: 'Đăng nhập',
        error: error.message,
        notifications: [],
      });

    // 🔍 Tìm user trong DB
    const user = await findUserByEmail(value.email);
    if (!user) {
      return res.status(404).render('auth/login', {
        layout: false,
        title: 'Đăng nhập',
        error: 'Không tìm thấy tài khoản!',
        notifications: [],
      });
    }

    // 🔑 So sánh mật khẩu
    const hash = String(user.PasswordHash || '').trim();
    const ok = await comparePassword(value.password.trim(), hash);

    if (!ok) {
      return res.status(401).render('auth/login', {
        layout: false,
        title: 'Đăng nhập',
        error: 'Sai mật khẩu!',
        notifications: [],
      });
    }

    // ✅ Tạo session
    req.session.user = user;
    res.redirect('/');
  } catch (err) {
    console.error('🔥 Lỗi login:', err);
    res.status(500).send('Server error');
  }
}

// 🚪 Đăng xuất
export async function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}
