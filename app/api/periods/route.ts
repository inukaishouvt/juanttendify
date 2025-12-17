import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timePeriods } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth';

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

    const periods = await db.select().from(timePeriods);

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
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, startTime, endTime, lateThreshold = 15 } = body;

    if (!name || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { generateId } = await import('@/lib/utils');
    const period = await db.insert(timePeriods).values({
      id: generateId(),
      name,
      startTime,
      endTime,
      lateThreshold,
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({ period: period[0] });
  } catch (error) {
    console.error('Error creating period:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

