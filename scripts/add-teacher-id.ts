import { client } from '../lib/db';

async function updateSchema() {
    console.log('Updating schema...');

    // Add teacher_id to time_periods
    try {
        await client.execute(`ALTER TABLE time_periods ADD COLUMN teacher_id TEXT`);
        console.log('✓ Added teacher_id to time_periods');
    } catch (e: any) {
        console.log(`- teacher_id to time_periods: ${e.message}`);
    }

    console.log('Schema update finished.');
}

updateSchema()
    .then(async () => {
        await client.close();
        process.exit(0);
    })
    .catch(async (error) => {
        console.error('Failed:', error);
        await client.close();
        process.exit(1);
    });
