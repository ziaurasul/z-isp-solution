import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, businessName } = body;

    if (!name || !email || !password || !businessName) {
      return NextResponse.json(
        { error: 'Name, email, password, and businessName are required' },
        { status: 400 }
      );
    }

    const existing = await db.business.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A business with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // First user ever = platform admin (lifetime access)
    const totalUsers = await db.business.count();
    const isFirstUser = totalUsers === 0;

    const business = await db.business.create({
      data: {
        name: isFirstUser ? 'Z ISP Solution - Admin' : businessName,
        email,
        password: hashedPassword,
        phone: phone || null,
        plan: isFirstUser ? 'enterprise' : 'trial',
        trialEndsAt: isFirstUser ? null : trialEndsAt,
        isActive: true,
        isPlatformAdmin: isFirstUser,
      },
    });

    const response = NextResponse.json({
      id: business.id,
      name: business.name,
      email: business.email,
      phone: business.phone,
      plan: business.plan,
      trialEndsAt: business.trialEndsAt,
      isActive: business.isActive,
      isPlatformAdmin: business.isPlatformAdmin,
      createdAt: business.createdAt,
    });

    response.cookies.set(COOKIE_NAME, business.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
