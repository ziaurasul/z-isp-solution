import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file || !type) {
      return NextResponse.json({ error: 'File and type are required' }, { status: 400 });
    }

    if (!['customers', 'connections', 'expenses'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Use: customers, connections, expenses' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let rows: Record<string, string>[] = [];

    if (file.name.endsWith('.csv')) {
      const text = buffer.toString('utf-8');
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return NextResponse.json({ error: 'CSV must have header + data rows' }, { status: 400 });
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      for (let i = 1; i < lines.length && i <= 500; i++) {
        const vals = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
        rows.push(row);
      }
    } else {
      // xlsx
      const XLSX = await import('xlsx');
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { raw: false });
      rows = json.slice(0, 500);
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in file' }, { status: 400 });
    }

    let created = 0;
    const errors: { row: number; error: string }[] = [];

    if (type === 'customers') {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const name = r.name || r['Name'] || r['NAME'] || '';
        const phone = r.phone || r['Phone'] || r['PHONE'] || '';
        if (!name || !phone) { errors.push({ row: i + 2, error: 'Name and phone required' }); continue; }
        try {
          await db.customer.create({
            data: {
              businessId: business.id,
              name,
              phone,
              email: r.email || r['Email'] || null,
              address: r.address || r['Address'] || null,
              cnic: r.cnic || r['CNIC'] || null,
              status: r.status || 'active',
            },
          });
          created++;
        } catch (e: any) {
          errors.push({ row: i + 2, error: e.message?.slice(0, 80) || 'Create failed' });
        }
      }
    } else if (type === 'connections') {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const custPhone = r.phone || r['customer_phone'] || r['customerPhone'] || '';
        if (!custPhone) { errors.push({ row: i + 2, error: 'Customer phone required to find customer' }); continue; }
        const packageType = r.package_type || r['packageType'] || r['type'] || 'internet';
        const monthlyFee = parseFloat(r.monthly_fee || r['monthlyFee'] || r['fee'] || '0');
        if (!monthlyFee || monthlyFee <= 0) { errors.push({ row: i + 2, error: 'Valid monthly fee required' }); continue; }
        try {
          const customer = await db.customer.findFirst({ where: { businessId: business.id, phone: custPhone } });
          if (!customer) { errors.push({ row: i + 2, error: `Customer not found for phone: ${custPhone}` }); continue; }
          await db.connection.create({
            data: {
              businessId: business.id,
              customerId: customer.id,
              packageType: ['internet', 'cable', 'iptv'].includes(packageType) ? packageType : 'internet',
              packageName: r.package_name || r['packageName'] || null,
              speed: r.speed || null,
              monthlyFee,
              status: r.status || 'active',
              expiresAt: r.expires_at || r['expiresAt'] ? new Date(r.expires_at || r['expiresAt']) : null,
            },
          });
          created++;
        } catch (e: any) {
          errors.push({ row: i + 2, error: e.message?.slice(0, 80) || 'Create failed' });
        }
      }
    } else if (type === 'expenses') {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const category = r.category || r['Category'] || 'other';
        const amount = parseFloat(r.amount || r['Amount'] || '0');
        if (!amount || amount <= 0) { errors.push({ row: i + 2, error: 'Valid amount required' }); continue; }
        try {
          await db.expense.create({
            data: {
              businessId: business.id,
              category,
              amount,
              description: r.description || r['Description'] || null,
              date: r.date || r['Date'] ? new Date(r.date || r['Date']) : new Date(),
            },
          });
          created++;
        } catch (e: any) {
          errors.push({ row: i + 2, error: e.message?.slice(0, 80) || 'Create failed' });
        }
      }
    }

    return NextResponse.json({ created, errors, total: rows.length });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
