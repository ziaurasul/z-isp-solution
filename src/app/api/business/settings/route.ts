import { NextRequest, NextResponse } from 'next/server';
import { getBusinessFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const business = await getBusinessFromRequest();
    if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, phone, address, invoiceTemplate, invoiceColor, whatsappEnabled, whatsappToken } = await req.json();

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (invoiceTemplate !== undefined) updateData.invoiceTemplate = invoiceTemplate;
    if (invoiceColor !== undefined) updateData.invoiceColor = invoiceColor;
    if (whatsappEnabled !== undefined) updateData.whatsappEnabled = whatsappEnabled;
    if (whatsappToken !== undefined) updateData.whatsappToken = whatsappToken;

    const updated = await db.business.update({
      where: { id: business.id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id, name: updated.name, email: updated.email, phone: updated.phone,
      address: updated.address, logo: updated.logo, plan: updated.plan,
      isPlatformAdmin: updated.isPlatformAdmin, invoiceTemplate: updated.invoiceTemplate,
      invoiceColor: updated.invoiceColor, whatsappEnabled: updated.whatsappEnabled,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}