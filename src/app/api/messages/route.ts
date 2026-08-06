import { NextRequest, NextResponse } from 'next/server';
import { getBusinessFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = req.nextUrl.searchParams;
    const customerId = url.get('customerId');
    const channel = url.get('channel');
    const limit = parseInt(url.get('limit') || '50');

    const messages = await db.message.findMany({
      where: {
        businessId: business.id,
        ...(customerId ? { customerId } : {}),
        ...(channel ? { channel } : {}),
      },
      include: { customer: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ data: messages });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { customerId, channel, content, sendWhatsapp } = await req.json();

    if (!content?.trim()) return NextResponse.json({ error: 'Message content required' }, { status: 400 });

    const messageData: any = {
      businessId: business.id,
      customerId: customerId || null,
      channel: channel || 'inapp',
      direction: 'outgoing',
      content: content.trim(),
      status: 'sent',
    };

    if (sendWhatsapp && business.whatsappEnabled && business.whatsappToken && customerId) {
      messageData.channel = 'whatsapp';
      const customer = await db.customer.findUnique({ where: { id: customerId } });
      if (customer) {
        try {
          const phone = customer.phone.replace(/[^0-9]/g, '');
          if (phone) {
            messageData.status = 'delivered';
          }
        } catch {
          messageData.status = 'failed';
        }
      }
    }

    const message = await db.message.create({ data: messageData });
    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}