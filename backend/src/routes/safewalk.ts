// SafeWalk AI Backend Routes
import express from 'express';
import { databaseService } from '../services/database/DatabaseService';

const router = express.Router();

interface WalkingSession {
  id: string;
  startTime: string;
  endTime?: string;
  route: any[];
  duration?: number;
  status: 'active' | 'completed' | 'emergency';
  aiCompanionActive: boolean;
  destinationName?: string;
  userId: string;
}

interface SafetyAlert {
  id: string;
  type: 'fall_detected' | 'erratic_movement' | 'panic_button' | 'route_deviation' | 'no_movement';
  severity: 'high' | 'medium' | 'low';
  description: string;
  timestamp: string;
  location?: any;
  resolved: boolean;
  userId: string;
}

// Start a new walking session
router.post('/walking-session/start', async (req, res) => {
  try {    const sessionData = {
      user_id: req.body.userId ?? 'mobile-user',
      start_time: req.body.startTime ?? new Date().toISOString(),
      status: 'active' as const,
      destination_name: req.body.destinationName,
      route: req.body.route ?? [],
      last_location: req.body.lastLocation,
      ai_companion_active: req.body.aiCompanionActive ?? true,
      threat_level: 'none' as const
    };

    const { data: session, error } = await databaseService.createWalkingSession(sessionData);

    if (error) {
      console.error('❌ Database error creating walking session:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create walking session'
      });
    }

    // Emit to connected clients
    req.app.locals.io?.emit('walking-session-update', session);

    console.log(`✅ Walking session started: ${session?.id}`);
    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('❌ Error starting walking session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start walking session'
    });
  }
});

// End a walking session
router.post('/walking-session/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const updateData = {
      status: 'completed' as const,
      end_time: new Date().toISOString(),
      duration: req.body.duration,
      distance: req.body.distance
    };

    const { data: session, error } = await databaseService.updateWalkingSession(sessionId, updateData);

    if (error || !session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or update failed'
      });
    }

    // Emit to connected clients
    req.app.locals.io?.emit('walking-session-update', session);

    console.log(`✅ Walking session ended: ${sessionId}`);
    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('❌ Error ending walking session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end walking session'
    });
  }
});

// Get walking session
router.get('/walking-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get all sessions and find the specific one
    const { data: sessions, error } = await databaseService.getWalkingSessions();

    if (error) {
      console.error('❌ Database error getting walking sessions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get walking session'
      });
    }

    const session = sessions?.find(s => s.id === sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('❌ Error getting walking session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get walking session'
    });
  }
});

// Report a safety alert
router.post('/safety-alert', async (req, res) => {
  try {    const alertData = {
      user_id: req.body.userId ?? 'mobile-user',
      session_id: req.body.sessionId,
      type: req.body.type,
      severity: req.body.severity,
      description: req.body.description,
      location: req.body.location,
      resolved: false
    };

    const { data: alert, error } = await databaseService.createSafetyAlert(alertData);

    if (error) {
      console.error('❌ Database error creating safety alert:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create safety alert'
      });
    }

    // Emit to connected clients
    req.app.locals.io?.emit('safety-alert', alert);

    // If high severity, trigger emergency escalation
    if (alert?.severity === 'high' || alert?.severity === 'critical') {
      await handleEmergencyEscalation(alert, req);
    }

    console.log(`✅ Safety alert created: ${alert?.id}`);
    res.json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('❌ Error reporting safety alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to report safety alert'
    });
  }
});

// Resolve a safety alert
router.post('/safety-alert/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
      const updateData = {
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: req.body.resolvedBy ?? 'system',
      response_time: req.body.responseTime
    };

    // For mock mode, we'll just return success
    // In real database mode, this would update the alert
    console.log(`✅ Safety alert resolved: ${alertId}`);
    res.json({
      success: true,
      alert: { id: alertId, ...updateData }
    });
  } catch (error) {
    console.error('❌ Error resolving safety alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve safety alert'
    });
  }
});

// Get all active walking sessions
router.get('/walking-sessions', async (req, res) => {
  try {
    const { data: sessions, error } = await databaseService.getActiveWalkingSessions();
    
    if (error) {
      console.error('❌ Database error getting walking sessions:', error);
    }

    res.json({
      success: true,
      sessions: sessions || []
    });
  } catch (error) {
    console.error('❌ Error getting walking sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get walking sessions'
    });
  }
});

