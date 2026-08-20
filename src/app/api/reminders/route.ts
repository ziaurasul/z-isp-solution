import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { type } = await req.json();
    const bizId = business.id;
    const now = new Date();
    let notifications: any[] = [];
    let messages: any[] = [];

    if (type === 'expiring') {
      const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const expiring = await db.connection.findMany({
        where: { businessId: bizId, status: 'active', expiresAt: { lte: sevenDays, gte: now } },
        include: { customer: { select: { id: true, name: true, phone: true } } },
      });
      for (const c of expiring) {
        const expDate = c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-PK') : 'soon';
        const title = 'Service Expiring Soon';
        const msg = `${c.customer?.name}'s ${c.packageType} package (${c.packageName || ''}) expires on ${expDate}. Please renew to avoid service interruption.`;
        notifications.push({ businessId: bizId, title, message: msg, type: 'expiry' });
        if (c.customerId) {
          messages.push({ businessId: bizId, customerId: c.customerId, channel: 'inapp', direction: 'outgoing', content: `Dear ${c.customer?.name}, your ${c.packageType} service (${c.packageName || 'package'}) is expiring on ${expDate}. Please renew your subscription to continue enjoying our services. Thank you!`, status: 'sent' });
        }
      }
    } else if (type === 'overdue') {
      const overdue = await db.invoice.findMany({
        where: { businessId: bizId, status: { in: ['unpaid', 'overdue'] }, dueDate: { lt: now } },
        include: { connection: { include: { customer: { select: { id: true, name: true, phone: true } } } } },
        take: 200,
      });
      for (const inv of overdue) {
        const custName = inv.connection?.customer?.name || 'Customer';
        const title = 'Overdue Invoice Reminder';
        const msg = `Invoice for ${inv.month} (${inv.connection?.customer?.name}) - Rs ${inv.amount} is overdue.`;
        notifications.push({ businessId: bizId, title, message: msg, type: 'payment' });
        if (inv.connection?.customerId) {
          messages.push({ businessId: bizId, customerId: inv.connection.customerId, channel: 'inapp', direction: 'outgoing', content: `Dear ${custName}, your invoice for ${inv.month} of Rs ${inv.amount} is overdue. Kindly clear your dues at your earliest convenience. Thank you!`, status: 'sent' });
        }
      }
    } else if (type === 'welcome') {
      const recent = await db.customer.findMany({
        where: { businessId: bizId, createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        take: 100,
      });
      for (const c of recent) {
        messages.push({ businessId: bizId, customerId: c.id, channel: 'inapp', direction: 'outgoing', content: `Welcome to ${business.name}! We're glad to have you as our valued customer. If you need any assistance, feel free to reach out. Thank you for choosing us!`, status: 'sent' });
      }
    } else if (type === 'maintenance') {
      const { message } = await req.json();
      const activeConns = await db.connection.findMany({
        where: { businessId: bizId, status: 'active' },
        include: { customer: { select: { id: true } } },
        take: 500,
      });
      const custIds = [...new Set(activeConns.map(c => c.customerId))];
      for (const cid of custIds) {
        messages.push({ businessId: bizId, customerId: cid, channel: 'inapp', direction: 'outgoing', content: message || `Dear customer, we will be performing scheduled maintenance. Services may be briefly interrupted. We apologize for any inconvenience. Thank you for your patience!`, status: 'sent' });
      }
      notifications.push({ businessId: bizId, title: 'Maintenance Notice Sent', message: `Bulk maintenance message sent to ${custIds.length} customers.`, type: 'info' });
    }

    const results = await Promise.all([
      ...notifications.map(n => db.notification.create({ data: n })),
      ...messages.map(m => db.message.create({ data: m })),
    ]);

    return NextResponse.json({ notificationsCreated: notifications.length, messagesCreated: messages.length, total: results.length });
  } catch (error) {
    console.error('Reminders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
