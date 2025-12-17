import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attendance, users, timePeriods } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

function isSuperAdminRequest(request: NextRequest): boolean {
  const referer = request.headers.get('referer');
  return referer?.includes('/sup_adm') || true;
}

export async function GET(request: NextRequest) {
  if (!isSuperAdminRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
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

