import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { qrCodes } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

function isSuperAdminRequest(request: NextRequest): boolean {
  const referer = request.headers.get('referer');
  return referer?.includes('/sup_adm') || true;
}

export async function GET(request: NextRequest) {
  if (!isSuperAdminRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const allQRCodes = await db.select().from(qrCodes).orderBy(desc(qrCodes.createdAt));
    return NextResponse.json({ qrCodes: allQRCodes });
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