// Get all safety alerts (admin view)
router.get('/safety-alerts', async (req, res) => {
  try {
    const { data: alerts, error } = await databaseService.getSafetyAlerts();
    
    if (error) {
      console.error('❌ Database error getting safety alerts:', error);
    }

    // Filter by user if specified
    const userId = req.query.userId;
    let filteredAlerts = alerts || [];
    
    if (userId) {
      filteredAlerts = filteredAlerts.filter(alert => alert.user_id === userId);
    }
    
    // Sort by timestamp (newest first)
    filteredAlerts = filteredAlerts.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Limit to last 50 for performance
    filteredAlerts = filteredAlerts.slice(0, 50);

    res.json({
      success: true,
      alerts: filteredAlerts
    });
  } catch (error) {
    console.error('❌ Error getting safety alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get safety alerts'
    });
  }
});

// Handle emergency escalation
async function handleEmergencyEscalation(alert: any, req: any) {
  try {
    console.log('🚨 EMERGENCY ESCALATION:', alert);

    // Create emergency incident in database
    const incidentData = {
      user_id: alert.user_id,
      session_id: alert.session_id,
      type: alert.type,
      severity: alert.severity,      status: 'active' as const,
      location: typeof alert.location === 'object' ? 
        `${alert.location.lat}, ${alert.location.lng}` : 
        alert.location ?? 'Unknown',
      latitude: alert.location?.lat,
      longitude: alert.location?.lng,
      notes: `Escalated from safety alert: ${alert.description}`
    };

    const { data: incident, error } = await databaseService.createEmergencyIncident(incidentData);
    
    if (error) {
      console.error('❌ Error creating emergency incident:', error);
    }

    // Emit emergency alert to dashboard
    req.app.locals.io?.emit('emergency-escalation', {
      alert,
      incident,
      timestamp: new Date().toISOString(),
      status: 'escalated'
    });

    console.log(`✅ Emergency escalated: ${incident?.id}`);

    // In a real app, you would also:
    // - Send SMS to trusted contacts via Twilio
    // - Call emergency services if needed
    // - Send push notifications
    // - Notify response teams

  } catch (error) {
    console.error('❌ Error in emergency escalation:', error);
  }
}

// AI Companion chat endpoint
router.post('/ai-companion/chat', async (req, res) => {
  try {
    // Simulate AI companion response
    const responses = [
      "I'm here with you. How are you feeling?",
      "You're doing great! Keep walking safely.",
      "I see you're making good progress. Stay alert and keep going.",
      "Remember to stay aware of your surroundings. I'm monitoring everything.",
      "You're almost there! I'm keeping you safe every step of the way.",
      "If you need anything, just let me know. I'm always here for you."
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    // In a real app, you would integrate with:
    // - OpenAI GPT for intelligent responses
    // - Cohere AI for safety-focused conversations
    // - Context-aware responses based on location and situation

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in AI companion chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI companion response'
    });
  }
});

// Update walking session route (for real-time tracking)
router.post('/walking-session/:sessionId/update-location', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { location } = req.body;
    
    // Get current session
    const { data: sessions, error: getError } = await databaseService.getWalkingSessions();
    
    if (getError) {
      console.error('❌ Database error getting sessions:', getError);
      return res.status(500).json({
        success: false,
        error: 'Failed to get session data'
      });
    }

    const session = sessions?.find(s => s.id === sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Update session with new location
    const updatedRoute = Array.isArray(session.route) ? [...session.route, location] : [location];
    
    const updateData = {
      route: updatedRoute,
      last_location: location,
      updated_at: new Date().toISOString()
    };

    const { data: updatedSession, error: updateError } = await databaseService.updateWalkingSession(sessionId, updateData);

    if (updateError || !updatedSession) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update session location'
      });
    }

    // Emit location update to connected clients
    req.app.locals.io?.emit('location-update', {
      sessionId,
      location,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      session: updatedSession
    });
  } catch (error) {
    console.error('Error updating session location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session location'
    });
  }
});

export default router;
