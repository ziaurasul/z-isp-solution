import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db, ensureTables } from '@/lib/db';

const COOKIE_NAME = 'biz_token';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getBusinessFromRequest() {
  await ensureTables();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const business = await db.business.findUnique({
    where: { id: token },
  });

  if (!business) {
    return null;
  }

  return business;
}

export { COOKIE_NAME };
