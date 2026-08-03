import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBusinessFromRequest } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const existing = await db.payment.findFirst({
      where: { id, businessId: business.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // If payment was linked to an invoice, recalculate invoice status
    if (existing.invoiceId) {
      const invoice = await db.invoice.findUnique({
        where: { id: existing.invoiceId },
        include: { payments: true },
      });

      if (invoice) {
        const remainingPayments = invoice.payments.filter((p) => p.id !== id);
        const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);

        let newStatus = 'unpaid';
        if (totalPaid >= invoice.amount) {
          newStatus = 'paid';
        } else if (totalPaid > 0) {
          newStatus = 'partial';
        }

        await db.invoice.update({
          where: { id: existing.invoiceId },
          data: {
            status: newStatus,
            ...(newStatus === 'unpaid' ? { paidAt: null } : {}),
          },
        });
      }
    }

    await db.payment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
