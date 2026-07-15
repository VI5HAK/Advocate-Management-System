import bcrypt from "bcryptjs";

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}
