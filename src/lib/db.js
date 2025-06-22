// lib/db.js
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // needed for Google Cloud SQL with SSL
    },
});

export default pool;
