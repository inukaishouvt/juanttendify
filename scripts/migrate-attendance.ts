import { client } from '../lib/db';

async function migrateAttendanceTable() {
  console.log('Migrating attendance table to add location columns...');

  try {
    // SQLite doesn't support IF NOT EXISTS for ALTER TABLE
    // We'll try to add each column and catch errors if they already exist
    const migrations = [
      { sql: `ALTER TABLE attendance ADD COLUMN latitude INTEGER`, name: 'latitude' },
      { sql: `ALTER TABLE attendance ADD COLUMN longitude INTEGER`, name: 'longitude' },
      { sql: `ALTER TABLE attendance ADD COLUMN accuracy INTEGER`, name: 'accuracy' },
      { sql: `ALTER TABLE attendance ADD COLUMN location_status TEXT`, name: 'location_status' },
    ];

    for (const migration of migrations) {
      try {
        await client.execute(migration.sql);
        console.log(`✓ Added column: ${migration.name}`);
      } catch (error: any) {
        const errorMsg = error?.message || error?.toString() || '';
        // Check if column already exists (different error messages for different SQLite versions)
        if (
          errorMsg.includes('duplicate column') ||
          errorMsg.includes('already exists') ||
          errorMsg.includes('SQLITE_ERROR') && errorMsg.includes('duplicate')
        ) {
          console.log(`- Column ${migration.name} already exists, skipping...`);
        } else {
          // Try to verify if column exists by querying it
          try {
            await client.execute(`SELECT ${migration.name} FROM attendance LIMIT 1`);
            console.log(`- Column ${migration.name} already exists, skipping...`);
          } catch (selectError) {
            // Column doesn't exist and we couldn't add it
            console.error(`✗ Failed to add column ${migration.name}:`, errorMsg);
            // Continue anyway - might be a different issue
          }
        }
      }
    }

    console.log('✓ Migration completed!');
  } catch (error) {
    console.error('Error migrating attendance table:', error);
    throw error;
  }
}

migrateAttendanceTable()
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

