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
      console.log('🔌 Connected to SafeWalk AI server');
      setIsConnected(true);
    });

    socketConnection.on('disconnect', () => {
      console.log('🔌 Disconnected from SafeWalk AI server');
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

  // Fetch SafeWalk data
  const fetchSafeWalkData = async () => {
    try {
      // Fetch active sessions
      const sessionsResponse = await axios.get(`${API_BASE_URL}/api/safewalk/walking-sessions`);
      if (sessionsResponse.data.success) {
        setActiveSessions(sessionsResponse.data.sessions || []);
      }

      // Fetch safety alerts
      const alertsResponse = await axios.get(`${API_BASE_URL}/api/safewalk/safety-alerts`);
      if (alertsResponse.data.success) {
        setSafetyAlerts(alertsResponse.data.alerts || []);
      }

      // Set mock total users
      setTotalUsers(mockUsers.length);
    } catch (error) {
      console.error('Error fetching SafeWalk data:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchSafeWalkData();
    
    // Mock some emergency incidents for demonstration
    setEmergencyIncidents([
      {
        id: 'INC-001',
        type: 'Fall Detection',
        severity: 'critical',
        location: 'Central Park, NYC',
        timestamp: new Date().toISOString(),
        userId: 'user-123',
        status: 'active'
      },
      {
        id: 'INC-002',
        type: 'Panic Button',
        severity: 'high',
        location: 'Broadway & 42nd St',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        userId: 'user-456',
        status: 'responding'
      }
    ]);

    // Mock response teams
    setResponseTeams([
      { id: 1, name: 'Alpha Team', status: 'available', location: 'Downtown' },
      { id: 2, name: 'Bravo Team', status: 'responding', location: 'Midtown' },
      { id: 3, name: 'Charlie Team', status: 'available', location: 'Uptown' }
    ]);
  }, []);

  // Event handlers
  const handleEmergencyResponse = (emergencyId, action) => {
    console.log(`Emergency ${emergencyId}: ${action}`);
    // Update emergency status
    setEmergencyIncidents(prev => 
      prev.map(incident => 
        incident.id === emergencyId 
          ? { ...incident, status: action === 'resolve' ? 'resolved' : 'responding' }
          : incident
      )
    );
  };

  const handleUserAction = (userId, action) => {
    console.log(`User ${userId}: ${action}`);
    // Handle user management actions
  };

  // Get overview statistics
  const getOverviewStats = () => ({
    activeSessions: activeSessions.length,
    pendingAlerts: safetyAlerts.filter(a => !a.resolved).length,
    activeEmergencies: emergencyIncidents.filter(e => e.status === 'active').length,
    totalUsers: totalUsers,
    responseTeams: responseTeams.filter(t => t.status === 'available').length
  });

  const stats = getOverviewStats();

  return (
    <div className="app safewalk-enhanced">
      {/* Enhanced Header */}
      <header className="app-header">
        <div className="header-left">
          <h1>🚶‍♂️ SafeWalk AI Command Center</h1>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
        </div>
        
        <nav className="nav-tabs">
          <button 
            className={activeView === 'overview' ? 'active' : ''} 
            onClick={() => setActiveView('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={activeView === 'analytics' ? 'active' : ''} 
            onClick={() => setActiveView('analytics')}
          >
            📈 Analytics
          </button>
          <button 
            className={activeView === 'map' ? 'active' : ''} 
            onClick={() => setActiveView('map')}
          >
            🗺️ Live Map
          </button>
          <button 
            className={activeView === 'emergency' ? 'active' : ''} 
            onClick={() => setActiveView('emergency')}
          >
            🚨 Emergency
          </button>
          <button 
            className={activeView === 'users' ? 'active' : ''} 
            onClick={() => setActiveView('users')}
          >
            👥 Users
          </button>
          <button 
            className={activeView === 'system' ? 'active' : ''} 
            onClick={() => setActiveView('system')}
          >
            ⚙️ System
          </button>
        </nav>

        <div className="header-right">
          <div className="emergency-status">
            {stats.activeEmergencies > 0 && (
              <span className="emergency-badge">
                🚨 {stats.activeEmergencies} Active
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content enhanced-dashboard">
        {activeView === 'overview' && (
          <div className="overview-dashboard">
            {/* Key Statistics */}
            <div className="stats-overview">
              <div className="stat-card primary">
                <div className="stat-icon">🚶‍♂️</div>
                <div className="stat-info">
                  <span className="stat-number">{stats.activeSessions}</span>
                  <span className="stat-label">Active Sessions</span>
                </div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">⚠️</div>
                <div className="stat-info">
                  <span className="stat-number">{stats.pendingAlerts}</span>
                  <span className="stat-label">Pending Alerts</span>
                </div>
              </div>
              <div className="stat-card danger">
                <div className="stat-icon">🚨</div>
                <div className="stat-info">
                  <span className="stat-number">{stats.activeEmergencies}</span>
                  <span className="stat-label">Emergencies</span>
                </div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <span className="stat-number">{stats.totalUsers}</span>
                  <span className="stat-label">Total Users</span>
                </div>
              </div>
            </div>

            {/* Recent Activity and Quick Actions */}
            <div className="overview-grid">
              {/* Recent Safety Alerts */}
              <div className="panel recent-alerts">
                <h3>⚠️ Recent Safety Alerts</h3>
                <div className="alerts-preview">
                  {safetyAlerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className={`alert-preview ${alert.severity}`}>
                      <span className="alert-type">{alert.type}</span>
                      <span className="alert-time">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                  {safetyAlerts.length === 0 && (
                    <div className="no-data">No recent alerts</div>
                  )}
                </div>
              </div>

              {/* Active Walking Sessions */}
              <div className="panel active-sessions-preview">
                <h3>🚶‍♂️ Active Sessions</h3>
                <div className="sessions-preview">
                  {activeSessions.slice(0, 3).map(session => (
                    <div key={session.id} className="session-preview">
                      <span className="session-user">User {session.userId}</span>
                      <span className="session-duration">
                        {Math.round((Date.now() - new Date(session.startTime).getTime()) / 60000)}min
                      </span>
                    </div>
                  ))}
                  {activeSessions.length === 0 && (
                    <div className="no-data">No active sessions</div>
                  )}
                </div>
              </div>

              {/* System Health Overview */}
              <div className="panel system-health-preview">
                <h3>📊 System Health</h3>
                <div className="health-preview">
                  {systemHealth ? (
                    <div className={`health-status ${systemHealth.status}`}>
                      <span className="health-indicator">
                        {systemHealth.status === 'healthy' ? '🟢' : '🔴'}
                      </span>
                      <span className="health-text">{systemHealth.status}</span>
                    </div>
                  ) : (
                    <div className="no-data">Loading...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'analytics' && (
          <AnalyticsDashboard 
            safetyData={safetyAlerts}
            usageData={activeSessions}
            alertData={safetyAlerts}
          />
        )}

        {activeView === 'map' && (
          <SafetyMap 
            activeSessions={activeSessions}
            incidents={emergencyIncidents}
            heatmapData={[]}
          />
        )}

        {activeView === 'emergency' && (
          <EmergencyResponseCenter 
            emergencies={emergencyIncidents}
            onResponse={handleEmergencyResponse}
          />
        )}

        {activeView === 'users' && (
          <UserManagement 
            users={mockUsers}
            onUserAction={handleUserAction}
          />
        )}

        {activeView === 'system' && (
          <SystemHealthMonitor 
            healthData={systemHealth}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>SafeWalk AI Dashboard v2.0 - Emergency Response Excellence</span>
          <span>Last Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
