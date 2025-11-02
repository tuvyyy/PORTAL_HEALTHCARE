import { pool, sql, poolConnect } from '../config/db.js';

export async function createMedicalRecord({ appointmentId, doctorId, summary, diagnosis, note }) {
  await poolConnect;
  const req = pool.request();
  req.input('AppointmentId', sql.Int, appointmentId);
  req.input('DoctorId', sql.Int, doctorId);
  req.input('Summary', sql.NVarChar, summary || null);
  req.input('Diagnosis', sql.NVarChar, diagnosis || null);
  req.input('Note', sql.NVarChar, note || null);
  const result = await req.query(`
    INSERT INTO MedicalRecords(AppointmentId, DoctorId, Summary, Diagnosis, Note)
    OUTPUT INSERTED.*
    VALUES(@AppointmentId, @DoctorId, @Summary, @Diagnosis, @Note)
  `);
  return result.recordset[0];
}

export async function myRecords(patientId) {
  await poolConnect;
  const req = pool.request();
  req.input('PatientId', sql.Int, patientId);
  const result = await req.query(`
    SELECT r.*, du.FullName AS DoctorName
    FROM MedicalRecords r
    JOIN Appointments a ON r.AppointmentId=a.AppointmentId
    JOIN Doctors d ON a.DoctorId=d.DoctorId
    JOIN Users du ON d.UserId=du.UserId
    WHERE a.PatientId=@PatientId
    ORDER BY r.CreatedAt DESC
  `);
  return result.recordset;
}
