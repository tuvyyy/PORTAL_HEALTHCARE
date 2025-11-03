import { pool, sql } from '../config/db.js';

// 🩹 Tạo lịch hẹn mới
export async function createAppointment({ patientId, doctorId, scheduleId, reason }) {
  try {
    // Đảm bảo kết nối
    await pool.connect();

    const req = pool.request();
    req.input('PatientId', sql.Int, patientId);
    req.input('DoctorId', sql.Int, doctorId);
    req.input('ScheduleId', sql.Int, scheduleId);
    req.input('Reason', sql.NVarChar, reason || null);

    const result = await req.query(`
      INSERT INTO Appointments (PatientId, DoctorId, ScheduleId, Reason, Status, BookedAt)
      OUTPUT INSERTED.*
      VALUES (@PatientId, @DoctorId, @ScheduleId, @Reason, 'pending', GETDATE())
    `);

    return result.recordset[0];
  } catch (err) {
    console.error('❌ [createAppointment] Lỗi tạo lịch hẹn:', err);
    throw err;
  }
}

// 📋 Danh sách lịch hẹn của bệnh nhân
export async function myAppointments(patientId) {
  try {
    await pool.connect();

    const req = pool.request();
    req.input('PatientId', sql.Int, patientId);

    const result = await req.query(`
      SELECT a.*, u.FullName AS DoctorName, d.DoctorId
      FROM Appointments a
      JOIN Doctors d ON a.DoctorId = d.DoctorId
      JOIN Users u ON d.UserId = u.UserId
      WHERE a.PatientId = @PatientId
      ORDER BY a.BookedAt DESC
    `);

    return result.recordset;
  } catch (err) {
    console.error('❌ [myAppointments] Lỗi lấy danh sách lịch hẹn:', err);
    throw err;
  }
}

// 🩺 Danh sách lịch hẹn theo ngày của bác sĩ
export async function doctorAppointmentsByDate(doctorId, date) {
  try {
    await pool.connect();

    const req = pool.request();
    req.input('DoctorId', sql.Int, doctorId);
    req.input('WorkDate', sql.Date, date);

    const result = await req.query(`
      SELECT a.*, pu.FullName AS PatientName
      FROM Appointments a
      JOIN DoctorSchedules s ON a.ScheduleId = s.ScheduleId
      JOIN Patients p ON a.PatientId = p.PatientId
      JOIN Users pu ON p.UserId = pu.UserId
      WHERE a.DoctorId = @DoctorId AND s.WorkDate = @WorkDate
      ORDER BY s.SlotStart
    `);

    return result.recordset;
  } catch (err) {
    console.error('❌ [doctorAppointmentsByDate] Lỗi lấy lịch hẹn bác sĩ:', err);
    throw err;
  }
}
