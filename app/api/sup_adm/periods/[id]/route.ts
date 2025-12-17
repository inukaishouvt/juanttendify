import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timePeriods } from '@/lib/db/schema';
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

