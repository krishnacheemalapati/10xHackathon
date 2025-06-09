// Call management API routes
import { Router } from 'express';
import { IAIService, INotificationService } from '../services/interfaces';
import { ScheduleCallRequest, ScheduleCallResponse } from '../types';
import { databaseService } from '../services/database/DatabaseService';

export function createCallRoutes(aiService: IAIService, notificationService: INotificationService): Router {
  const router = Router();

  // POST /api/calls/schedule - Schedule a new wellness check call
  router.post('/schedule', async (req, res) => {
    try {
      const { userId, scheduledTime, phoneNumber }: ScheduleCallRequest = req.body;

      if (!userId || !scheduledTime) {
        return res.status(400).json({
          error: 'Missing required fields: userId and scheduledTime are required'
        });
      }      const callSessionData = {
        user_id: userId,
        start_time: new Date(scheduledTime).toISOString(),
        threat_level: 'none' as const,
        conversation_history: [],
        emergency_triggered: false,
        ai_responses: 0,
        user_messages: 0
      };

      const { data: session, error } = await databaseService.createCallSession(callSessionData);      if (error || !session) {
        console.error('❌ Database error creating call session:', error);
        return res.status(500).json({
          error: 'Failed to schedule call',
          details: 'Database error'
        });
      }

      console.log(`📅 Call scheduled: ${session.id} for user ${userId} at ${scheduledTime}`);

      // Set up actual scheduling mechanism (cron job, queue, etc.)
      if (phoneNumber) {
        const message = `Your wellness check call has been scheduled for ${new Date(scheduledTime).toLocaleString()}. Stay safe!`;
        await notificationService.sendSMS(phoneNumber, message);
      }

      const response: ScheduleCallResponse = {
        callId: session.id,
        scheduledTime: new Date(scheduledTime),
        status: 'scheduled'
      };

      res.status(201).json(response);

    } catch (error) {
      console.error('❌ Call scheduling error:', error);
      res.status(500).json({
        error: 'Failed to schedule call',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  // GET /api/calls/:callId - Get call details
  router.get('/:callId', async (req, res) => {
    try {
      const { callId } = req.params;
      const { data: session, error } = await databaseService.getCallSession(callId);

      if (error || !session) {
        return res.status(404).json({
          error: 'Call not found',
          callId
        });
      }

      res.json(session);

    } catch (error) {
      console.error('❌ Get call error:', error);
      res.status(500).json({
        error: 'Failed to retrieve call',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });  // PUT /api/calls/:callId/status - Update call status (simulated since schema doesn't have status)
  router.put('/:callId/status', async (req, res) => {
    try {
      const { callId } = req.params;
      const { status } = req.body;

      const { data: session, error: getError } = await databaseService.getCallSession(callId);
      if (getError || !session) {
        return res.status(404).json({
          error: 'Call not found',
          callId
        });
      }

      const validStatuses = ['scheduled', 'calling', 'active', 'completed', 'failed', 'emergency_escalated'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          validStatuses
        });
      }

      // Since the database schema doesn't have a status field, we'll simulate status updates
      // by updating relevant fields based on the intended status
      const updateData: any = {};
      
      if (status === 'active' && !session.start_time) {
        updateData.start_time = new Date().toISOString();
      }
      
      if (status === 'completed' && !session.end_time) {
        updateData.end_time = new Date().toISOString();
        if (session.start_time) {
          const duration = Math.floor((new Date().getTime() - new Date(session.start_time).getTime()) / 1000);
          updateData.duration = duration;
        }
      }

      let updatedSession = session;
      if (Object.keys(updateData).length > 0) {
        const { data, error: updateError } = await databaseService.updateCallSession(callId, updateData);
        if (updateError || !data) {
          return res.status(500).json({
            error: 'Failed to update call status',
            details: 'Database update failed'
          });
        }
        updatedSession = data;
      }

      console.log(`🔄 Call ${callId} status updated to: ${status}`);

      // Add virtual status field to response
      res.json({
        ...updatedSession,
        status: status
      });

    } catch (error) {
      console.error('❌ Update call status error:', error);
      res.status(500).json({
        error: 'Failed to update call status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  // GET /api/calls/user/:userId - Get calls for a user
  router.get('/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { data: userSessions, error } = await databaseService.getCallSessionsByUser(userId);

      if (error) {
        console.error('❌ Database error getting user calls:', error);
        return res.status(500).json({
          error: 'Failed to retrieve user calls',
          details: 'Database error'
        });
      }

      const sessions = userSessions || [];

      res.json({
        userId,
        calls: sessions,
        totalCalls: sessions.length,
        activeCalls: sessions.filter(session => session.status === 'active').length,
        emergencyCalls: sessions.filter(session => session.emergency_triggered).length
      });

    } catch (error) {
      console.error('❌ Get user calls error:', error);
      res.status(500).json({
        error: 'Failed to retrieve user calls',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });  // POST /api/calls/:callId/start - Start a scheduled call
  router.post('/:callId/start', async (req, res) => {
    try {
      const { callId } = req.params;
      const { data: session, error: getError } = await databaseService.getCallSession(callId);

      if (getError || !session) {
        return res.status(404).json({
          error: 'Call not found',
          callId
        });
      }

      // Since schema doesn't have status, check if call already started by checking start_time
      if (session.start_time && new Date(session.start_time) <= new Date()) {
        return res.status(400).json({
          error: 'Call already started or in progress',
          callId
        });
      }

      const updateData = {
        start_time: new Date().toISOString()
      };

      const { data: updatedSession, error: updateError } = await databaseService.updateCallSession(callId, updateData);

      if (updateError || !updatedSession) {
        return res.status(500).json({
          error: 'Failed to start call',
          details: 'Database update failed'
        });
      }

      console.log(`📞 Starting call: ${callId}`);

      // Implement actual call initiation logic
      // This could involve WebRTC signaling, Twilio voice calls, etc.

      res.json({
        message: 'Call started successfully',
        callId,
        status: 'active',
        startTime: updatedSession.start_time
      });

    } catch (error) {
      console.error('❌ Start call error:', error);
      res.status(500).json({
        error: 'Failed to start call',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  // DELETE /api/calls/:callId - Cancel a call
  router.delete('/:callId', async (req, res) => {
    try {
      const { callId } = req.params;
      const { data: session, error: getError } = await databaseService.getCallSession(callId);

      if (getError || !session) {
        return res.status(404).json({
          error: 'Call not found',
          callId
        });
      }

      if (session.status === 'active') {
        return res.status(400).json({
          error: 'Cannot cancel an active call',
          callId,
          status: session.status
        });
      }

      const { error: deleteError } = await databaseService.deleteCallSession(callId);

      if (deleteError) {
        return res.status(500).json({
          error: 'Failed to cancel call',
          details: 'Database delete failed'
        });
      }

      console.log(`🗑️ Call cancelled: ${callId}`);

      res.json({
        message: 'Call cancelled successfully',
        callId
      });

    } catch (error) {
      console.error('❌ Cancel call error:', error);
      res.status(500).json({
        error: 'Failed to cancel call',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
