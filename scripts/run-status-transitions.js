#!/usr/bin/env node

const { handleStatusTransitions } = require('../src/lib/cron/statusTransitions.cjs');

console.log('🔄 Starting status transitions for dual-auction system...');

handleStatusTransitions()
    .then(() => {
        console.log('✅ Status transitions completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Status transitions failed:', error);
        process.exit(1);
    });
