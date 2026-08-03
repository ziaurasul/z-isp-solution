import { NextResponse } from 'next/server';
import { getBusinessFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const business = await getBusinessFromRequest();

    if (!business) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let trialExpired = false;
    if (business.plan === 'trial' && business.trialEndsAt) {
      trialExpired = new Date() > business.trialEndsAt;
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
      trialExpired,
      createdAt: business.createdAt,
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
