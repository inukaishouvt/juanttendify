import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, attendance } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function isSuperAdminRequest(request: NextRequest): boolean {
  const referer = request.headers.get('referer');
  return referer?.includes('/sup_adm') || true;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSuperAdminRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if user has attendance records
    const userAttendance = await db
      .select()
      .from(attendance)
      .where(eq(attendance.studentId, userId))
      .limit(1);

    if (userAttendance.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with attendance records' },
        { status: 400 }
      );
    }

    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

