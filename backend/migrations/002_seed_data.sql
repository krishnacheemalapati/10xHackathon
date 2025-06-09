-- AI Video Call Platform - Seed Data
-- This migration populates the database with sample data for development and testing

-- Insert sample users
INSERT INTO users (id, name, email, phone, status, total_sessions, emergency_contacts, risk_level, total_distance, avg_session) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Sarah Chen', 'sarah.chen@example.com', '+1-555-0101', 'active', 24, ARRAY['+1-555-1001', '+1-555-1002'], 'Low', '45.2 km', '22 min'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Michael Rodriguez', 'michael.r@example.com', '+1-555-0102', 'walking', 18, ARRAY['+1-555-1003'], 'Medium', '32.8 km', '18 min'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Emily Johnson', 'emily.j@example.com', '+1-555-0103', 'offline', 31, ARRAY['+1-555-1004', '+1-555-1005'], 'Low', '78.5 km', '25 min'),
  ('550e8400-e29b-41d4-a716-446655440004', 'David Kim', 'david.kim@example.com', '+1-555-0104', 'emergency', 12, ARRAY['+1-555-1006'], 'High', '28.3 km', '15 min'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Jessica Brown', 'jessica.b@example.com', '+1-555-0105', 'active', 42, ARRAY['+1-555-1007', '+1-555-1008'], 'Low', '96.7 km', '28 min'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Alex Thompson', 'alex.t@example.com', '+1-555-0106', 'walking', 8, ARRAY['+1-555-1009'], 'Medium', '15.2 km', '12 min')
ON CONFLICT (id) DO NOTHING;

-- Insert sample response teams
INSERT INTO response_teams (id, name, status, location, contact_info, specializations) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Emergency Response Team Alpha', 'available', 'Downtown Campus', '{"phone": "+1-555-2001", "radio": "CH-1"}', ARRAY['medical', 'security']),
  ('660e8400-e29b-41d4-a716-446655440002', 'Campus Security Beta', 'responding', 'North Campus', '{"phone": "+1-555-2002", "radio": "CH-2"}', ARRAY['security', 'escort']),
  ('660e8400-e29b-41d4-a716-446655440003', 'Medical Team Gamma', 'available', 'Health Center', '{"phone": "+1-555-2003", "radio": "CH-3"}', ARRAY['medical', 'trauma']),
  ('660e8400-e29b-41d4-a716-446655440004', 'Night Patrol Delta', 'busy', 'South Campus', '{"phone": "+1-555-2004", "radio": "CH-4"}', ARRAY['security', 'patrol'])
ON CONFLICT (id) DO NOTHING;

-- Insert sample walking sessions
INSERT INTO walking_sessions (id, user_id, start_time, end_time, status, destination_name, route, last_location, ai_companion_active, threat_level, duration, distance) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '30 minutes', NULL, 'active', 'Library', 
   '[{"lat": 40.7128, "lng": -74.0060, "timestamp": "2024-01-15T10:00:00Z"}, {"lat": 40.7138, "lng": -74.0050, "timestamp": "2024-01-15T10:05:00Z"}]'::JSONB,
   '{"lat": 40.7138, "lng": -74.0050, "timestamp": "2024-01-15T10:05:00Z"}'::JSONB, true, 'low', NULL, NULL),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '45 minutes', NULL, 'active', 'Dormitory Building C', 
   '[{"lat": 40.7148, "lng": -74.0040, "timestamp": "2024-01-15T09:45:00Z"}]'::JSONB,
   '{"lat": 40.7148, "lng": -74.0040, "timestamp": "2024-01-15T09:45:00Z"}'::JSONB, true, 'medium', NULL, NULL),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 'completed', 'Student Center', 
   '[{"lat": 40.7120, "lng": -74.0070, "timestamp": "2024-01-15T08:00:00Z"}, {"lat": 40.7130, "lng": -74.0060, "timestamp": "2024-01-15T08:30:00Z"}, {"lat": 40.7140, "lng": -74.0050, "timestamp": "2024-01-15T09:00:00Z"}]'::JSONB,
   '{"lat": 40.7140, "lng": -74.0050, "timestamp": "2024-01-15T09:00:00Z"}'::JSONB, false, 'none', 3600, 1200)
