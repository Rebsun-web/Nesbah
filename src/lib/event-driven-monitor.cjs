const pool = require('./db.cjs')

class EventDrivenMonitor {
    constructor() {
        this.isRunning = false
        this.webhookServer = null
        this.triggers = new Map()
    }

    // Start the event-driven monitoring system
    async start() {
        if (this.isRunning) {
            console.log('Event-driven monitor is already running')
            return
        }

        console.log('🚀 Starting Event-Driven Monitor...')
        this.isRunning = true

        try {
            // Setup database triggers
            await this.setupDatabaseTriggers()
            
            // Setup webhook server for external events
            await this.setupWebhookServer()
            
            // Setup notification listeners
            await this.setupNotificationListeners()
            
            console.log('✅ Event-driven monitor started successfully')
        } catch (error) {
            console.error('❌ Error starting event-driven monitor:', error)
            this.isRunning = false
            throw error
        }
    }

    // Stop the event-driven monitoring system
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
            
            // Stop webhook server
            if (this.webhookServer) {
                this.webhookServer.close()
            }
            
            console.log('✅ Event-driven monitor stopped')
        } catch (error) {
            console.error('❌ Error stopping event-driven monitor:', error)
            throw error
        }
    }

    // Setup database triggers for automatic monitoring
    async setupDatabaseTriggers() {
        const client = await pool.connect()
        
        try {
            console.log('🔧 Setting up database triggers...')

            // Create trigger function for application status changes
            await client.query(`
                CREATE OR REPLACE FUNCTION notify_application_status_change()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Notify about status change
                    PERFORM pg_notify(
                        'application_status_change',
                        json_build_object(
                            'application_id', NEW.application_id,
                            'old_status', OLD.status,
                            'new_status', NEW.status,
                            'timestamp', NOW()
                        )::text
                    );
                    
                    -- If status changed to pending_offers, set auction deadline
                    IF NEW.status = 'pending_offers' AND OLD.status != 'pending_offers' THEN
                        UPDATE submitted_applications 
                        SET auction_end_time = NOW() + INTERVAL '48 hours'
                        WHERE application_id = NEW.application_id;
                        
                        PERFORM pg_notify(
                            'auction_started',
                            json_build_object(
                                'application_id', NEW.application_id,
                                'auction_end_time', NOW() + INTERVAL '48 hours'
                            )::text
                        );
                    END IF;
                    
                    -- If status changed to offer_received, set selection deadline
                    IF NEW.status = 'offer_received' AND OLD.status != 'offer_received' THEN
                        UPDATE submitted_applications 
                        SET offer_selection_end_time = NOW() + INTERVAL '24 hours'
                        WHERE application_id = NEW.application_id;
                        
                        PERFORM pg_notify(
                            'offer_selection_started',
                            json_build_object(
                                'application_id', NEW.application_id,
                                'selection_end_time', NOW() + INTERVAL '24 hours'
                            )::text
                        );
                    END IF;
                    
                    -- If status changed to abandoned or deal_expired, trigger cleanup
                    IF NEW.status IN ('abandoned', 'deal_expired') AND OLD.status NOT IN ('abandoned', 'deal_expired') THEN
                        PERFORM pg_notify(
                            'application_expired',
                            json_build_object(
                                'application_id', NEW.application_id,
                                'status', NEW.status,
                                'timestamp', NOW()
                            )::text
                        );
                    END IF;
                    
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)

            // Create trigger for application status changes
            await client.query(`
                DROP TRIGGER IF EXISTS trigger_application_status_change ON submitted_applications;
                CREATE TRIGGER trigger_application_status_change
                    AFTER UPDATE OF status ON submitted_applications
                    FOR EACH ROW
                    WHEN (OLD.status IS DISTINCT FROM NEW.status)
                    EXECUTE FUNCTION notify_application_status_change();
            `)

            // Create trigger function for revenue collection changes
            await client.query(`
                CREATE OR REPLACE FUNCTION notify_revenue_collection_change()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Notify about revenue collection change
                    PERFORM pg_notify(
                        'revenue_collection_change',
                        json_build_object(
                            'collection_id', NEW.collection_id,
                            'application_id', NEW.application_id,
                            'old_status', OLD.status,
                            'new_status', NEW.status,
                            'amount', NEW.amount,
                            'timestamp', NOW()
                        )::text
                    );
                    
                    -- If collection failed, trigger retry logic
                    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
                        PERFORM pg_notify(
                            'revenue_collection_failed',
                            json_build_object(
                                'collection_id', NEW.collection_id,
                                'failure_reason', NEW.failure_reason,
                                'retry_count', NEW.retry_count
                            )::text
                        );
                    END IF;
                    
                    -- If collection completed, trigger verification
                    IF NEW.status = 'collected' AND OLD.status != 'collected' THEN
                        PERFORM pg_notify(
                            'revenue_collection_completed',
                            json_build_object(
                                'collection_id', NEW.collection_id,
                                'amount', NEW.amount,
                                'timestamp', NOW()
                            )::text
                        );
                    END IF;
                    
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)

            // Create trigger for revenue collection changes
            await client.query(`
                DROP TRIGGER IF EXISTS trigger_revenue_collection_change ON revenue_collections;
                CREATE TRIGGER trigger_revenue_collection_change
                    AFTER UPDATE OF status ON revenue_collections
                    FOR EACH ROW
                    WHEN (OLD.status IS DISTINCT FROM NEW.status)
                    EXECUTE FUNCTION notify_revenue_collection_change();
            `)

            // Create trigger function for new applications
            await client.query(`
                CREATE OR REPLACE FUNCTION notify_new_application()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Notify about new application
                    PERFORM pg_notify(
                        'new_application',
                        json_build_object(
                            'application_id', NEW.application_id,
                            'status', NEW.status,
                            'timestamp', NOW()
                        )::text
                    );
                    
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)

            // Create trigger for new applications
            await client.query(`
                DROP TRIGGER IF EXISTS trigger_new_application ON submitted_applications;
                CREATE TRIGGER trigger_new_application
                    AFTER INSERT ON submitted_applications
                    FOR EACH ROW
                    EXECUTE FUNCTION notify_new_application();
            `)

            // Create trigger function for system alerts
            await client.query(`
                CREATE OR REPLACE FUNCTION notify_system_alert()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Notify about new system alert
                    PERFORM pg_notify(
                        'system_alert',
                        json_build_object(
                            'alert_id', NEW.alert_id,
                            'alert_type', NEW.alert_type,
                            'severity', NEW.severity,
                            'title', NEW.title,
                            'message', NEW.message,
                            'timestamp', NOW()
                        )::text
                    );
                    
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)

            // Create trigger for system alerts
            await client.query(`
                DROP TRIGGER IF EXISTS trigger_system_alert ON system_alerts;
                CREATE TRIGGER trigger_system_alert
                    AFTER INSERT ON system_alerts
                    FOR EACH ROW
                    EXECUTE FUNCTION notify_system_alert();
            `)

            console.log('✅ Database triggers setup completed')
        } finally {
            client.release()
        }
    }

    // Remove database triggers
    async removeDatabaseTriggers() {
        const client = await pool.connect()
        
        try {
            console.log('🧹 Removing database triggers...')

            await client.query(`
                DROP TRIGGER IF EXISTS trigger_application_status_change ON submitted_applications;
                DROP TRIGGER IF EXISTS trigger_revenue_collection_change ON revenue_collections;
                DROP TRIGGER IF EXISTS trigger_new_application ON submitted_applications;
                DROP TRIGGER IF EXISTS trigger_system_alert ON system_alerts;
            `)

            await client.query(`
                DROP FUNCTION IF EXISTS notify_application_status_change();
                DROP FUNCTION IF EXISTS notify_revenue_collection_change();
                DROP FUNCTION IF EXISTS notify_new_application();
                DROP FUNCTION IF EXISTS notify_system_alert();
            `)

            console.log('✅ Database triggers removed')
        } finally {
            client.release()
        }
    }

    // Setup webhook server for external events
    async setupWebhookServer() {
        const http = require('http')
        
        this.webhookServer = http.createServer((req, res) => {
            if (req.method === 'POST' && req.url === '/webhook') {
                let body = ''
                req.on('data', chunk => {
                    body += chunk.toString()
                })
                req.on('end', () => {
                    try {
                        const event = JSON.parse(body)
                        this.handleWebhookEvent(event)
                        res.writeHead(200, { 'Content-Type': 'application/json' })
                        res.end(JSON.stringify({ success: true }))
                    } catch (error) {
                        console.error('❌ Error processing webhook:', error)
                        res.writeHead(400, { 'Content-Type': 'application/json' })
                        res.end(JSON.stringify({ error: 'Invalid webhook data' }))
                    }
                })
            } else {
                res.writeHead(404)
                res.end()
            }
        })

        const port = process.env.WEBHOOK_PORT || 3001
        this.webhookServer.listen(port, () => {
            console.log(`🌐 Webhook server listening on port ${port}`)
        })
    }

    // Setup notification listeners for database events
    async setupNotificationListeners() {
        const client = await pool.connect()
        
        try {
            // Listen for application status changes
            client.on('notification', (msg) => {
                try {
                    const data = JSON.parse(msg.payload)
                    this.handleDatabaseEvent(msg.channel, data)
                } catch (error) {
                    console.error('❌ Error parsing notification:', error)
                }
            })

            // Subscribe to all notification channels
            await client.query('LISTEN application_status_change')
            await client.query('LISTEN revenue_collection_change')
            await client.query('LISTEN new_application')
            await client.query('LISTEN system_alert')
            await client.query('LISTEN auction_started')
            await client.query('LISTEN offer_selection_started')
            await client.query('LISTEN application_expired')
            await client.query('LISTEN revenue_collection_failed')
            await client.query('LISTEN revenue_collection_completed')

            console.log('👂 Database notification listeners setup completed')
        } catch (error) {
            console.error('❌ Error setting up notification listeners:', error)
            throw error
        }
    }

    // Handle database events
    async handleDatabaseEvent(channel, data) {
        console.log(`📡 Database event: ${channel}`, data)

        switch (channel) {
            case 'application_status_change':
                await this.handleApplicationStatusChange(data)
                break
            case 'revenue_collection_change':
                await this.handleRevenueCollectionChange(data)
                break
            case 'new_application':
                await this.handleNewApplication(data)
                break
            case 'system_alert':
                await this.handleSystemAlert(data)
                break
            case 'auction_started':
                await this.handleAuctionStarted(data)
                break
            case 'offer_selection_started':
                await this.handleOfferSelectionStarted(data)
                break
            case 'application_expired':
                await this.handleApplicationExpired(data)
                break
            case 'revenue_collection_failed':
                await this.handleRevenueCollectionFailed(data)
                break
            case 'revenue_collection_completed':
                await this.handleRevenueCollectionCompleted(data)
                break
            default:
                console.log(`⚠️ Unknown channel: ${channel}`)
        }
    }

    // Handle webhook events
    async handleWebhookEvent(event) {
        console.log('🌐 Webhook event received:', event)

        switch (event.type) {
            case 'deadline_approaching':
                await this.handleDeadlineApproaching(event.data)
                break
            case 'manual_status_transition':
                await this.handleManualStatusTransition(event.data)
                break
            case 'external_payment_received':
                await this.handleExternalPaymentReceived(event.data)
                break
            default:
                console.log(`⚠️ Unknown webhook event type: ${event.type}`)
        }
    }

    // Event handlers
    async handleApplicationStatusChange(data) {
        const { application_id, old_status, new_status } = data
        
        // Log the status change
        await this.logStatusTransition(application_id, old_status, new_status, 'Automated transition')
        
        // Create system alert for important transitions
        if (new_status === 'abandoned' || new_status === 'deal_expired') {
            await this.createSystemAlert(
                'revenue_anomaly',
                'medium',
                `Application ${new_status}`,
                `Application #${application_id} was ${new_status}`,
                'application',
                application_id
            )
        }
    }

    async handleRevenueCollectionChange(data) {
        const { collection_id, old_status, new_status, amount } = data
        
        // Log the revenue change
        console.log(`💰 Revenue collection ${collection_id} changed from ${old_status} to ${new_status}`)
        
        // Create system alert for failed collections
        if (new_status === 'failed') {
            await this.createSystemAlert(
                'revenue_anomaly',
                'high',
                'Revenue Collection Failed',
                `Collection #${collection_id} failed with amount ${amount} SAR`,
                'revenue',
                collection_id
            )
        }
    }

    async handleNewApplication(data) {
        const { application_id } = data
        
        // Schedule transition to pending_offers after brief delay
        setTimeout(async () => {
            await this.transitionApplication(
                application_id,
                'submitted',
                'pending_offers',
                'Automated transition: Application moved to auction phase'
            )
        }, 5000) // 5 second delay
    }

    async handleSystemAlert(data) {
        const { alert_id, alert_type, severity, title, message } = data
        
        // Send notifications based on alert type and severity
        if (severity === 'critical') {
            await this.sendCriticalAlert(title, message)
        } else if (severity === 'high') {
            await this.sendHighPriorityAlert(title, message)
        }
    }

    async handleAuctionStarted(data) {
        const { application_id, auction_end_time } = data
        
        // Schedule auction expiry check
        const auctionEnd = new Date(auction_end_time)
        const now = new Date()
        const timeUntilExpiry = auctionEnd.getTime() - now.getTime()
        
        if (timeUntilExpiry > 0) {
            setTimeout(async () => {
                await this.checkAuctionExpiry(application_id)
            }, timeUntilExpiry)
        }
    }

    async handleOfferSelectionStarted(data) {
        const { application_id, selection_end_time } = data
        
        // Schedule selection expiry check
        const selectionEnd = new Date(selection_end_time)
        const now = new Date()
        const timeUntilExpiry = selectionEnd.getTime() - now.getTime()
        
        if (timeUntilExpiry > 0) {
            setTimeout(async () => {
                await this.checkSelectionExpiry(application_id)
            }, timeUntilExpiry)
        }
    }

    async handleApplicationExpired(data) {
        const { application_id, status } = data
        
        // Archive expired applications after 30 days
        setTimeout(async () => {
            await this.archiveExpiredApplication(application_id)
        }, 30 * 24 * 60 * 60 * 1000) // 30 days
    }

    async handleRevenueCollectionFailed(data) {
        const { collection_id, failure_reason, retry_count } = data
        
        // Retry failed collections (up to 3 times)
        if (retry_count < 3) {
            setTimeout(async () => {
                await this.retryFailedCollection(collection_id)
            }, 60000) // 1 minute delay
        }
    }

    async handleRevenueCollectionCompleted(data) {
        const { collection_id, amount } = data
        
        // Verify the collection amount
        await this.verifyCollection(collection_id, amount === 25, 'Amount verified')
    }

    async handleDeadlineApproaching(data) {
        const { application_id, deadline_type, hours_remaining } = data
        
        await this.createSystemAlert(
            'deadline_approaching',
            'high',
            `${deadline_type} Ending Soon`,
            `Application #${application_id} ${deadline_type.toLowerCase()} ends in ${hours_remaining} hours`,
            'application',
            application_id
        )
    }

    async handleManualStatusTransition(data) {
        const { application_id, from_status, to_status, reason, admin_user_id } = data
        
        await this.transitionApplication(application_id, from_status, to_status, reason, admin_user_id)
    }

    async handleExternalPaymentReceived(data) {
        const { application_id, amount, payment_reference } = data
        
        // Create revenue collection record
        await this.createRevenueCollection(application_id, amount, payment_reference)
    }

    // Helper methods
    async logStatusTransition(applicationId, fromStatus, toStatus, reason, adminUserId = 1) {
        const client = await pool.connect()
        
        try {
            await client.query(`
                INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `, [applicationId, fromStatus, toStatus, adminUserId, reason])
        } finally {
            client.release()
        }
    }

    async transitionApplication(applicationId, fromStatus, toStatus, reason, adminUserId = 1) {
        const client = await pool.connect()
        
        try {
            await client.query('BEGIN')

            // Update submitted_applications table
            await client.query(
                'UPDATE submitted_applications SET status = $1, updated_at = NOW() WHERE application_id = $2',
                [toStatus, applicationId]
            )

            // Update pos_application table
            await client.query(
                'UPDATE pos_application SET status = $1 WHERE application_id = $2',
                [toStatus, applicationId]
            )

            // Log the transition
            await this.logStatusTransition(applicationId, fromStatus, toStatus, reason, adminUserId)

            await client.query('COMMIT')
            console.log(`✅ Transitioned application ${applicationId} from ${fromStatus} to ${toStatus}`)

        } catch (error) {
            await client.query('ROLLBACK')
            console.error(`❌ Error transitioning application ${applicationId}:`, error)
            throw error
        } finally {
            client.release()
        }
    }

    async createSystemAlert(alertType, severity, title, message, entityType = null, entityId = null) {
        const client = await pool.connect()
        
        try {
            await client.query(`
                INSERT INTO system_alerts (alert_type, severity, title, message, related_entity_type, related_entity_id, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [alertType, severity, title, message, entityType, entityId])

            console.log(`🚨 Created system alert: ${title}`)
        } catch (error) {
            console.error('❌ Error creating system alert:', error)
        } finally {
            client.release()
        }
    }

    async checkAuctionExpiry(applicationId) {
        const client = await pool.connect()
        
        try {
            const result = await client.query(`
                SELECT status, offers_count FROM submitted_applications 
                WHERE application_id = $1 AND status = 'pending_offers'
            `, [applicationId])

            if (result.rows.length > 0) {
                const app = result.rows[0]
                if (app.offers_count > 0) {
                    await this.transitionApplication(
                        applicationId,
                        'pending_offers',
                        'offer_received',
                        'Automated transition: Offers received, moving to selection phase'
                    )
                } else {
                    await this.transitionApplication(
                        applicationId,
                        'pending_offers',
                        'abandoned',
                        'Automated transition: Auction expired without offers'
                    )
                }
            }
        } finally {
            client.release()
        }
    }

    async checkSelectionExpiry(applicationId) {
        const client = await pool.connect()
        
        try {
            const result = await client.query(`
                SELECT status FROM submitted_applications 
                WHERE application_id = $1 AND status = 'offer_received'
            `, [applicationId])

            if (result.rows.length > 0) {
                await this.transitionApplication(
                    applicationId,
                    'offer_received',
                    'deal_expired',
                    'Automated transition: Offer selection period expired'
                )
            }
        } finally {
            client.release()
        }
    }

    async archiveExpiredApplication(applicationId) {
        const client = await pool.connect()
        
        try {
            await client.query('BEGIN')

            await client.query(
                'UPDATE submitted_applications SET status = $1, updated_at = NOW() WHERE application_id = $2',
                ['archived', applicationId]
            )

            await client.query(
                'UPDATE pos_application SET status = $1 WHERE application_id = $2',
                ['archived', applicationId]
            )

            await client.query('COMMIT')
            console.log(`🗄️ Archived application ${applicationId}`)

        } catch (error) {
            await client.query('ROLLBACK')
            console.error(`❌ Error archiving application ${applicationId}:`, error)
            throw error
        } finally {
            client.release()
        }
    }

    async retryFailedCollection(collectionId) {
        const client = await pool.connect()
        
        try {
            await client.query('BEGIN')

            // Increment retry count
            await client.query(`
                UPDATE revenue_collections 
                SET retry_count = retry_count + 1, updated_at = NOW()
                WHERE collection_id = $1
            `, [collectionId])

            // Mark as pending for retry
            await client.query(`
                UPDATE revenue_collections 
                SET status = 'pending', failure_reason = NULL, updated_at = NOW()
                WHERE collection_id = $1
            `, [collectionId])

            await client.query('COMMIT')
            console.log(`🔄 Retried collection ${collectionId}`)

        } catch (error) {
            await client.query('ROLLBACK')
            console.error(`❌ Error retrying collection ${collectionId}:`, error)
            throw error
        } finally {
            client.release()
        }
    }

    async verifyCollection(collectionId, isVerified, verificationNotes) {
        const client = await pool.connect()
        
        try {
            await client.query(`
                UPDATE revenue_collections 
                SET verified = $1, verification_notes = $2, verified_at = NOW(), updated_at = NOW()
                WHERE collection_id = $3
            `, [isVerified, verificationNotes, collectionId])

            console.log(`✅ Verified collection ${collectionId}: ${isVerified ? 'PASS' : 'FAIL'}`)

        } catch (error) {
            console.error(`❌ Error verifying collection ${collectionId}:`, error)
            throw error
        } finally {
            client.release()
        }
    }

    async createRevenueCollection(applicationId, amount, paymentReference) {
        const client = await pool.connect()
        
        try {
            await client.query(`
                INSERT INTO revenue_collections (application_id, bank_user_id, amount, status, payment_reference, timestamp)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `, [applicationId, 1, amount, 'collected', paymentReference])

            console.log(`💰 Created revenue collection for application ${applicationId}`)

        } catch (error) {
            console.error(`❌ Error creating revenue collection:`, error)
            throw error
        } finally {
            client.release()
        }
    }

    async sendCriticalAlert(title, message) {
        // Implementation for sending critical alerts (email, SMS, etc.)
        console.log(`🚨 CRITICAL ALERT: ${title} - ${message}`)
    }

    async sendHighPriorityAlert(title, message) {
        // Implementation for sending high priority alerts
        console.log(`⚠️ HIGH PRIORITY ALERT: ${title} - ${message}`)
    }

    // Get monitoring statistics
    async getMonitoringStats() {
        const client = await pool.connect()
        
        try {
            const stats = await client.query(`
                SELECT 
                    status,
                    COUNT(*) as count,
                    AVG(EXTRACT(EPOCH FROM (NOW() - pa.submitted_at))/3600) as avg_hours_since_submission
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                WHERE sa.status IN ('submitted', 'pending_offers', 'offer_received', 'completed', 'abandoned', 'deal_expired')
                GROUP BY status
                ORDER BY status
            `)

            return stats.rows
        } finally {
            client.release()
        }
    }

    // Get urgent applications
    async getUrgentApplications() {
        const client = await pool.connect()
        
        try {
            const urgent = await client.query(`
                SELECT 
                    sa.application_id,
                    sa.status,
                    sa.auction_end_time,
                    sa.offer_selection_end_time,
                    pa.trade_name,
                    pa.submitted_at,
                    CASE 
                        WHEN sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() + INTERVAL '1 hour' THEN 'auction_ending_soon'
                        WHEN sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() + INTERVAL '1 hour' THEN 'selection_ending_soon'
                        WHEN sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() THEN 'auction_expired'
                        WHEN sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() THEN 'selection_expired'
                        ELSE 'normal'
                    END as urgency_level
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                WHERE 
                    (sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() + INTERVAL '1 hour')
                    OR (sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() + INTERVAL '1 hour')
                    OR (sa.status = 'pending_offers' AND sa.auction_end_time <= NOW())
                    OR (sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW())
                ORDER BY 
                    CASE 
                        WHEN sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() + INTERVAL '1 hour' THEN 1
                        WHEN sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() + INTERVAL '1 hour' THEN 2
                        WHEN sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() THEN 3
                        WHEN sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() THEN 4
                        ELSE 5
                    END,
                    sa.auction_end_time ASC,
                    sa.offer_selection_end_time ASC
            `)

            return urgent.rows
        } finally {
            client.release()
        }
    }
}

// Create singleton instance
const eventDrivenMonitor = new EventDrivenMonitor()

module.exports = eventDrivenMonitor
