import { updateProfile, findUserById } from '../models/userModel.js';
import { listDoctors, getDoctorById } from '../models/doctorModel.js';
import { listSchedulesOfDoctor } from '../models/scheduleModel.js';
import { createAppointment, myAppointments } from '../models/appointmentModel.js';
import { myRecords } from '../models/recordModel.js';
import { appointmentCreateSchema } from '../validators/schemas.js';
import { pool, sql } from '../config/db.js';

// 🏠 Trang chính của bệnh nhân
export async function dashboard(req, res) {
  try {
    const doctors = await listDoctors();
    res.render('patient/dashboard', {
      layout: 'layout', // ✅ Layout riêng
      title: 'Trang bệnh nhân',
      doctors,
      active: 'dashboard'
    });
  } catch (err) {
    console.error('❌ Lỗi dashboard:', err);
    res.status(500).send('Không tải được trang bệnh nhân');
  }
}

// 👤 Hồ sơ cá nhân
export async function getProfile(req, res) {
  try {
    const user = req.session.user;
    res.render('patient/profile', {
      layout: 'layout',
      title: 'Hồ sơ cá nhân',
      user,
      active: 'profile'
    });
  } catch (err) {
    console.error('❌ Lỗi getProfile:', err);
    res.status(500).send('Không tải được hồ sơ');
  }
}

export async function postProfile(req, res) {
  try {
    await updateProfile(req.session.user.UserId, {
      FullName: req.body.FullName,
      Phone: req.body.Phone,
      Gender: req.body.Gender,
      DOB: req.body.DOB || null
    });

    const updated = await findUserById(req.session.user.UserId);
    req.session.user = updated;
    res.redirect('/patient/profile');
  } catch (err) {
    console.error('❌ Lỗi postProfile:', err);
    res.status(500).send('Lỗi cập nhật hồ sơ');
  }
}

// 👩‍⚕️ Danh sách bác sĩ
export async function listDoctorsPage(req, res) {
  try {
    const doctors = await listDoctors();
    res.render('patient/doctors', {
      layout: 'layout',
      title: 'Danh sách bác sĩ',
      doctors,
      active: 'appointments'
    });
  } catch (err) {
    console.error('❌ Lỗi listDoctorsPage:', err);
    res.status(500).send('Không tải được danh sách bác sĩ');
  }
}

// ⏰ Xem lịch làm việc của bác sĩ
export async function doctorSchedules(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const date = req.query.date || null;
    const doctor = await getDoctorById(id);
    const schedules = await listSchedulesOfDoctor(id, date);

    res.render('patient/doctor_schedules', {
      layout: 'layout',
      title: `Lịch của bác sĩ ${doctor.FullName}`,
      doctor,
      schedules,
      date,
      active: 'appointments'
    });
  } catch (err) {
    console.error('❌ Lỗi doctorSchedules:', err);
    res.status(500).send('Không tải được lịch của bác sĩ');
  }
}

// 🩹 Đặt lịch khám
export async function createAppt(req, res) {
  try {
    const { value, error } = appointmentCreateSchema.validate(req.body);
    if (error) return res.status(400).send(error.message);

    const userId = req.session.user.UserId;
    const { getPatientIdByUserId } = await import('../services/patientService.js');
    const patientId = await getPatientIdByUserId(userId);

    await createAppointment({
      patientId,
      doctorId: parseInt(value.doctorId, 10),
      scheduleId: parseInt(value.scheduleId, 10),
      reason: value.reason
    });

    res.redirect('/patient/appointments');
  } catch (err) {
    console.error('❌ Lỗi createAppt:', err);
    res.status(500).send('Không tạo được lịch hẹn');
  }
}

// 📋 Danh sách lịch hẹn
export async function listMyAppts(req, res) {
  try {
    const userId = req.session.user.UserId;
    const { getPatientIdByUserId } = await import('../services/patientService.js');
    const pid = await getPatientIdByUserId(userId);

    const appts = await myAppointments(pid);
    res.render('patient/appointments', {
      layout: 'layout',
      title: 'Lịch hẹn của tôi',
      appts,
      active: 'appointments'
    });
  } catch (err) {
    console.error('❌ Lỗi listMyAppts:', err);
    res.status(500).send('Không tải được lịch hẹn');
  }
}

// 🩺 Danh sách hồ sơ khám
export async function listMyRecords(req, res) {
  try {
    const { getPatientIdByUserId } = await import('../services/patientService.js');
    const pid = await getPatientIdByUserId(req.session.user.UserId);

    const records = await myRecords(pid);
    res.render('patient/records', {
      layout: 'layout',
      title: 'Hồ sơ khám',
      records,
      active: 'records'
    });
  } catch (err) {
    console.error('❌ Lỗi listMyRecords:', err);
    res.status(500).send('Không tải được hồ sơ khám');
  }
}

// 💊 Danh sách toa thuốc
export async function listPrescriptions(req, res) {
  try {
    const userId = req.session.user.UserId;

    const result = await pool.request()
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT 
          P.PrescriptionId,
          P.CreatedAt,
          D.FullName AS DoctorName,
          MR.Diagnosis,
          A.Status
        FROM Prescriptions P
        JOIN MedicalRecords MR ON P.RecordId = MR.RecordId
        JOIN Appointments A ON MR.AppointmentId = A.AppointmentId
        JOIN Users D ON MR.DoctorId = D.UserId
        WHERE A.PatientId = @UserId
        ORDER BY P.CreatedAt DESC
      `);

    res.render('patient/prescriptions', {
      layout: 'layout',
      title: 'Toa thuốc của tôi',
      prescriptions: result.recordset,
      active: 'prescriptions'
    });
  } catch (err) {
    console.error('❌ Lỗi listPrescriptions:', err);
    res.status(500).send('Không tải được danh sách toa thuốc');
  }
}

// 👁️ Xem chi tiết toa thuốc
export async function viewPrescription(req, res) {
  try {
    const presId = parseInt(req.params.id, 10);
    const userId = req.session.user.UserId;

    const result = await pool.request()
      .input('PrescriptionId', sql.Int, presId)
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT 
          PR.PrescriptionId,
          PR.RecordId,
          D.FullName AS DoctorName,
          A.ScheduleDate,
          A.Status
        FROM Prescriptions PR
        JOIN MedicalRecords MR ON PR.RecordId = MR.RecordId
        JOIN Appointments A ON MR.AppointmentId = A.AppointmentId
        JOIN Users D ON MR.DoctorId = D.UserId
        WHERE PR.PrescriptionId = @PrescriptionId AND A.PatientId = @UserId
      `);

    if (result.recordset.length === 0)
      return res.status(404).send('Không tìm thấy toa thuốc');

    const info = result.recordset[0];
    if (info.Status !== 'done')
      return res.status(403).send('Bạn chỉ có thể xem toa thuốc sau khi bác sĩ hoàn tất hồ sơ.');

    const items = await pool.request()
      .input('PrescriptionId', sql.Int, presId)
      .query(`SELECT * FROM PrescriptionItems WHERE PrescriptionId = @PrescriptionId`);

    res.render('patient/prescription_detail', {
      layout: 'layout',
      title: 'Chi tiết toa thuốc',
      info,
      items: items.recordset,
      active: 'prescriptions'
    });
  } catch (err) {
    console.error('❌ Lỗi viewPrescription:', err);
    res.status(500).send('Không tải được chi tiết toa thuốc');
  }
}
