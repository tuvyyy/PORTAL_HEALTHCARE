import { pool, sql } from '../config/db.js';
import dayjs from 'dayjs';

// 🩺 Trang dashboard bác sĩ (hiển thị lịch hôm nay)
export async function doctorDashboard(req, res) {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const doctorId = req.session.user.UserId;

    const result = await pool.request()
      .input('DoctorId', sql.Int, doctorId)
      .input('Today', sql.Date, today)
      .query(`
        SELECT 
          A.AppointmentId,
          A.ScheduleDate,
          A.Reason,
          A.Status,
          P.FullName AS PatientName,
          P.Email AS PatientEmail
        FROM Appointments A
        JOIN Users P ON A.PatientId = P.UserId
        WHERE A.DoctorId = @DoctorId
          AND CONVERT(DATE, A.ScheduleDate) = CONVERT(DATE, @Today)
        ORDER BY A.ScheduleDate DESC
      `);

    res.render('doctor/dashboard', {
      layout: 'doctor/layout',
      title: 'Trang bác sĩ',
      today,
      appointments: result.recordset,
      active: 'dashboard'
    });
  } catch (err) {
    console.error('❌ Lỗi doctorDashboard:', err);
    res.status(500).send('Không tải được trang bác sĩ');
  }
}

// 📋 Danh sách lịch khám (lọc theo ngày / hôm nay / tất cả)
export async function doctorAppointmentsToday(req, res) {
  try {
    const filter = req.query.filter || 'today';
    const doctorId = req.session.user.UserId;

    let query = `
      SELECT 
        A.AppointmentId,
        A.ScheduleDate,
        A.Reason,
        A.Status,
        P.FullName AS PatientName,
        P.Email AS PatientEmail,
        MR.RecordId
      FROM Appointments A
      JOIN Users P ON A.PatientId = P.UserId
      LEFT JOIN MedicalRecords MR ON A.AppointmentId = MR.AppointmentId
      WHERE A.DoctorId = @DoctorId
    `;

    const request = pool.request().input('DoctorId', sql.Int, doctorId);

    if (filter === 'date' && req.query.date) {
      request.input('Date', sql.Date, req.query.date);
      query += ' AND CONVERT(DATE, A.ScheduleDate) = CONVERT(DATE, @Date)';
    } else if (filter === 'today') {
      const today = dayjs().format('YYYY-MM-DD');
      request.input('Today', sql.Date, today);
      query += ' AND CONVERT(DATE, A.ScheduleDate) = CONVERT(DATE, @Today)';
    }

    query += ' ORDER BY A.ScheduleDate DESC';
    const result = await request.query(query);

    res.render('doctor/appointments', {
      layout: 'doctor/layout',
      title: 'Danh sách lịch khám',
      filter,
      date: req.query.date || '',
      appointments: result.recordset,
      active: 'appointments'
    });
  } catch (err) {
    console.error('❌ Lỗi doctorAppointmentsToday:', err);
    res.status(500).send('Không tải được danh sách lịch khám');
  }
}

// 🧍 Danh sách bệnh nhân từng khám
export async function doctorPatients(req, res) {
  try {
    const doctorId = req.session.user.UserId;
    const result = await pool.request()
      .input('DoctorId', sql.Int, doctorId)
      .query(`
        SELECT DISTINCT 
          U.UserId,
          U.FullName,
          U.Email,
          U.Phone
        FROM Appointments A
        JOIN Users U ON A.PatientId = U.UserId
        WHERE A.DoctorId = @DoctorId
        ORDER BY U.FullName
      `);

    res.render('doctor/patients', {
      layout: 'doctor/layout',
      title: 'Bệnh nhân của tôi',
      patients: result.recordset,
      active: 'patients'
    });
  } catch (err) {
    console.error('❌ Lỗi doctorPatients:', err);
    res.status(500).send('Không tải được danh sách bệnh nhân');
  }
}

