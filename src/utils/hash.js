import bcrypt from 'bcryptjs';

export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hash) {
  if (!password || !hash) return false;
  try {
    const result = await bcrypt.compare(password, hash);
    console.log('🧩 So sánh bcrypt:', password, hash, '=>', result);
    return result;
  } catch (err) {
    console.error('⚠️ Lỗi bcrypt.compare:', err);
    return false;
  }
}
