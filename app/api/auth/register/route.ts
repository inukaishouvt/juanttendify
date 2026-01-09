import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword, generateToken } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, studentLrn } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (role !== 'student' && role !== 'teacher') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.insert(users).values({
      id: generateId(),
      email,
      password: hashedPassword,
      name,
      role,
      studentLrn: role === 'student' ? studentLrn : null,
      createdAt: new Date(),
    }).returning();

    // Generate token
    const token = generateToken({
      userId: user[0].id,
      role: user[0].role as 'student' | 'teacher',
      email: user[0].email,
    });

    return NextResponse.json({
      token,
      user: {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        role: user[0].role,
        studentLrn: user[0].studentLrn,
      },
    });
  } catch (error) {
    console.error('Error registering:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

