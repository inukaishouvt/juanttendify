# Juanttendify

A school attendance monitoring system with QR code scanning.

## Features

- **Student Side**: Scan QR codes to mark attendance (in/late/out based on time periods)
- **Teacher Side**: View all attendance records in real-time
- **Time-based Logic**: Automatically determines if student is in, late, or out based on time periods
- **QR Code Generation**: Dynamic QR codes based on current day, time, or period

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Database**: Turso (SQLite-based edge database)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS
- **QR Code**: html5-qrcode for scanning, qrcode for generation

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Turso Database

1. Create an account at [turso.tech](https://turso.tech)
2. Create a new database
3. Get your database URL and auth token from the Turso dashboard

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
TURSO_DATABASE_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 4. Initialize Database

Push the schema to your database:

```bash
npm run db:push
```

### 5. Seed Initial Data (Optional)

Create sample users and time periods:

```bash
npm run seed
```

This creates:
- **Teacher**: `teacher@school.com` / `teacher123`
- **Student**: `student@school.com` / `student123`
- **4 Sample Periods**: Period 1-4 with default times

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### For Teachers

1. Login at `/teacher` with teacher credentials
2. Select a time period and date
3. Click "Generate QR Code" to create a QR code for students to scan
4. View attendance records in real-time on the dashboard
5. Filter by date and period

### For Students

1. Login at `/student` with student credentials
2. Click "Start Scanner" to activate the QR code scanner
3. Scan the QR code displayed by the teacher
4. See your attendance status (in/late/out) immediately

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/periods` - Get all time periods
- `POST /api/periods` - Create a new time period (teacher only)
- `POST /api/qr/generate` - Generate QR code (teacher only)
- `POST /api/attendance/scan` - Scan QR code and mark attendance (student only)
- `GET /api/attendance/list` - Get attendance records (teacher only)

## Project Structure

```
├── app/
│   ├── api/           # API routes
│   ├── student/       # Student portal
│   ├── teacher/       # Teacher dashboard
│   └── page.tsx       # Home page
├── lib/
│   ├── db/           # Database schema and connection
│   ├── auth.ts       # Authentication utilities
│   └── utils.ts      # Helper functions
└── scripts/
    └── seed.ts       # Database seeding script
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run seed` - Seed database with sample data

