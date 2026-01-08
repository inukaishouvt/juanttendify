import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timePeriods } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

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

    await db.delete(timePeriods).where(eq(timePeriods.id, periodId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting period:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
