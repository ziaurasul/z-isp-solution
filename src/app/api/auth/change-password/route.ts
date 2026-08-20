import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessFromRequest, comparePassword, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Current password and new password (min 6 chars) required' }, { status: 400 });
    }

    const isMatch = await comparePassword(currentPassword, business.password);
    if (!isMatch) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });

    const hashed = await hashPassword(newPassword);
    await db.business.update({ where: { id: business.id }, data: { password: hashed } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
