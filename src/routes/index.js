import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import * as auth from '../controllers/authController.js';
import * as patient from '../controllers/patientController.js';
import * as doctor from '../controllers/doctorController.js';
import * as msg from '../controllers/messageController.js';
import appointmentRoutes from './appointmentRoutes.js';
import { pool } from '../config/db.js';

const router = Router();

// -------------------- AUTH --------------------
router.get('/login', auth.showLogin);
router.post('/login', auth.login);
router.get('/register', auth.showRegister);
router.post('/register', auth.register);
router.post('/logout', auth.logout);

// -------------------- HOME REDIRECT --------------------
router.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const role = req.session.user.Role?.toLowerCase();
  if (role === 'doctor') return res.redirect('/doctor');
  if (role === 'patient') return res.redirect('/patient');
  return res.redirect('/login');
});

// ======================================================
// 🧍 PATIENT ROUTES
// ======================================================
router.get('/patient', requireAuth, requireRole('patient'), patient.dashboard);
router.get('/patient/profile', requireAuth, requireRole('patient'), patient.getProfile);
router.post('/patient/profile', requireAuth, requireRole('patient'), patient.postProfile);

router.get('/patient/doctors', requireAuth, requireRole('patient'), patient.listDoctorsPage);
router.get('/patient/doctors/:id/schedules', requireAuth, requireRole('patient'), patient.doctorSchedules);
router.post('/patient/appointments', requireAuth, requireRole('patient'), patient.createAppt);
router.get('/patient/appointments', requireAuth, requireRole('patient'), patient.listMyAppts);
router.get('/patient/records', requireAuth, requireRole('patient'), patient.listMyRecords);
router.get('/patient/prescriptions', requireAuth, requireRole('patient'), patient.listPrescriptions);
router.get('/patient/prescriptions/:id', requireAuth, requireRole('patient'), patient.viewPrescription);

// ======================================================
// 👨‍⚕️ DOCTOR DASHBOARD + CÁC TRANG CHÍNH
// ======================================================

// Trang chính bác sĩ (dashboard)
router.get(
  '/doctor',
  requireAuth,
  requireRole('doctor'),
  doctor.doctorDashboard
);

router.get(
  '/doctor/dashboard',
  requireAuth,
  requireRole('doctor'),
  doctor.doctorDashboard
);

// Trang hồ sơ bác sĩ
router.get(
  '/doctor/profile',
  requireAuth,
  requireRole('doctor'),
  (req, res) => {
    res.render('doctor/profile', {
      layout: 'doctor/layout',
      title: 'Hồ sơ bác sĩ',
      currentUser: req.session.user,
      active: 'profile',
    });
  }
);

// Trang lịch khám
router.get(
  '/doctor/schedule',
  requireAuth,
  requireRole('doctor'),
  (req, res) => {
    res.render('doctor/schedule', {
      layout: 'doctor/layout',
      title: 'Lịch khám',
      currentUser: req.session.user,
      active: 'schedule',
    });
  }
);

// Trang đơn thuốc
router.get(
  '/doctor/prescriptions',
  requireAuth,
  requireRole('doctor'),
  (req, res) => {
    res.render('doctor/prescriptions', {
      layout: 'doctor/layout',
      title: 'Đơn thuốc',
      currentUser: req.session.user,
      active: 'prescriptions',
    });
  }
);

// ======================================================
// 🗓️ LỊCH KHÁM & HỒ SƠ KHÁM
// ======================================================

// Lịch hẹn hôm nay
router.get(
  '/doctor/appointments',
  requireAuth,
  requireRole('doctor'),
  doctor.doctorAppointmentsToday
);

// Ghi hồ sơ mới (form trống)
router.get(
  '/doctor/record/new',
  requireAuth,
  requireRole('doctor'),
  (req, res) => {
    const { appointmentId, date } = req.query;
    res.render('doctor/record_form', {
      layout: 'doctor/layout',
      title: 'Ghi hồ sơ khám',
      appointmentId,
      date,
      active: 'records',
    });
  }
);

// Thêm hồ sơ mới
router.post(
  '/doctor/records',
  requireAuth,
  requireRole('doctor'),
  doctor.postRecord
);

// Hoàn thành hồ sơ khám
router.post(
  '/doctor/record/complete',
  requireAuth,
  requireRole('doctor'),
  doctor.completeRecord
);

// Sửa hồ sơ
router.get(
  '/doctor/record/edit/:id',
  requireAuth,
  requireRole('doctor'),
  doctor.editRecordForm
);
router.post(
  '/doctor/record/edit/:id',
  requireAuth,
  requireRole('doctor'),
  doctor.updateRecord
);

// ======================================================
// 💊 KÊ TOA THUỐC
// ======================================================

// Form kê toa (load dữ liệu cũ nếu có)
router.get(
  '/doctor/prescription/new',
  requireAuth,
  requireRole('doctor'),
  async (req, res) => {
    try {
      const { recordId, date } = req.query;

      const pres = await pool
        .request()
        .input('RecordId', recordId)
        .query(`
          SELECT TOP 1 PrescriptionId, CreatedAt
          FROM Prescriptions
          WHERE RecordId = @RecordId
          ORDER BY CreatedAt DESC
        `);

      let prescriptionId = null;
      let items = [];

      if (pres.recordset.length > 0) {
        prescriptionId = pres.recordset[0].PrescriptionId;
        const itemResult = await pool
          .request()
          .input('PrescriptionId', prescriptionId)
          .query(
            `SELECT * FROM PrescriptionItems WHERE PrescriptionId = @PrescriptionId`
          );
        items = itemResult.recordset;
      }

      res.render('doctor/prescription_form', {
        layout: 'doctor/layout',
        title: 'Kê toa thuốc',
        recordId,
        date,
        prescriptionId,
        items,
        active: 'prescriptions',
      });
    } catch (err) {
      console.error('❌ Lỗi load form kê toa:', err);
      res.status(500).send('Không tải được toa thuốc');
    }
  }
);

// Gửi dữ liệu kê toa (POST)
router.post(
  '/doctor/prescriptions',
  requireAuth,
  requireRole('doctor'),
  doctor.postPrescription
);

// ======================================================
// 💬 MESSAGES ROUTES
// ======================================================
router.get('/messages', requireAuth, msg.threadsPage);
router.post('/messages/open', requireAuth, msg.openThread);
router.get('/messages/:id', requireAuth, msg.messagesPage);
router.post('/messages/:id', requireAuth, msg.postMessage);

// ======================================================
// 📅 APPOINTMENT MODULE
// ======================================================
router.use('/appointments', requireAuth, appointmentRoutes);

export default router;
