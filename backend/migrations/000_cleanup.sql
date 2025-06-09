-- Cleanup script to remove any partially inserted data
-- Run this before the corrected seed data

-- Clear all data in reverse order to avoid foreign key conflicts
DELETE FROM call_sessions;
DELETE FROM safety_alerts;
DELETE FROM emergency_incidents;
DELETE FROM walking_sessions;
DELETE FROM response_teams;
DELETE FROM users;

-- Reset sequences (optional, but good practice)
-- Note: Supabase uses UUID defaults, so no sequences to reset

SELECT 'Database cleaned successfully' AS status;
