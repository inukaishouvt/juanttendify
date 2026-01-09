import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attendance, users, timePeriods } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'teacher' && payload.role !== 'secretary')) {
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

    if (payload.role === 'teacher') {
      // Get all period IDs belonging to this teacher
      const teacherPeriods = await db
        .select({ id: timePeriods.id })
        .from(timePeriods)
        .where(eq(timePeriods.teacherId, payload.userId));

      const teacherPeriodIds = teacherPeriods.map(p => p.id);

      if (teacherPeriodIds.length === 0) {
        return NextResponse.json({
          attendance: [],
          count: 0,
        });
      }

      if (periodId) {
        // Ensure the requested period belongs to this teacher
        if (!teacherPeriodIds.includes(periodId)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        conditions.push(eq(attendance.periodId, periodId));
      } else {
        // Show all attendance for all teacher's periods
        conditions.push(inArray(attendance.periodId, teacherPeriodIds));
      }
    } else if (periodId) {
      // Secretaries and Admins can see specific periods
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

