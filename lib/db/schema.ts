import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Users table (students and teachers)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(), // hashed
  role: text('role').notNull(), // 'student' or 'teacher'
  studentLrn: text('student_lrn'), // for students
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Time periods (e.g., Period 1: 8:00-9:00, Period 2: 9:00-10:00)
export const timePeriods = sqliteTable('time_periods', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // e.g., "Period 1", "Morning", "Afternoon"
  strand: text('strand'), // e.g., "STEM", "ICT"
  section: text('section'), // e.g., "201"
  subject: text('subject'), // e.g., "Programming"
  startTime: text('start_time').notNull(), // HH:mm format
  endTime: text('end_time').notNull(), // HH:mm format
  lateThreshold: integer('late_threshold').notNull(), // minutes after start time
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// QR codes generated for attendance
export const qrCodes = sqliteTable('qr_codes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // the actual QR code string
  periodId: text('period_id').references(() => timePeriods.id),
  date: text('date').notNull(), // YYYY-MM-DD format
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  createdBy: text('created_by').references(() => users.id), // teacher who created it
});

// Attendance records
export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => users.id),
  periodId: text('period_id').notNull().references(() => timePeriods.id),
  qrCodeId: text('qr_code_id').references(() => qrCodes.id),
  status: text('status').notNull(), // 'in', 'late', 'out', or 'in_review'
  date: text('date').notNull(), // YYYY-MM-DD format
  scannedAt: integer('scanned_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  latitude: integer('latitude'), // Location latitude in microdegrees (multiply by 1e-6 to get degrees)
  longitude: integer('longitude'), // Location longitude in microdegrees (multiply by 1e-6 to get degrees)
  accuracy: integer('accuracy'), // Location accuracy in meters
  locationStatus: text('location_status'), // 'verified', 'in_review', or null
});

