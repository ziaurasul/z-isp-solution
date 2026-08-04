import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'customers';

  let headers: string[] = [];
  let sampleData: string[][] = [];

  if (type === 'customers') {
    headers = ['name', 'phone', 'email', 'address', 'cnic', 'status'];
    sampleData = [
      ['Muhammad Ali', '0300-1234567', 'ali@email.com', 'Street 5, Lahore', '35201-1234567-1', 'active'],
      ['Ahmed Khan', '0312-7654321', 'ahmed@email.com', 'Block B, Karachi', '35201-7654321-1', 'active'],
      ['Sara Bibi', '0333-9876543', '', 'Sector 3, Islamabad', '', 'active'],
    ];
  } else if (type === 'connections') {
    headers = ['customer_phone', 'package_type', 'package_name', 'speed', 'monthly_fee', 'status'];
    sampleData = [
      ['0300-1234567', 'internet', 'Basic', '10 Mbps', '1500', 'active'],
      ['0300-1234567', 'cable', 'Standard', '', '800', 'active'],
      ['0312-7654321', 'internet', 'Premium', '50 Mbps', '3000', 'active'],
      ['0333-9876543', 'iptv', 'Gold', '', '1200', 'active'],
    ];
  } else if (type === 'expenses') {
    headers = ['category', 'amount', 'description', 'date'];
    sampleData = [
      ['rent', '25000', 'Office rent January', '2026-01-01'],
      ['salary', '45000', 'Technician salary', '2026-01-05'],
      ['equipment', '12000', 'Fiber optic cables', '2026-01-10'],
      ['utility', '8000', 'Electricity bill', '2026-01-15'],
    ];
  } else {
    return NextResponse.json({ error: 'Invalid type. Use: customers, connections, expenses' }, { status: 400 });
  }

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${type}_template.xlsx"`,
    },
  });
}