import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  server: process.env.DB_SERVER || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'PatientDoctorPortal',
  options: {
    encrypt: (process.env.DB_ENCRYPT || 'false').toLowerCase() === 'true'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

export const pool = new sql.ConnectionPool(config);
export const poolConnect = pool.connect()
  .then(() => console.log('[mssql] Connected'))
  .catch(err => console.error('[mssql] Connection error', err));

export { sql };
