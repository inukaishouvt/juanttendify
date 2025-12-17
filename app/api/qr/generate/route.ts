import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { qrCodes, timePeriods } from '@/lib/db/schema';
import { generateId, formatDate } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';
import QRCode from 'qrcode';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
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
    const { periodId, date, expiresInMinutes = 60 } = body;

    // Verify period exists
    const period = await db.select().from(timePeriods).where(eq(timePeriods.id, periodId)).limit(1);
    if (period.length === 0) {
      return NextResponse.json({ error: 'Period not found' }, { status: 404 });
    }

    // Generate unique QR code
    const qrCodeString = generateId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);

    // Save QR code to database
    const qrCode = await db.insert(qrCodes).values({
      id: generateId(),
      code: qrCodeString,
      periodId,
      date: date || formatDate(now),
      expiresAt,
      createdAt: now,
      createdBy: payload.userId,
    }).returning();

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(qrCodeString);

    return NextResponse.json({
      qrCode: qrCodeString,
      qrCodeImage,
      expiresAt: expiresAt.toISOString(),
      period: period[0],
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

