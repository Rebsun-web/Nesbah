#!/usr/bin/env node

const { runMigrations } = require('../src/lib/db-migration.cjs');

console.log('🔄 Starting database migration for dual-auction system...');

runMigrations()
    .then(() => {
        console.log('✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
