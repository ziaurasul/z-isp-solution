import { NextRequest, NextResponse } from 'next/server';
import { getBusinessFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const business = await getBusinessFromRequest();
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const type = req.nextUrl.searchParams.get('type') || 'customers';
  const XLSX = await import('xlsx');

  let headers: string[] = [];
  let sample: string[][] = [];

  if (type === 'customers') {
    headers = ['name', 'phone', 'email', 'address', 'cnic', 'status'];
    sample = [
      ['Ahmed Khan', '0300-1234567', 'ahmed@email.com', 'House 5, Street 3, Lahore', '35201-1234567-1', 'active'],
      ['Sara Ali', '0312-9876543', 'sara@email.com', 'Flat 2, Block D, Karachi', '35201-7654321-1', 'active'],
      ['Usman Tariq', '0333-5551234', '', 'Shop 10, Market Road, Islamabad', '35201-1112233-4', 'active'],
    ];
  } else if (type === 'connections') {
    headers = ['customerPhone', 'packageType', 'packageName', 'speed', 'monthlyFee', 'status', 'expiresAt'];
    sample = [
      ['0300-1234567', 'internet', 'Basic 10Mbps', '10 Mbps', '1500', 'active', '2026-12-31'],
      ['0300-1234567', 'cable', 'Standard Cable', '', '800', 'active', '2026-12-31'],
      ['0312-9876543', 'internet', 'Premium 50Mbps', '50 Mbps', '3000', 'active', '2026-12-31'],
    ];
  } else {
    headers = ['category', 'amount', 'description', 'date'];
    sample = [
      ['rent', '25000', 'Office rent August', '2026-08-01'],
      ['salary', '35000', 'Technician salary', '2026-08-01'],
      ['equipment', '15000', 'Router purchase', '2026-08-03'],
      ['utility', '5000', 'Electricity bill', '2026-08-05'],
    ];
  }

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${type}_template.xlsx"`,
    },
  });
}
