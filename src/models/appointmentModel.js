import { pool, sql, poolConnect } from '../config/db.js';

export async function createAppointment({ patientId, doctorId, scheduleId, reason }) {
  await poolConnect;
  const req = pool.request();
  req.input('PatientId', sql.Int, patientId);
  req.input('DoctorId', sql.Int, doctorId);
  req.input('ScheduleId', sql.Int, scheduleId);
  req.input('Reason', sql.NVarChar, reason || null);
  const result = await req.query(`
    INSERT INTO Appointments(PatientId, DoctorId, ScheduleId, Reason, Status)
    OUTPUT INSERTED.*
    VALUES(@PatientId, @DoctorId, @ScheduleId, @Reason, 'pending')
  `);
  return result.recordset[0];
}

export async function myAppointments(patientId) {
  await poolConnect;
  const req = pool.request();
  req.input('PatientId', sql.Int, patientId);
  const result = await req.query(`
    SELECT a.*, u.FullName AS DoctorName, d.DoctorId
    FROM Appointments a
    JOIN Doctors d ON a.DoctorId=d.DoctorId
    JOIN Users u ON d.UserId=u.UserId
    WHERE a.PatientId=@PatientId
    ORDER BY a.BookedAt DESC
  `);
  return result.recordset;
}

export async function doctorAppointmentsByDate(doctorId, date) {
  await poolConnect;
  const req = pool.request();
  req.input('DoctorId', sql.Int, doctorId);
  req.input('WorkDate', sql.Date, date);
  const result = await req.query(`
    SELECT a.*, pu.FullName AS PatientName
    FROM Appointments a
    JOIN DoctorSchedules s ON a.ScheduleId=s.ScheduleId
    JOIN Patients p ON a.PatientId=p.PatientId
    JOIN Users pu ON p.UserId=pu.UserId
    WHERE a.DoctorId=@DoctorId AND s.WorkDate=@WorkDate
    ORDER BY s.SlotStart
  `);
  return result.recordset;
}
