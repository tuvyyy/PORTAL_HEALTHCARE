import { pool } from '../config/db.js';

// 🩺 Hiển thị form đặt lịch
export async function showAppointmentForm(req, res) {
  try {
    const doctors = (await pool.request()
      .query("SELECT UserId, FullName, Email FROM Users WHERE Role = 'doctor' AND Status='active'")).recordset;
    res.render('patient/book_appointment', { title: 'Đặt lịch khám', doctors });
  } catch (err) {
    console.error('❌ Lỗi showAppointmentForm:', err);
    res.status(500).send('Server error');
  }
}

// 🩹 Xử lý form đặt lịch
export async function createAppointment(req, res) {
  try {
    const { doctorId, date, reason } = req.body;
    const patientId = req.session.user.UserId;

    console.log('📅 [createAppointment]', { patientId, doctorId, date, reason });

    // Kiểm tra dữ liệu đầu vào
    if (!doctorId || !date || !reason) {
      console.warn('⚠️ Thiếu dữ liệu đầu vào khi đặt lịch');
      return res.status(400).send('Thiếu thông tin cần thiết để đặt lịch');
    }

    // Thêm lịch khám mới
    await pool.request()
      .input('PatientId', sql.Int, patientId)
      .input('DoctorId', sql.Int, doctorId)
      .input('ScheduleDate', sql.Date, date)
      .input('Reason', sql.NVarChar, reason)
      .input('Status', sql.NVarChar, 'pending')
      .query(`
        INSERT INTO Appointments (PatientId, DoctorId, ScheduleDate, Reason, Status, CreatedAt)
        VALUES (@PatientId, @DoctorId, @ScheduleDate, @Reason, @Status, GETDATE())
      `);

    console.log(`✅ [createAppointment] Đặt lịch thành công cho bác sĩ #${doctorId} — Ngày: ${date}`);

    res.redirect('/appointments/my');
  } catch (err) {
    console.error('❌ Lỗi createAppointment:', err);
    res.status(500).send('Không thể đặt lịch khám, vui lòng thử lại.');
  }
}


// 🧾 Danh sách lịch khám của bệnh nhân
export async function listMyAppointments(req, res) {
  try {
    const patientId = req.session.user.UserId;
    const result = await pool.request()
      .input('PatientId', patientId)
      .query(`
        SELECT A.AppointmentId, A.ScheduleDate, A.Reason, A.Status,
               D.FullName AS DoctorName
        FROM Appointments A
        JOIN Users D ON A.DoctorId = D.UserId
        WHERE A.PatientId = @PatientId
        ORDER BY A.CreatedAt DESC
      `);
    res.render('patient/my_appointments', {
      title: 'Lịch khám của tôi',
      appointments: result.recordset
    });
  } catch (err) {
    console.error('❌ Lỗi listMyAppointments:', err);
    res.status(500).send('Server error');
  }
}
