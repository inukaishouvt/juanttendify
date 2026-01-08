import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timePeriods, attendance, qrCodes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'sup_adm') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: periodId } = await params;
    const body = await request.json();
    const { name, startTime, endTime, lateThreshold } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (lateThreshold !== undefined) updateData.lateThreshold = lateThreshold;

    const updated = await db
      .update(timePeriods)
      .set(updateData)
      .where(eq(timePeriods.id, periodId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Period not found' }, { status: 404 });
    }

    return NextResponse.json({ period: updated[0] });
  } catch (error) {
    console.error('Error updating period:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'sup_adm') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: periodId } = await params;

    if (!periodId) {
      return NextResponse.json({ error: 'Period ID required' }, { status: 400 });
    }

    // Check for dependent records
    const [hasAttendance, hasQR] = await Promise.all([
      db.select().from(attendance).where(eq(attendance.periodId, periodId)).limit(1),
      db.select().from(qrCodes).where(eq(qrCodes.periodId, periodId)).limit(1),
    ]);

    if (hasAttendance.length > 0 || hasQR.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete period with existing attendance or QR codes' },
        { status: 400 }
      );
    }

    await db.delete(timePeriods).where(eq(timePeriods.id, periodId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting period:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
