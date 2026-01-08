import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword, verifyToken } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'sup_adm') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allUsers = await db.select().from(users).orderBy(asc(users.name));
    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'sup_adm') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, role, studentLrn } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (role !== 'student' && role !== 'teacher' && role !== 'secretary') {
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

    return NextResponse.json({ user: user[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