// 📋 Hồ sơ khám đã lập của bác sĩ
export async function doctorRecords(req, res) {
  try {
    const doctorId = req.session.user.UserId;
    const result = await pool.request()
      .input('DoctorId', sql.Int, doctorId)
      .query(`
        SELECT 
          MR.RecordId,
          MR.Summary,
          MR.Diagnosis,
          MR.CreatedAt,
          U.FullName AS PatientName,
          A.ScheduleDate
        FROM MedicalRecords MR
        JOIN Appointments A ON MR.AppointmentId = A.AppointmentId
        JOIN Users U ON A.PatientId = U.UserId
        WHERE MR.DoctorId = @DoctorId
        ORDER BY MR.CreatedAt DESC
      `);

    res.render('doctor/records', {
      layout: 'doctor/layout',
      title: 'Hồ sơ khám của tôi',
      records: result.recordset,
      active: 'records'
    });
  } catch (err) {
    console.error('❌ Lỗi doctorRecords:', err);
    res.status(500).send('Không tải được hồ sơ khám');
  }
}

// 🧾 Bác sĩ ghi hồ sơ khám (tạo mới)
export async function postRecord(req, res) {
  try {
    const doctorId = req.session.user.UserId;
    const { appointmentId, summary, diagnosis, note, date } = req.body;

    const check = await pool.request()
      .input('AppointmentId', sql.Int, appointmentId)
      .query('SELECT TOP 1 RecordId FROM MedicalRecords WHERE AppointmentId = @AppointmentId');

    if (check.recordset.length > 0) {
      const existingRecordId = check.recordset[0].RecordId;
      return res.redirect(`/doctor/prescription/new?recordId=${existingRecordId}&date=${date || ''}`);
    }

    const result = await pool.request()
      .input('AppointmentId', sql.Int, appointmentId)
      .input('DoctorId', sql.Int, doctorId)
      .input('Summary', sql.NVarChar, summary)
      .input('Diagnosis', sql.NVarChar, diagnosis)
      .input('Note', sql.NVarChar, note)
      .query(`
        INSERT INTO MedicalRecords (AppointmentId, DoctorId, Summary, Diagnosis, Note, CreatedAt)
        OUTPUT INSERTED.RecordId
        VALUES (@AppointmentId, @DoctorId, @Summary, @Diagnosis, @Note, GETDATE())
      `);

    const newRecordId = result.recordset[0].RecordId;
    res.redirect(`/doctor/record/edit/${newRecordId}`);
  } catch (err) {
    console.error('❌ Lỗi postRecord:', err);
    res.status(500).send('Không tạo được hồ sơ khám');
  }
}

// ✅ Hoàn thành hồ sơ
export async function completeRecord(req, res) {
  try {
    const { recordId } = req.body;
    const record = await pool.request()
      .input('RecordId', sql.Int, recordId)
      .query(`SELECT AppointmentId FROM MedicalRecords WHERE RecordId = @RecordId`);

    if (record.recordset.length === 0)
      return res.status(404).send('Không tìm thấy hồ sơ');

    const appointmentId = record.recordset[0].AppointmentId;

    await pool.request()
      .input('AppointmentId', sql.Int, appointmentId)
      .query(`UPDATE Appointments SET Status = 'done' WHERE AppointmentId = @AppointmentId`);

    res.redirect('/doctor/appointments');
  } catch (err) {
    console.error('❌ Lỗi completeRecord:', err);
    res.status(500).send('Không thể hoàn thành hồ sơ');
  }
}

