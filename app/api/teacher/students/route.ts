import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, attendance, timePeriods } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth';
import { eq, inArray } from 'drizzle-orm';

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

        // Get all periods for this teacher
        const teacherPeriods = await db
            .select({ id: timePeriods.id })
            .from(timePeriods)
            .where(eq(timePeriods.teacherId, payload.userId));

        if (teacherPeriods.length === 0) {
            return NextResponse.json({ students: [] });
        }

        const periodIds = teacherPeriods.map(p => p.id);

        // Get all students who have attended these periods
        const studentAttendance = await db
            .selectDistinct({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                studentLrn: users.studentLrn,
            })
            .from(attendance)
            .innerJoin(users, eq(attendance.studentId, users.id))
            .where(inArray(attendance.periodId, periodIds));

        return NextResponse.json({ students: studentAttendance });
    } catch (error) {
        console.error('Error fetching teacher students:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
