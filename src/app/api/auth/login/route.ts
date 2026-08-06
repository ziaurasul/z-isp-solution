import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const business = await db.business.findUnique({
      where: { email },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, business.password);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

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
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
