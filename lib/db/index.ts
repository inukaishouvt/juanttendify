import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// NOTE: Hardcoded for local testing only. Do NOT commit real production secrets.
const TURSO_DATABASE_URL =
  'libsql://juanttendify-denis0vich.aws-ap-northeast-1.turso.io';
const TURSO_AUTH_TOKEN =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ1ODE3NjUsImlkIjoiZjNiOWU0ODQtMWFjOS00MTZkLWIyMDktNjRlODQ3MTk1ZWM3IiwicmlkIjoiNTA0MTI1NzYtMjhjOS00ZDBmLWJhYjAtOGQ1OGVjOTdhNWYxIn0.WpIuJyK6PdguqMQwyX1DyN_Na3zxvhgIYeq3jfSZc76oiST3k05PpRehMhhGUZPkB8C08zy3n8ITXNjb-ALdAQ';

export const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export { schema };

