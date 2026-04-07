-- Migration 003: Add sector and email fields to pos_application
-- These are collected during anonymous onboarding but were not being persisted.

ALTER TABLE pos_application
    ADD COLUMN IF NOT EXISTS sector TEXT,
    ADD COLUMN IF NOT EXISTS business_contact_email TEXT;
