// Service interfaces for dependency injection
import { 
  ChatMessage, 
  ThreatAssessment, 
  VisualThreatAssessment, 
  AIResponse, 
  EmergencyContact,
  EmergencyIncident,
  Call
} from '../types';

export interface IAIService {
  generateResponse(message: string, context: ConversationContext): Promise<AIResponse>;
  assessThreatFromText(message: string): Promise<ThreatAssessment>;
  identifyEmergencyContacts(situation: string, location: string): Promise<EmergencyContact[]>;
  summarizeConversation(messages: ChatMessage[]): Promise<string>;
}

export interface IVisionService {
  analyzeVideoFrame(frameData: string | Buffer): Promise<VisualThreatAssessment>;
  detectObjects(frameData: string): Promise<string[]>;
  assessSafety(frameData: string): Promise<ThreatAssessment>;
}

export interface INotificationService {
  sendSMS(phoneNumber: string, message: string): Promise<boolean>;
  makeCall(phoneNumber: string, message: string): Promise<boolean>;
  notifyEmergencyContacts(contacts: EmergencyContact[], incident: EmergencyIncident): Promise<void>;
}

export interface ICallRepository {
  create(call: Omit<Call, 'id'>): Promise<Call>;
  findById(id: string): Promise<Call | null>;
  findByUserId(userId: string): Promise<Call[]>;
  update(id: string, updates: Partial<Call>): Promise<Call | null>;
  delete(id: string): Promise<boolean>;
}

export interface IEmergencyService {
  escalateIncident(callId: string, threatAssessment: ThreatAssessment): Promise<EmergencyIncident>;
  logIncident(incident: EmergencyIncident): Promise<void>;
  resolveIncident(incidentId: string, notes: string): Promise<void>;
}

export interface ConversationContext {
  callId: string;
  userId: string;
  conversationHistory: ChatMessage[];
  currentThreatLevel: string;
  userLocation?: string;
  callDuration: number;
}

export interface CallHandlerContext {
  call: Call;
  message?: string;
  videoFrame?: string;
  socketId: string;
}
