import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.trim() === '') throw new Error('JWT_SECRET is missing. Set it in havenia-api/.env');
  return s;
}

const SECRET = getJwtSecret();
// 7 days in seconds
const EXPIRES_IN_SECONDS = Number(process.env.JWT_EXPIRES_IN) || 60 * 60 * 24 * 7;

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signJwt(payload: object): string {
  const options: SignOptions = { expiresIn: EXPIRES_IN_SECONDS };
  return jwt.sign(payload, SECRET, options);
}

export function verifyJwt<T = JwtPayload | string>(token: string): T {
  return jwt.verify(token, SECRET) as T;
}