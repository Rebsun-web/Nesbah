#!/usr/bin/env node

// Lists all tables and their columns (with PK/FK) for a given PostgreSQL schema.
// Usage:
//   node list-db-schema.cjs               # defaults to schema "public"
//   SCHEMA=custom node list-db-schema.cjs # choose schema
//
// Connection via env:
//   DATABASE_URL=postgres://user:pass@host:5432/db
//   or PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD

const { Client } = require('pg');

// Load environment variables (prefers .env.local if present)
try {
  const path = require('path');
  const fs = require('fs');
  const dotenv = require('dotenv');
  const localEnvPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
  } else {
    dotenv.config();
  }
} catch (_) {
  // dotenv is optional; ignore if not installed
}

function getClientConfigFromEnv() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    };
  }

  const required = ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required env for direct connection: ${missing.join(', ')}\n` +
      `Provide DATABASE_URL or PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD.`
    );
  }

  return {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  };
}

async function main() {
  const schema = process.env.SCHEMA || 'public';
  const client = new Client(getClientConfigFromEnv());

  await client.connect();

  try {
    const [tablesRes, columnsRes, pkRes, fkRes] = await Promise.all([
      client.query(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = $1 AND table_type = 'BASE TABLE'
         ORDER BY table_name`,
        [schema]
      ),
      client.query(
        `SELECT table_name, column_name, data_type, is_nullable, column_default, ordinal_position
         FROM information_schema.columns
         WHERE table_schema = $1
         ORDER BY table_name, ordinal_position`,
        [schema]
      ),
      client.query(
        `SELECT tc.table_name, kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
         WHERE tc.table_schema = $1 AND tc.constraint_type = 'PRIMARY KEY'`,
        [schema]
      ),
      client.query(
        `SELECT tc.table_name, kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage ccu
           ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
         WHERE tc.table_schema = $1 AND tc.constraint_type = 'FOREIGN KEY'`,
        [schema]
      ),
    ]);

    const tables = tablesRes.rows.map((r) => r.table_name);

    // Build maps for quick lookup
    const columnsByTable = new Map();
    for (const row of columnsRes.rows) {
      const list = columnsByTable.get(row.table_name) || [];
      list.push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default || null,
      });
      columnsByTable.set(row.table_name, list);
    }

    const pkSet = new Set(pkRes.rows.map((r) => `${r.table_name}.${r.column_name}`));

    const fkMap = new Map(); // key: table.column -> {ftable, fcolumn}
    for (const r of fkRes.rows) {
      fkMap.set(`${r.table_name}.${r.column_name}`, {
        foreignTable: r.foreign_table_name,
        foreignColumn: r.foreign_column_name,
      });
    }

    // Output
    console.log(`# Database Schema (schema: ${schema})`);
    console.log();

    for (const table of tables) {
      console.log(`## ${table}`);
      const cols = columnsByTable.get(table) || [];
      if (cols.length === 0) {
        console.log('No columns found.');
        console.log();
        continue;
      }
      console.log('| Column | Type | Nullable | Default | Keys |');
      console.log('|---|---|---|---|---|');
      for (const c of cols) {
        const keyFlags = [];
        if (pkSet.has(`${table}.${c.column}`)) keyFlags.push('PK');
        const fk = fkMap.get(`${table}.${c.column}`);
        if (fk) keyFlags.push(`FK→${fk.foreignTable}(${fk.foreignColumn})`);
        const defaultVal = c.default ? `\`${c.default}\`` : '';
        console.log(`| ${c.column} | ${c.type} | ${c.nullable ? 'YES' : 'NO'} | ${defaultVal} | ${keyFlags.join(', ')} |`);
      }
      console.log();
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Error listing schema:', err.message);
  process.exit(1);
});


