// Basic event-driven monitoring for admin API routes
const EventEmitter = require('events');

class EventDrivenMonitoring extends EventEmitter {
    constructor() {
        super();
        this.metrics = {
            requests: 0,
            errors: 0,
            responseTime: [],
            activeConnections: 0
        };
        this.alerts = [];
        this.webhooks = [];
    }

    recordRequest(responseTime = 0) {
        this.metrics.requests++;
        this.metrics.responseTime.push(responseTime);
        
        // Keep only last 100 response times
        if (this.metrics.responseTime.length > 100) {
            this.metrics.responseTime.shift();
        }

        this.emit('request', { responseTime });
    }

    recordError(error) {
        this.metrics.errors++;
        this.emit('error', error);
        
        // Check if we need to send alerts
        if (this.metrics.errors > 10) {
            this.createAlert('High error rate detected', 'error');
        }
    }

    createAlert(message, type = 'info') {
        const alert = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date(),
            acknowledged: false
        };
        
        this.alerts.push(alert);
        this.emit('alert', alert);
        
        // Send webhook if configured
        this.sendWebhooks(alert);
        
        return alert;
    }

    addWebhook(url, events = ['alert']) {
        this.webhooks.push({ url, events });
    }

    async sendWebhooks(data) {
        for (const webhook of this.webhooks) {
            try {
                await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
            } catch (error) {
                console.error('Failed to send webhook:', error);
            }
        }
    }

    getMetrics() {
        const avgResponseTime = this.metrics.responseTime.length > 0 
            ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length 
            : 0;

        return {
            ...this.metrics,
            avgResponseTime,
            errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0
        };
    }

    getAlerts() {
        return this.alerts.filter(alert => !alert.acknowledged);
    }

    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
        }
    }

    clearOldAlerts() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.alerts = this.alerts.filter(alert => alert.timestamp > oneDayAgo);
    }
}

// Export singleton instance
const monitoring = new EventDrivenMonitoring();

// Set up periodic cleanup
setInterval(() => {
    monitoring.clearOldAlerts();
}, 60 * 60 * 1000); // Every hour

module.exports = monitoring;
