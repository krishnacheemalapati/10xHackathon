// Google Cloud Vision Service Implementation
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { Environment } from '../utils/environment';
import { IVisionService } from './interfaces';
import { VisualThreatAssessment, ThreatAssessment, ThreatLevel } from '../types';

export class GoogleVisionService implements IVisionService {
  private client?: ImageAnnotatorClient;

  constructor() {
    try {
      // Initialize with API key
      this.client = new ImageAnnotatorClient({
        apiKey: Environment.GOOGLE_CLOUD_VISION_KEY
      });
    } catch (error) {
      console.error('❌ Failed to initialize Google Vision client:', error);
    }
  }

  async analyzeVideoFrame(frameData: string | Buffer): Promise<VisualThreatAssessment> {
    try {
      if (!this.client) {
        throw new Error('Google Vision client not initialized');
      }

      // Convert to buffer if it's a string (base64)
      const imageBuffer = typeof frameData === 'string' ? Buffer.from(frameData, 'base64') : frameData;      // Store client reference for type safety
      const client = this.client;
      
      if (!client || !client.safeSearchDetection || !client.objectLocalization || !client.labelDetection) {
        throw new Error('Google Vision client methods not available');
      }

      // Parallel analysis for efficiency
      const [
        safeSearchResult,
        objectResult,
        labelResult
      ] = await Promise.all([
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
    } catch (error) {
      console.error('❌ Vision analysis error:', error);
      throw new Error('Vision analysis failed');
    }
  }

  async detectObjects(frameData: string): Promise<string[]> {
    try {
      if (!this.client) {
        throw new Error('Google Vision client not initialized');
      }      const imageBuffer = Buffer.from(frameData, 'base64');
      const client = this.client;
      
      if (!client || !client.objectLocalization) {
        throw new Error('Google Vision client objectLocalization method not available');
      }
      
      const [result] = await client.objectLocalization({
        image: { content: imageBuffer }
      });

      return result.localizedObjectAnnotations?.map(obj => obj.name || '') || [];
    } catch (error) {
      console.error('❌ Object detection error:', error);
      return [];
    }
  }

  async assessSafety(frameData: string): Promise<ThreatAssessment> {
    try {
      const visualAssessment = await this.analyzeVideoFrame(frameData);
      
      let threatLevel: ThreatLevel = 'none';
      let shouldEscalate = false;
      const detectedThreats: string[] = [];
      let reasoning = 'Visual analysis completed';

      // Determine threat level based on visual assessment
      if (visualAssessment.hasWeapons) {
        threatLevel = 'critical';
        shouldEscalate = true;
        detectedThreats.push('weapons_detected');
        reasoning = 'Weapons or dangerous objects detected in video feed';
      } else if (visualAssessment.hasViolence) {
        threatLevel = 'high';
        shouldEscalate = true;
        detectedThreats.push('violence_indicators');
        reasoning = 'Violence or inappropriate content detected';
      } else if (visualAssessment.hasDistress) {
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
    } catch (error) {
      console.error('❌ Safety assessment error:', error);
      return {
        level: 'medium',
        confidence: 0.5,
        reasoning: 'Error in visual safety assessment',
        shouldEscalate: false,
        detectedThreats: ['analysis_error']
      };
    }
  }

  private detectWeapons(detectedItems: string[]): boolean {
    const weaponKeywords = [
      'weapon', 'gun', 'knife', 'blade', 'sword', 'rifle', 'pistol',
      'firearm', 'ammunition', 'bullet', 'explosive', 'bomb',
      'baseball bat', 'hammer', 'axe', 'machete', 'dagger'
    ];

    return detectedItems.some(item => 
      weaponKeywords.some(weapon => 
        item.toLowerCase().includes(weapon.toLowerCase())
      )
    );
  }

  private assessViolence(safeSearch: any): boolean {
    if (!safeSearch) return false;

    // Google's SafeSearch levels: UNKNOWN, VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY
    const violenceLevel = safeSearch.violence;
    const racyLevel = safeSearch.racy;

    return violenceLevel === 'LIKELY' || violenceLevel === 'VERY_LIKELY' ||
           racyLevel === 'VERY_LIKELY';
  }

  private detectDistressSignals(detectedItems: string[]): boolean {
    const distressKeywords = [
      'crying', 'tears', 'bruise', 'injury', 'blood', 'bandage',
      'distress', 'fear', 'panic', 'hiding', 'emergency',
      'medical equipment', 'ambulance', 'police car'
    ];

    return detectedItems.some(item =>
      distressKeywords.some(signal =>
        item.toLowerCase().includes(signal.toLowerCase())
      )
    );
  }

  private calculateConfidence(safeSearch: any, objectCount: number, labelCount: number): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence based on detection quality
    if (objectCount > 0) confidence += 0.1;
    if (labelCount > 5) confidence += 0.1;
    if (safeSearch) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }
}
