import { NextRequest, NextResponse } from 'next/server';
import { getBusinessFromRequest, hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureTables } from '@/lib/db';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export async function POST(req: NextRequest) {
  await ensureTables();
  const business = await getBusinessFromRequest();
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // customers, connections, expenses

    if (!file || !type) return NextResponse.json({ error: 'File and type required' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    let rows: Record<string, string>[] = [];

    if (file.name.endsWith('.csv')) {
      const text = buffer.toString('utf-8');
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      rows = parsed.data as Record<string, string>[];
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    } else {
      return NextResponse.json({ error: 'Only CSV and Excel files supported' }, { status: 400 });
    }

    if (rows.length === 0) return NextResponse.json({ error: 'No data rows found' }, { status: 400 });
    if (rows.length > 500) return NextResponse.json({ error: 'Max 500 rows per upload' }, { status: 400 });

    let created = 0;
    let errors: { row: number; message: string }[] = [];

    if (type === 'customers') {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const name = (r.name || r.Name || '').toString().trim();
        const phone = (r.phone || r.Phone || '').toString().trim();
        const email = (r.email || r.Email || '').toString().trim() || null;
        const address = (r.address || r.Address || '').toString().trim() || null;
        const cnic = (r.cnic || r.CNIC || r.cnic_no || '').toString().trim() || null;
        const status = (r.status || r.Status || 'active').toString().trim().toLowerCase();

        if (!name || !phone) { errors.push({ row: i + 2, message: 'Name and phone required' }); continue; }
        if (!['active', 'inactive', 'suspended'].includes(status)) { errors.push({ row: i + 2, message: `Invalid status: ${status}` }); continue; }

        try {
          await db.customer.create({ data: { businessId: business.id, name, phone, email, address, cnic, status } });
          created++;
        } catch (e: any) {
          errors.push({ row: i + 2, message: e.message?.substring(0, 60) || 'DB error' });
        }
      }
    } else if (type === 'connections') {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const customerPhone = (r.customer_phone || r.CustomerPhone || r.phone || r.Phone || '').toString().trim();
        const packageType = (r.package_type || r.PackageType || r.type || r.Type || 'internet').toString().trim().toLowerCase();
        const packageName = (r.package_name || r.PackageName || r.package || '').toString().trim() || null;
        const speed = (r.speed || r.Speed || '').toString().trim() || null;
        const monthlyFee = parseFloat(r.monthly_fee || r.MonthlyFee || r.fee || r.Fee || '0');
        const status = (r.status || r.Status || 'active').toString().trim().toLowerCase();

        if (!customerPhone) { errors.push({ row: i + 2, message: 'Customer phone required' }); continue; }
        if (isNaN(monthlyFee) || monthlyFee <= 0) { errors.push({ row: i + 2, message: 'Valid monthly fee required' }); continue; }
        if (!['internet', 'cable', 'iptv'].includes(packageType)) { errors.push({ row: i + 2, message: `Invalid type: ${packageType}` }); continue; }

        try {
          const customer = await db.customer.findFirst({ where: { businessId: business.id, phone: customerPhone } });
          if (!customer) { errors.push({ row: i + 2, message: `Customer not found: ${customerPhone}` }); continue; }
          await db.connection.create({
            data: { businessId: business.id, customerId: customer.id, packageType, packageName, speed, monthlyFee, status }
          });
          created++;
        } catch (e: any) {
          errors.push({ row: i + 2, message: e.message?.substring(0, 60) || 'DB error' });
        }
      }
    } else if (type === 'expenses') {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const category = (r.category || r.Category || '').toString().trim().toLowerCase();
        const amount = parseFloat(r.amount || r.Amount || '0');
        const description = (r.description || r.Description || '').toString().trim() || null;
        const date = (r.date || r.Date || '').toString().trim();

        if (!category || !['rent', 'salary', 'equipment', 'maintenance', 'utility', 'transport', 'other'].includes(category)) {
          errors.push({ row: i + 2, message: `Invalid category: ${category}` }); continue;
        }
        if (isNaN(amount) || amount <= 0) { errors.push({ row: i + 2, message: 'Valid amount required' }); continue; }

        try {
          await db.expense.create({
            data: {
              businessId: business.id, category, amount, description,
              date: date ? new Date(date) : new Date()
            }
          });
          created++;
        } catch (e: any) {
          errors.push({ row: i + 2, message: e.message?.substring(0, 60) || 'DB error' });
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid type. Use: customers, connections, expenses' }, { status: 400 });
    }

    return NextResponse.json({ created, errors, total: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
  }
}