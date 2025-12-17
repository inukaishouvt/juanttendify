import { client, db } from '../lib/db';
import { users, timePeriods } from '../lib/db/schema';
import { hashPassword } from '../lib/auth';
import { generateId } from '../lib/utils';

async function seed() {
  console.log('Seeding database...');

  try {
    // Ensure required tables exist (helpful when drizzle push hasn't been run yet).
    // This is safe for local/testing: uses IF NOT EXISTS so it won't break existing data.
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        student_id TEXT,
        created_at INTEGER NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS time_periods (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        late_threshold INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    // Create sample time periods
    const periods = [
      {
        id: generateId(),
        name: 'Period 1',
        startTime: '08:00',
        endTime: '09:00',
        lateThreshold: 15,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: 'Period 2',
        startTime: '09:00',
        endTime: '10:00',
        lateThreshold: 15,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: 'Period 3',
        startTime: '10:30',
        endTime: '11:30',
        lateThreshold: 15,
        createdAt: new Date(),
      },
      {
        id: generateId(),
        name: 'Period 4',
        startTime: '11:30',
        endTime: '12:30',
        lateThreshold: 15,
        createdAt: new Date(),
      },
    ];

    for (const period of periods) {
      await db.insert(timePeriods).values(period);
      console.log(`Created period: ${period.name}`);
    }

    // Create sample teacher
    const teacherPassword = await hashPassword('teacher123');
    const teacher = {
      id: generateId(),
      email: 'teacher@school.com',
      name: 'Teacher Admin',
      password: teacherPassword,
      role: 'teacher',
      studentId: null,
      createdAt: new Date(),
    };

    await db.insert(users).values(teacher);
    console.log('Created teacher: teacher@school.com / teacher123');

    // Create sample student
    const studentPassword = await hashPassword('student123');
    const student = {
      id: generateId(),
      email: 'student@school.com',
      name: 'John Student',
      password: studentPassword,
      role: 'student',
      studentId: 'STU001',
      createdAt: new Date(),
    };

    await db.insert(users).values(student);
    console.log('Created student: student@school.com / student123');

    console.log('Seeding completed!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });

