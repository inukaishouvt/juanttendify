import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timePeriods, attendance, qrCodes } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

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
        if (!payload || payload.role !== 'teacher') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id: periodId } = await params;
        const body = await request.json();
        const { name, strand, section, subject, startTime, endTime, lateThreshold } = body;

        // Verify ownership
        const existing = await db
            .select()
            .from(timePeriods)
            .where(and(eq(timePeriods.id, periodId), eq(timePeriods.teacherId, payload.userId)))
            .get();

        if (!existing) {
            return NextResponse.json({ error: 'Period not found or unauthorized' }, { status: 404 });
        }

        const updated = await db
            .update(timePeriods)
            .set({
                name: name ?? existing.name,
                strand: strand ?? existing.strand,
                section: section ?? existing.section,
                subject: subject ?? existing.subject,
                startTime: startTime ?? existing.startTime,
                endTime: endTime ?? existing.endTime,
                lateThreshold: lateThreshold !== undefined ? Number(lateThreshold) : existing.lateThreshold,
            })
            .where(eq(timePeriods.id, periodId))
            .returning();

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
        if (!payload || payload.role !== 'teacher') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id: periodId } = await params;

        // Verify ownership before deleting
        const existing = await db
            .select()
            .from(timePeriods)
            .where(and(eq(timePeriods.id, periodId), eq(timePeriods.teacherId, payload.userId)))
            .get();

        if (!existing) {
            return NextResponse.json({ error: 'Period not found or unauthorized' }, { status: 404 });
        }

        // Delete related records first to avoid foreign key constraints
        await db.delete(attendance).where(eq(attendance.periodId, periodId));
        await db.delete(qrCodes).where(eq(qrCodes.periodId, periodId));

        await db.delete(timePeriods).where(eq(timePeriods.id, periodId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting period:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
