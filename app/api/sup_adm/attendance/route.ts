import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attendance, users, timePeriods } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

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

    const records = await db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        periodId: attendance.periodId,
        status: attendance.status,
        date: attendance.date,
        scannedAt: attendance.scannedAt,
        latitude: attendance.latitude,
        longitude: attendance.longitude,
        accuracy: attendance.accuracy,
        locationStatus: attendance.locationStatus,
        student: users,
        period: timePeriods,
      })
      .from(attendance)
      .innerJoin(users, eq(attendance.studentId, users.id))
      .innerJoin(timePeriods, eq(attendance.periodId, timePeriods.id))
      .orderBy(desc(attendance.scannedAt));

    return NextResponse.json({ attendance: records });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
