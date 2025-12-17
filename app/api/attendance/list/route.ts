import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attendance, users, timePeriods } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const periodId = searchParams.get('periodId');

    // Build conditions
    const conditions = [];
    if (date) {
      conditions.push(eq(attendance.date, date));
    }
    if (periodId) {
      conditions.push(eq(attendance.periodId, periodId));
    }

    let baseQuery = db
      .select({
        attendance: attendance,
        student: users,
        period: timePeriods,
      })
      .from(attendance)
      .innerJoin(users, eq(attendance.studentId, users.id))
      .innerJoin(timePeriods, eq(attendance.periodId, timePeriods.id));

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions)) as any;
    }

    const records = await baseQuery.orderBy(desc(attendance.scannedAt));

    return NextResponse.json({
      attendance: records,
      count: records.length,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

