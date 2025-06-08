"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatRoutes = createChatRoutes;
// Chat API routes
const express_1 = require("express");
function createChatRoutes(aiService, visionService) {
    const router = (0, express_1.Router)();
    // POST /api/chat/message - Handle chat message with optional video frame
    router.post('/message', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { callId, message, videoFrame } = req.body;
            if (!callId || !message) {
                return res.status(400).json({
                    error: 'Missing required fields: callId and message are required'
                });
            }
            console.log(`💬 Processing chat message for call ${callId}: ${message.substring(0, 50)}...`);
            // Analyze video frame if provided
            let visualThreatAssessment = null;
            if (videoFrame) {
                console.log(`🎥 Analyzing video frame for call ${callId}`);
                try {
                    const imageBuffer = Buffer.from(videoFrame, 'base64');
                    visualThreatAssessment = yield visionService.analyzeVideoFrame(imageBuffer);
                    console.log(`📊 Visual threat assessment completed`);
                }
                catch (error) {
                    console.error('❌ Video frame analysis failed:', error);
                }
            } // Generate AI response with threat assessment
            const aiResponse = yield aiService.generateResponse(message, {
                callId,
                userId: 'demo-user', // TODO: Get from session
                conversationHistory: [], // TODO: Get from database  
                currentThreatLevel: 'none',
                callDuration: 300
            });
            console.log(`🤖 AI response generated`);
            const response = {
                callId,
                message: aiResponse.message,
                threatAssessment: visualThreatAssessment ? {
                    level: 'medium',
                    confidence: visualThreatAssessment.confidence,
                    reasoning: 'Visual and text analysis completed',
                    shouldEscalate: visualThreatAssessment.hasWeapons || visualThreatAssessment.hasViolence,
                    detectedThreats: visualThreatAssessment.detectedObjects
                } : undefined,
                visualThreatAssessment,
                timestamp: new Date()
            };
            // Check if emergency escalation is needed
            const shouldEscalate = (visualThreatAssessment === null || visualThreatAssessment === void 0 ? void 0 : visualThreatAssessment.hasWeapons) || (visualThreatAssessment === null || visualThreatAssessment === void 0 ? void 0 : visualThreatAssessment.hasViolence) || false;
            if (shouldEscalate) {
                console.log(`🚨 Emergency escalation triggered for call ${callId}`);
                response.emergencyEscalated = true;
            }
            res.json(response);
        }
        catch (error) {
            console.error('❌ Error processing chat message:', error);
            res.status(500).json({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }));
    // POST /api/chat/analyze-frame - Analyze video frame only
    router.post('/analyze-frame', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { callId, frameData } = req.body;
            if (!callId || !frameData) {
                return res.status(400).json({
                    error: 'Missing required fields: callId and frameData are required'
                });
            }
            console.log(`🎥 Analyzing video frame for call ${callId}`);
            const imageBuffer = Buffer.from(frameData, 'base64');
            const analysis = yield visionService.analyzeVideoFrame(imageBuffer);
            console.log(`📊 Video frame analysis complete`);
            const response = {
                callId,
                analysis,
                timestamp: new Date()
            };
            res.json(response);
        }
        catch (error) {
            console.error('❌ Error analyzing video frame:', error);
            res.status(500).json({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }));
    // POST /api/chat/summarize - Summarize conversation
    router.post('/summarize', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { callId } = req.body;
            if (!callId) {
                return res.status(400).json({
                    error: 'Missing required field: callId'
                });
            }
            // Get conversation history from database (placeholder for now)
            const conversationHistory = []; // Placeholder
            const summary = yield aiService.summarizeConversation(conversationHistory);
            res.json({
                callId,
                summary,
                timestamp: new Date()
            });
        }
        catch (error) {
            console.error('❌ Error summarizing conversation:', error);
            res.status(500).json({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }));
    return router;
}
