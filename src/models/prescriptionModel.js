import { pool, sql, poolConnect } from '../config/db.js';

export async function createPrescription({ recordId, doctorId }) {
  await poolConnect;
  const req = pool.request();
  req.input('RecordId', sql.Int, recordId);
  req.input('DoctorId', sql.Int, doctorId);
  const result = await req.query(`
    INSERT INTO Prescriptions(RecordId, DoctorId)
    OUTPUT INSERTED.*
    VALUES(@RecordId, @DoctorId)
  `);
  return result.recordset[0];
}

export async function addPrescriptionItem({ prescriptionId, drugName, dosage, frequency, days, note }) {
  await poolConnect;
  const req = pool.request();
  req.input('PrescriptionId', sql.Int, prescriptionId);
  req.input('DrugName', sql.NVarChar, drugName);
  req.input('Dosage', sql.NVarChar, dosage);
  req.input('Frequency', sql.NVarChar, frequency);
  req.input('Days', sql.Int, days || 1);
  req.input('Note', sql.NVarChar, note || null);
  const result = await req.query(`
    INSERT INTO PrescriptionItems(PrescriptionId, DrugName, Dosage, Frequency, Days, Note)
    OUTPUT INSERTED.*
    VALUES(@PrescriptionId, @DrugName, @Dosage, @Frequency, @Days, @Note)
  `);
  return result.recordset[0];
}

export async function myPrescriptions(patientId) {
  await poolConnect;
  const req = pool.request();
  req.input('PatientId', sql.Int, patientId);
  const result = await req.query(`
    SELECT pr.*, r.RecordId, a.AppointmentId, du.FullName AS DoctorName
    FROM Prescriptions pr
    JOIN MedicalRecords r ON pr.RecordId=r.RecordId
    JOIN Appointments a ON r.AppointmentId=a.AppointmentId
    JOIN Doctors d ON pr.DoctorId=d.DoctorId
    JOIN Users du ON d.UserId=du.UserId
    WHERE a.PatientId=@PatientId
    ORDER BY pr.CreatedAt DESC
  `);
  return result.recordset;
}
