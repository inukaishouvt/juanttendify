import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, attendance, timePeriods } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth';
import { eq, and, inArray } from 'drizzle-orm';

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
        const { studentId, role } = body;

        if (!studentId || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (role !== 'student' && role !== 'secretary') {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Verify the student has actually attended one of this teacher's classes
        // to ensure teachers can't just modify anyone
        const teacherPeriods = await db
            .select({ id: timePeriods.id })
            .from(timePeriods)
            .where(eq(timePeriods.teacherId, payload.userId));

        if (teacherPeriods.length === 0) {
            return NextResponse.json({ error: 'Not authorized to modify this student' }, { status: 403 });
        }

        const periodIds = teacherPeriods.map(p => p.id);

        const hasAttended = await db
            .select()
            .from(attendance)
            .where(
                and(
                    eq(attendance.studentId, studentId),
                    inArray(attendance.periodId, periodIds)
                )
            )
            .limit(1);

        if (hasAttended.length === 0) {
            return NextResponse.json({ error: 'Student not found in your classes' }, { status: 403 });
        }

        // Update user role
        await db
            .update(users)
            .set({ role })
            .where(eq(users.id, studentId));

        return NextResponse.json({ success: true, role });
    } catch (error) {
        console.error('Error updating student role:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
