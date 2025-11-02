import { pool, sql, poolConnect } from '../config/db.js';

export async function findUserByEmail(email) {
  await poolConnect;
  const req = pool.request();
  req.input('Email', sql.NVarChar, email);
  const result = await req.query('SELECT TOP 1 * FROM Users WHERE Email=@Email');
  return result.recordset[0] || null;
}

export async function createPatientUser({ email, passwordHash, fullName }) {
  await poolConnect;
  const req = pool.request();
  req.input('Email', sql.NVarChar, email);
  req.input('PasswordHash', sql.NVarChar, passwordHash);
  req.input('FullName', sql.NVarChar, fullName);
  const result = await req.query(`
    INSERT INTO Users(Email, PasswordHash, FullName, Role)
    OUTPUT INSERTED.*
    VALUES(@Email, @PasswordHash, @FullName, 'patient')
  `);
  const user = result.recordset[0];
  const req2 = pool.request();
  req2.input('UserId', sql.Int, user.UserId);
  await req2.query('INSERT INTO Patients(UserId) VALUES(@UserId)');
  return user;
}

export async function findUserById(id) {
  await poolConnect;
  const req = pool.request();
  req.input('UserId', sql.Int, id);
  const result = await req.query('SELECT * FROM Users WHERE UserId=@UserId');
  return result.recordset[0] || null;
}

export async function updateProfile(userId, { FullName, Phone, Gender, DOB }) {
  await poolConnect;
  const req = pool.request();
  req.input('UserId', sql.Int, userId);
  req.input('FullName', sql.NVarChar, FullName || null);
  req.input('Phone', sql.NVarChar, Phone || null);
  req.input('Gender', sql.NVarChar, Gender || null);
  req.input('DOB', sql.Date, DOB || null);
  await req.query(`
    UPDATE Users SET FullName=@FullName, Phone=@Phone, Gender=@Gender, DOB=@DOB, UpdatedAt=SYSUTCDATETIME()
    WHERE UserId=@UserId
  `);
}
