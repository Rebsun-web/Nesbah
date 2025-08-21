#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { runAdminMigration } = require('../src/lib/admin-db-migration.cjs');

console.log('🚀 Starting Admin Panel Database Migration...');
console.log('📅', new Date().toISOString());

runAdminMigration()
    .then(() => {
        console.log('✅ Admin Panel migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Admin Panel migration failed:', error);
        process.exit(1);
    });
