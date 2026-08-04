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
    const month = searchParams.get('month') || ''; // YYYY-MM format
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { businessId: business.id };

    if (month) {
      where.month = month;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      db.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          connection: {
            include: {
              customer: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      db.invoice.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error('Invoices GET error:', error);
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
    const { month } = body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Valid month in YYYY-MM format is required' },
        { status: 400 }
      );
    }

    // Find all active connections for this business
    const activeConnections = await db.connection.findMany({
      where: {
        businessId: business.id,
        status: 'active',
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (activeConnections.length === 0) {
      return NextResponse.json(
        { error: 'No active connections found', created: 0 },
        { status: 400 }
      );
    }

    // Check for existing invoices for this month to avoid duplicates
    const existingInvoices = await db.invoice.findMany({
      where: {
        businessId: business.id,
        month,
      },
      select: { connectionId: true },
    });

    const existingConnectionIds = new Set(existingInvoices.map((inv) => inv.connectionId));

    const connectionsToInvoice = activeConnections.filter(
      (conn) => !existingConnectionIds.has(conn.id)
    );

    if (connectionsToInvoice.length === 0) {
      return NextResponse.json({
        message: 'All invoices already exist for this month',
        created: 0,
        skipped: activeConnections.length,
      });
    }

    // Calculate due date (15th of the invoice month)
    const dueDate = new Date(`${month}-15T23:59:59.000Z`);

    // Create invoices in a transaction
    const created = await db.$transaction(
      connectionsToInvoice.map((conn) =>
        db.invoice.create({
          data: {
            businessId: business.id,
            connectionId: conn.id,
            month,
            amount: conn.monthlyFee,
            status: 'unpaid',
            dueDate,
          },
          include: {
            connection: {
              include: {
                customer: {
                  select: { id: true, name: true, phone: true },
                },
              },
            },
          },
        })
      )
    );

    return NextResponse.json({
      message: `Generated ${created.length} invoices for ${month}`,
      created: created.length,
      skipped: activeConnections.length - created.length,
      data: created,
    }, { status: 201 });
  } catch (error) {
    console.error('Invoices POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
