// 🧩 Kiểm tra đăng nhập
export function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

// 🧩 Kiểm tra quyền (role: 'doctor' | 'patient' | 'admin' ...)
export function requireRole(role) {
  return (req, res, next) => {
    if (req.session?.user?.Role === role) return next();
    return res.status(403).send('Forbidden');
  };
}

// 🧩 Inject user + biến global vào view
export function injectUser(req, res, next) {
  res.locals.currentUser = req.session?.user || null;

  // 🟢 Thêm mặc định để tránh lỗi undefined trong layout
  res.locals.active = null;
  res.locals.title = res.locals.title || 'Hệ thống quản lý bệnh nhân';

  next();
}
