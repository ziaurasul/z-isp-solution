import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q || q.length < 1) return NextResponse.json({ results: [] });

    const bizId = business.id;
    const isAdmin = business.isPlatformAdmin;

    // Run all searches in parallel
    const [customers, connections, payments, invoices, vendors, employees] = await Promise.all([
      db.customer.findMany({
        where: isAdmin ? { OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
        ] } : { businessId: bizId, OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
        ] },
        take: 8,
        select: { id: true, name: true, phone: true, email: true, status: true, businessId: true },
      }),
      db.connection.findMany({
        where: isAdmin ? {
          OR: [
            { packageName: { contains: q, mode: 'insensitive' } },
            { packageType: { contains: q, mode: 'insensitive' } },
            { customer: { name: { contains: q, mode: 'insensitive' } } },
          ],
        } : {
          businessId: bizId,
          OR: [
            { packageName: { contains: q, mode: 'insensitive' } },
            { packageType: { contains: q, mode: 'insensitive' } },
            { customer: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take: 8,
        include: { customer: { select: { name: true } } },
        select: { id: true, packageType: true, packageName: true, status: true, monthlyFee: true, customer: { select: { name: true } }, businessId: true },
      }),
      db.payment.findMany({
        where: isAdmin ? {
          OR: [
            { note: { contains: q, mode: 'insensitive' } },
            { method: { contains: q, mode: 'insensitive' } },
            { customer: { name: { contains: q, mode: 'insensitive' } } },
          ],
        } : {
          businessId: bizId,
          OR: [
            { note: { contains: q, mode: 'insensitive' } },
            { method: { contains: q, mode: 'insensitive' } },
            { customer: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take: 8,
        include: { customer: { select: { name: true, phone: true } }, connection: { select: { packageName: true, packageType: true } } },
        select: { id: true, amount: true, method: true, note: true, createdAt: true, customer: { select: { name: true, phone: true } }, connection: { select: { packageName: true, packageType: true } }, businessId: true },
      }),
      db.invoice.findMany({
        where: isAdmin ? { month: { contains: q } } : { businessId: bizId, month: { contains: q } },
        take: 8,
        include: { connection: { select: { packageName: true, customer: { select: { name: true } } } } },
        select: { id: true, month: true, amount: true, status: true, connection: { select: { packageName: true, customer: { select: { name: true } } } }, businessId: true },
      }),
      db.vendor.findMany({
        where: isAdmin ? { OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { service: { contains: q, mode: 'insensitive' } },
        ] } : { businessId: bizId, OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { service: { contains: q, mode: 'insensitive' } },
        ] },
        take: 5,
        select: { id: true, name: true, phone: true, service: true, status: true, businessId: true },
      }),
      db.employee.findMany({
        where: isAdmin ? { OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { role: { contains: q, mode: 'insensitive' } },
        ] } : { businessId: bizId, OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { role: { contains: q, mode: 'insensitive' } },
        ] },
        take: 5,
        select: { id: true, name: true, phone: true, role: true, status: true, businessId: true },
      }),
    ]);

    const results = [
      ...customers.map(c => ({ type: 'customer' as const, id: c.id, title: c.name, subtitle: c.phone + (c.email ? ` | ${c.email}` : ''), extra: c.status, businessId: c.businessId })),
      ...connections.map(c => ({ type: 'connection' as const, id: c.id, title: `${c.packageName || c.packageType}`, subtitle: c.customer?.name || '', extra: `${c.packageType} - Rs ${c.monthlyFee}`, businessId: c.businessId })),
      ...payments.map(p => ({ type: 'payment' as const, id: p.id, title: `Rs ${p.amount.toLocaleString()}`, subtitle: p.customer?.name || '', extra: `${p.method || ''} ${p.connection?.packageName ? '- ' + p.connection.packageName : ''}`, businessId: p.businessId })),
      ...invoices.map(i => ({ type: 'invoice' as const, id: i.id, title: `Rs ${i.amount.toLocaleString()} - ${i.month}`, subtitle: i.connection?.customer?.name || '', extra: i.status, businessId: i.businessId })),
      ...vendors.map(v => ({ type: 'vendor' as const, id: v.id, title: v.name, subtitle: v.service || '', extra: v.status, businessId: v.businessId })),
      ...employees.map(e => ({ type: 'employee' as const, id: e.id, title: e.name, subtitle: e.role, extra: e.status, businessId: e.businessId })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
