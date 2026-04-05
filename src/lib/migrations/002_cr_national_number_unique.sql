-- Migration 002: Add UNIQUE constraint on pos_application.cr_national_number
-- CR national number is a one-of-a-kind identifier for a specific legal entity

ALTER TABLE pos_application
    ADD CONSTRAINT uq_pos_application_cr_national_number UNIQUE (cr_national_number);
