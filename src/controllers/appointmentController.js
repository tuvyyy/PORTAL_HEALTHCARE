import { pool, sql } from '../config/db.js'; // ✅ thêm sql ở đây

// 🩺 Hiển thị form đặt lịch
export async function showAppointmentForm(req, res) {
  try {
    const doctorsResult = await pool.request()
      .query(`
        SELECT UserId, FullName, Email
        FROM Users
        WHERE Role = 'doctor' AND Status = 'active'
      `);

    const doctors = doctorsResult.recordset;

    res.render('patient/book_appointment', {
      title: 'Đặt lịch khám',
      doctors
    });
  } catch (err) {
    console.error('❌ [showAppointmentForm] Lỗi tải danh sách bác sĩ:', err);
    res.status(500).send('Lỗi máy chủ khi tải form đặt lịch.');
  }
}

// 🩹 Xử lý form đặt lịch
export async function createAppointment(req, res) {
  try {
    const { doctorId, date, reason } = req.body;
    const patientId = req.session.user?.UserId;

    console.log('📅 [createAppointment]', { patientId, doctorId, date, reason });

    // Kiểm tra dữ liệu đầu vào
    if (!doctorId || !date || !reason) {
      console.warn('⚠️ Thiếu dữ liệu đầu vào khi đặt lịch');
      return res.status(400).send('Thiếu thông tin cần thiết để đặt lịch.');
    }

    // Ghi dữ liệu lịch hẹn mới
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
    console.error('❌ [createAppointment] Lỗi đặt lịch:', err);
    res.status(500).send('Không thể đặt lịch khám, vui lòng thử lại.');
  }
}

// 🧾 Danh sách lịch khám của bệnh nhân
export async function listMyAppointments(req, res) {
  try {
    const patientId = req.session.user?.UserId;

    const result = await pool.request()
      .input('PatientId', sql.Int, patientId)
      .query(`
        SELECT 
          A.AppointmentId, 
          A.ScheduleDate, 
          A.Reason, 
          A.Status,
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
    console.error('❌ [listMyAppointments] Lỗi lấy danh sách:', err);
    res.status(500).send('Không thể tải danh sách lịch hẹn.');
  }
}
