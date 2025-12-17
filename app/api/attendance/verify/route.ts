import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attendance } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
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
    const { attendanceId, status } = body;

    if (!attendanceId || !status) {
      return NextResponse.json(
        { error: 'Attendance ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['in', 'late', 'out', 'in_review'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update attendance record
    const updated = await db
      .update(attendance)
      .set({
        status: status as 'in' | 'late' | 'out' | 'in_review',
        locationStatus: status === 'in_review' ? 'in_review' : 'verified',
      })
      .where(eq(attendance.id, attendanceId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      attendance: updated[0],
    });
  } catch (error) {
    console.error('Error verifying attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

