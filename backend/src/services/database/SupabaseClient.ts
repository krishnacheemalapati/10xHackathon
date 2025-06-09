// Supabase client configuration and setup
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Environment } from '../../utils/environment';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          status: 'active' | 'walking' | 'emergency' | 'offline';
          total_sessions: number;
          last_active: string;
          emergency_contacts: string[];
          risk_level: 'Low' | 'Medium' | 'High';
          total_distance: string;
          avg_session: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          status?: 'active' | 'walking' | 'emergency' | 'offline';
          total_sessions?: number;
          last_active?: string;
          emergency_contacts?: string[];
          risk_level?: 'Low' | 'Medium' | 'High';
          total_distance?: string;
          avg_session?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          status?: 'active' | 'walking' | 'emergency' | 'offline';
          total_sessions?: number;
          last_active?: string;
          emergency_contacts?: string[];
          risk_level?: 'Low' | 'Medium' | 'High';
          total_distance?: string;
          avg_session?: string;
          updated_at?: string;
        };
      };
      walking_sessions: {
        Row: {
          id: string;
          user_id: string;
          start_time: string;
          end_time: string | null;
          status: 'active' | 'completed' | 'emergency';
          destination_name: string | null;
          route: any[];
          last_location: any | null;
          ai_companion_active: boolean;
          threat_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
          duration: number | null;
          distance: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_time?: string;
          end_time?: string | null;
          status?: 'active' | 'completed' | 'emergency';
          destination_name?: string | null;
          route?: any[];
          last_location?: any | null;
          ai_companion_active?: boolean;
          threat_level?: 'none' | 'low' | 'medium' | 'high' | 'critical';
          duration?: number | null;
          distance?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_time?: string;
          end_time?: string | null;
          status?: 'active' | 'completed' | 'emergency';
          destination_name?: string | null;
          route?: any[];
          last_location?: any | null;
          ai_companion_active?: boolean;
          threat_level?: 'none' | 'low' | 'medium' | 'high' | 'critical';
          duration?: number | null;
          distance?: number | null;
          updated_at?: string;
        };
      };
      safety_alerts: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          type: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          description: string;
          location: any | null;
          resolved: boolean;
          resolved_at: string | null;
          resolved_by: string | null;
          response_time: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          type: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          description: string;
          location?: any | null;
          resolved?: boolean;
          resolved_at?: string | null;
          resolved_by?: string | null;
          response_time?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          type?: string;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          description?: string;
          location?: any | null;
          resolved?: boolean;
          resolved_at?: string | null;
          resolved_by?: string | null;
          response_time?: number | null;
          updated_at?: string;
        };
      };
      emergency_incidents: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          type: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          status: 'active' | 'responding' | 'resolved' | 'escalated';
          location: string;
          latitude: number | null;
          longitude: number | null;
          responder_id: string | null;
          response_time: number | null;
          resolution_time: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          type: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          status?: 'active' | 'responding' | 'resolved' | 'escalated';
          location: string;
          latitude?: number | null;
          longitude?: number | null;
          responder_id?: string | null;
          response_time?: number | null;
          resolution_time?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          type?: string;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'active' | 'responding' | 'resolved' | 'escalated';
          location?: string;
          latitude?: number | null;
          longitude?: number | null;
          responder_id?: string | null;
          response_time?: number | null;
          resolution_time?: number | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      call_sessions: {
        Row: {
          id: string;
          user_id: string;
          walking_session_id: string | null;
          start_time: string;
          end_time: string | null;
          duration: number | null;
          threat_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
          conversation_history: any[];
          ai_responses: number;
          user_messages: number;
          emergency_triggered: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          walking_session_id?: string | null;
          start_time?: string;
          end_time?: string | null;
          duration?: number | null;
          threat_level?: 'none' | 'low' | 'medium' | 'high' | 'critical';
          conversation_history?: any[];
          ai_responses?: number;
          user_messages?: number;
          emergency_triggered?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          walking_session_id?: string | null;
          start_time?: string;
          end_time?: string | null;
          duration?: number | null;
          threat_level?: 'none' | 'low' | 'medium' | 'high' | 'critical';
          conversation_history?: any[];
          ai_responses?: number;
          user_messages?: number;
          emergency_triggered?: boolean;
          updated_at?: string;
        };
      };
      response_teams: {
        Row: {
          id: string;
          name: string;
          status: 'available' | 'responding' | 'busy' | 'offline';
          location: string;
          contact_info: any;
          specializations: string[];
          current_incident_id: string | null;
          last_active: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: 'available' | 'responding' | 'busy' | 'offline';
          location: string;
          contact_info?: any;
          specializations?: string[];
          current_incident_id?: string | null;
          last_active?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: 'available' | 'responding' | 'busy' | 'offline';
          location?: string;
          contact_info?: any;
          specializations?: string[];
          current_incident_id?: string | null;
          last_active?: string;
          updated_at?: string;
        };
      };
    };
  };
}

class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient<Database> | null = null;
  private mockMode: boolean = true;

  private constructor() {
    this.initializeClient();
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }
  private initializeClient(): void {
    try {
      if (!Environment.SUPABASE_URL || !Environment.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('🔄 Running in mock mode - Supabase not configured');
        this.mockMode = true;
        return;
      }

      this.client = createClient<Database>(
        Environment.SUPABASE_URL,
        Environment.SUPABASE_SERVICE_ROLE_KEY
      );
      
      this.mockMode = false;
      console.log('✅ Supabase client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      this.mockMode = true;
    }
  }

  public getClient(): SupabaseClient<Database> | null {
    return this.client;
  }

  public isMockMode(): boolean {
    return this.mockMode;
  }

  public async testConnection(): Promise<boolean> {
    if (this.mockMode || !this.client) {
      console.log('🔄 Mock mode active - skipping connection test');
      return false;
    }

    try {
      const { data, error } = await this.client.from('users').select('count').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }
      console.log('✅ Supabase connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection test failed:', error);
      return false;
    }
  }
}

export const supabaseService = SupabaseService.getInstance();
export default supabaseService;
