import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessFromRequest } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    if (body.isDefault) {
      await db.bankAccount.updateMany({ where: { businessId: business.id, isDefault: true }, data: { isDefault: false } });
    }
    const updated = await db.bankAccount.update({ where: { id }, data: body });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('BankAccount PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    await db.bankAccount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('BankAccount DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}