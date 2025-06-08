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
exports.GoogleVisionService = void 0;
// Google Cloud Vision Service Implementation
const vision_1 = require("@google-cloud/vision");
const environment_1 = require("../utils/environment");
class GoogleVisionService {
    constructor() {
        try {
            // Initialize with API key
            this.client = new vision_1.ImageAnnotatorClient({
                apiKey: environment_1.Environment.GOOGLE_CLOUD_VISION_KEY
            });
        }
        catch (error) {
            console.error('❌ Failed to initialize Google Vision client:', error);
        }
    }
    analyzeVideoFrame(frameData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.client) {
                    throw new Error('Google Vision client not initialized');
                }
                // Convert to buffer if it's a string (base64)
                const imageBuffer = typeof frameData === 'string' ? Buffer.from(frameData, 'base64') : frameData; // Store client reference for type safety
                const client = this.client;
                if (!client || !client.safeSearchDetection || !client.objectLocalization || !client.labelDetection) {
                    throw new Error('Google Vision client methods not available');
                }
                // Parallel analysis for efficiency
                const [safeSearchResult, objectResult, labelResult] = yield Promise.all([
                    client.safeSearchDetection({ image: { content: imageBuffer } }),
                    client.objectLocalization({ image: { content: imageBuffer } }),
                    client.labelDetection({ image: { content: imageBuffer } })
                ]);
                const safeSearch = safeSearchResult[0].safeSearchAnnotation;
                const objects = objectResult[0].localizedObjectAnnotations || [];
                const labels = labelResult[0].labelAnnotations || [];
                // Analyze for weapons and dangerous objects
                const detectedObjects = objects.map(obj => obj.name || '').filter(Boolean);
                const detectedLabels = labels.map(label => label.description || '').filter(Boolean);
                const hasWeapons = this.detectWeapons([...detectedObjects, ...detectedLabels]);
                const hasViolence = this.assessViolence(safeSearch);
                const hasDistress = this.detectDistressSignals([...detectedObjects, ...detectedLabels]);
                // Calculate overall confidence
                const confidence = this.calculateConfidence(safeSearch, objects.length, labels.length);
                return {
                    hasWeapons,
                    hasViolence,
                    hasDistress,
                    confidence,
                    detectedObjects: [...detectedObjects, ...detectedLabels]
                };
            }
            catch (error) {
                console.error('❌ Vision analysis error:', error);
                throw new Error('Vision analysis failed');
            }
        });
    }
    detectObjects(frameData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!this.client) {
                    throw new Error('Google Vision client not initialized');
                }
                const imageBuffer = Buffer.from(frameData, 'base64');
                const client = this.client;
                if (!client || !client.objectLocalization) {
                    throw new Error('Google Vision client objectLocalization method not available');
                }
                const [result] = yield client.objectLocalization({
                    image: { content: imageBuffer }
                });
                return ((_a = result.localizedObjectAnnotations) === null || _a === void 0 ? void 0 : _a.map(obj => obj.name || '')) || [];
            }
            catch (error) {
                console.error('❌ Object detection error:', error);
                return [];
            }
        });
    }
    assessSafety(frameData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const visualAssessment = yield this.analyzeVideoFrame(frameData);
                let threatLevel = 'none';
                let shouldEscalate = false;
                const detectedThreats = [];
                let reasoning = 'Visual analysis completed';
                // Determine threat level based on visual assessment
                if (visualAssessment.hasWeapons) {
                    threatLevel = 'critical';
                    shouldEscalate = true;
                    detectedThreats.push('weapons_detected');
                    reasoning = 'Weapons or dangerous objects detected in video feed';
                }
                else if (visualAssessment.hasViolence) {
                    threatLevel = 'high';
                    shouldEscalate = true;
                    detectedThreats.push('violence_indicators');
                    reasoning = 'Violence or inappropriate content detected';
                }
                else if (visualAssessment.hasDistress) {
                    threatLevel = 'medium';
                    detectedThreats.push('distress_signals');
                    reasoning = 'Potential distress signals detected';
                }
                return {
                    level: threatLevel,
                    confidence: visualAssessment.confidence,
                    reasoning,
                    shouldEscalate,
                    detectedThreats
                };
            }
            catch (error) {
                console.error('❌ Safety assessment error:', error);
                return {
                    level: 'medium',
                    confidence: 0.5,
                    reasoning: 'Error in visual safety assessment',
                    shouldEscalate: false,
                    detectedThreats: ['analysis_error']
                };
            }
        });
    }
    detectWeapons(detectedItems) {
        const weaponKeywords = [
            'weapon', 'gun', 'knife', 'blade', 'sword', 'rifle', 'pistol',
            'firearm', 'ammunition', 'bullet', 'explosive', 'bomb',
            'baseball bat', 'hammer', 'axe', 'machete', 'dagger'
        ];
        return detectedItems.some(item => weaponKeywords.some(weapon => item.toLowerCase().includes(weapon.toLowerCase())));
    }
    assessViolence(safeSearch) {
        if (!safeSearch)
            return false;
        // Google's SafeSearch levels: UNKNOWN, VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY
        const violenceLevel = safeSearch.violence;
        const racyLevel = safeSearch.racy;
        return violenceLevel === 'LIKELY' || violenceLevel === 'VERY_LIKELY' ||
            racyLevel === 'VERY_LIKELY';
    }
    detectDistressSignals(detectedItems) {
        const distressKeywords = [
            'crying', 'tears', 'bruise', 'injury', 'blood', 'bandage',
            'distress', 'fear', 'panic', 'hiding', 'emergency',
            'medical equipment', 'ambulance', 'police car'
        ];
        return detectedItems.some(item => distressKeywords.some(signal => item.toLowerCase().includes(signal.toLowerCase())));
    }
    calculateConfidence(safeSearch, objectCount, labelCount) {
        let confidence = 0.7; // Base confidence
        // Increase confidence based on detection quality
        if (objectCount > 0)
            confidence += 0.1;
        if (labelCount > 5)
            confidence += 0.1;
        if (safeSearch)
            confidence += 0.1;
        return Math.min(confidence, 1.0);
    }
}
exports.GoogleVisionService = GoogleVisionService;
