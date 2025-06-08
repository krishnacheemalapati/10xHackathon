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
exports.CohereAIService = void 0;
// Cohere AI Service Implementation
const cohere_ai_1 = require("cohere-ai");
const environment_1 = require("../utils/environment");
class CohereAIService {
    constructor() {
        this.cohere = new cohere_ai_1.CohereClient({
            token: environment_1.Environment.COHERE_API_KEY
        });
    }
    generateResponse(message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const preamble = this.buildPreamble(context);
                const response = yield this.cohere.chat({
                    model: 'command-r-plus',
                    message: message,
                    chatHistory: this.formatChatHistory(context.conversationHistory),
                    preamble: preamble,
                    temperature: 0.7,
                    maxTokens: 300
                });
                const emotionalTone = this.determineEmotionalTone(response.text, context.currentThreatLevel);
                const shouldContinue = this.shouldContinueConversation(response.text, context);
                return {
                    message: response.text,
                    confidence: 0.85, // Cohere doesn't return confidence, using default
                    shouldContinueConversation: shouldContinue,
                    suggestedActions: this.extractSuggestedActions(response.text),
                    emotionalTone: emotionalTone
                };
            }
            catch (error) {
                console.error('❌ Cohere AI generation error:', error);
                throw new Error('AI response generation failed');
            }
        });
    }
    assessThreatFromText(message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const examples = [
                    { text: "I'm feeling sad today", label: "low" },
                    { text: "I don't want to live anymore", label: "critical" },
                    { text: "Someone is threatening me", label: "high" },
                    { text: "I'm having a great day", label: "none" },
                    { text: "I'm scared and hiding", label: "high" },
                    { text: "Help me, someone broke in", label: "critical" },
                    { text: "I feel a bit anxious", label: "low" },
                    { text: "Everything is fine", label: "none" }
                ];
                const classification = yield this.cohere.classify({
                    inputs: [message],
                    examples: examples
                });
                const prediction = classification.classifications[0];
                const threatLevel = prediction.prediction;
                const confidence = prediction.confidence || 0;
                // Enhanced threat detection using generation
                const analysisResponse = yield this.cohere.generate({
                    prompt: `Analyze this message for potential threats or distress indicators: "${message}"
                 Consider: suicidal ideation, violence, immediate danger, emotional distress.
                 Respond with JSON: {"threats": ["list"], "reasoning": "explanation", "urgency": "low/medium/high/critical"}`,
                    maxTokens: 150,
                    temperature: 0.1
                });
                let detectedThreats = [];
                let reasoning = `Classified as ${threatLevel} threat level`;
                try {
                    const analysis = JSON.parse(analysisResponse.generations[0].text);
                    detectedThreats = analysis.threats || [];
                    reasoning = analysis.reasoning || reasoning;
                }
                catch (_a) {
                    // Fallback if JSON parsing fails
                    detectedThreats = this.extractThreatsFromText(message);
                }
                return {
                    level: threatLevel,
                    confidence: confidence,
                    reasoning: reasoning,
                    shouldEscalate: threatLevel === 'high' || threatLevel === 'critical',
                    detectedThreats: detectedThreats
                };
            }
            catch (error) {
                console.error('❌ Threat assessment error:', error);
                // Fallback assessment
                return {
                    level: 'medium',
                    confidence: 0.5,
                    reasoning: 'Error in threat assessment - defaulting to medium',
                    shouldEscalate: false,
                    detectedThreats: []
                };
            }
        });
    }
    identifyEmergencyContacts(situation, location) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.cohere.generate({
                    prompt: `Given this emergency situation: "${situation}" in location: "${location}"
                 Identify the most appropriate emergency contacts.
                 Consider: 911 (general emergency), 988 (crisis hotline), local police, medical services.
                 Respond with JSON array: [{"type": "police/medical/crisis/fire", "name": "Service Name", "phoneNumber": "number", "reason": "why appropriate", "priority": 1-5}]`,
                    maxTokens: 200,
                    temperature: 0.1
                });
                try {
                    const contacts = JSON.parse(response.generations[0].text);
                    return contacts.map((contact, index) => ({
                        type: contact.type || 'police',
                        name: contact.name || 'Emergency Services',
                        phoneNumber: contact.phoneNumber || '911',
                        reason: contact.reason || 'General emergency response',
                        priority: contact.priority || index + 1
                    }));
                }
                catch (_a) {
                    // Fallback contacts
                    return this.getDefaultEmergencyContacts(location);
                }
            }
            catch (error) {
                console.error('❌ Emergency contact identification error:', error);
                return this.getDefaultEmergencyContacts(location);
            }
        });
    }
    summarizeConversation(messages) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const conversationText = messages
                    .map(msg => `${msg.role}: ${msg.content}`)
                    .join('\n');
                const summary = yield this.cohere.summarize({
                    text: conversationText,
                    length: 'medium',
                    format: 'paragraph',
                    temperature: 0.3
                });
                return summary.summary || 'No summary available';
            }
            catch (error) {
                console.error('❌ Conversation summarization error:', error);
                return 'Unable to generate conversation summary';
            }
        });
    }
    buildPreamble(context) {
        const basePreamble = `You are a caring AI companion conducting a wellness check video call. 
    Your role is to:
    - Provide emotional support and engage in meaningful conversation
    - Gently assess the person's wellbeing and safety
    - If you detect signs of distress, probe sensitively for more information
    - Maintain a warm, professional, and supportive tone
    - Keep responses conversational and under 2-3 sentences
    - Ask follow-up questions to keep the person engaged`;
        const threatLevelAdjustment = {
            'none': 'Continue with normal supportive conversation.',
            'low': 'Be extra attentive and supportive. Ask gentle follow-up questions.',
            'medium': 'Show increased concern. Ask direct but caring questions about their wellbeing.',
            'high': 'Express serious concern. Try to understand the immediate situation and offer help.',
            'critical': 'This is an emergency situation. Stay on the call and gather location information.'
        };
        return `${basePreamble}\n\nCurrent threat assessment: ${context.currentThreatLevel}
    Guidance: ${threatLevelAdjustment[context.currentThreatLevel] || 'Assess the situation carefully.'}`;
    }
    formatChatHistory(messages) {
        return messages.slice(-10).map(msg => ({
            role: msg.role === 'assistant' ? 'CHATBOT' : 'USER',
            message: msg.content
        }));
    }
    determineEmotionalTone(response, threatLevel) {
        if (threatLevel === 'critical' || threatLevel === 'high')
            return 'urgent';
        if (threatLevel === 'medium')
            return 'concerned';
        if (response.toLowerCase().includes('sorry') || response.toLowerCase().includes('understand'))
            return 'supportive';
        return 'calm';
    }
    shouldContinueConversation(response, context) {
        const endIndicators = ['goodbye', 'bye', 'end call', 'hang up'];
        const hasEndIndicator = endIndicators.some(indicator => response.toLowerCase().includes(indicator));
        // Continue if no end indicators and conversation is under 30 minutes
        return !hasEndIndicator && context.callDuration < 1800; // 30 minutes
    }
    extractSuggestedActions(response) {
        const actions = [];
        if (response.toLowerCase().includes('call') || response.toLowerCase().includes('contact')) {
            actions.push('Consider reaching out for support');
        }
        if (response.toLowerCase().includes('help') || response.toLowerCase().includes('assistance')) {
            actions.push('Seek professional help');
        }
        if (response.toLowerCase().includes('safe') || response.toLowerCase().includes('safety')) {
            actions.push('Ensure personal safety');
        }
        return actions;
    }
    extractThreatsFromText(message) {
        const threats = [];
        const threatKeywords = {
            'suicidal_ideation': ['kill myself', 'end it all', 'not worth living', 'want to die'],
            'violence': ['hurt', 'attack', 'weapon', 'fight', 'violence'],
            'immediate_danger': ['help', 'emergency', 'call police', 'scared', 'hiding'],
            'emotional_distress': ['depressed', 'anxious', 'hopeless', 'alone', 'worthless']
        };
        const lowerMessage = message.toLowerCase();
        Object.entries(threatKeywords).forEach(([threat, keywords]) => {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                threats.push(threat);
            }
        });
        return threats;
    }
    getDefaultEmergencyContacts(location) {
        return [
            {
                type: 'police',
                name: 'Emergency Services',
                phoneNumber: '911',
                reason: 'General emergency response',
                priority: 1
            },
            {
                type: 'crisis',
                name: 'Crisis Lifeline',
                phoneNumber: '988',
                reason: 'Mental health crisis support',
                priority: 2
            },
            {
                type: 'medical',
                name: 'Emergency Medical Services',
                phoneNumber: '911',
                reason: 'Medical emergency response',
                priority: 3
            }
        ];
    }
}
exports.CohereAIService = CohereAIService;
