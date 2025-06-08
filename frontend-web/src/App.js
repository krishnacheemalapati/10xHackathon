// SafeWalk AI Enhanced Web Dashboard - Main Application
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import './components/components.css';
import safeWalkAPI from './services/SafeWalkAPI';
import { 
  AnalyticsDashboard, 
  SafetyMap, 
  EmergencyResponseCenter, 
  SystemHealthMonitor,
  UserManagement 
} from './components/SafeWalkComponents';

function App() {
  // Connection and basic states
  const [isConnected, setIsConnected] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [activeView, setActiveView] = useState('overview'); // overview, analytics, map, emergency, users, system
  
  // SafeWalk AI states
  const [activeSessions, setActiveSessions] = useState([]);
  const [safetyAlerts, setSafetyAlerts] = useState([]);
  const [emergencyIncidents, setEmergencyIncidents] = useState([]);  const [totalUsers, setTotalUsers] = useState(0);
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

  // Initialize SafeWalk API service
  useEffect(() => {
    console.log('🚀 Initializing SafeWalk AI Dashboard...');
    
    // Initialize socket connection
    safeWalkAPI.initializeSocket(
      () => setIsConnected(true),
      () => setIsConnected(false)
    );

    // Register event handlers
    safeWalkAPI.onEvent('walking-session-update', (session) => {
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

    safeWalkAPI.onEvent('safety-alert', (alert) => {
      setSafetyAlerts(prev => [alert, ...prev]);
    });

    safeWalkAPI.onEvent('emergency-escalation', (escalation) => {
      setEmergencyIncidents(prev => [escalation, ...prev]);
    });

    safeWalkAPI.onEvent('location-update', (update) => {
      setActiveSessions(prev => 
        prev.map(session => 
          session.id === update.sessionId 
            ? { ...session, lastLocation: update.location, lastUpdated: update.timestamp }
            : session
        )
      );
    });

    return () => {
      safeWalkAPI.disconnect();
    };
  }, []);

  // Check system health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthData = await safeWalkAPI.getHealthStatus();
        setSystemHealth(healthData);
        console.log('✅ System health check successful:', healthData);
      } catch (error) {
        console.error('❌ Health check failed:', error);
        setSystemHealth({ status: 'error', error: error.message });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);  // Fetch SafeWalk data from backend using API service
  const fetchSafeWalkData = useCallback(async () => {
    try {
      console.log('🔄 Fetching SafeWalk data from backend...');
      
      // Fetch active sessions
      const sessionsData = await safeWalkAPI.getWalkingSessions();
      if (sessionsData.success) {
        setActiveSessions(sessionsData.sessions || []);
        console.log('✅ Active sessions loaded:', sessionsData.sessions?.length || 0);
      }

      // Fetch safety alerts
      const alertsData = await safeWalkAPI.getSafetyAlerts();
      if (alertsData.success) {
        setSafetyAlerts(alertsData.alerts || []);
        console.log('✅ Safety alerts loaded:', alertsData.alerts?.length || 0);
      }

      // Fetch emergency incidents
      const emergencyData = await safeWalkAPI.getEmergencyIncidents();
      if (emergencyData.incidents) {
        setEmergencyIncidents(emergencyData.incidents || []);
        console.log('✅ Emergency incidents loaded:', emergencyData.incidents?.length || 0);
      }

      // Set mock total users for now (until user management API is implemented)
      setTotalUsers(mockUsers.length);
      
      console.log('✅ SafeWalk data fetch completed successfully');
    } catch (error) {
      console.error('❌ Error fetching SafeWalk data:', error);
      console.log('📱 Using mock data for demonstration');
      
      // Fallback to mock data if backend is not available
      setActiveSessions([]);
      setSafetyAlerts([]);
      setEmergencyIncidents([]);
    }
  }, [mockUsers.length]);
  // Load data on component mount
  useEffect(() => {
    fetchSafeWalkData();
    
    // Mock some emergency incidents for demonstration (until backend provides them)
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

    // Refresh data every 30 seconds
    const dataRefreshInterval = setInterval(fetchSafeWalkData, 30000);
    
    return () => clearInterval(dataRefreshInterval);
  }, [fetchSafeWalkData]);  // Event handlers for backend integration
  const handleEmergencyResponse = async (emergencyId, action) => {
    try {
      console.log(`🚨 Emergency ${emergencyId}: ${action}`);
      
      // Send response to backend using API service
      const response = await safeWalkAPI.respondToEmergency(emergencyId, {
        action,
        timestamp: new Date().toISOString(),
        responderId: 'dashboard-admin' // In real app, use authenticated user ID
      });

      if (response.success) {
        // Update local state
        setEmergencyIncidents(prev => 
          prev.map(incident => 
            incident.id === emergencyId 
              ? { ...incident, status: action === 'resolve' ? 'resolved' : 'responding' }
              : incident
          )
        );
        console.log('✅ Emergency response sent to backend');
      }
    } catch (error) {
      console.error('❌ Error sending emergency response:', error);
      // Still update local state for demo purposes
      setEmergencyIncidents(prev => 
        prev.map(incident => 
          incident.id === emergencyId 
            ? { ...incident, status: action === 'resolve' ? 'resolved' : 'responding' }
            : incident
        )
      );
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      console.log(`👤 User ${userId}: ${action}`);
      
      // Send user action to backend (when user management API is implemented)
      // await safeWalkAPI.performUserAction(userId, action);
      
      console.log('✅ User action processed');
    } catch (error) {
      console.error('❌ Error processing user action:', error);
    }
  };

  // Add function to manually create test safety alert
  const createTestSafetyAlert = async () => {
    try {
      const testAlert = {
        type: 'route_deviation',
        severity: 'medium',
        description: 'User deviated from planned route - Dashboard Test',
        location: { lat: 40.7128, lng: -74.0060 },
        userId: 'dashboard-test-user-' + Date.now()
      };

      const response = await safeWalkAPI.createSafetyAlert(testAlert);
      
      if (response.success) {
        console.log('✅ Test safety alert created:', response.alert);
        // Alert will be added to state via socket event
      }
    } catch (error) {
      console.error('❌ Error creating test alert:', error);
    }
  };

  // Add function to simulate walking session
  const simulateWalkingSession = async () => {
    try {
      const testSession = {
        id: 'dashboard-session-' + Date.now(),
        startTime: new Date().toISOString(),
        status: 'active',
        aiCompanionActive: true,
        destinationName: 'Central Park - Dashboard Test',
        route: [{ lat: 40.7829, lng: -73.9654 }],
        userId: 'dashboard-test-user-' + Date.now()
      };

      const response = await safeWalkAPI.startWalkingSession(testSession);
      
      if (response.success) {
        console.log('✅ Test walking session started:', response.session);
        // Session will be added to state via socket event
      }
    } catch (error) {
      console.error('❌ Error starting test session:', error);
    }
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
        </nav>        <div className="header-right">
          <div className="dev-tools">
            <button 
              className="dev-button"
              onClick={createTestSafetyAlert}
              title="Create test safety alert"
            >
              ⚠️ Test Alert
            </button>
            <button 
              className="dev-button"
              onClick={simulateWalkingSession}
              title="Simulate walking session"
            >
              🚶‍♂️ Test Session
            </button>
          </div>
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
      </main>      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>SafeWalk AI Dashboard v2.0 - Emergency Response Excellence</span>
          <span>Last Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </footer>

      {/* Integration Status Indicator */}
      <div className={`integration-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Backend Connected' : '🔴 Backend Disconnected'}
      </div>
    </div>
  );
}

export default App;
