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

    const business = await db.business.create({
      data: {
        name: businessName,
        email,
        password: hashedPassword,
        phone: phone || null,
        plan: 'trial',
        trialEndsAt,
        isActive: true,
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
