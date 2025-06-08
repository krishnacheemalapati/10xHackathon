// SafeWalk AI Enhanced Web Dashboard - Main Application
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';
import './components/components.css';
import { 
  AnalyticsDashboard, 
  SafetyMap, 
  EmergencyResponseCenter, 
  SystemHealthMonitor,
  UserManagement 
} from './components/SafeWalkComponents';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

function App() {
  // Connection and basic states
  const [isConnected, setIsConnected] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [activeView, setActiveView] = useState('overview'); // overview, analytics, map, emergency, users, system
  
  // SafeWalk AI states
  const [activeSessions, setActiveSessions] = useState([]);
  const [safetyAlerts, setSafetyAlerts] = useState([]);
  const [emergencyIncidents, setEmergencyIncidents] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [responseTeams, setResponseTeams] = useState([]);
  
  // Mock data for demonstration
  const [mockUsers] = useState([
    { 
      id: 1, 
      name: 'John Doe', 
      email: 'john@example.com', 
      phone: '+1-555-0123',
      status: 'walking', 
      totalSessions: 42,
      lastActive: '2 min ago',
      emergencyContacts: ['Emergency Contact 1', 'Emergency Contact 2'],
      riskLevel: 'Low',
      totalDistance: '45.2 km',
      avgSession: '23 min'
    },
    { 
      id: 2, 
      name: 'Sarah Smith', 
      email: 'sarah@example.com', 
      phone: '+1-555-0124',
      status: 'active', 
      totalSessions: 28,
      lastActive: '5 min ago',
      emergencyContacts: ['Emergency Contact 1'],
      riskLevel: 'Medium',
      totalDistance: '32.1 km',
      avgSession: '18 min'
    },
    { 
      id: 3, 
      name: 'Mike Johnson', 
      email: 'mike@example.com', 
      phone: '+1-555-0125',
      status: 'emergency', 
      totalSessions: 67,
      lastActive: 'Active now',
      emergencyContacts: ['Emergency Contact 1', 'Emergency Contact 2', 'Emergency Contact 3'],
      riskLevel: 'High',
      totalDistance: '78.9 km',
      avgSession: '31 min'
    },
    { 
      id: 4, 
      name: 'Lisa Wilson', 
      email: 'lisa@example.com', 
      phone: '+1-555-0126',
      status: 'offline', 
      totalSessions: 15,
      lastActive: '2 hours ago',
      emergencyContacts: ['Emergency Contact 1'],
      riskLevel: 'Low',
      totalDistance: '12.4 km',
      avgSession: '15 min'
    }
  ]);

  // Initialize socket connection
  useEffect(() => {
    const socketConnection = io(API_BASE_URL);
    
    socketConnection.on('connect', () => {
      console.log('🔌 Connected to server');
      setIsConnected(true);
    });

    socketConnection.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      setIsConnected(false);
    });

    socketConnection.on('emergency-alert', (incident) => {
      console.log('🚨 Emergency alert:', incident);
      setEmergencyIncidents(prev => [incident, ...prev]);
    });

    // SafeWalk AI socket listeners
    socketConnection.on('walking-session-update', (session) => {
      console.log('🚶‍♂️ Walking session update:', session);
      setActiveSessions(prev => {
        const existing = prev.find(s => s.id === session.id);
        if (existing) {
          return prev.map(s => s.id === session.id ? session : s);
        } else if (session.status === 'active') {
          return [session, ...prev];
        }
        return prev;
      });
    });

    socketConnection.on('safety-alert', (alert) => {
      console.log('⚠️ Safety alert:', alert);
      setSafetyAlerts(prev => [alert, ...prev]);
    });

    socketConnection.on('emergency-escalation', (escalation) => {
      console.log('🚨 Emergency escalation:', escalation);
      setEmergencyIncidents(prev => [escalation, ...prev]);
    });

    socketConnection.on('location-update', (update) => {
      console.log('📍 Location update:', update);
      // Update session location in real-time
      setActiveSessions(prev => 
        prev.map(session => 
          session.id === update.sessionId 
            ? { ...session, lastLocation: update.location, lastUpdated: update.timestamp }
            : session
        )
      );
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  // Check system health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        setSystemHealth(response.data);
      } catch (error) {
        console.error('❌ Health check failed:', error);
        setSystemHealth({ status: 'error', error: error.message });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const scheduleCall = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/calls/schedule`, {
        userId: userData.userId,
        phoneNumber: userData.phoneNumber,
        scheduledTime: userData.scheduledTime
      });

      setCalls(prev => [...prev, response.data.call]);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to schedule call:', error);
      throw error;
    }
  };

  const escalateEmergency = async (incidentData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/emergency/escalate`, incidentData);
      setEmergencyIncidents(prev => [response.data.incident, ...prev]);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to escalate emergency:', error);
      throw error;
    }
  };

  // SafeWalk AI functions
  const fetchActiveSessions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/safewalk/walking-sessions`);
      if (response.data.success) {
        setActiveSessions(response.data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }
  };

  const fetchSafetyAlerts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/safewalk/safety-alerts`);
      if (response.data.success) {
        setSafetyAlerts(response.data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching safety alerts:', error);
    }
  };

  const fetchTotalUsers = async () => {
    try {
      // In a real app, this would come from a user management service
      setTotalUsers(Math.floor(Math.random() * 100) + 50);
    } catch (error) {
      console.error('Error fetching user count:', error);
    }
  };

  useEffect(() => {
    if (activeView === 'safewalk') {
      fetchActiveSessions();
      fetchSafetyAlerts();
      fetchTotalUsers();
    }
  }, [activeView]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚶‍♂️ SafeWalk AI Platform</h1>
        <nav className="nav-tabs">
          <button 
            className={activeView === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveView('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={activeView === 'safewalk' ? 'active' : ''} 
            onClick={() => setActiveView('safewalk')}
          >
            🚶‍♂️ SafeWalk
          </button>
          <button 
            className={activeView === 'wellness' ? 'active' : ''} 
            onClick={() => setActiveView('wellness')}
          >
            🩺 Wellness
          </button>
        </nav>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </header>

      <main className="main-content">
        {activeView === 'safewalk' && (
          <div className="safewalk-dashboard">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{activeSessions.length}</div>
                <div className="stat-label">Active Walking Sessions</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{safetyAlerts.filter(a => !a.resolved).length}</div>
                <div className="stat-label">Pending Safety Alerts</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{totalUsers}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{safetyAlerts.filter(a => a.severity === 'high').length}</div>
                <div className="stat-label">High Priority Alerts</div>
              </div>
            </div>

            <div className="dashboard-grid">
              {/* Active Walking Sessions */}
              <div className="panel active-sessions">
                <h2>🚶‍♂️ Active Walking Sessions</h2>
                {activeSessions.length === 0 ? (
                  <div className="no-data">No active walking sessions</div>
                ) : (
                  <div className="sessions-list">
                    {activeSessions.map(session => (
                      <div key={session.id} className="session-card">
                        <div className="session-header">
                          <span className="session-destination">
                            {session.destinationName || 'Unknown destination'}
                          </span>
                          <span className={`session-status ${session.status}`}>
                            {session.status}
                          </span>
                        </div>
                        <div className="session-details">
                          <div>Started: {new Date(session.startTime).toLocaleTimeString()}</div>
                          <div>Duration: {Math.round((Date.now() - new Date(session.startTime).getTime()) / 60000)} min</div>
                          {session.aiCompanionActive && <div className="ai-companion">🤖 AI Companion Active</div>}
                        </div>
                        {session.lastLocation && (
                          <div className="location-info">
                            📍 Lat: {session.lastLocation.coords.latitude.toFixed(6)}, 
                            Lng: {session.lastLocation.coords.longitude.toFixed(6)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Safety Alerts */}
              <div className="panel safety-alerts">
                <h2>⚠️ Safety Alerts</h2>
                {safetyAlerts.length === 0 ? (
                  <div className="no-data">No safety alerts</div>
                ) : (
                  <div className="alerts-list">
                    {safetyAlerts.slice(0, 10).map(alert => (
                      <div key={alert.id} className={`alert-card severity-${alert.severity}`}>
                        <div className="alert-header">
                          <span className="alert-type">{alert.type.replace('_', ' ').toUpperCase()}</span>
                          <span className={`alert-severity ${alert.severity}`}>{alert.severity}</span>
                          <span className="alert-time">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="alert-description">{alert.description}</div>
                        {alert.location && (
                          <div className="alert-location">
                            📍 {alert.location.coords.latitude.toFixed(4)}, {alert.location.coords.longitude.toFixed(4)}
                          </div>
                        )}
                        {alert.resolved && <div className="alert-resolved">✅ Resolved</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'dashboard' && (
          <div className="dashboard-grid">
            {/* System Health Panel */}
            <div className="panel system-health">
              <h2>📊 System Health</h2>
              {systemHealth ? (
                <div className="health-details">
                  <div className={`health-status ${systemHealth.status}`}>
                    Status: {systemHealth.status}
                  </div>
                  {systemHealth.services && (
                    <div className="services-status">
                      <div>AI Service: {systemHealth.services.ai}</div>
                      <div>Vision Service: {systemHealth.services.vision}</div>
                      <div>Notifications: {systemHealth.services.notifications}</div>
                    </div>
                  )}
                  <div className="timestamp">
                    Last checked: {systemHealth.timestamp ? new Date(systemHealth.timestamp).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
              ) : (
                <div>Loading...</div>
              )}
            </div>

            {/* Active Calls Panel */}
            <div className="panel active-calls">
              <h2>📞 Active Calls</h2>
              {calls.length === 0 ? (
                <div className="no-calls">No active calls</div>
              ) : (
                <div className="calls-list">
                  {calls.map(call => (
                    <div key={call.id} className={`call-item ${call.status}`}>
                      <div className="call-header">
                        <span className="call-id">{call.id}</span>
                        <span className={`call-status ${call.status}`}>{call.status}</span>
                      </div>
                      <div className="call-details">
                        <div>User: {call.userId}</div>
                        <div>Duration: {call.duration || '0:00'}</div>
                        {call.threatLevel && call.threatLevel !== 'none' && (
                          <div className={`threat-level ${call.threatLevel}`}>
                            ⚠️ Threat Level: {call.threatLevel}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Incidents Panel */}
            <div className="panel emergency-incidents">
              <h2>🚨 Emergency Incidents</h2>
              {emergencyIncidents.length === 0 ? (
                <div className="no-incidents">No emergency incidents</div>
              ) : (
                <div className="incidents-list">
                  {emergencyIncidents.slice(0, 5).map(incident => (
                    <div key={incident.id} className={`incident-item ${incident.threatLevel}`}>
                      <div className="incident-header">
                        <span className="incident-id">{incident.id}</span>
                        <span className={`threat-level ${incident.threatLevel}`}>
                          {incident.threatLevel}
                        </span>
                      </div>
                      <div className="incident-details">
                        <div className="description">{incident.description}</div>
                        <div className="timestamp">
                          {new Date(incident.timestamp).toLocaleString()}
                        </div>
                        <div className="authorities">
                          Contacted: {incident.contactedAuthorities.length} authorities
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Call Scheduler Panel */}
            <div className="panel call-scheduler">
              <h2>📅 Schedule New Call</h2>
              <CallScheduler onSchedule={scheduleCall} />
            </div>

            {/* Emergency Escalation Panel */}
            <div className="panel emergency-escalation">
              <h2>🚨 Emergency Escalation</h2>
              <EmergencyEscalation onEscalate={escalateEmergency} />
            </div>

            {/* Live Chat Testing Panel */}
            <div className="panel chat-testing">
              <h2>💬 Test AI Chat</h2>
              <ChatTesting />
            </div>
          </div>
        )}

        {activeView === 'wellness' && (
          <div className="wellness-dashboard">
            <div className="panel">
              <h2>🩺 Wellness Platform</h2>
              <div className="wellness-content">
                <p>Legacy wellness platform features will be maintained here.</p>
                <div className="wellness-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Wellness Sessions</span>
                    <span className="stat-value">0</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Active Programs</span>
                    <span className="stat-value">0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Call Scheduler Component
function CallScheduler({ onSchedule }) {
  const [formData, setFormData] = useState({
    userId: '',
    phoneNumber: '',
    scheduledTime: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      await onSchedule(formData);
      setMessage('✅ Call scheduled successfully!');
      setFormData({ userId: '', phoneNumber: '', scheduledTime: '' });
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="scheduler-form">
      <input
        type="text"
        placeholder="User ID"
        value={formData.userId}
        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
        required
      />
      <input
        type="tel"
        placeholder="Phone Number"
        value={formData.phoneNumber}
        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
        required
      />
      <input
        type="datetime-local"
        value={formData.scheduledTime}
        onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
        required
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Scheduling...' : 'Schedule Call'}
      </button>
      {message && <div className="form-message">{message}</div>}
    </form>
  );
}

// Emergency Escalation Component
function EmergencyEscalation({ onEscalate }) {
  const [formData, setFormData] = useState({
    callId: '',
    userId: '',
    threatLevel: 'medium',
    description: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      await onEscalate(formData);
      setMessage('🚨 Emergency escalated successfully!');
      setFormData({ callId: '', userId: '', threatLevel: 'medium', description: '', location: '' });
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="escalation-form">
      <input
        type="text"
        placeholder="Call ID"
        value={formData.callId}
        onChange={(e) => setFormData({ ...formData, callId: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="User ID"
        value={formData.userId}
        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
        required
      />
      <select
        value={formData.threatLevel}
        onChange={(e) => setFormData({ ...formData, threatLevel: e.target.value })}
        required
      >
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
      <textarea
        placeholder="Description of the emergency"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Location (optional)"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Escalating...' : '🚨 Escalate Emergency'}
      </button>
      {message && <div className="form-message">{message}</div>}
    </form>
  );
}

// Chat Testing Component
function ChatTesting() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    setResponse('');

    try {
      const result = await axios.post(`${API_BASE_URL}/api/chat/message`, {
        message,
        userId: 'test-user',
        conversationContext: {
          userId: 'test-user',
          currentThreatLevel: 'none',
          callDuration: 0
        }
      });

      setResponse(result.data.response);
    } catch (error) {
      setResponse(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-testing">
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
      {response && (
        <div className="chat-response">
          <strong>AI Response:</strong>
          <div className="response-text">{response}</div>
        </div>
      )}
    </div>
  );
}

export default App;
