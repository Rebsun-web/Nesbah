-- Migration 007: Create analytics_events table
-- Backs AnalyticsService (src/lib/analytics/analytics-service.js), which records
-- application views, offer submissions, and lead purchases. The table was referenced
-- in code but never created, causing "relation analytics_events does not exist" errors.
-- Append-only event log; no hard FKs so analytics writes can never block the main flow.

CREATE TABLE IF NOT EXISTS analytics_events (
    event_id        SERIAL PRIMARY KEY,
    event_type      VARCHAR(50) NOT NULL,
    application_id  INTEGER,
    bank_user_id    INTEGER,
    offer_id        INTEGER,
    timestamp       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_application_id ON analytics_events (application_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_bank_user_id   ON analytics_events (bank_user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type     ON analytics_events (event_type);
