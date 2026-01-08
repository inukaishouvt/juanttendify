import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const adminEmail = 'admin@juanttendify.com';
        const adminPassword = 'adminpassword123'; // Change this after first login

        // Check if admin already exists
        const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

        if (existing.length > 0) {
            return NextResponse.json({ message: 'Admin user already exists.' });
        }

        // Create admin user
        const hashedPassword = await hashPassword(adminPassword);
        await db.insert(users).values({
            id: generateId(),
            email: adminEmail,
            password: hashedPassword,
            name: 'Super Admin',
            role: 'sup_adm',
            createdAt: new Date(),
        });

        return NextResponse.json({
            message: 'Super Admin created successfully!',
            email: adminEmail,
            password: adminPassword
        });
    } catch (error) {
        console.error('Error setting up admin:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
