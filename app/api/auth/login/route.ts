import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { comparePassword, generateToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user
    const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userList.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = userList[0];

    // Verify password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      role: user.role as 'student' | 'teacher' | 'secretary' | 'sup_adm',
      email: user.email,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

