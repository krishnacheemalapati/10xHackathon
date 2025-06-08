// SafeWalk AI API Integration Service
import axios from 'axios';
import io from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

class SafeWalkAPIService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventCallbacks = new Map();
  }

  // Initialize socket connection
  initializeSocket(onConnect, onDisconnect) {
    console.log('🔌 Initializing SafeWalk API socket connection...');
    
    this.socket = io(API_BASE_URL, {
      transports: ['websocket'],
      upgrade: true,
      rememberUpgrade: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to SafeWalk AI Backend');
      this.isConnected = true;
      if (onConnect) onConnect();
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from SafeWalk AI Backend');
      this.isConnected = false;
      if (onDisconnect) onDisconnect();
    });

    // SafeWalk specific events
    this.socket.on('walking-session-update', (session) => {
      console.log('🚶‍♂️ Walking session update:', session);
      this.triggerCallback('walking-session-update', session);
    });

    this.socket.on('safety-alert', (alert) => {
      console.log('⚠️ Safety alert received:', alert);
      this.triggerCallback('safety-alert', alert);
    });

    this.socket.on('emergency-escalation', (escalation) => {
      console.log('🚨 Emergency escalation:', escalation);
      this.triggerCallback('emergency-escalation', escalation);
    });

    this.socket.on('location-update', (update) => {
      console.log('📍 Location update:', update);
      this.triggerCallback('location-update', update);
    });

    return this.socket;
  }

  // Register event callbacks
  onEvent(eventName, callback) {
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, []);
    }
    this.eventCallbacks.get(eventName).push(callback);
  }

  // Trigger callbacks for events
  triggerCallback(eventName, data) {
    if (this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.get(eventName).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventName} callback:`, error);
        }
      });
    }
  }

  // API Methods
  async getHealthStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  async getWalkingSessions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/safewalk/walking-sessions`);
      return response.data;
    } catch (error) {
      console.error('Failed to get walking sessions:', error);
      throw error;
    }
  }

  async getSafetyAlerts(userId = null) {
    try {
      const url = `${API_BASE_URL}/api/safewalk/safety-alerts${userId ? `?userId=${userId}` : ''}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to get safety alerts:', error);
      throw error;
    }
  }

  async getEmergencyIncidents() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/emergency/incidents`);
      return response.data;
    } catch (error) {
      console.error('Failed to get emergency incidents:', error);
      throw error;
    }
  }

  async createSafetyAlert(alertData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/safewalk/safety-alert`, alertData);
      return response.data;
    } catch (error) {
      console.error('Failed to create safety alert:', error);
      throw error;
    }
  }

  async startWalkingSession(sessionData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/safewalk/walking-session/start`, sessionData);
      return response.data;
    } catch (error) {
      console.error('Failed to start walking session:', error);
      throw error;
    }
  }

  async endWalkingSession(sessionId, endData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/safewalk/walking-session/${sessionId}/end`, endData);
      return response.data;
    } catch (error) {
      console.error('Failed to end walking session:', error);
      throw error;
    }
  }

  async resolveSafetyAlert(alertId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/safewalk/safety-alert/${alertId}/resolve`);
      return response.data;
    } catch (error) {
      console.error('Failed to resolve safety alert:', error);
      throw error;
    }
  }

  async escalateEmergency(escalationData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/emergency/escalate`, escalationData);
      return response.data;
    } catch (error) {
      console.error('Failed to escalate emergency:', error);
      throw error;
    }
  }

  async respondToEmergency(incidentId, responseData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/emergency/incidents/${incidentId}/response`, responseData);
      return response.data;
    } catch (error) {
      console.error('Failed to respond to emergency:', error);
      throw error;
    }
  }

  // Chat with AI companion
  async chatWithAI(message, sessionId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/safewalk/ai-companion/chat`, {
        message,
        sessionId
      });
      return response.data;
    } catch (error) {
      console.error('Failed to chat with AI:', error);
      throw error;
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const safeWalkAPI = new SafeWalkAPIService();

export default safeWalkAPI;
