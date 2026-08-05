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
    const file = formData.get('logo') as File;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    // Validate file type
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only images allowed' }, { status: 400 });
    if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Max 2MB' }, { status: 400 });

    // Convert to base64 data URL
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    await db.business.update({
      where: { id: business.id },
      data: { logo: dataUrl },
    });

    return NextResponse.json({ logo: dataUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE() {
  await ensureTables();
  const business = await getBusinessFromRequest();
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.business.update({
    where: { id: business.id },
    data: { logo: null },
  });

  return NextResponse.json({ success: true });
}
