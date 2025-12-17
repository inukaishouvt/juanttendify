import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timePeriods } from '@/lib/db/schema';
import { generateId } from '@/lib/utils';

function isSuperAdminRequest(request: NextRequest): boolean {
  const referer = request.headers.get('referer');
  return referer?.includes('/sup_adm') || true;
}

export async function GET(request: NextRequest) {
  if (!isSuperAdminRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const allPeriods = await db.select().from(timePeriods);
    return NextResponse.json({ periods: allPeriods });
  } catch (error) {
    console.error('Error fetching periods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSuperAdminRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, startTime, endTime, lateThreshold = 15 } = body;

    if (!name || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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

