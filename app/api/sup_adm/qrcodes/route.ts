import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { qrCodes } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'sup_adm') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allQRCodes = await db.select().from(qrCodes).orderBy(desc(qrCodes.createdAt));
    return NextResponse.json({ qrCodes: allQRCodes });
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
