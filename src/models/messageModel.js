import { pool, sql, poolConnect } from '../config/db.js';

export async function ensureThread(patientId, doctorId) {
  await poolConnect;
  const req = pool.request();
  req.input('PatientId', sql.Int, patientId);
  req.input('DoctorId', sql.Int, doctorId);
  const check = await req.query(`SELECT TOP 1 * FROM MessageThreads WHERE PatientId=@PatientId AND DoctorId=@DoctorId`);
  if (check.recordset[0]) return check.recordset[0];
  const ins = await req.query(`
    INSERT INTO MessageThreads(PatientId, DoctorId)
    OUTPUT INSERTED.*
    VALUES(@PatientId, @DoctorId)
  `);
  return ins.recordset[0];
}

export async function listThreadsByUser(user) {
  await poolConnect;
  if (user.Role === 'patient') {
    const req = pool.request();
    req.input('UserId', sql.Int, user.UserId);
    const result = await req.query(`
      SELECT t.*, du.FullName AS DoctorName
      FROM MessageThreads t
      JOIN Patients p ON t.PatientId=p.PatientId
      JOIN Users pu ON p.UserId=pu.UserId
      JOIN Doctors d ON t.DoctorId=d.DoctorId
      JOIN Users du ON d.UserId=du.UserId
      WHERE pu.UserId=@UserId
      ORDER BY t.LastMsgAt DESC
    `);
    return result.recordset;
  } else if (user.Role === 'doctor') {
    const req = pool.request();
    req.input('UserId', sql.Int, user.UserId);
    const result = await req.query(`
      SELECT t.*, pu.FullName AS PatientName
      FROM MessageThreads t
      JOIN Doctors d ON t.DoctorId=d.DoctorId
      JOIN Users du ON d.UserId=du.UserId
      JOIN Patients p ON t.PatientId=p.PatientId
      JOIN Users pu ON p.UserId=pu.UserId
      WHERE du.UserId=@UserId
      ORDER BY t.LastMsgAt DESC
    `);
    return result.recordset;
  }
  return [];
}

export async function listMessages(threadId) {
  await poolConnect;
  const req = pool.request();
  req.input('ThreadId', sql.Int, threadId);
  const result = await req.query(`
    SELECT m.*, fu.FullName AS FromName, tu.FullName AS ToName
    FROM Messages m
    JOIN Users fu ON m.FromUserId=fu.UserId
    JOIN Users tu ON m.ToUserId=tu.UserId
    WHERE m.ThreadId=@ThreadId
    ORDER BY m.CreatedAt ASC
  `);
  return result.recordset;
}

export async function sendMessage({ threadId, fromUserId, toUserId, content }) {
  await poolConnect;
  const req = pool.request();
  req.input('ThreadId', sql.Int, threadId);
  req.input('FromUserId', sql.Int, fromUserId);
  req.input('ToUserId', sql.Int, toUserId);
  req.input('Content', sql.NVarChar, content);
  const result = await req.query(`
    INSERT INTO Messages(ThreadId, FromUserId, ToUserId, Content)
    OUTPUT INSERTED.*
    VALUES(@ThreadId, @FromUserId, @ToUserId, @Content);
    UPDATE MessageThreads SET LastMsgAt=SYSUTCDATETIME() WHERE ThreadId=@ThreadId;
  `);
  return result.recordset[0];
}
