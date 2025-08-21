const pool = require('./db.cjs')

class EventDrivenMonitor {
    constructor() {
        this.isRunning = false
        this.triggers = new Map()
        this.webhookUrl = process.env.MONITORING_WEBHOOK_URL || 'http://localhost:3000/api/admin/monitoring/webhook'
    }

    // Start event-driven monitoring
    async start() {
        if (this.isRunning) {
            console.log('Event-driven monitor is already running')
            return
        }

        console.log('🚀 Starting Event-Driven Monitor...')
        this.isRunning = true

        try {
            // Create database triggers
            await this.createDatabaseTriggers()
            
            // Start webhook listener
            await this.startWebhookListener()
            
            console.log('✅ Event-driven monitor started successfully')
        } catch (error) {
            console.error('❌ Error starting event-driven monitor:', error)
            this.isRunning = false
            throw error
        }
    }

    // Stop event-driven monitoring
    async stop() {
        if (!this.isRunning) {
            console.log('Event-driven monitor is not running')
            return
        }

        console.log('🛑 Stopping Event-Driven Monitor...')
        this.isRunning = false

        try {
            // Remove database triggers
            await this.removeDatabaseTriggers()
            console.log('✅ Event-driven monitor stopped')
        } catch (error) {
            console.error('❌ Error stopping event-driven monitor:', error)
            throw error
        }
    }

    // Create database triggers for monitoring
    async createDatabaseTriggers() {
        const client = await pool.connect()
        
        try {
            // Create notification function
            await client.query(`
                CREATE OR REPLACE FUNCTION notify_monitoring_event()
                RETURNS TRIGGER AS $$
                DECLARE
                    payload JSON;
                BEGIN
                    -- Create payload based on trigger
                    payload := json_build_object(
                        'table', TG_TABLE_NAME,
                        'action', TG_OP,
                        'old', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
                        'new', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
                        'timestamp', NOW(),
                        'trigger_name', TG_NAME
                    );
                    
                    -- Send notification
                    PERFORM pg_notify('monitoring_events', payload::text);
                    
                    RETURN COALESCE(NEW, OLD);
                END;
                $$ LANGUAGE plpgsql;
            `)

            // Create triggers for submitted_applications
            await client.query(`
                DROP TRIGGER IF EXISTS monitor_applications_status_change ON submitted_applications;
                CREATE TRIGGER monitor_applications_status_change
                AFTER UPDATE OF status ON submitted_applications
                FOR EACH ROW
                WHEN (OLD.status IS DISTINCT FROM NEW.status)
                EXECUTE FUNCTION notify_monitoring_event();
            `)

            await client.query(`
                DROP TRIGGER IF EXISTS monitor_applications_insert ON submitted_applications;
                CREATE TRIGGER monitor_applications_insert
                AFTER INSERT ON submitted_applications
                FOR EACH ROW
                EXECUTE FUNCTION notify_monitoring_event();
            `)

            // Create triggers for revenue_collections
            await client.query(`
                DROP TRIGGER IF EXISTS monitor_revenue_status_change ON revenue_collections;
                CREATE TRIGGER monitor_revenue_status_change
                AFTER UPDATE OF status ON revenue_collections
                FOR EACH ROW
                WHEN (OLD.status IS DISTINCT FROM NEW.status)
                EXECUTE FUNCTION notify_monitoring_event();
            `)

            await client.query(`
                DROP TRIGGER IF EXISTS monitor_revenue_insert ON revenue_collections;
                CREATE TRIGGER monitor_revenue_insert
                FOR EACH ROW
                EXECUTE FUNCTION notify_monitoring_event();
            `)

            // Create triggers for system_alerts
            await client.query(`
                DROP TRIGGER IF EXISTS monitor_alerts_insert ON system_alerts;
                CREATE TRIGGER monitor_alerts_insert
                AFTER INSERT ON system_alerts
                FOR EACH ROW
                EXECUTE FUNCTION notify_monitoring_event();
            `)

            // Create triggers for admin_users (security monitoring)
            await client.query(`
                DROP TRIGGER IF EXISTS monitor_admin_login ON admin_users;
                CREATE TRIGGER monitor_admin_login
                AFTER UPDATE OF last_login ON admin_users
                FOR EACH ROW
                WHEN (OLD.last_login IS DISTINCT FROM NEW.last_login)
                EXECUTE FUNCTION notify_monitoring_event();
            `)

            console.log('✅ Database triggers created successfully')
        } finally {
            client.release()
        }
    }

