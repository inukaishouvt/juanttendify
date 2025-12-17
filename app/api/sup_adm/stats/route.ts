import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, timePeriods, attendance, qrCodes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

function isSuperAdminRequest(request: NextRequest): boolean {
  const referer = request.headers.get('referer');
  return referer?.includes('/sup_adm') || true;
}

export async function GET(request: NextRequest) {
  if (!isSuperAdminRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Get all counts
    const [allUsers, allPeriods, allAttendance, allQRCodes] = await Promise.all([
      db.select().from(users),
      db.select().from(timePeriods),
      db.select().from(attendance),
      db.select().from(qrCodes),
    ]);

    const totalUsers = allUsers.length;
    const totalStudents = allUsers.filter((u) => u.role === 'student').length;
    const totalTeachers = allUsers.filter((u) => u.role === 'teacher').length;
    const totalPeriods = allPeriods.length;
    const totalAttendance = allAttendance.length;
    const totalQRCodes = allQRCodes.length;

    // Count in_review and verified
    const inReview = allAttendance.filter(
      (a) => a.status === 'in_review' || a.locationStatus === 'in_review'
    ).length;
    const verified = allAttendance.filter((a) => a.locationStatus === 'verified').length;

    return NextResponse.json({
      totalUsers,
      totalStudents,
      totalTeachers,
      totalPeriods,
      totalAttendance,
      totalQRCodes,
      inReview,
      verified,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

