import { NextRequest, NextResponse } from 'next/server';
import { getBusinessFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureTables } from '@/lib/db';

export async function POST(req: NextRequest) {
  await ensureTables();
  const business = await getBusinessFromRequest();
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // customers, connections, expenses

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
    if (!['customers', 'connections', 'expenses'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Use customers, connections, or expenses' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop()?.toLowerCase();
    let rows: Record<string, string>[] = [];

    if (ext === 'csv') {
      const text = buffer.toString('utf-8');
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return NextResponse.json({ error: 'Empty CSV' }, { status: 400 });
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      for (let i = 1; i < lines.length && i <= 500; i++) {
        const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
        rows.push(row);
      }
    } else {
      // Excel - use xlsx
      const XLSX = await import('xlsx');
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { raw: false });
      rows = rows.slice(0, 500);
    }

    let created = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header)
      try {
        if (type === 'customers') {
          if (!row.name || !row.phone) { errors.push({ row: rowNum, error: 'Name and phone required' }); continue; }
          await db.customer.create({
            data: { businessId: business.id, name: row.name, phone: row.phone, email: row.email || null, address: row.address || null, cnic: row.cnic || null, status: row.status || 'active' },
          });
          created++;
        } else if (type === 'connections') {
          if (!row.customerPhone) { errors.push({ row: rowNum, error: 'customerPhone required' }); continue; }
          const cust = await db.customer.findFirst({ where: { businessId: business.id, phone: row.customerPhone } });
          if (!cust) { errors.push({ row: rowNum, error: `Customer not found: ${row.customerPhone}` }); continue; }
          await db.connection.create({
            data: { businessId: business.id, customerId: cust.id, packageType: row.packageType || 'internet', packageName: row.packageName || null, speed: row.speed || null, monthlyFee: parseFloat(row.monthlyFee) || 0, status: row.status || 'active', expiresAt: row.expiresAt ? new Date(row.expiresAt) : null },
          });
          created++;
        } else if (type === 'expenses') {
          if (!row.amount) { errors.push({ row: rowNum, error: 'Amount required' }); continue; }
          await db.expense.create({
            data: { businessId: business.id, category: row.category || 'other', amount: parseFloat(row.amount) || 0, description: row.description || null, date: row.date ? new Date(row.date) : new Date() },
          });
          created++;
        }
      } catch (e: any) {
        errors.push({ row: rowNum, error: e.message?.substring(0, 80) || 'Unknown error' });
      }
    }

    return NextResponse.json({ created, errors, total: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
  }
}
