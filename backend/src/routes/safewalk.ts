// SafeWalk AI Backend Routes
import express from 'express';

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

// In-memory storage (in production, use a database)
const walkingSessions: Map<string, WalkingSession> = new Map();
const safetyAlerts: Map<string, SafetyAlert> = new Map();

// Start a new walking session
router.post('/walking-session/start', (req, res) => {
  try {
    const session: WalkingSession = {
      ...req.body,
      userId: req.body.userId || 'mobile-user'
    };

    walkingSessions.set(session.id, session);

    // Emit to connected clients
    req.app.locals.io?.emit('walking-session-update', session);

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error starting walking session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start walking session'
    });
  }
});

// End a walking session
router.post('/walking-session/:sessionId/end', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = walkingSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const updatedSession = {
      ...session,
      ...req.body,
      status: 'completed' as const
    };

    walkingSessions.set(sessionId, updatedSession);

    // Emit to connected clients
    req.app.locals.io?.emit('walking-session-update', updatedSession);

    res.json({
      success: true,
      session: updatedSession
    });
  } catch (error) {
    console.error('Error ending walking session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end walking session'
    });
  }
});

// Get walking session
router.get('/walking-session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = walkingSessions.get(sessionId);

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
    console.error('Error getting walking session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get walking session'
    });
  }
});

// Report a safety alert
router.post('/safety-alert', (req, res) => {
  try {
    const alert: SafetyAlert = {
      ...req.body,
      id: req.body.id || Date.now().toString(),
      timestamp: req.body.timestamp || new Date().toISOString(),
      userId: req.body.userId || 'mobile-user',
      resolved: false
    };

    safetyAlerts.set(alert.id, alert);

    // Emit to connected clients
    req.app.locals.io?.emit('safety-alert', alert);

    // If high severity, trigger emergency escalation
    if (alert.severity === 'high') {
      handleEmergencyEscalation(alert, req);
    }

    res.json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('Error reporting safety alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to report safety alert'
    });
  }
});

// Resolve a safety alert
router.post('/safety-alert/:alertId/resolve', (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = safetyAlerts.get(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    const updatedAlert = {
      ...alert,
      resolved: true,
      resolvedAt: new Date().toISOString()
    };

    safetyAlerts.set(alertId, updatedAlert);

    res.json({
      success: true,
      alert: updatedAlert
    });
  } catch (error) {
    console.error('Error resolving safety alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve safety alert'
    });
  }
});

// Get all active walking sessions
router.get('/walking-sessions', (req, res) => {
  try {
    const sessions = Array.from(walkingSessions.values()).filter(session => 
      session.status === 'active'
    );

    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Error getting walking sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get walking sessions'
    });
  }
});

// Get all safety alerts (admin view)
router.get('/safety-alerts', (req, res) => {
  try {
    const userId = req.query.userId;
    let alerts = Array.from(safetyAlerts.values());
    
    // Filter by user if specified
    if (userId) {
      alerts = alerts.filter(alert => alert.userId === userId);
    }
    
    // Sort by timestamp (newest first)
    alerts = alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Limit to last 50 for performance
    alerts = alerts.slice(0, 50);

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error('Error getting safety alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get safety alerts'
    });
  }
});

// Handle emergency escalation
async function handleEmergencyEscalation(alert: SafetyAlert, req: any) {
  try {
    console.log('🚨 EMERGENCY ESCALATION:', alert);

    // In a real app, you would:
    // 1. Send SMS to trusted contacts
    // 2. Call emergency services if needed
    // 3. Send push notifications
    // 4. Log to monitoring system

    // For now, just emit an emergency alert
    req.app.locals.io?.emit('emergency-escalation', {
      alert,
      timestamp: new Date().toISOString(),
      status: 'escalated'
    });

    // You could integrate with services like:
    // - Twilio for SMS/calls
    // - Firebase for push notifications
    // - Emergency service APIs
    // - Location-based emergency services

  } catch (error) {
    console.error('Error in emergency escalation:', error);
  }
}

// AI Companion chat endpoint
router.post('/ai-companion/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

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
router.post('/walking-session/:sessionId/update-location', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { location } = req.body;
    const session = walkingSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const updatedSession = {
      ...session,
      route: [...session.route, location],
      lastUpdated: new Date().toISOString()
    };

    walkingSessions.set(sessionId, updatedSession);

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
