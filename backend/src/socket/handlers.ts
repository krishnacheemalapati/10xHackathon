// WebSocket handlers for real-time communication
import { Server as SocketIOServer, Socket } from 'socket.io';
import { IAIService, IVisionService, INotificationService } from '../services/interfaces';
import { ChatMessage, ThreatAssessment } from '../types';

interface SocketServices {
  aiService: IAIService;
  visionService: IVisionService;
  notificationService: INotificationService;
}

interface CallSession {
  callId: string;
  userId: string;
  socketId: string;
  startTime: Date;
  lastActivity: Date;
  threatLevel: string;
  conversationHistory: ChatMessage[];
}

// Active call sessions
const activeSessions = new Map<string, CallSession>();

export function setupSocketHandlers(io: SocketIOServer, services: SocketServices): void {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a call session
    socket.on('join-call', (data: { callId: string; userId: string }) => {
      try {
        const { callId, userId } = data;
        
        console.log(`📞 User ${userId} joining call ${callId} via socket ${socket.id}`);
        
        // Create or update session
        const session: CallSession = {
          callId,
          userId,
          socketId: socket.id,
          startTime: new Date(),
          lastActivity: new Date(),
          threatLevel: 'none',
          conversationHistory: []
        };
        
        activeSessions.set(callId, session);
        socket.join(callId);
        
        // Notify client of successful join
        socket.emit('call-joined', {
          callId,
          userId,
          sessionId: socket.id,
          timestamp: new Date().toISOString()
        });

        // Send initial AI greeting
        setTimeout(async () => {
          try {
            const aiResponse = await services.aiService.generateResponse(
              'Hello! This is your scheduled wellness check. How are you feeling today?',
              {
                callId,
                userId,
                conversationHistory: [],
                currentThreatLevel: 'none',
                callDuration: 0
              }
            );

            socket.emit('ai-message', {
              message: aiResponse.message,
              timestamp: new Date().toISOString(),
              type: 'greeting'
            });
          } catch (error) {
            console.error('❌ Failed to send AI greeting:', error);
          }
        }, 1000);

      } catch (error) {
        console.error('❌ Join call error:', error);
        socket.emit('error', { message: 'Failed to join call' });
      }
    });

    // Handle chat messages
    socket.on('chat-message', async (data: { callId: string; message: string; videoFrame?: string }) => {
      try {
        const { callId, message, videoFrame } = data;
        const session = activeSessions.get(callId);
        
        if (!session) {
          socket.emit('error', { message: 'Call session not found' });
          return;
        }

        console.log(`💬 Chat message in call ${callId}: "${message}"`);
        
        // Update session activity
        session.lastActivity = new Date();
        
        // Create user message
        const userMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          callId,
          role: 'user',
          content: message,
          timestamp: new Date()
        };
        
        session.conversationHistory.push(userMessage);

        // Analyze threat from text
        const textThreatAssessment = await services.aiService.assessThreatFromText(message);
        
        // Analyze video frame if provided
        let visualThreatAssessment: ThreatAssessment | null = null;
        if (videoFrame) {
          console.log(`🎥 Analyzing video frame for call ${callId}`);
          visualThreatAssessment = await services.visionService.assessSafety(videoFrame);
        }

        // Determine overall threat level
        const threatLevels = ['none', 'low', 'medium', 'high', 'critical'];
        const textLevel = threatLevels.indexOf(textThreatAssessment.level);
        const visualLevel = visualThreatAssessment ? threatLevels.indexOf(visualThreatAssessment.level) : -1;
        const overallThreatLevel = threatLevels[Math.max(textLevel, visualLevel)] || 'none';
        
        session.threatLevel = overallThreatLevel;
        userMessage.threatAssessment = textThreatAssessment;

        // Generate AI response
        const context = {
          callId,
          userId: session.userId,
          conversationHistory: session.conversationHistory,
          currentThreatLevel: overallThreatLevel,
          callDuration: Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000)
        };

        const aiResponse = await services.aiService.generateResponse(message, context);
        
        // Create AI message
        const aiMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          callId,
          role: 'assistant',
          content: aiResponse.message,
          timestamp: new Date()
        };
        
        session.conversationHistory.push(aiMessage);
        activeSessions.set(callId, session);

        // Emit responses
        socket.emit('ai-message', {
          message: aiResponse.message,
          timestamp: aiMessage.timestamp.toISOString(),
          threatLevel: overallThreatLevel,
          confidence: textThreatAssessment.confidence
        });

        // Check for emergency escalation
        if (textThreatAssessment.shouldEscalate || (visualThreatAssessment?.shouldEscalate)) {
          console.log(`🚨 EMERGENCY: Escalating call ${callId} - Threat level: ${overallThreatLevel}`);
          
          socket.emit('emergency-alert', {
            threatLevel: overallThreatLevel,
            reason: textThreatAssessment.reasoning,
            timestamp: new Date().toISOString()
          });

          // Notify other connected clients (dashboard, monitoring)
          socket.to(callId).emit('emergency-escalated', {
            callId,
            userId: session.userId,
            threatLevel: overallThreatLevel,
            message: message,
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error('❌ Chat message handling error:', error);
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    // Handle video frame analysis only
    socket.on('video-frame', async (data: { callId: string; frameData: string }) => {
      try {
        const { callId, frameData } = data;
        const session = activeSessions.get(callId);
        
        if (!session) {
          socket.emit('error', { message: 'Call session not found' });
          return;
        }

        const visualAnalysis = await services.visionService.analyzeVideoFrame(frameData);
        const threatAssessment = await services.visionService.assessSafety(frameData);

        // Update session if threat level increased
        const currentThreatIndex = ['none', 'low', 'medium', 'high', 'critical'].indexOf(session.threatLevel);
        const newThreatIndex = ['none', 'low', 'medium', 'high', 'critical'].indexOf(threatAssessment.level);
        
        if (newThreatIndex > currentThreatIndex) {
          session.threatLevel = threatAssessment.level;
          activeSessions.set(callId, session);
        }

        socket.emit('video-analysis', {
          threatLevel: threatAssessment.level,
          hasWeapons: visualAnalysis.hasWeapons,
          hasViolence: visualAnalysis.hasViolence,
          hasDistress: visualAnalysis.hasDistress,
          confidence: visualAnalysis.confidence,
          timestamp: new Date().toISOString()
        });

        if (threatAssessment.shouldEscalate) {
          socket.emit('emergency-alert', {
            threatLevel: threatAssessment.level,
            reason: 'Visual threat detected',
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error('❌ Video frame handling error:', error);
        socket.emit('error', { message: 'Failed to analyze video frame' });
      }
    });

    // Handle call end
    socket.on('end-call', (data: { callId: string }) => {
      try {
        const { callId } = data;
        const session = activeSessions.get(callId);
        
        if (session) {
          console.log(`📞 Call ${callId} ended by user ${session.userId}`);
          
          socket.emit('call-ended', {
            callId,
            duration: Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000),
            messageCount: session.conversationHistory.length,
            finalThreatLevel: session.threatLevel,
            timestamp: new Date().toISOString()
          });

          activeSessions.delete(callId);
        }
        
        socket.leave(callId);

      } catch (error) {
        console.error('❌ End call error:', error);
        socket.emit('error', { message: 'Failed to end call' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} - Reason: ${reason}`);
      
      // Clean up any sessions for this socket
      for (const [callId, session] of activeSessions.entries()) {
        if (session.socketId === socket.id) {
          console.log(`🧹 Cleaning up session for call ${callId}`);
          activeSessions.delete(callId);
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error from ${socket.id}:`, error);
    });
  });

  // Periodic cleanup of inactive sessions
  setInterval(() => {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [callId, session] of activeSessions.entries()) {
      if (now.getTime() - session.lastActivity.getTime() > inactiveThreshold) {
        console.log(`🧹 Cleaning up inactive session: ${callId}`);
        activeSessions.delete(callId);
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  console.log('✅ Socket handlers configured successfully');
}
