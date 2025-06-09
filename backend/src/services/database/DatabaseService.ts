// Database service layer with fallback to mock data
import { supabaseService, Database } from './SupabaseClient';

// Mock data for fallback when database is not available
const mockUsers = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0123',
    status: 'walking' as const,
    total_sessions: 42,
    last_active: '2 min ago',
    emergency_contacts: ['Emergency Contact 1', 'Emergency Contact 2'],
    risk_level: 'Low' as const,
    total_distance: '45.2 km',
    avg_session: '23 min',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-2',
    name: 'Sarah Smith',
    email: 'sarah@example.com',
    phone: '+1-555-0124',
    status: 'active' as const,
    total_sessions: 28,
    last_active: '5 min ago',
    emergency_contacts: ['Emergency Contact 1'],
    risk_level: 'Medium' as const,
    total_distance: '32.1 km',
    avg_session: '18 min',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '+1-555-0125',
    status: 'emergency' as const,
    total_sessions: 67,
    last_active: 'Active now',
    emergency_contacts: ['Emergency Contact 1', 'Emergency Contact 2', 'Emergency Contact 3'],
    risk_level: 'High' as const,
    total_distance: '78.9 km',
    avg_session: '31 min',
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'user-4',
    name: 'Lisa Wilson',
    email: 'lisa@example.com',
    phone: '+1-555-0126',
    status: 'offline' as const,
    total_sessions: 15,
    last_active: '2 hours ago',
    emergency_contacts: ['Emergency Contact 1'],
    risk_level: 'Low' as const,
    total_distance: '12.4 km',
    avg_session: '15 min',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockWalkingSessions = [
  {
    id: 'session-1',
    user_id: 'user-1',
    start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    end_time: null,
    status: 'active' as const,
    destination_name: 'Central Park West',
    route: [
      { lat: 40.7829, lng: -73.9654, timestamp: new Date().toISOString() }
    ],
    last_location: { coords: { latitude: 40.7829, longitude: -73.9654 } },
    ai_companion_active: true,
    threat_level: 'none' as const,
    duration: null,
    distance: null,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'session-2',
    user_id: 'user-2',
    start_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    end_time: null,
    status: 'active' as const,
    destination_name: 'Bryant Park',
    route: [
      { lat: 40.7536, lng: -73.9832, timestamp: new Date().toISOString() }
    ],
    last_location: { coords: { latitude: 40.7536, longitude: -73.9832 } },
    ai_companion_active: true,
    threat_level: 'low' as const,
    duration: null,
    distance: null,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockSafetyAlerts = [
  {
    id: 'alert-1',
    user_id: 'user-3',
    session_id: 'session-3',
    type: 'route_deviation',
    severity: 'medium' as const,
    description: 'User deviated significantly from planned route',
    location: { lat: 40.7580, lng: -73.9855 },
    resolved: false,
    resolved_at: null,
    resolved_by: null,
    response_time: null,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'alert-2',
    user_id: 'user-1',
    session_id: 'session-1',
    type: 'unusual_activity',
    severity: 'low' as const,
    description: 'Detected unusual movement pattern',
    location: { lat: 40.7829, lng: -73.9654 },
    resolved: true,
    resolved_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    resolved_by: 'auto-system',
    response_time: 120,
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockEmergencyIncidents = [
  {
    id: 'INC-001',
    user_id: 'user-3',
    session_id: null,
    type: 'Fall Detection',
    severity: 'critical' as const,
    status: 'active' as const,
    location: 'Central Park, NYC',
    latitude: 40.7829,
    longitude: -73.9654,
    responder_id: null,
    response_time: null,
    resolution_time: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'INC-002',
    user_id: 'user-2',
    session_id: 'session-2',
    type: 'Panic Button',
    severity: 'high' as const,
    status: 'responding' as const,
    location: 'Broadway & 42nd St',
    latitude: 40.7580,
    longitude: -73.9855,
    responder_id: 'team-1',
    response_time: 300,
    resolution_time: null,
    notes: 'Team Alpha dispatched',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockResponseTeams = [
  {
    id: 'team-1',
    name: 'Alpha Team',
    status: 'responding' as const,
    location: 'Midtown Manhattan',
    contact_info: { phone: '+1-555-0200', radio: 'ALPHA-1' },
    specializations: ['Medical Emergency', 'Security Response'],
    current_incident_id: 'INC-002',
    last_active: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'team-2',
    name: 'Bravo Team',
    status: 'available' as const,
    location: 'Downtown Manhattan',
    contact_info: { phone: '+1-555-0201', radio: 'BRAVO-1' },
    specializations: ['Crisis Response', 'Technical Rescue'],
    current_incident_id: null,
    last_active: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export class DatabaseService {
  private static instance: DatabaseService;
  private client = supabaseService.getClient();

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Users
  async getUsers() {
    if (supabaseService.isMockMode()) {
      console.log('📦 Using mock user data');
      return { data: mockUsers, error: null };
    }

    try {
      const { data, error } = await this.client!.from('users').select('*').order('updated_at', { ascending: false });
      return { data: data || mockUsers, error };
    } catch (error) {
      console.error('❌ Database error, falling back to mock data:', error);
      return { data: mockUsers, error: null };
    }
  }

  async getUserById(id: string) {
    if (supabaseService.isMockMode()) {
      const user = mockUsers.find(u => u.id === id);
      return { data: user || null, error: null };
    }

    try {
      const { data, error } = await this.client!.from('users').select('*').eq('id', id).single();
      return { data, error };
    } catch (error) {
      console.error('❌ Database error, falling back to mock data:', error);
      const user = mockUsers.find(u => u.id === id);
      return { data: user || null, error: null };
    }
  }

  async createUser(user: Database['public']['Tables']['users']['Insert']) {
    if (supabaseService.isMockMode()) {
      const newUser = { 
        id: `user-${Date.now()}`, 
        ...user, 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockUsers.push(newUser as any);
      return { data: newUser, error: null };
    }

    try {
      const { data, error } = await this.client!.from('users').insert(user).select().single();
      return { data, error };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: null, error };
    }
  }

  async updateUser(id: string, updates: Database['public']['Tables']['users']['Update']) {
    if (supabaseService.isMockMode()) {
      const userIndex = mockUsers.findIndex(u => u.id === id);      if (userIndex >= 0) {
        mockUsers[userIndex] = { 
          ...mockUsers[userIndex], 
          ...updates, 
          updated_at: new Date().toISOString() 
        } as any;
        return { data: mockUsers[userIndex], error: null };
      }
      return { data: null, error: { message: 'User not found' } };
    }

    try {
      const { data, error } = await this.client!
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      return { data, error };    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: null, error };
    }
  }

  async deleteUser(id: string) {
    if (supabaseService.isMockMode()) {
      const userIndex = mockUsers.findIndex(u => u.id === id);
      if (userIndex >= 0) {
        mockUsers.splice(userIndex, 1);
        return { data: true, error: null };
      }
      return { data: false, error: { message: 'User not found' } };
    }

    try {
      const { error } = await this.client!.from('users').delete().eq('id', id);
      return { data: !error, error };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: false, error };
    }
  }

  async getWalkingSessionsByUserId(userId: string) {
    if (supabaseService.isMockMode()) {
      const userSessions = mockWalkingSessions.filter(s => s.user_id === userId);
      return { data: userSessions, error: null };
    }

    try {
      const { data, error } = await this.client!
        .from('walking_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });
      return { data: data || [], error };
    } catch (error) {
      console.error('❌ Database error:', error);
      const userSessions = mockWalkingSessions.filter(s => s.user_id === userId);
      return { data: userSessions, error: null };
    }
  }

  async getEmergencyIncidentsByUserId(userId: string) {
    if (supabaseService.isMockMode()) {
      const userIncidents = mockEmergencyIncidents.filter(i => i.user_id === userId);
      return { data: userIncidents, error: null };
    }

    try {
      const { data, error } = await this.client!
        .from('emergency_incidents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return { data: data || [], error };
    } catch (error) {
      console.error('❌ Database error:', error);
      const userIncidents = mockEmergencyIncidents.filter(i => i.user_id === userId);
      return { data: userIncidents, error: null };
    }
  }

  // Walking Sessions
  async getWalkingSessions() {
    if (supabaseService.isMockMode()) {
      console.log('📦 Using mock walking session data');
      return { data: mockWalkingSessions, error: null };
    }

    try {
      const { data, error } = await this.client!
        .from('walking_sessions')
        .select('*')
        .order('start_time', { ascending: false });
      return { data: data || mockWalkingSessions, error };
    } catch (error) {
      console.error('❌ Database error, falling back to mock data:', error);
      return { data: mockWalkingSessions, error: null };
    }
  }

  async getActiveWalkingSessions() {
    if (supabaseService.isMockMode()) {
      const activeSessions = mockWalkingSessions.filter(s => s.status === 'active');
      return { data: activeSessions, error: null };
    }

    try {
      const { data, error } = await this.client!
        .from('walking_sessions')
        .select('*')
        .eq('status', 'active')
        .order('start_time', { ascending: false });
      return { data: data || [], error };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: mockWalkingSessions.filter(s => s.status === 'active'), error: null };
    }
  }

  async createWalkingSession(session: Database['public']['Tables']['walking_sessions']['Insert']) {
    if (supabaseService.isMockMode()) {
      const newSession = { 
        id: `session-${Date.now()}`, 
        ...session,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockWalkingSessions.push(newSession as any);
      return { data: newSession, error: null };
    }

    try {
      const { data, error } = await this.client!.from('walking_sessions').insert(session).select().single();
      return { data, error };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: null, error };
    }
  }

  async updateWalkingSession(id: string, updates: Database['public']['Tables']['walking_sessions']['Update']) {
    if (supabaseService.isMockMode()) {
      const sessionIndex = mockWalkingSessions.findIndex(s => s.id === id);      if (sessionIndex >= 0) {
        mockWalkingSessions[sessionIndex] = { 
          ...mockWalkingSessions[sessionIndex], 
          ...updates, 
          updated_at: new Date().toISOString() 
        } as any;
        return { data: mockWalkingSessions[sessionIndex], error: null };
      }
      return { data: null, error: { message: 'Session not found' } };
    }

    try {
      const { data, error } = await this.client!
        .from('walking_sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: null, error };
    }
  }

  // Safety Alerts
  async getSafetyAlerts() {
    if (supabaseService.isMockMode()) {
      console.log('📦 Using mock safety alert data');
      return { data: mockSafetyAlerts, error: null };
    }

    try {
      const { data, error } = await this.client!
        .from('safety_alerts')
        .select('*')
        .order('created_at', { ascending: false });
      return { data: data || mockSafetyAlerts, error };
    } catch (error) {
      console.error('❌ Database error, falling back to mock data:', error);
      return { data: mockSafetyAlerts, error: null };
    }
  }

  async createSafetyAlert(alert: Database['public']['Tables']['safety_alerts']['Insert']) {
    if (supabaseService.isMockMode()) {
      const newAlert = { 
        id: `alert-${Date.now()}`, 
        ...alert,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockSafetyAlerts.push(newAlert as any);
      return { data: newAlert, error: null };
    }

    try {
      const { data, error } = await this.client!.from('safety_alerts').insert(alert).select().single();
      return { data, error };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: null, error };
    }
  }

  // Emergency Incidents
  async getEmergencyIncidents() {
    if (supabaseService.isMockMode()) {
      console.log('📦 Using mock emergency incident data');
      return { data: mockEmergencyIncidents, error: null };
    }

    try {
      const { data, error } = await this.client!
        .from('emergency_incidents')
        .select('*')
        .order('created_at', { ascending: false });
      return { data: data || mockEmergencyIncidents, error };
    } catch (error) {
      console.error('❌ Database error, falling back to mock data:', error);
      return { data: mockEmergencyIncidents, error: null };
    }
  }

  async getEmergencyIncident(id: string) {
    if (supabaseService.isMockMode()) {
      const incident = mockEmergencyIncidents.find(i => i.id === id);
      return { data: incident || null, error: null };
    }

    try {
      const { data, error } = await this.client!
        .from('emergency_incidents')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    } catch (error) {
      console.error('❌ Database error, falling back to mock data:', error);
      const incident = mockEmergencyIncidents.find(i => i.id === id);
      return { data: incident || null, error: null };
    }
  }

  async createEmergencyIncident(incident: Database['public']['Tables']['emergency_incidents']['Insert']) {
    if (supabaseService.isMockMode()) {
      const newIncident = { 
        id: `INC-${Date.now()}`, 
        ...incident,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockEmergencyIncidents.push(newIncident as any);
      return { data: newIncident, error: null };
    }

    try {
      const { data, error } = await this.client!.from('emergency_incidents').insert(incident).select().single();
      return { data, error };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: null, error };
    }
  }

  async updateEmergencyIncident(id: string, updates: Database['public']['Tables']['emergency_incidents']['Update']) {
    if (supabaseService.isMockMode()) {
      const incidentIndex = mockEmergencyIncidents.findIndex(i => i.id === id);      if (incidentIndex >= 0) {
        mockEmergencyIncidents[incidentIndex] = { 
          ...mockEmergencyIncidents[incidentIndex], 
          ...updates, 
          updated_at: new Date().toISOString() 
        } as any;
        return { data: mockEmergencyIncidents[incidentIndex], error: null };
      }
      return { data: null, error: { message: 'Emergency incident not found' } };
    }

    try {
      const { data, error } = await this.client!
        .from('emergency_incidents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: null, error };
    }
  }

  // Call Sessions
  async getCallSessions() {
    if (supabaseService.isMockMode()) {
      console.log('📦 Using mock call session data');
      return { data: [], error: null };
    }

    try {
      const { data, error } = await this.client!
        .from('call_sessions')
        .select('*')
        .order('scheduled_time', { ascending: false });
      return { data: data || [], error };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: [], error: null };
    }
  }

  async getCallSession(id: string) {
    if (supabaseService.isMockMode()) {
      console.log('📦 Mock call session lookup:', id);
      return { data: null, error: null };
    }

    try {
      const { data, error } = await this.client!
        .from('call_sessions')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: null, error };
    }
  }

  async getCallSessionsByUser(userId: string) {
    if (supabaseService.isMockMode()) {
      console.log('📦 Mock call sessions for user:', userId);
      return { data: [], error: null };
    }

    try {
      const { data, error } = await this.client!
        .from('call_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_time', { ascending: false });
      return { data: data || [], error };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: [], error: null };
    }
  }

  async deleteCallSession(id: string) {
    if (supabaseService.isMockMode()) {
      console.log('📦 Mock call session deleted:', id);
      return { data: { id }, error: null };
    }

    try {
      const { data, error } = await this.client!
        .from('call_sessions')
        .delete()
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: null, error };
    }
  }

  async createCallSession(session: Database['public']['Tables']['call_sessions']['Insert']) {
    if (supabaseService.isMockMode()) {
      const newSession = { 
        id: `call-${Date.now()}`, 
        ...session,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('📦 Mock call session created:', newSession.id);
      return { data: newSession, error: null };
    }

    try {
      const { data, error } = await this.client!.from('call_sessions').insert(session).select().single();
      return { data, error };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: null, error };
    }
  }

  async updateCallSession(id: string, updates: Database['public']['Tables']['call_sessions']['Update']) {
    if (supabaseService.isMockMode()) {
      console.log('📦 Mock call session updated:', id);
      return { data: { id, ...updates }, error: null };
    }

    try {
      const { data, error } = await this.client!
        .from('call_sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { data: null, error };
    }
  }

  // Response Teams
  async getResponseTeams() {
    if (supabaseService.isMockMode()) {
      console.log('📦 Using mock response team data');
      return { data: mockResponseTeams, error: null };
    }

    try {
      const { data, error } = await this.client!
        .from('response_teams')
        .select('*')
        .order('name', { ascending: true });
      return { data: data || mockResponseTeams, error };
    } catch (error) {
      console.error('❌ Database error, falling back to mock data:', error);
      return { data: mockResponseTeams, error: null };
    }
  }

  // Health check
  async healthCheck() {
    if (supabaseService.isMockMode()) {
      return { 
        status: 'mock', 
        message: 'Running in mock mode - database not connected',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const connected = await supabaseService.testConnection();
      return { 
        status: connected ? 'healthy' : 'error', 
        message: connected ? 'Database connection healthy' : 'Database connection failed',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: 'Database health check failed',
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const databaseService = DatabaseService.getInstance();
export default databaseService;
