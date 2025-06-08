// Call management API routes
import { Router } from 'express';
import { IAIService, INotificationService } from '../services/interfaces';
import { ScheduleCallRequest, ScheduleCallResponse, Call } from '../types';

export function createCallRoutes(aiService: IAIService, notificationService: INotificationService): Router {
  const router = Router();

  // In-memory store for demo (replace with database in production)
  const calls = new Map<string, Call>();

  // POST /api/calls/schedule - Schedule a new wellness check call
  router.post('/schedule', async (req, res) => {
    try {
      const { userId, scheduledTime, phoneNumber }: ScheduleCallRequest = req.body;

      if (!userId || !scheduledTime) {
        return res.status(400).json({
          error: 'Missing required fields: userId and scheduledTime are required'
        });
      }

      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const call: Call = {
        id: callId,
        userId,
        scheduledTime: new Date(scheduledTime),
        status: 'scheduled',
        threatLevel: 'none',
        conversationHistory: [],
        emergencyTriggered: false,
        metadata: {
          userLocation: 'Unknown',
          averageThreatLevel: 'none',
          aiResponseCount: 0
        }
      };

      calls.set(callId, call);

      console.log(`📅 Call scheduled: ${callId} for user ${userId} at ${scheduledTime}`);

      // TODO: Set up actual scheduling mechanism (cron job, queue, etc.)
      if (phoneNumber) {
        const message = `Your wellness check call has been scheduled for ${new Date(scheduledTime).toLocaleString()}. Stay safe!`;
        await notificationService.sendSMS(phoneNumber, message);
      }

      const response: ScheduleCallResponse = {
        callId,
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
  router.get('/:callId', (req, res) => {
    try {
      const { callId } = req.params;
      const call = calls.get(callId);

      if (!call) {
        return res.status(404).json({
          error: 'Call not found',
          callId
        });
      }

      res.json(call);

    } catch (error) {
      console.error('❌ Get call error:', error);
      res.status(500).json({
        error: 'Failed to retrieve call',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PUT /api/calls/:callId/status - Update call status
  router.put('/:callId/status', (req, res) => {
    try {
      const { callId } = req.params;
      const { status } = req.body;

      const call = calls.get(callId);
      if (!call) {
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

      call.status = status;
      
      if (status === 'active' && !call.actualStartTime) {
        call.actualStartTime = new Date();
      }
      
      if (status === 'completed' && !call.actualEndTime) {
        call.actualEndTime = new Date();
        call.metadata.callDuration = call.actualStartTime 
          ? Math.floor((new Date().getTime() - call.actualStartTime.getTime()) / 1000)
          : 0;
      }

      calls.set(callId, call);

      console.log(`🔄 Call ${callId} status updated to: ${status}`);

      res.json(call);

    } catch (error) {
      console.error('❌ Update call status error:', error);
      res.status(500).json({
        error: 'Failed to update call status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/calls/user/:userId - Get calls for a user
  router.get('/user/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const userCalls = Array.from(calls.values()).filter(call => call.userId === userId);

      res.json({
        userId,
        calls: userCalls,
        totalCalls: userCalls.length,
        activeCalls: userCalls.filter(call => call.status === 'active').length,
        emergencyCalls: userCalls.filter(call => call.emergencyTriggered).length
      });

    } catch (error) {
      console.error('❌ Get user calls error:', error);
      res.status(500).json({
        error: 'Failed to retrieve user calls',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/calls/:callId/start - Start a scheduled call
  router.post('/:callId/start', async (req, res) => {
    try {
      const { callId } = req.params;
      const call = calls.get(callId);

      if (!call) {
        return res.status(404).json({
          error: 'Call not found',
          callId
        });
      }

      if (call.status !== 'scheduled') {
        return res.status(400).json({
          error: 'Call cannot be started',
          currentStatus: call.status,
          callId
        });
      }

      call.status = 'calling';
      call.actualStartTime = new Date();
      calls.set(callId, call);

      console.log(`📞 Starting call: ${callId}`);

      // TODO: Implement actual call initiation logic
      // This could involve WebRTC signaling, Twilio voice calls, etc.

      res.json({
        message: 'Call started successfully',
        callId,
        status: call.status,
        startTime: call.actualStartTime
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
  router.delete('/:callId', (req, res) => {
    try {
      const { callId } = req.params;
      const call = calls.get(callId);

      if (!call) {
        return res.status(404).json({
          error: 'Call not found',
          callId
        });
      }

      if (call.status === 'active') {
        return res.status(400).json({
          error: 'Cannot cancel an active call',
          callId,
          status: call.status
        });
      }

      calls.delete(callId);

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
