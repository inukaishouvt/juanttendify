import { client } from '../lib/db';

async function createTables() {
  console.log('Creating missing tables...');

  try {
    // Create qr_codes table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS qr_codes (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        period_id TEXT,
        date TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        created_by TEXT,
        FOREIGN KEY (period_id) REFERENCES time_periods(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('✓ Created qr_codes table');

    // Create attendance table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        period_id TEXT NOT NULL,
        qr_code_id TEXT,
        status TEXT NOT NULL,
        date TEXT NOT NULL,
        scanned_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        latitude INTEGER,
        longitude INTEGER,
        accuracy INTEGER,
        location_status TEXT,
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (period_id) REFERENCES time_periods(id),
        FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id)
      )
    `);
    console.log('✓ Created attendance table');

    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

createTables()
  .then(async () => {
    console.log('Done!');
    await client.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Failed:', error);
    await client.close();
    process.exit(1);
  });

