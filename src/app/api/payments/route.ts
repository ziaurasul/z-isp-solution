import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const method = searchParams.get('method') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { businessId: business.id };

    if (method) {
      where.method = method;
    }

    if (startDate || endDate) {
      where.createdAt = {} as Record<string, Date>;
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const [data, total] = await Promise.all([
      db.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
          connection: {
            select: { id: true, packageType: true, packageName: true },
          },
          invoice: {
            select: { id: true, month: true, amount: true, status: true },
          },
        },
      }),
      db.payment.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error('Payments GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, connectionId, invoiceId, amount, method, collectedBy, note } = body;

    if (!customerId || amount === undefined) {
      return NextResponse.json(
        { error: 'customerId and amount are required' },
        { status: 400 }
      );
    }

    // Verify customer belongs to this business
    const customer = await db.customer.findFirst({
      where: { id: customerId, businessId: business.id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Verify connection belongs to this business if provided
    if (connectionId) {
      const connection = await db.connection.findFirst({
        where: { id: connectionId, businessId: business.id },
      });
      if (!connection) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
      }
    }

    // Verify invoice belongs to this business if provided
    if (invoiceId) {
      const invoice = await db.invoice.findFirst({
        where: { id: invoiceId, businessId: business.id },
      });
      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Calculate total paid for this invoice
      const existingPayments = await db.payment.findMany({
        where: { invoiceId },
        select: { amount: true },
      });

      const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
      const newTotal = totalPaid + parseFloat(amount);

      // Update invoice status based on payment
      if (newTotal >= invoice.amount) {
        await db.invoice.update({
          where: { id: invoiceId },
          data: { status: 'paid', paidAt: new Date() },
        });
      } else {
        await db.invoice.update({
          where: { id: invoiceId },
          data: { status: 'partial' },
        });
      }
    }

    const payment = await db.payment.create({
      data: {
        businessId: business.id,
        customerId,
        connectionId: connectionId || null,
        invoiceId: invoiceId || null,
        amount: parseFloat(amount),
        method: method || null,
        collectedBy: collectedBy || null,
        note: note || null,
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
        connection: {
          select: { id: true, packageType: true, packageName: true },
        },
        invoice: {
          select: { id: true, month: true, amount: true, status: true },
        },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Payments POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
