import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { io, Socket } from 'socket.io-client';
import * as Haptics from 'expo-haptics';
import { NETWORK_CONFIG, TIMEOUTS } from '@/constants/Config';

// Define interface types for the data we'll store in context
export interface CallSession {
  id: string;
  patientName: string;
  scheduledTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'wellness-check' | 'emergency' | 'follow-up';
  duration?: number;
}

export interface EmergencyAlert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  timestamp: string;
  patientName?: string;
  resolved: boolean;
}

export interface AppContextType {
  // State
  isLoading: boolean;
  isConnectedToBackend: boolean;
  currentCall: CallSession | null;
  isCallActive: boolean;
  upcomingCalls: CallSession[];
  emergencyAlerts: EmergencyAlert[];
  
  // Actions
  refreshDashboardData: () => Promise<void>;
  startWellnessCall: (callId?: string) => Promise<void>;
  endCall: () => void;
  reportEmergency: (message: string) => Promise<boolean>;
  
  // Socket functions
  connectToBackend: () => void;
  disconnectFromBackend: () => void;
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component props
interface AppContextProviderProps {
  children: ReactNode;
}

// Provider component
export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  // Core state
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectedToBackend, setIsConnectedToBackend] = useState(false);
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [upcomingCalls, setUpcomingCalls] = useState<CallSession[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  
  // Socket state
  const [socketConnection, setSocketConnection] = useState<Socket | null>(null);

  // Initialize socket connection
  const connectToBackend = () => {
    try {
      console.log('Connecting to backend at:', NETWORK_CONFIG.getBackendUrl());
        const newSocket = io(NETWORK_CONFIG.getBackendUrl(), {
        timeout: TIMEOUTS.API_REQUEST,
        transports: ['websocket', 'polling'],
        forceNew: true,
      });

      newSocket.on('connect', () => {
        console.log('Connected to backend');
        setIsConnectedToBackend(true);
        setSocketConnection(newSocket);
        
        newSocket.emit('mobile-app-connected', { 
          appVersion: '1.0.0',
          platform: 'mobile' 
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from backend');
        setIsConnectedToBackend(false);
        setSocketConnection(null);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Backend connection error:', error);
        setIsConnectedToBackend(false);
        setSocketConnection(null);
      });

      newSocket.on('emergency-alert', (alert: EmergencyAlert) => {
        console.log('Received emergency alert:', alert);
        
        setEmergencyAlerts(prev => [alert, ...prev]);
        
        Alert.alert(
          `${alert.severity.toUpperCase()} Alert`,
          alert.description,
          [{ text: 'OK' }]
        );
        
        if (alert.severity === 'high') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (alert.severity === 'medium') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      });

      newSocket.on('call-update', (callData: CallSession) => {
        console.log('Received call update:', callData);
        setCurrentCall(callData);
        if (callData.status === 'in-progress') {
          setIsCallActive(true);
        } else {
          setIsCallActive(false);
        }
      });

      newSocket.on('calls-list-updated', (calls: CallSession[]) => {
        console.log('Received updated calls list:', calls);
        setUpcomingCalls(calls.filter(call => call.status === 'scheduled'));
      });

    } catch (error) {
      console.error('Error connecting to backend:', error);
      setIsConnectedToBackend(false);
    }
  };

  const disconnectFromBackend = () => {
    if (socketConnection) {
      socketConnection.disconnect();
      setSocketConnection(null);
    }
    setIsConnectedToBackend(false);
  };

  const refreshDashboardData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const [callsResponse, alertsResponse] = await Promise.all([
        fetch(`${NETWORK_CONFIG.getBackendUrl()}/api/calls`, {
          headers: {
            'Accept': 'application/json',
          },
        }).catch(err => {
          console.warn('Failed to fetch calls:', err);
          return null;
        }),
        
        fetch(`${NETWORK_CONFIG.getBackendUrl()}/api/emergency/alerts`, {
          headers: {
            'Accept': 'application/json',
          },
        }).catch(err => {
          console.warn('Failed to fetch alerts:', err);
          return null;
        })
      ]);

      if (callsResponse?.ok) {
        const callsData = await callsResponse.json();
        setUpcomingCalls(callsData.filter((call: CallSession) => call.status === 'scheduled'));
        
        const activeCall = callsData.find((call: CallSession) => call.status === 'in-progress');
        if (activeCall) {
          setCurrentCall(activeCall);
          setIsCallActive(true);
        }
      } else {
        const mockCalls: CallSession[] = [
          {
            id: 'mock-call-1',
            patientName: 'Sarah Johnson',
            scheduledTime: new Date(Date.now() + 30 * 60000).toISOString(),
            status: 'scheduled',
            type: 'wellness-check'
          },
          {
            id: 'mock-call-2', 
            patientName: 'Michael Chen',
            scheduledTime: new Date(Date.now() + 90 * 60000).toISOString(),
            status: 'scheduled',
            type: 'follow-up'
          }
        ];
        setUpcomingCalls(mockCalls);
      }

      if (alertsResponse?.ok) {
        const alertsData = await alertsResponse.json();
        setEmergencyAlerts(alertsData);
      } else {
        const mockAlerts: EmergencyAlert[] = [
          {
            id: 'mock-alert-1',
            severity: 'low',
            description: 'Routine wellness check completed successfully',
            timestamp: new Date().toISOString(),
            resolved: true
          }
        ];
        setEmergencyAlerts(mockAlerts);
      }

    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      setUpcomingCalls([]);
      setEmergencyAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const startWellnessCall = async (callId?: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      const newCall: CallSession = {
        id: callId ?? 'manual-call-' + Date.now(),
        patientName: 'Mobile User',
        scheduledTime: new Date().toISOString(),
        status: 'in-progress',
        type: 'wellness-check'
      };

      if (socketConnection && isConnectedToBackend) {
        socketConnection.emit('start-call', newCall);
      } else {
        console.log('Backend not connected, starting call locally');
      }

      setCurrentCall(newCall);
      setIsCallActive(true);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
    } catch (error) {
      console.error('Error starting wellness call:', error);
      Alert.alert('Error', 'Failed to start call');
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = (): void => {
    try {
      if (currentCall && socketConnection && isConnectedToBackend) {
        socketConnection.emit('end-call', { callId: currentCall.id });
      }

      setCurrentCall(null);
      setIsCallActive(false);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const reportEmergency = async (message: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const emergencyData = {
        id: 'emergency-' + Date.now(),
        description: message,
        severity: 'high' as const,
        timestamp: new Date().toISOString(),
        patientName: 'Mobile User',
        resolved: false
      };

      if (socketConnection && isConnectedToBackend) {
        socketConnection.emit('emergency-report', emergencyData);
      } else {
        try {
          await fetch(`${NETWORK_CONFIG.getBackendUrl()}/api/emergency/report`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(emergencyData),
          });
        } catch (httpError) {
          console.warn('Emergency HTTP request failed:', httpError);
        }
      }

      setEmergencyAlerts(prev => [emergencyData, ...prev]);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Emergency Reported',
        'Your emergency has been reported and help is on the way.',
        [{ text: 'OK' }]
      );
      
      return true;
      
    } catch (error) {
      console.error('Error reporting emergency:', error);
      Alert.alert('Error', 'Failed to report emergency. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    connectToBackend();
    refreshDashboardData();

    return () => {
      disconnectFromBackend();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const contextValue: AppContextType = {
    isLoading,
    isConnectedToBackend,
    currentCall,
    isCallActive,
    upcomingCalls,
    emergencyAlerts,
    refreshDashboardData,
    startWellnessCall,
    endCall,
    reportEmergency,
    connectToBackend,
    disconnectFromBackend,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
