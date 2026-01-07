import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timePeriods } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let periods;
    if (payload.role === 'teacher') {
      periods = await db.select().from(timePeriods).where(eq(timePeriods.teacherId, payload.userId));
    } else if (payload.role === 'secretary' || payload.role === 'sup_adm') {
      periods = await db.select().from(timePeriods);
    } else {
      periods = [];
    }

    return NextResponse.json({ periods });
  } catch (error) {
    console.error('Error fetching periods:', error);
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
    if (!payload || (payload.role !== 'teacher' && payload.role !== 'secretary')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, strand, section, subject, startTime, endTime, lateThreshold = 15 } = body;

    if (!name || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const period = await db.insert(timePeriods).values({
      id: generateId(),
      name,
      strand,
      section,
      subject,
      startTime,
      endTime,
      lateThreshold: Number(lateThreshold),
      teacherId: payload.userId,
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({ period: period[0] });
  } catch (error) {
    console.error('Error creating period:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

