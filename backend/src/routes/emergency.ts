// Emergency response API routes
import { Router } from 'express';
import { INotificationService } from '../services/interfaces';
import { EmergencyContact } from '../types';
import { DatabaseService } from '../services/database/DatabaseService';

export function createEmergencyRoutes(notificationService: INotificationService): Router {
  const router = Router();
  const dbService = DatabaseService.getInstance();

  // POST /api/emergency/escalate - Escalate an incident to emergency services
  router.post('/escalate', async (req, res) => {
    try {
      const { callId, userId, threatLevel, description, location } = req.body;

      if (!callId || !userId || !threatLevel || !description) {
        return res.status(400).json({
          error: 'Missing required fields: callId, userId, threatLevel, and description are required'
        });
      }      // Create emergency incident data
      const incidentData = {
        user_id: userId,
        session_id: callId, // Using callId as session_id since they're related
        type: 'emergency_escalation',
        severity: threatLevel as 'low' | 'medium' | 'high' | 'critical',
        status: 'active' as const,
        location: location ?? 'Unknown location',
        notes: description
      };

      // Create incident in database
      const { data: incident, error } = await dbService.createEmergencyIncident(incidentData);

      if (error || !incident) {
        console.error('❌ Database error creating incident:', error);
        return res.status(500).json({
          error: 'Failed to create emergency incident',
          details: 'Database error'
        });
      }      // Get appropriate emergency contacts
      const emergencyContacts = await getEmergencyContacts(threatLevel, location ?? 'Unknown location');
      
      console.log(`🚨 EMERGENCY ESCALATION - Incident ${incident.id}`);
      console.log(`   Threat Level: ${threatLevel}`);
      console.log(`   Description: ${description}`);
      console.log(`   Contacting ${emergencyContacts.length} authorities`);

      // Contact emergency services
      await notificationService.notifyEmergencyContacts(emergencyContacts, incident);

      res.status(201).json({
        incidentId: incident.id,
        message: 'Emergency escalation initiated',
        contactedAuthorities: emergencyContacts.length,
        timestamp: incident.created_at
      });

    } catch (error) {
      console.error('❌ Emergency escalation error:', error);
      res.status(500).json({
        error: 'Failed to escalate emergency',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  // GET /api/emergency/incidents - Get all incidents
  router.get('/incidents', async (req, res) => {
    try {
      const { data: allIncidents, error } = await dbService.getEmergencyIncidents();
      
      if (error) {
        console.error('❌ Database error getting incidents:', error);
        return res.status(500).json({
          error: 'Failed to retrieve incidents',
          details: 'Database error'
        });
      }

      const incidents = allIncidents || [];

      res.json({
        incidents,
        totalIncidents: incidents.length,
        activeIncidents: incidents.filter((i: any) => i.status === 'active').length,
        resolvedIncidents: incidents.filter((i: any) => i.status === 'resolved').length
      });

    } catch (error) {
      console.error('❌ Get incidents error:', error);
      res.status(500).json({
        error: 'Failed to retrieve incidents',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/emergency/incidents/:incidentId - Get specific incident
  router.get('/incidents/:incidentId', async (req, res) => {
    try {
      const { incidentId } = req.params;
      const { data: incident, error } = await dbService.getEmergencyIncident(incidentId);

      if (error || !incident) {
        return res.status(404).json({
          error: 'Incident not found',
          incidentId
        });
      }

      res.json(incident);

    } catch (error) {
      console.error('❌ Get incident error:', error);
      res.status(500).json({
        error: 'Failed to retrieve incident',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  // PUT /api/emergency/incidents/:incidentId/resolve - Mark incident as resolved
  router.put('/incidents/:incidentId/resolve', async (req, res) => {
    try {
      const { incidentId } = req.params;
      const { notes } = req.body;
        // Update incident status to resolved
      const { data: incident, error } = await dbService.updateEmergencyIncident(incidentId, {
        status: 'resolved',
        notes: notes ?? 'Incident resolved',
        resolution_time: Date.now()
      });

      if (error || !incident) {
        return res.status(404).json({
          error: 'Incident not found or failed to update',
          incidentId
        });
      }

      console.log(`✅ Incident resolved: ${incidentId}`);

      res.json({
        message: 'Incident resolved',
        incidentId,
        resolvedAt: new Date().toISOString(),
        notes: incident.notes
      });

    } catch (error) {
      console.error('❌ Resolve incident error:', error);
      res.status(500).json({
        error: 'Failed to resolve incident',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/emergency/test-notification - Test emergency notification system
  router.post('/test-notification', async (req, res) => {
    try {
      const { phoneNumber, testType = 'sms' } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          error: 'Phone number is required for testing'
        });
      }

      const testMessage = 'TEST: This is a test notification from the AI Video Call Platform emergency system. No action required.';

      let success = false;
      if (testType === 'sms') {
        success = await notificationService.sendSMS(phoneNumber, testMessage);
      } else if (testType === 'call') {
        success = await notificationService.makeCall(phoneNumber, testMessage);
      }

      res.json({
        success,
        testType,
        phoneNumber,
        message: success ? 'Test notification sent successfully' : 'Test notification failed',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Test notification error:', error);
      res.status(500).json({
        error: 'Failed to send test notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}

// Helper function to get appropriate emergency contacts based on threat level
async function getEmergencyContacts(threatLevel: string, location: string): Promise<EmergencyContact[]> {
  const baseContacts: EmergencyContact[] = [
    {
      type: 'police',
      name: 'Emergency Services',
      phoneNumber: '911',
      reason: 'General emergency response',
      priority: 1
    }
  ];

  switch (threatLevel) {
    case 'critical':
      return [
        ...baseContacts,
        {
          type: 'medical',
          name: 'Emergency Medical Services',
          phoneNumber: '911',
          reason: 'Critical situation requiring immediate medical response',
          priority: 1
        },
        {
          type: 'crisis',
          name: 'Crisis Intervention Team',
          phoneNumber: '988',
          reason: 'Mental health crisis requiring specialized intervention',
          priority: 2
        }
      ];

    case 'high':
      return [
        ...baseContacts,
        {
          type: 'crisis',
          name: 'Crisis Lifeline',
          phoneNumber: '988',
          reason: 'High-risk situation requiring crisis support',
          priority: 2
        }
      ];

    case 'medium':
      return [
        {
          type: 'crisis',
          name: 'Crisis Lifeline',
          phoneNumber: '988',
          reason: 'Wellness check with concerning indicators',
          priority: 1
        }
      ];

    default:
      return baseContacts;
  }
}
