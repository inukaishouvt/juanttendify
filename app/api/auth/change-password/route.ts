import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifyToken, comparePassword, hashPassword } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing password fields' }, { status: 400 });
        }

        // Get user from db
        const userResult = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
        if (userResult.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userResult[0];

        // Verify current password
        const isCorrect = await comparePassword(currentPassword, user.password);
        if (!isCorrect) {
            return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
        }

        // Hash and update new password
        const hashedPassword = await hashPassword(newPassword);
        await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, user.id));

        return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
