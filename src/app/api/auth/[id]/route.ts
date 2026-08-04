import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    const business = await db.business.findUnique({
      where: { id },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: business.id,
      name: business.name,
      email: business.email,
      phone: business.phone,
      address: business.address,
      logo: business.logo,
      plan: business.plan,
      trialEndsAt: business.trialEndsAt,
      isActive: business.isActive,
      createdAt: business.createdAt,
    });
  } catch (error) {
    console.error('Get business by ID error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, address } = body;

    const business = await db.business.update({
      where: { id },
      data: { name, email, phone, address },
    });

    return NextResponse.json({
      id: business.id,
      name: business.name,
      email: business.email,
      phone: business.phone,
      address: business.address,
      plan: business.plan,
      trialEndsAt: business.trialEndsAt,
      isActive: business.isActive,
    });
  } catch (error) {
    console.error('Update business error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
