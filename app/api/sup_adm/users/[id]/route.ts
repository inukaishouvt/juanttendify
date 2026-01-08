import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, attendance } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyToken } from '@/lib/auth';

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

    const { id: userId } = await params;
    const body = await request.json();
    const { name, email, role, studentLrn, password } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (studentLrn !== undefined) updateData.studentLrn = studentLrn;

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: updated[0] });
  } catch (error) {
    console.error('Error updating user:', error);
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
