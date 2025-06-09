// Chat API routes
import { Router, Request, Response } from 'express';
import { IAIService, IVisionService } from '../services/interfaces';
import { ChatRequest, ChatResponse, VideoFrameAnalysisRequest, VideoFrameAnalysisResponse } from '../types';
import { DatabaseService } from '../services/database/DatabaseService';

export function createChatRoutes(aiService: IAIService, visionService: IVisionService): Router {
  const router = Router();
  const dbService = DatabaseService.getInstance();

  // POST /api/chat/message - Handle chat message with optional video frame
  router.post('/message', async (req: Request, res: Response) => {
    try {
      const { callId, message, videoFrame }: ChatRequest = req.body;

      if (!callId || !message) {
        return res.status(400).json({
          error: 'Missing required fields: callId and message are required'
        });
      }

      console.log(`💬 Processing chat message for call ${callId}: ${message.substring(0, 50)}...`);      // Get call session from database
      const { data: callSession, error: callError } = await dbService.getCallSession(callId);
      if (callError || !callSession) {
        return res.status(404).json({
          error: `Call session ${callId} not found`
        });
      }

      // Analyze video frame if provided
      let visualThreatAssessment = null;
      if (videoFrame) {
        console.log(`🎥 Analyzing video frame for call ${callId}`);
        try {
          const imageBuffer = Buffer.from(videoFrame, 'base64');
          visualThreatAssessment = await visionService.analyzeVideoFrame(imageBuffer);
          console.log(`📊 Visual threat assessment completed`);
        } catch (error) {
          console.error('❌ Video frame analysis failed:', error);
        }
      }

      // Generate AI response with threat assessment
      const aiResponse = await aiService.generateResponse(message, {
        callId,
        userId: callSession.user_id,
        conversationHistory: [], // TODO: Implement chat history storage
        currentThreatLevel: 'none',
        callDuration: callSession.duration ?? 300
      });

      console.log(`🤖 AI response generated`);

      const response: any = {
        callId,
        message: aiResponse.message,
        threatAssessment: visualThreatAssessment ? {
          level: 'medium' as const,
          confidence: visualThreatAssessment.confidence,
          reasoning: 'Visual and text analysis completed',
          shouldEscalate: visualThreatAssessment.hasWeapons || visualThreatAssessment.hasViolence,
          detectedThreats: visualThreatAssessment.detectedObjects
        } : undefined,
        visualThreatAssessment,
        timestamp: new Date()
      };

      // Check if emergency escalation is needed
      const shouldEscalate = visualThreatAssessment?.hasWeapons || visualThreatAssessment?.hasViolence || false;

      if (shouldEscalate) {
        console.log(`🚨 Emergency escalation triggered for call ${callId}`);
        response.emergencyEscalated = true;
      }

      res.json(response);

    } catch (error) {
      console.error('❌ Error processing chat message:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/chat/analyze-frame - Analyze video frame only
  router.post('/analyze-frame', async (req: Request, res: Response) => {
    try {
      const { callId, frameData }: VideoFrameAnalysisRequest = req.body;

      if (!callId || !frameData) {
        return res.status(400).json({
          error: 'Missing required fields: callId and frameData are required'
        });
      }

      console.log(`🎥 Analyzing video frame for call ${callId}`);

      const imageBuffer = Buffer.from(frameData, 'base64');
      const analysis = await visionService.analyzeVideoFrame(imageBuffer);      console.log(`📊 Video frame analysis complete`);

      const response: any = {
        callId,
        analysis,
        timestamp: new Date()
      };

      res.json(response);

    } catch (error) {
      console.error('❌ Error analyzing video frame:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  // POST /api/chat/summarize - Summarize conversation
  router.post('/summarize', async (req: Request, res: Response) => {
    try {
      const { callId } = req.body;

      if (!callId) {
        return res.status(400).json({
          error: 'Missing required field: callId'
        });
      }

      // Get call session from database
      const { data: callSession, error: callError } = await dbService.getCallSession(callId);
      if (callError || !callSession) {
        return res.status(404).json({
          error: `Call session ${callId} not found`
        });
      }

      // Get conversation history from call session
      const conversationHistory = callSession.conversation_history || [];

      const summary = await aiService.summarizeConversation(conversationHistory);

      res.json({
        callId,
        summary,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Error summarizing conversation:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
