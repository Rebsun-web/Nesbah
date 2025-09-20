#!/usr/bin/env node

/**
 * Background Processing Monitor
 * 
 * This script monitors the background task manager and application status transitions
 * in real-time to help verify automated processing is working correctly.
 * 
 * Features:
 * - Real-time monitoring of background tasks
 * - Application status transition tracking
 * - Performance metrics
 * - Alert for failed transitions
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import backgroundTaskManager from './src/lib/background-tasks.js';
import pool from './src/lib/db.js';

class BackgroundProcessingMonitor {
    constructor() {
        this.isMonitoring = false;
        this.monitorInterval = null;
        this.lastStatusCheck = new Date();
        this.transitionHistory = [];
    }

    async startMonitoring() {
        console.log('🔍 Starting Background Processing Monitor');
        console.log('=' .repeat(50));
        
        this.isMonitoring = true;
        
        // Start background task manager if not running
        if (!backgroundTaskManager.isRunning) {
            console.log('🚀 Starting background task manager...');
            backgroundTaskManager.start();
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Start monitoring loop
        this.monitorInterval = setInterval(() => {
            this.performMonitoringCycle();
        }, 30000); // Check every 30 seconds

        // Initial status check
        await this.performMonitoringCycle();
        
        console.log('✅ Monitoring started. Press Ctrl+C to stop.');
    }

    async performMonitoringCycle() {
        try {
            const now = new Date();
            console.log(`\n⏰ Monitoring Cycle - ${now.toLocaleTimeString()}`);
            console.log('-'.repeat(40));

            // Check background task manager status
            await this.checkBackgroundTaskStatus();
            
            // Check for recent status transitions
            await this.checkRecentTransitions();
            
            // Check for urgent applications
            await this.checkUrgentApplications();
            
            // Display performance metrics
            this.displayPerformanceMetrics();
            
            this.lastStatusCheck = now;
            
        } catch (error) {
            console.error('❌ Monitoring cycle error:', error);
        }
    }

    async checkBackgroundTaskStatus() {
        const status = backgroundTaskManager.getStatus();
        
        console.log('🔧 Background Task Manager:');
        console.log(`   Running: ${status.isRunning ? '✅' : '❌'}`);
        console.log(`   Active Tasks: ${status.tasks.length}`);
        
        status.tasks.forEach(task => {
            const statusIcon = task.isActive ? '✅' : '❌';
            const intervalMinutes = Math.round(task.interval / 60000);
            console.log(`   - ${task.name}: ${statusIcon} (${intervalMinutes}min interval)`);
        });
    }

    async checkRecentTransitions() {
        const client = await pool.connectWithRetry(2, 1000, 'monitor');
        
        try {
            // Check for applications that have transitioned in the last 5 minutes
            const query = `
                SELECT 
                    application_id,
                    trade_name,
                    status,
                    updated_at,
                    offers_count,
                    auction_end_time
                FROM pos_application 
                WHERE updated_at > NOW() - INTERVAL '5 minutes'
                AND status IN ('completed', 'ignored')
                ORDER BY updated_at DESC
                LIMIT 10
            `;
            
            const result = await client.query(query);
            
            if (result.rows.length > 0) {
                console.log(`🔄 Recent Transitions (${result.rows.length}):`);
                result.rows.forEach(app => {
                    const timeAgo = Math.round((new Date() - new Date(app.updated_at)) / 1000);
                    console.log(`   - App #${app.application_id} (${app.trade_name}): ${app.status} (${timeAgo}s ago, ${app.offers_count} offers)`);
                });
            } else {
                console.log('ℹ️ No recent transitions found');
            }
            
        } finally {
            client.release();
        }
    }

    async checkUrgentApplications() {
        const client = await pool.connectWithRetry(2, 1000, 'monitor');
        
        try {
            // Check for applications expiring within 2 hours
            const query = `
                SELECT 
                    application_id,
                    trade_name,
                    auction_end_time,
                    offers_count,
                    EXTRACT(EPOCH FROM (auction_end_time - NOW()))/3600 as hours_until_expiry
                FROM pos_application 
                WHERE status = 'live_auction'
                AND auction_end_time > NOW()
                AND auction_end_time <= NOW() + INTERVAL '2 hours'
                ORDER BY auction_end_time ASC
                LIMIT 5
            `;
            
            const result = await client.query(query);
            
            if (result.rows.length > 0) {
                console.log(`⚠️ Urgent Applications (${result.rows.length}):`);
                result.rows.forEach(app => {
                    const hours = Math.round(app.hours_until_expiry * 10) / 10;
                    console.log(`   - App #${app.application_id} (${app.trade_name}): ${hours}h until expiry (${app.offers_count} offers)`);
                });
            } else {
                console.log('✅ No urgent applications found');
            }
            
        } finally {
            client.release();
        }
    }

    displayPerformanceMetrics() {
        const metrics = backgroundTaskManager.getPerformanceMetrics();
        
        console.log('📊 Performance Metrics:');
        Object.entries(metrics).forEach(([taskName, metric]) => {
            const isOverdue = metric.isOverdue;
            const nextRunIn = Math.round(metric.timeUntilNext / 1000);
            const statusIcon = isOverdue ? '⚠️' : '✅';
            
            console.log(`   - ${taskName}: ${statusIcon} Next run in ${nextRunIn}s`);
        });
    }

    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        
        this.isMonitoring = false;
        console.log('\n🛑 Monitoring stopped');
        
        // Stop background task manager
        if (backgroundTaskManager.isRunning) {
            console.log('🛑 Stopping background task manager...');
            backgroundTaskManager.stop();
        }
    }
}

// Create and start the monitor
const monitor = new BackgroundProcessingMonitor();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    monitor.stopMonitoring();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    monitor.stopMonitoring();
    process.exit(0);
});

// Start monitoring
monitor.startMonitoring().catch(error => {
    console.error('❌ Failed to start monitoring:', error);
    process.exit(1);
});
