import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attendance, qrCodes, timePeriods, users } from '@/lib/db/schema';
import { generateId, getManilaToday, getManilaTimeParts, parseTime } from '@/lib/utils';
import { verifyToken } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { isWithinGeofence, isGeofencingEnabled } from '@/lib/geofence';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { qrCode, latitude, longitude, accuracy } = body;

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 });
    }

    // Location validation
    const ACCURACY_THRESHOLD = 100; // meters - if accuracy is worse than this, mark as in_review
    let locationStatus: 'verified' | 'in_review' | null = null;
    let finalStatus: 'in' | 'late' | 'out' | 'in_review' = 'in';

    // Check if location is provided
    if (latitude === undefined || longitude === undefined || accuracy === undefined) {
      locationStatus = 'in_review';
      finalStatus = 'in_review';
    } else if (accuracy > ACCURACY_THRESHOLD) {
      // Location is approximate (accuracy too low)
      locationStatus = 'in_review';
      finalStatus = 'in_review';
    } else {
      // Location is precise - now check geofence
      if (isGeofencingEnabled()) {
        const geofenceCheck = isWithinGeofence(latitude, longitude);
        if (!geofenceCheck.isWithin) {
          // Outside geofence - send for manual verification
          locationStatus = 'in_review';
          finalStatus = 'in_review';
        } else {
          // Inside geofence - location verified
          locationStatus = 'verified';
        }
      } else {
        // Geofencing disabled - just verify accuracy
        locationStatus = 'verified';
      }
    }

    // Find the QR code
    const qr = await db.select().from(qrCodes).where(eq(qrCodes.code, qrCode)).limit(1);
    if (qr.length === 0) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 404 });
    }

    const qrRecord = qr[0];

    // Check if QR code is expired
    if (new Date() > qrRecord.expiresAt) {
      return NextResponse.json({ error: 'QR code has expired' }, { status: 400 });
    }

    // Get the period
    const period = await db.select().from(timePeriods).where(eq(timePeriods.id, qrRecord.periodId!)).limit(1);
    if (period.length === 0) {
      return NextResponse.json({ error: 'Period not found' }, { status: 404 });
    }

    const periodRecord = period[0];
    const now = new Date();
    const manilaTime = getManilaTimeParts(now);
    const currentDate = getManilaToday();



    // Check if already scanned today for this period
    const existing = await db.select()
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, payload.userId),
          eq(attendance.periodId, periodRecord.id),
          eq(attendance.date, currentDate)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        error: 'Already scanned for this period today',
        attendance: existing[0]
      }, { status: 400 });
    }

    // Determine status: in, late, or out (only if location is verified)
    if (locationStatus === 'verified') {
      const startTime = parseTime(periodRecord.startTime);
      const endTime = parseTime(periodRecord.endTime);
      const nowMinutes = manilaTime.hours * 60 + manilaTime.minutes;
      const startMinutes = startTime.hours * 60 + startTime.minutes;
      const endMinutes = endTime.hours * 60 + endTime.minutes;
      const lateThreshold = startMinutes + periodRecord.lateThreshold;

      // Grace period: allow 5 minutes before start and 10 minutes after end
      const GRACE_PERIOD_BEFORE = 5; // minutes before period starts
      const GRACE_PERIOD_AFTER = 10; // minutes after period ends
      const graceStart = startMinutes - GRACE_PERIOD_BEFORE;
      const graceEnd = endMinutes + GRACE_PERIOD_AFTER;

      if (nowMinutes < graceStart) {
        finalStatus = 'out'; // Too early (before grace period)
      } else if (nowMinutes > graceEnd) {
        finalStatus = 'out'; // Too late (after grace period)
      } else if (nowMinutes < startMinutes) {
        // Within grace period before start - mark as present
        finalStatus = 'in';
      } else if (nowMinutes > endMinutes) {
        // Within grace period after end - mark as late
        finalStatus = 'late';
      } else if (nowMinutes > lateThreshold) {
        finalStatus = 'late'; // After late threshold
      } else {
        finalStatus = 'in'; // On time
      }
    }
    // If locationStatus is 'in_review', finalStatus is already set to 'in_review'

    // Create attendance record
    // Convert latitude/longitude to microdegrees (multiply by 1e6) for storage as integers
    const latitudeMicro = latitude !== undefined ? Math.round(latitude * 1e6) : null;
    const longitudeMicro = longitude !== undefined ? Math.round(longitude * 1e6) : null;
    const accuracyMeters = accuracy !== undefined ? Math.round(accuracy) : null;

    const attendanceRecord = await db.insert(attendance).values({
      id: generateId(),
      studentId: payload.userId,
      periodId: periodRecord.id,
      qrCodeId: qrRecord.id,
      status: finalStatus,
      date: currentDate,
      scannedAt: now,
      createdAt: now,
      latitude: latitudeMicro,
      longitude: longitudeMicro,
      accuracy: accuracyMeters,
      locationStatus: locationStatus,
    }).returning();

    // Get student info
    const student = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

    return NextResponse.json({
      success: true,
      attendance: attendanceRecord[0],
      status: finalStatus,
      period: periodRecord,
      student: student[0],
      debug: {
        currentTime: `${manilaTime.hours}:${manilaTime.minutes.toString().padStart(2, '0')}`,
        periodTime: `${periodRecord.startTime} - ${periodRecord.endTime}`,
        locationStatus,
        locationProvided: latitude !== undefined && longitude !== undefined,
        accuracy: accuracy,
      },
    });
  } catch (error) {
    console.error('Error scanning QR code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