    // Remove database triggers
    async removeDatabaseTriggers() {
        const client = await pool.connect()
        
        try {
            const triggers = [
                'monitor_applications_status_change',
                'monitor_applications_insert',
                'monitor_revenue_status_change',
                'monitor_revenue_insert',
                'monitor_alerts_insert',
                'monitor_admin_login'
            ]

            for (const trigger of triggers) {
                await client.query(`DROP TRIGGER IF EXISTS ${trigger} ON ${this.getTableName(trigger)}`)
            }

            console.log('✅ Database triggers removed successfully')
        } finally {
            client.release()
        }
    }

    // Get table name from trigger name
    getTableName(triggerName) {
        const tableMap = {
            'monitor_applications_status_change': 'submitted_applications',
            'monitor_applications_insert': 'submitted_applications',
            'monitor_revenue_status_change': 'revenue_collections',
            'monitor_revenue_insert': 'revenue_collections',
            'monitor_alerts_insert': 'system_alerts',
            'monitor_admin_login': 'admin_users'
        }
        return tableMap[triggerName] || 'submitted_applications'
    }

    // Start webhook listener for external notifications
    async startWebhookListener() {
        // This would be handled by the main application's webhook endpoint
        console.log('✅ Webhook listener ready at /api/admin/monitoring/webhook')
    }

    // Process monitoring events
    async processEvent(eventData) {
        try {
            const { table, action, old, new: newData, trigger_name } = eventData

            console.log(`📡 Processing event: ${action} on ${table}`)

            switch (table) {
                case 'submitted_applications':
                    await this.handleApplicationEvent(action, old, newData)
                    break
                case 'revenue_collections':
                    await this.handleRevenueEvent(action, old, newData)
                    break
                case 'system_alerts':
                    await this.handleAlertEvent(action, old, newData)
                    break
                case 'admin_users':
                    await this.handleAdminEvent(action, old, newData)
                    break
                default:
                    console.log(`⚠️ Unknown table: ${table}`)
            }
        } catch (error) {
            console.error('❌ Error processing event:', error)
        }
    }

    // Handle application status changes
    async handleApplicationEvent(action, old, newData) {
        if (action === 'UPDATE' && old && newData) {
            const oldStatus = old.status
            const newStatus = newData.status
            const applicationId = newData.application_id

            console.log(`🔄 Application ${applicationId} status changed: ${oldStatus} → ${newStatus}`)

            // Check for urgent transitions
            if (newStatus === 'pending_offers') {
                await this.scheduleAuctionDeadline(applicationId)
            } else if (newStatus === 'purchased') {
                await this.handleApplicationPurchased(applicationId)
            } else if (newStatus === 'offer_received') {
                await this.scheduleSelectionDeadline(applicationId)
            } else if (newStatus === 'abandoned' || newStatus === 'deal_expired') {
                await this.handleApplicationFailure(applicationId, newStatus)
            }
        } else if (action === 'INSERT') {
            console.log(`📝 New application created: ${newData.application_id}`)
            await this.handleNewApplication(newData)
        }
    }