// ✏️ Form chỉnh sửa hồ sơ
export async function editRecordForm(req, res) {
  try {
    const recordId = req.params.id;
    const result = await pool.request()
      .input('RecordId', sql.Int, recordId)
      .query(`
        SELECT MR.RecordId, MR.Summary, MR.Diagnosis, MR.Note, A.ScheduleDate, U.FullName AS PatientName
        FROM MedicalRecords MR
        JOIN Appointments A ON MR.AppointmentId = A.AppointmentId
        JOIN Users U ON A.PatientId = U.UserId
        WHERE MR.RecordId = @RecordId
      `);

    if (result.recordset.length === 0)
      return res.status(404).send('Không tìm thấy hồ sơ');

    res.render('doctor/edit_record', {
      layout: 'doctor/layout',
      title: 'Sửa hồ sơ khám',
      record: result.recordset[0],
      active: 'records'
    });
  } catch (err) {
    console.error('❌ Lỗi editRecordForm:', err);
    res.status(500).send('Không tải được hồ sơ khám');
  }
}

// 💾 Cập nhật hồ sơ
export async function updateRecord(req, res) {
  try {
    const recordId = req.body.recordId || req.params.id;
    const { summary, diagnosis, note, date } = req.body;

    await pool.request()
      .input('RecordId', sql.Int, recordId)
      .input('Summary', sql.NVarChar, summary)
      .input('Diagnosis', sql.NVarChar, diagnosis)
      .input('Note', sql.NVarChar, note)
      .query(`
        UPDATE MedicalRecords
        SET Summary = @Summary,
            Diagnosis = @Diagnosis,
            Note = @Note,
            UpdatedAt = GETDATE()
        WHERE RecordId = @RecordId
      `);

    if (date)
      res.redirect(`/doctor/prescription/new?recordId=${recordId}&date=${date}`);
    else
      res.redirect('/doctor/appointments');
  } catch (err) {
    console.error('❌ Lỗi updateRecord:', err);
    res.status(500).send('Không thể cập nhật hồ sơ');
  }
}

// 💊 Kê toa thuốc
export async function postPrescription(req, res) {
  try {
    const doctorId = req.session.user.UserId;
    const { recordId, date, items, prescriptionId } = req.body;
    let currentPresId = prescriptionId;

    if (currentPresId) {
      await pool.request()
        .input('PrescriptionId', sql.Int, currentPresId)
        .query(`DELETE FROM PrescriptionItems WHERE PrescriptionId = @PrescriptionId`);
    } else {
      const insertPrescription = await pool.request()
        .input('RecordId', sql.Int, recordId)
        .input('DoctorId', sql.Int, doctorId)
        .query(`
          INSERT INTO Prescriptions (RecordId, DoctorId, CreatedAt)
          OUTPUT INSERTED.PrescriptionId
          VALUES (@RecordId, @DoctorId, GETDATE())
        `);
      currentPresId = insertPrescription.recordset[0].PrescriptionId;
    }

    if (items && Array.isArray(items)) {
      for (const it of items) {
        const drugName = String(it.drugName?.text || it.drugName || '').trim();
        const dosage = String(it.dosage || '').trim();
        const frequency = String(it.frequency || '').trim();
        const note = it.note ? String(it.note).trim() : null;
        const days = parseInt(it.days || '1', 10);
        if (!drugName) continue;

        await pool.request()
          .input('PrescriptionId', sql.Int, currentPresId)
          .input('DrugName', sql.NVarChar, drugName)
          .input('Dosage', sql.NVarChar, dosage)
          .input('Frequency', sql.NVarChar, frequency)
          .input('Days', sql.Int, days)
          .input('Note', sql.NVarChar, note)
          .query(`
            INSERT INTO PrescriptionItems (PrescriptionId, DrugName, Dosage, Frequency, Days, Note)
            VALUES (@PrescriptionId, @DrugName, @Dosage, @Frequency, @Days, @Note)
          `);
      }
    }

    console.log(`✅ Đã lưu toa thuốc #${currentPresId} cho Record ${recordId}`);
    res.redirect('/doctor/appointments' + (date ? `?date=${date}` : ''));
  } catch (err) {
    console.error('❌ Lỗi postPrescription:', err);
    res.status(500).send('Không tạo được toa thuốc');
  }
}
