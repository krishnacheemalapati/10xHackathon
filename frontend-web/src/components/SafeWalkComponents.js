// SafeWalk AI Dashboard Components - Analytics and Visualization
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { format, subDays, subHours } from 'date-fns';
import { 
  Shield, 
  MapPin, 
  AlertTriangle, 
  Phone, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity,
  Zap,
  Heart,
  Navigation,
  MessageCircle,
  CheckCircle,
  XCircle,
  Eye,
  Settings
} from 'lucide-react';

// Analytics Dashboard Component
export const AnalyticsDashboard = ({ safetyData, usageData, alertData }) => {
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('incidents');

  // Generate mock analytics data
  const generateAnalyticsData = () => {
    const now = new Date();
    const data = [];
    for (let i = 23; i >= 0; i--) {
      data.push({
        time: format(subHours(now, i), 'HH:mm'),
        incidents: Math.floor(Math.random() * 10) + 1,
        sessions: Math.floor(Math.random() * 50) + 20,
        responses: Math.floor(Math.random() * 8) + 2,
        alerts: Math.floor(Math.random() * 15) + 5
      });
    }
    return data;
  };

  const analyticsData = generateAnalyticsData();

  const incidentTypeData = [
    { name: 'Fall Detection', value: 35, color: '#EF4444' },
    { name: 'Panic Button', value: 25, color: '#F59E0B' },
    { name: 'Route Deviation', value: 20, color: '#3B82F6' },
    { name: 'No Response', value: 15, color: '#8B5CF6' },
    { name: 'Other', value: 5, color: '#10B981' }
  ];

  const responseTimeData = [
    { time: '< 1 min', count: 45 },
    { time: '1-2 min', count: 32 },
    { time: '2-5 min', count: 18 },
    { time: '5-10 min', count: 8 },
    { time: '> 10 min', count: 3 }
  ];

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>
          <Activity className="icon" />
          Safety Analytics
        </h2>
        <div className="time-range-selector">
          {['1h', '6h', '24h', '7d', '30d'].map(range => (
            <button
              key={range}
              className={`time-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-grid">
        {/* Key Metrics */}
        <div className="metric-cards">
          <div className="metric-card">
            <div className="metric-icon danger">
              <AlertTriangle />
            </div>
            <div className="metric-info">
              <span className="metric-value">127</span>
              <span className="metric-label">Total Incidents</span>
              <span className="metric-change negative">+8% vs yesterday</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon success">
              <CheckCircle />
            </div>
            <div className="metric-info">
              <span className="metric-value">1.2 min</span>
              <span className="metric-label">Avg Response Time</span>
              <span className="metric-change positive">-15% vs yesterday</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon primary">
              <Users />
            </div>
            <div className="metric-info">
              <span className="metric-value">2,847</span>
              <span className="metric-label">Active Sessions</span>
              <span className="metric-change positive">+23% vs yesterday</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon warning">
              <Shield />
            </div>
            <div className="metric-info">
              <span className="metric-value">98.7%</span>
              <span className="metric-label">Safety Score</span>
              <span className="metric-change positive">+0.3% vs yesterday</span>
            </div>
          </div>
        </div>

        {/* Incident Trends Chart */}
        <div className="chart-card">
          <h3>Incident Trends (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="incidents" 
                stroke="#EF4444" 
                fill="#EF4444" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Incident Types Distribution */}
        <div className="chart-card">
          <h3>Incident Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={incidentTypeData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {incidentTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time Distribution */}
        <div className="chart-card">
          <h3>Response Time Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Real-time Activity Feed */}
        <div className="chart-card activity-feed">
          <h3>Real-time Activity</h3>
          <div className="activity-list">
            <div className="activity-item danger">
              <AlertTriangle className="activity-icon" />
              <div className="activity-content">
                <span className="activity-text">Fall detected - User #2847</span>
                <span className="activity-time">2 min ago</span>
              </div>
            </div>
            
            <div className="activity-item success">
              <CheckCircle className="activity-icon" />
              <div className="activity-content">
                <span className="activity-text">Emergency resolved - Session #1234</span>
                <span className="activity-time">5 min ago</span>
              </div>
            </div>

            <div className="activity-item warning">
              <Navigation className="activity-icon" />
              <div className="activity-content">
                <span className="activity-text">Route deviation detected</span>
                <span className="activity-time">8 min ago</span>
              </div>
            </div>

            <div className="activity-item info">
              <MessageCircle className="activity-icon" />
              <div className="activity-content">
                <span className="activity-text">AI companion engaged</span>
                <span className="activity-time">12 min ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Interactive Map Component
export const SafetyMap = ({ activeSessions, incidents, heatmapData }) => {
  const [mapCenter] = useState([40.7128, -74.0060]); // NYC coordinates
  const [zoom] = useState(12);

  return (
    <div className="safety-map">
      <div className="map-header">
        <h3>
          <MapPin className="icon" />
          Live Safety Map
        </h3>
        <div className="map-controls">
          <button className="map-btn active">Sessions</button>
          <button className="map-btn">Incidents</button>
          <button className="map-btn">Heatmap</button>
        </div>
      </div>

      <div className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: '500px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Active Sessions */}
          {activeSessions?.map(session => (
            <Marker key={session.id} position={[session.lat || 40.7128, session.lng || -74.0060]}>
              <Popup>
                <div className="map-popup">
                  <h4>Active Session</h4>
                  <p><strong>User:</strong> {session.userId}</p>
                  <p><strong>Duration:</strong> {session.duration}</p>
                  <p><strong>Status:</strong> <span className="status-safe">Safe</span></p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Safety Incidents */}
          {incidents?.map(incident => (
            <Circle
              key={incident.id}
              center={[incident.lat || 40.7128, incident.lng || -74.0060]}
              radius={200}
              pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.3 }}
            >
              <Popup>
                <div className="map-popup">
                  <h4>Safety Incident</h4>
                  <p><strong>Type:</strong> {incident.type}</p>
                  <p><strong>Time:</strong> {incident.timestamp}</p>
                  <p><strong>Status:</strong> <span className="status-alert">Active</span></p>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-marker session"></div>
          <span>Active Sessions</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker incident"></div>
          <span>Safety Incidents</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker heatmap"></div>
          <span>Risk Areas</span>
        </div>
      </div>
    </div>
  );
};

// Emergency Response Center
export const EmergencyResponseCenter = ({ emergencies, onResponse }) => {
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [responseTeams, setResponseTeams] = useState([
    { id: 1, name: 'Alpha Team', status: 'available', location: 'Downtown' },
    { id: 2, name: 'Bravo Team', status: 'responding', location: 'Midtown' },
    { id: 3, name: 'Charlie Team', status: 'available', location: 'Uptown' }
  ]);

  const handleEmergencyResponse = (emergencyId, action) => {
    console.log(`Emergency ${emergencyId}: ${action}`);
    onResponse?.(emergencyId, action);
  };

  return (
    <div className="emergency-response-center">
      <div className="response-header">
        <h3>
          <Zap className="icon" />
          Emergency Response Center
        </h3>
        <div className="response-status">
          <span className="status-indicator active">3 Active</span>
          <span className="status-indicator resolved">12 Resolved Today</span>
        </div>
      </div>

      <div className="response-grid">
        {/* Active Emergencies */}
        <div className="emergency-list">
          <h4>Active Emergencies</h4>
          {emergencies?.map(emergency => (
            <div
              key={emergency.id}
              className={`emergency-item ${emergency.severity}`}
              onClick={() => setSelectedEmergency(emergency)}
            >
              <div className="emergency-icon">
                <AlertTriangle />
              </div>
              <div className="emergency-details">
                <span className="emergency-type">{emergency.type}</span>
                <span className="emergency-location">{emergency.location}</span>
                <span className="emergency-time">{emergency.timestamp}</span>
              </div>
              <div className="emergency-status">
                <span className={`status-badge ${emergency.status}`}>
                  {emergency.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Response Teams */}
        <div className="response-teams">
          <h4>Response Teams</h4>
          {responseTeams.map(team => (
            <div key={team.id} className="team-card">
              <div className="team-info">
                <span className="team-name">{team.name}</span>
                <span className="team-location">{team.location}</span>
              </div>
              <div className={`team-status ${team.status}`}>
                {team.status}
              </div>
            </div>
          ))}
        </div>

        {/* Emergency Details */}
        {selectedEmergency && (
          <div className="emergency-details-panel">
            <h4>Emergency Details</h4>
            <div className="emergency-info">
              <p><strong>Type:</strong> {selectedEmergency.type}</p>
              <p><strong>Severity:</strong> {selectedEmergency.severity}</p>
              <p><strong>Location:</strong> {selectedEmergency.location}</p>
              <p><strong>Time:</strong> {selectedEmergency.timestamp}</p>
              <p><strong>User:</strong> {selectedEmergency.userId}</p>
            </div>
            
            <div className="response-actions">
              <button
                className="response-btn primary"
                onClick={() => handleEmergencyResponse(selectedEmergency.id, 'dispatch')}
              >
                Dispatch Team
              </button>
              <button
                className="response-btn secondary"
                onClick={() => handleEmergencyResponse(selectedEmergency.id, 'contact')}
              >
                Contact User
              </button>
              <button
                className="response-btn success"
                onClick={() => handleEmergencyResponse(selectedEmergency.id, 'resolve')}
              >
                Mark Resolved
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// System Health Monitor
export const SystemHealthMonitor = ({ healthData }) => {
  const [refreshInterval] = useState(30); // seconds

  const healthMetrics = [
    { name: 'API Response Time', value: '127ms', status: 'good', trend: 'down' },
    { name: 'Database Performance', value: '98.9%', status: 'good', trend: 'up' },
    { name: 'WebSocket Connections', value: '2,847', status: 'good', trend: 'up' },
    { name: 'AI Model Accuracy', value: '96.3%', status: 'warning', trend: 'down' },
    { name: 'Storage Usage', value: '73%', status: 'good', trend: 'up' },
    { name: 'Memory Usage', value: '61%', status: 'good', trend: 'stable' }
  ];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="trend-icon positive" />;
      case 'down': return <TrendingDown className="trend-icon negative" />;
      default: return <Activity className="trend-icon stable" />;
    }
  };

  return (
    <div className="system-health-monitor">
      <div className="health-header">
        <h3>
          <Heart className="icon" />
          System Health
        </h3>
        <div className="health-status">
          <span className="status-indicator good">All Systems Operational</span>
          <span className="refresh-info">Updates every {refreshInterval}s</span>
        </div>
      </div>

      <div className="health-grid">
        {healthMetrics.map((metric, index) => (
          <div key={index} className={`health-card ${metric.status}`}>
            <div className="health-metric">
              <span className="metric-name">{metric.name}</span>
              <span className="metric-value">{metric.value}</span>
            </div>
            <div className="health-trend">
              {getTrendIcon(metric.trend)}
            </div>
          </div>
        ))}
      </div>

      <div className="health-chart">
        <h4>System Performance (24h)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={[
            { time: '00:00', cpu: 45, memory: 60, api: 120 },
            { time: '04:00', cpu: 52, memory: 58, api: 135 },
            { time: '08:00', cpu: 67, memory: 72, api: 89 },
            { time: '12:00', cpu: 78, memory: 81, api: 94 },
            { time: '16:00', cpu: 69, memory: 75, api: 102 },
            { time: '20:00', cpu: 61, memory: 68, api: 87 },
            { time: '24:00', cpu: 48, memory: 61, api: 127 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="cpu" stroke="#EF4444" name="CPU %" />
            <Line type="monotone" dataKey="memory" stroke="#3B82F6" name="Memory %" />
            <Line type="monotone" dataKey="api" stroke="#10B981" name="API Response (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// User Management Component
export const UserManagement = ({ users, onUserAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  }) || [];

  return (
    <div className="user-management">
      <div className="user-header">
        <h3>
          <Users className="icon" />
          User Management
        </h3>
        <div className="user-controls">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="walking">Walking</option>
            <option value="emergency">Emergency</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      <div className="user-grid">
        {/* User List */}
        <div className="user-list">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className={`user-card ${user.status}`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="user-avatar">
                <Users />
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
                <span className={`user-status ${user.status}`}>
                  {user.status}
                </span>
              </div>
              <div className="user-metrics">
                <span className="metric">Sessions: {user.totalSessions || 0}</span>
                <span className="metric">Last Active: {user.lastActive || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* User Details */}
        {selectedUser && (
          <div className="user-details-panel">
            <h4>User Details</h4>
            <div className="user-profile">
              <div className="profile-section">
                <h5>Personal Information</h5>
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</p>
                <p><strong>Status:</strong> {selectedUser.status}</p>
              </div>

              <div className="profile-section">
                <h5>Safety Settings</h5>
                <p><strong>Emergency Contacts:</strong> {selectedUser.emergencyContacts?.length || 0}</p>
                <p><strong>Preferred Response:</strong> {selectedUser.preferredResponse || 'Auto'}</p>
                <p><strong>Risk Level:</strong> {selectedUser.riskLevel || 'Low'}</p>
              </div>

              <div className="profile-section">
                <h5>Usage Statistics</h5>
                <p><strong>Total Sessions:</strong> {selectedUser.totalSessions || 0}</p>
                <p><strong>Total Distance:</strong> {selectedUser.totalDistance || '0 km'}</p>
                <p><strong>Average Session:</strong> {selectedUser.avgSession || '0 min'}</p>
              </div>

              <div className="user-actions">
                <button
                  className="action-btn primary"
                  onClick={() => onUserAction?.(selectedUser.id, 'contact')}
                >
                  Contact User
                </button>
                <button
                  className="action-btn secondary"
                  onClick={() => onUserAction?.(selectedUser.id, 'view-sessions')}
                >
                  View Sessions
                </button>
                <button
                  className="action-btn warning"
                  onClick={() => onUserAction?.(selectedUser.id, 'suspend')}
                >
                  Suspend Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  AnalyticsDashboard,
  SafetyMap,
  EmergencyResponseCenter,
  SystemHealthMonitor,
  UserManagement
};
