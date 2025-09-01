# Background Task Connection Exhaustion Fixes

## Problem Description

The background task manager was causing database connection exhaustion due to:
- **High connection pool limits** (max: 100, min: 20)
- **Frequent task execution** (every 5 minutes)
- **Improper connection cleanup** after task completion
- **Missing connection timeout handling**
- **No retry logic with exponential backoff**

## Solutions Implemented

### 1. Reduced Connection Pool Limits
```javascript
// Before (src/lib/db.cjs)
max: 100, // Too high - causes exhaustion
min: 20,  // Too high - keeps unnecessary connections

// After
max: 20,  // Reasonable limit for background tasks
min: 5,   // Minimal connections when idle
```

### 2. Reduced Task Frequency
```javascript
// Before
statusTransitions: 5 * 60 * 1000,    // Every 5 minutes
auctionMonitor: 15 * 60 * 1000,      // Every 15 minutes
healthCheck: 30 * 60 * 1000          // Every 30 minutes

// After
statusTransitions: 15 * 60 * 1000,   // Every 15 minutes
auctionMonitor: 30 * 60 * 1000,      // Every 30 minutes
healthCheck: 60 * 60 * 1000          // Every 60 minutes
```

### 3. Dedicated Connection Manager
Created `src/lib/background-connection-manager.js` with:
- **Automatic connection tracking** and cleanup
- **Timeout-based connection management** (30 seconds max)
- **Stale connection detection** and cleanup
- **Emergency cleanup** capabilities

### 4. Enhanced Task Execution
```javascript
// New retry logic with exponential backoff
async executeWithConnectionRetry(taskName, taskFunction) {
    let attempts = 0
    while (attempts < this.maxRetries) {
        try {
            const result = await backgroundConnectionManager.executeWithConnection(taskName, taskFunction)
            return result
        } catch (error) {
            attempts++
            if (attempts >= this.maxRetries) throw error
            
            // Exponential backoff
            const delay = this.retryDelay * Math.pow(2, attempts - 1)
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }
}
```

### 5. Proper Connection Cleanup
- **Always release connections** in finally blocks
- **Automatic cleanup** of stale connections every 5 minutes
- **Emergency cleanup** methods for critical situations

## New Architecture

```
Background Task Manager
├── Task Scheduler (reduced frequency)
├── Connection Manager (dedicated)
│   ├── Connection Pooling
│   ├── Timeout Management
│   ├── Stale Detection
│   └── Emergency Cleanup
└── Retry Logic (exponential backoff)
```

## Usage

### Starting Background Tasks
```bash
# Via API
POST /api/admin/background-jobs/status
{
  "action": "start"
}

# Via component
<BackgroundTaskMonitor />
```

### Monitoring Status
```bash
GET /api/admin/background-jobs/status
```

### Emergency Actions
```bash
# Force cleanup
POST /api/admin/background-jobs/status
{
  "action": "cleanup"
}

# Emergency connection cleanup
POST /api/admin/background-jobs/status
{
  "action": "emergency_cleanup"
}
```

## Monitoring Dashboard

The `BackgroundTaskMonitor` component provides:
- **Real-time status** of background tasks
- **Connection pool metrics** (total, idle, waiting)
- **Background connection tracking** (active, stale)
- **Control panel** for starting/stopping tasks
- **Emergency actions** for connection cleanup
- **Automated recommendations** based on metrics

## Key Benefits

1. **Prevents Connection Exhaustion**
   - Reduced pool limits
   - Proper cleanup mechanisms
   - Timeout handling

2. **Better Resource Management**
   - Dedicated connection manager
   - Automatic stale connection cleanup
   - Emergency cleanup capabilities

3. **Improved Reliability**
   - Retry logic with exponential backoff
   - Better error handling
   - Connection health monitoring

4. **Operational Visibility**
   - Real-time monitoring dashboard
   - Connection metrics and alerts
   - Automated recommendations

## Configuration

### Environment Variables
```bash
# Database connection
DATABASE_URL=postgresql://user:pass@host:port/db

# Connection pool settings (optional overrides)
DB_MAX_CONNECTIONS=20
DB_MIN_CONNECTIONS=5
DB_IDLE_TIMEOUT=60000
DB_CONNECTION_TIMEOUT=15000
```

### Task Intervals (configurable)
```javascript
this.taskIntervals = {
    statusTransitions: 15 * 60 * 1000, // 15 minutes
    auctionMonitor: 30 * 60 * 1000,    // 30 minutes
    healthCheck: 60 * 60 * 1000        // 60 minutes
}
```

## Troubleshooting

### Connection Pool Exhaustion
1. Check current pool status via monitoring dashboard
2. Use "Emergency Cleanup" if needed
3. Monitor for connection leaks
4. Consider reducing concurrent load

### Background Task Failures
1. Check task logs for specific errors
2. Verify database connectivity
3. Use "Force Cleanup" to reset tasks
4. Monitor retry attempts and delays

### Performance Issues
1. Review task execution frequency
2. Monitor connection pool utilization
3. Check for long-running queries
4. Consider connection pool tuning

## Best Practices

1. **Monitor Regularly**: Use the dashboard to track connection health
2. **Clean Up Proactively**: Run cleanup operations during low-traffic periods
3. **Scale Gradually**: Increase task frequency only after monitoring shows stability
4. **Emergency Procedures**: Have emergency cleanup procedures documented
5. **Logging**: Monitor logs for connection-related warnings and errors

## Future Improvements

1. **Dynamic Scaling**: Adjust pool size based on load
2. **Predictive Cleanup**: Proactively clean connections before exhaustion
3. **Load Balancing**: Distribute tasks across multiple database instances
4. **Metrics Export**: Export metrics to monitoring systems (Prometheus, etc.)
5. **Automated Alerts**: Set up alerts for connection pool issues
