import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const accounts = await db.bankAccount.findMany({
      where: { businessId: business.id },
      orderBy: { isDefault: 'desc' },
    });
    return NextResponse.json({ data: accounts });
  } catch (error) {
    console.error('BankAccounts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { bankName, accountTitle, accountNumber, branch, type, isDefault } = await req.json();
    if (!bankName || !accountTitle || !accountNumber) {
      return NextResponse.json({ error: 'Bank name, account title, and number are required' }, { status: 400 });
    }
    if (isDefault) {
      await db.bankAccount.updateMany({ where: { businessId: business.id, isDefault: true }, data: { isDefault: false } });
    }
    const account = await db.bankAccount.create({
      data: { businessId: business.id, bankName, accountTitle, accountNumber, branch: branch || null, type: type || 'current', isDefault: !!isDefault },
    });
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('BankAccounts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}