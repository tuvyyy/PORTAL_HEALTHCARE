import { pool, sql, poolConnect } from '../config/db.js';

export async function getPatientIdByUserId(userId) {
  await poolConnect;
  const req = pool.request();
  req.input('UserId', sql.Int, userId);
  const result = await req.query('SELECT PatientId FROM Patients WHERE UserId=@UserId');
  const row = result.recordset[0];
  return row ? row.PatientId : null;
}

export async function getDoctorIdByUserId(userId) {
  await poolConnect;
  const req = pool.request();
  req.input('UserId', sql.Int, userId);
  const result = await req.query('SELECT DoctorId FROM Doctors WHERE UserId=@UserId');
  const row = result.recordset[0];
  return row ? row.DoctorId : null;
}