    // Handle revenue collection events
    async handleRevenueEvent(action, old, newData) {
        if (action === 'UPDATE' && old && newData) {
            const oldStatus = old.status
            const newStatus = newData.status
            const collectionId = newData.collection_id

            console.log(`💰 Revenue collection ${collectionId} status changed: ${oldStatus} → ${newStatus}`)

            if (newStatus === 'collected') {
                await this.handleSuccessfulCollection(collectionId, newData)
            } else if (newStatus === 'failed') {
                await this.handleFailedCollection(collectionId, newData)
            }
        } else if (action === 'INSERT') {
            console.log(`💰 New revenue collection: ${newData.collection_id}`)
            await this.handleNewCollection(newData)
        }
    }

    // Handle system alert events
    async handleAlertEvent(action, old, newData) {
        if (action === 'INSERT') {
            console.log(`🚨 New system alert: ${newData.title}`)
            await this.handleNewAlert(newData)
        }
    }

    // Handle admin user events
    async handleAdminEvent(action, old, newData) {
        if (action === 'UPDATE' && old && newData) {
            console.log(`👤 Admin login: ${newData.email}`)
            await this.handleAdminLogin(newData)
        }
    }

    // Schedule auction deadline check
    async scheduleAuctionDeadline(applicationId) {
        const client = await pool.connect()
        
        try {
            // Schedule deadline check for 48 hours from now
            const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000)
            
            await client.query(`
                INSERT INTO auction_deadlines (application_id, phase, original_deadline, created_at)
                VALUES ($1, 'auction', $2, NOW())
                ON CONFLICT (application_id, phase) DO UPDATE SET
                original_deadline = EXCLUDED.original_deadline,
                updated_at = NOW()
            `, [applicationId, deadline])

            console.log(`⏰ Scheduled auction deadline for application ${applicationId}`)
        } finally {
            client.release()
        }
    }

    // Schedule selection deadline check
    async scheduleSelectionDeadline(applicationId) {
        const client = await pool.connect()
        
        try {
            // Schedule deadline check for 24 hours from now
            const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000)
            
            await client.query(`
                INSERT INTO auction_deadlines (application_id, phase, original_deadline, created_at)
                VALUES ($1, 'selection', $2, NOW())
                ON CONFLICT (application_id, phase) DO UPDATE SET
                original_deadline = EXCLUDED.original_deadline,
                updated_at = NOW()
            `, [applicationId, deadline])

            console.log(`⏰ Scheduled selection deadline for application ${applicationId}`)
        } finally {
            client.release()
        }
    }

    // Handle application failure events
    async handleApplicationFailure(applicationId, status) {
        console.log(`❌ Application ${applicationId} failed with status: ${status}`)
        
        // TODO: Send notification to business user about application failure
        // TODO: Update analytics and reporting
    }

    // Handle application purchased events
    async handleApplicationPurchased(applicationId) {
        console.log(`💰 Application ${applicationId} has been purchased by a bank`)
        
        // TODO: Send notification to business user that their application was purchased
        // TODO: Update analytics and reporting for purchased applications
        // TODO: Start monitoring for offer submission
        
        // Track revenue for Nesbah (25 SAR per purchase)
        await this.trackPurchaseRevenue(applicationId)
        
        // Note: Application status remains 'pending_offers' until auction ends
        // Status will only change to 'offer_received' when auction ends AND offers exist
        // Status will change to 'abandoned' when auction ends AND no offers exist
    }

    // Track revenue when application is purchased
    async trackPurchaseRevenue(applicationId) {
        const client = await pool.connect()
        
        try {
            // Check if revenue has already been tracked for this application
            const existingRevenue = await client.query(
                'SELECT revenue_collected FROM submitted_applications WHERE application_id = $1',
                [applicationId]
            )
            
            if (existingRevenue.rows.length === 0) {
                console.log(`⚠️ Application ${applicationId} not found for revenue tracking`)
                return
            }
            
            const currentRevenue = parseFloat(existingRevenue.rows[0].revenue_collected) || 0
            
            // Add 25 SAR to Nesbah's revenue for this application
            const newRevenue = currentRevenue + 25.00
            
            await client.query(
                'UPDATE submitted_applications SET revenue_collected = $1 WHERE application_id = $2',
                [newRevenue, applicationId]
            )
            
            console.log(`💰 Added 25 SAR to Nesbah revenue for application ${applicationId}. Total: SAR ${newRevenue.toFixed(2)}`)
            
            // Also update the pos_application table to keep it in sync
            await client.query(
                'UPDATE pos_application SET revenue_collected = $1 WHERE application_id = $2',
                [newRevenue, applicationId]
            )
            
        } catch (error) {
            console.error(`❌ Error tracking purchase revenue for application ${applicationId}:`, error)
        } finally {
            client.release()
        }
    }

    // Handle successful revenue collection
    async handleSuccessfulCollection(collectionId, collectionData) {
        const client = await pool.connect()
        
        try {
            // Verify collection amount
            const expectedAmount = 25 // 25 SAR per bank purchase
            if (collectionData.amount !== expectedAmount) {
                await client.query(`
                    INSERT INTO system_alerts (alert_type, severity, title, message, related_entity_type, related_entity_id, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                `, [
                    'revenue_anomaly',
                    'high',
                    'Revenue Amount Mismatch',
                    `Collection ${collectionId}: expected ${expectedAmount}, got ${collectionData.amount}`,
                    'revenue_collection',
                    collectionId
                ])
            }

            console.log(`✅ Revenue collection ${collectionId} processed successfully`)
        } finally {
            client.release()
        }
    }

    // Handle failed revenue collection
    async handleFailedCollection(collectionId, collectionData) {
        const client = await pool.connect()
        
        try {
            await client.query(`
                INSERT INTO system_alerts (alert_type, severity, title, message, related_entity_type, related_entity_id, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [
                'revenue_failure',
                'critical',
                'Revenue Collection Failed',
                `Collection ${collectionId} failed: ${collectionData.failure_reason || 'Unknown reason'}`,
                'revenue_collection',
                collectionId
            ])

            console.log(`❌ Created failure alert for revenue collection ${collectionId}`)
        } finally {
            client.release()
        }
    }

    // Handle new application
    async handleNewApplication(applicationData) {
        // Log new application for analytics
        console.log(`📊 New application analytics: ${applicationData.application_id}`)
    }

    // Handle new collection
    async handleNewCollection(collectionData) {
        // Log new collection for analytics
        console.log(`📊 New revenue collection analytics: ${collectionData.collection_id}`)
    }

    // Handle new alert
    async handleNewAlert(alertData) {
        // Could trigger external notifications here
        console.log(`📢 New alert notification: ${alertData.title}`)
    }

    // Handle admin login
    async handleAdminLogin(adminData) {
        const client = await pool.connect()
        
        try {
            // Log admin activity
            await client.query(`
                INSERT INTO admin_activity_log (admin_id, action, details, ip_address, created_at)
                VALUES ($1, $2, $3, $4, NOW())
            `, [adminData.admin_id, 'login', 'Admin login successful', '127.0.0.1'])

            console.log(`👤 Admin activity logged: ${adminData.email}`)
        } finally {
            client.release()
        }
    }

    // Get monitoring statistics
    async getMonitoringStats() {
        const client = await pool.connect()
        
        try {
            const stats = await client.query(`
                SELECT 
                    'triggers_active' as metric,
                    COUNT(*) as value
                FROM information_schema.triggers 
                WHERE trigger_name LIKE 'monitor_%'
                
                UNION ALL
                
                SELECT 
                    'events_processed_today' as metric,
                    COUNT(*) as value
                FROM system_alerts 
                WHERE created_at >= CURRENT_DATE
                
                UNION ALL
                
                SELECT 
                    'pending_deadlines' as metric,
                    COUNT(*) as value
                FROM auction_deadlines 
                WHERE original_deadline > NOW()
            `)

            return stats.rows
        } finally {
            client.release()
        }
    }
}

// Create singleton instance
const eventDrivenMonitor = new EventDrivenMonitor()

module.exports = eventDrivenMonitor
