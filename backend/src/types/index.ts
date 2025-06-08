// Core domain types for the AI Video Call Platform

export interface Call {
  id: string;
  userId: string;
  scheduledTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: CallStatus;
  threatLevel: ThreatLevel;
  conversationHistory: ChatMessage[];
  emergencyTriggered: boolean;
  metadata: CallMetadata;
}

export interface CallMetadata {
  userLocation?: string;
  userEmergencyContacts?: EmergencyContact[];
  callDuration?: number;
  averageThreatLevel: ThreatLevel;
  aiResponseCount: number;
}

export type CallStatus = 
  | 'scheduled' 
  | 'calling' 
  | 'active' 
  | 'completed' 
  | 'failed' 
  | 'emergency_escalated';

export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface ChatMessage {
  id: string;
  callId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  threatAssessment?: ThreatAssessment;
}

export interface ThreatAssessment {
  level: ThreatLevel;
  confidence: number;
  reasoning: string;
  shouldEscalate: boolean;
  detectedThreats: string[];
}

export interface VisualThreatAssessment {
  hasWeapons: boolean;
  hasViolence: boolean;
  hasDistress: boolean;
  confidence: number;
  detectedObjects: string[];
}

export interface EmergencyContact {
  type: 'police' | 'medical' | 'crisis' | 'fire' | 'family';
  name: string;
  phoneNumber: string;
  reason: string;
  priority: number;
}

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  emergencyContacts: EmergencyContact[];
  location: string;
  timezone: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  callFrequency: 'daily' | 'weekly' | 'monthly';
  preferredCallTime: string; // HH:MM format
  language: string;
  emergencyEscalationThreshold: ThreatLevel;
  allowRecording: boolean;
}

export interface AIResponse {
  message: string;
  confidence: number;
  shouldContinueConversation: boolean;
  suggestedActions: string[];
  emotionalTone: 'supportive' | 'concerned' | 'urgent' | 'calm';
}

export interface EmergencyIncident {
  id: string;
  callId: string;
  userId: string;
  timestamp: Date;
  threatLevel: ThreatLevel;
  description: string;
  contactedAuthorities: EmergencyContact[];
  resolved: boolean;
  notes: string;
}

// API Request/Response types
export interface ChatRequest {
  callId: string;
  message: string;
  videoFrame?: string; // base64 encoded
}

export interface ChatResponse {
  message: string;
  threatAssessment: ThreatAssessment;
  shouldEscalate: boolean;
  callStatus: CallStatus;
}

export interface ScheduleCallRequest {
  userId: string;
  scheduledTime: Date;
  phoneNumber?: string;
}

export interface ScheduleCallResponse {
  callId: string;
  scheduledTime: Date;
  status: CallStatus;
}

export interface VideoFrameAnalysisRequest {
  callId: string;
  frameData: string; // base64 encoded image
}

export interface VideoFrameAnalysisResponse {
  visualThreats: VisualThreatAssessment;
  shouldEscalate: boolean;
}

export interface EmergencyAlert {
  id: string;
  patientName: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  resolved: boolean;
}
