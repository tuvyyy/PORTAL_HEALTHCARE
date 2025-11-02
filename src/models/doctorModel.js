import { pool, sql, poolConnect } from '../config/db.js';

export async function listDoctors() {
  await poolConnect;
  const result = await pool.request().query(`
    SELECT d.DoctorId, u.FullName, u.Email, d.Specialty, d.Room, d.Level
    FROM Doctors d JOIN Users u ON d.UserId=u.UserId
    ORDER BY u.FullName
  `);
  return result.recordset;
}

export async function getDoctorById(id) {
  await poolConnect;
  const req = pool.request();
  req.input('DoctorId', sql.Int, id);
  const result = await req.query(`
    SELECT d.DoctorId, u.FullName, u.Email, d.Specialty, d.Room, d.Level
    FROM Doctors d JOIN Users u ON d.UserId=u.UserId
    WHERE d.DoctorId=@DoctorId
  `);
  return result.recordset[0] || null;
}
