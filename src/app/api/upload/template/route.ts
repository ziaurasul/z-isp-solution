import { NextRequest, NextResponse } from 'next/server';
import { getBusinessFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'customers';

    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    if (type === 'customers') {
      const data = [
        { Name: 'Ahmed Khan', Phone: '0300-1234567', Email: 'ahmed@example.com', Address: 'Street 5, Lahore', CNIC: '35201-1234567-1', Status: 'active' },
        { Name: 'Sara Ali', Phone: '0321-7654321', Email: 'sara@example.com', Address: 'Block D, Karachi', CNIC: '42201-9876543-1', Status: 'active' },
      ];
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    } else if (type === 'connections') {
      const data = [
        { Phone: '0300-1234567', Package_Type: 'internet', Package_Name: '10 Mbps', Speed: '10 Mbps', Monthly_Fee: '1500', Status: 'active', Expires_At: '2026-09-20' },
        { Phone: '0321-7654321', Package_Type: 'cable', Package_Name: 'Basic Cable', Speed: '', Monthly_Fee: '800', Status: 'active', Expires_At: '' },
        { Phone: '0300-1234567', Package_Type: 'iptv', Package_Name: 'IPTV Gold', Speed: '', Monthly_Fee: '1200', Status: 'active', Expires_At: '2026-12-31' },
      ];
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Connections');
    } else if (type === 'expenses') {
      const data = [
        { Category: 'rent', Amount: '25000', Description: 'Office rent August', Date: '2026-08-01' },
        { Category: 'salary', Amount: '30000', Description: 'Technician salary', Date: '2026-08-01' },
        { Category: 'equipment', Amount: '5500', Description: 'Fiber optic cable reel', Date: '2026-08-05' },
        { Category: 'maintenance', Amount: '2000', Description: 'OFC splicing tools', Date: '2026-08-10' },
      ];
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${type}_template.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Template download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
