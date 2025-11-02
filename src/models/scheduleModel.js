import { pool, sql, poolConnect } from '../config/db.js';

export async function listSchedulesOfDoctor(doctorId, date) {
  await poolConnect;
  const req = pool.request();
  req.input('DoctorId', sql.Int, doctorId);
  req.input('WorkDate', sql.Date, date);
  const result = await req.query(`
    SELECT * FROM DoctorSchedules
    WHERE DoctorId=@DoctorId AND WorkDate=@WorkDate
    ORDER BY SlotStart
  `);
  return result.recordset;
}

export async function doctorSchedulesInRange(doctorId, from, to) {
  await poolConnect;
  const req = pool.request();
  req.input('DoctorId', sql.Int, doctorId);
  req.input('From', sql.Date, from);
  req.input('To', sql.Date, to);
  const result = await req.query(`
    SELECT * FROM DoctorSchedules
    WHERE DoctorId=@DoctorId AND WorkDate BETWEEN @From AND @To
    ORDER BY WorkDate, SlotStart
  `);
  return result.recordset;
}