ON CONFLICT (id) DO NOTHING;

-- Insert sample emergency incidents
INSERT INTO emergency_incidents (id, user_id, session_id, type, severity, status, location, latitude, longitude, responder_id, response_time, notes) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', NULL, 'Suspicious Activity', 'high', 'responding', 'Parking Lot D', 40.7125, -74.0065, '550e8400-e29b-41d4-a716-446655440001', 120, 'User reported being followed by unknown individual'),
  ('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'Path Obstruction', 'medium', 'resolved', 'Main Walkway', 40.7135, -74.0055, '550e8400-e29b-41d4-a716-446655440001', 90, 'Fallen tree blocking path, rerouted user safely')
ON CONFLICT (id) DO NOTHING;

-- Insert sample safety alerts
INSERT INTO safety_alerts (id, user_id, session_id, type, severity, description, location, resolved, resolved_by, response_time) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'Unusual Noise', 'medium', 'Loud construction noise detected in area', '{"lat": 40.7138, "lng": -74.0050}'::JSONB, true, '550e8400-e29b-41d4-a716-446655440001', 60),
  ('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002', 'Poor Lighting', 'low', 'Street lamp out on route', '{"lat": 40.7148, "lng": -74.0040}'::JSONB, false, NULL, NULL),
  ('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', NULL, 'Panic Button', 'critical', 'Emergency panic button activated', '{"lat": 40.7125, "lng": -74.0065}'::JSONB, false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert sample call sessions
INSERT INTO call_sessions (id, user_id, walking_session_id, start_time, end_time, duration, threat_level, conversation_history, ai_responses, user_messages, emergency_triggered) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '25 minutes', NULL, NULL, 'low', 
   '[{"timestamp": "2024-01-15T10:05:00Z", "sender": "user", "message": "Hi, starting my walk to the library"}, {"timestamp": "2024-01-15T10:05:30Z", "sender": "ai", "message": "Hello! I''m here to keep you company. How are you feeling about your route today?"}]'::JSONB, 8, 6, false),
  ('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '40 minutes', NULL, NULL, 'medium',
   '[{"timestamp": "2024-01-15T09:50:00Z", "sender": "user", "message": "I think someone is following me"}, {"timestamp": "2024-01-15T09:50:15Z", "sender": "ai", "message": "I understand your concern. Can you describe what you''re seeing? I''m alerting our safety team as a precaution."}]'::JSONB, 12, 8, false),
  ('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 3600, 'none',
   '[{"timestamp": "2024-01-15T08:00:00Z", "sender": "user", "message": "Starting my walk to student center"}, {"timestamp": "2024-01-15T08:00:15Z", "sender": "ai", "message": "Great! I''ll be with you. The weather looks nice for a walk today."}, {"timestamp": "2024-01-15T09:00:00Z", "sender": "user", "message": "Made it safely, thanks!"}, {"timestamp": "2024-01-15T09:00:10Z", "sender": "ai", "message": "Wonderful! Have a great day!"}]'::JSONB, 15, 12, false)
ON CONFLICT (id) DO NOTHING;

-- Update response teams with current incidents
UPDATE response_teams 
SET current_incident_id = '880e8400-e29b-41d4-a716-446655440001' 
WHERE id = '660e8400-e29b-41d4-a716-446655440002';

-- Update emergency incidents with responder assignments
UPDATE emergency_incidents 
SET resolved_at = NOW() - INTERVAL '30 minutes', resolution_time = 1800
WHERE status = 'resolved';

-- Update safety alerts resolved timestamps
UPDATE safety_alerts 
SET resolved_at = NOW() - INTERVAL '45 minutes'
WHERE resolved = true;
