// SafeWalk AI - Personal Safety Companion App
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  Switch,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Sensors from 'expo-sensors';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { NETWORK_CONFIG, TIMEOUTS, FEATURES } from '@/constants/Config';

const { width, height } = Dimensions.get('window');
const BACKEND_URL = NETWORK_CONFIG.getBackendUrl();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface WalkingSession {
  id: string;
  startTime: string;
  endTime?: string;
  route: Location.LocationObject[];
  duration?: number;
  status: 'active' | 'completed' | 'emergency';
  aiCompanionActive: boolean;
  destinationName?: string;
  estimatedArrival?: string;
}

interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  priority: number;
}

interface SafetyAlert {
  id: string;
  type: 'fall_detected' | 'erratic_movement' | 'panic_button' | 'route_deviation' | 'no_movement';
  severity: 'high' | 'medium' | 'low';
  description: string;
  timestamp: string;
  location?: Location.LocationObject;
  resolved: boolean;
}

interface CallSession {
  id: string;
  patientName: string;
  scheduledTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'wellness-check' | 'emergency' | 'follow-up';
  duration?: number;
}

export default function SafeWalkScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [isWalkingActive, setIsWalkingActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<WalkingSession | null>(null);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [aiCompanionActive, setAiCompanionActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [destination, setDestination] = useState('');
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  
  // AI Video Call Platform state variables
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [upcomingCalls, setUpcomingCalls] = useState<CallSession[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([]);
  
  const cameraRef = useRef<CameraView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const accelerometerSubscription = useRef<any>(null);

  useEffect(() => {
    requestPermissions();
    initializeSocket();
    loadTrustedContacts();
    loadDashboardData(); // Add this line to load calls data
    return () => {
      cleanupListeners();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load upcoming calls
      const callsResponse = await fetch(`${BACKEND_URL}/api/calls`);
      const callsData = await callsResponse.json();
      setUpcomingCalls(callsData.filter((call: CallSession) => call.status === 'scheduled'));

      // Load recent emergency alerts
      const emergencyResponse = await fetch(`${BACKEND_URL}/api/emergency/alerts`);
      const emergencyData = await emergencyResponse.json();
      setEmergencyAlerts(emergencyData.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(cameraStatus === 'granted');

    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(locationStatus === 'granted');

    const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
    if (notificationStatus !== 'granted') {
      Alert.alert('Permission required', 'Notifications are needed for safety alerts');
    }
  };
  const initializeSocket = () => {
    const socketConnection = io(BACKEND_URL);
    setSocket(socketConnection);
    
    socketConnection.on('safety-alert', (alert: SafetyAlert) => {
      setSafetyAlerts(prev => [alert, ...prev]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Safety Alert', alert.description);
    });

    socketConnection.on('walking-session-update', (session: WalkingSession) => {
      setCurrentSession(session);
      setIsWalkingActive(session.status === 'active');
    });

    socketConnection.on('call-update', (call: CallSession) => {
      if (call.status === 'in-progress') {
        setCurrentCall(call);
        setIsCallActive(true);
      } else if (call.status === 'completed') {
        setIsCallActive(false);
        setCurrentCall(null);
      }
    });

    socketConnection.on('emergency-alert', (alert: any) => {
      setEmergencyAlerts(prev => [alert, ...prev]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Emergency Alert', alert.description);
    });

    return () => {
      socketConnection.disconnect();
    };
  };

  const loadTrustedContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem('trustedContacts');
      if (stored) {
        setTrustedContacts(JSON.parse(stored));
      } else {
        // Default emergency contacts
        const defaultContacts: TrustedContact[] = [
          { id: '1', name: 'Emergency Services', phone: '911', priority: 1 },
          { id: '2', name: 'Family Member', phone: '+1234567890', priority: 2 },
        ];
        setTrustedContacts(defaultContacts);
        await AsyncStorage.setItem('trustedContacts', JSON.stringify(defaultContacts));
      }
    } catch (error) {
      console.error('Error loading trusted contacts:', error);
    }
  };

  const setupSensorListeners = () => {
    // Set up accelerometer for fall detection
    Sensors.Accelerometer.setUpdateInterval(100);
    
    accelerometerSubscription.current = Sensors.Accelerometer.addListener(accelerometerData => {
      const { x, y, z } = accelerometerData;
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      
      // Simple fall detection algorithm
      if (acceleration > 2.5 || acceleration < 0.5) {
        detectPotentialFall();
      }
    });
  };

  const setupLocationTracking = async () => {
    if (locationPermission) {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          setCurrentLocation(location);
          if (currentSession) {
            // Update session route
            setCurrentSession(prev => prev ? {
              ...prev,
              route: [...prev.route, location]
            } : null);
          }
        }
      );
    }
  };

  const cleanupListeners = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    if (accelerometerSubscription.current) {
      accelerometerSubscription.current.remove();
    }
  };

  const detectPotentialFall = async () => {
    if (!isWalkingActive) return;

    const alert: SafetyAlert = {
      id: Date.now().toString(),
      type: 'fall_detected',
      severity: 'high',
      description: 'Potential fall detected. Are you okay?',
      timestamp: new Date().toISOString(),
      location: currentLocation || undefined,
      resolved: false
    };

    setSafetyAlerts(prev => [alert, ...prev]);
    
    // Give user 10 seconds to respond before auto-alert
    setTimeout(() => {
      if (!alert.resolved) {
        Alert.alert(
          'Fall Detected',
          'A potential fall was detected. Are you okay?',
          [
            { text: "I'm OK", onPress: () => resolveAlert(alert.id) },
            { text: 'Send Help', onPress: () => triggerEmergencyAlert(alert) }
          ]
        );
      }
    }, 2000);
  };

  const resolveAlert = (alertId: string) => {
    setSafetyAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  };

  const triggerEmergencyAlert = async (alert: SafetyAlert) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Send emergency alert to backend
      await fetch(`${BACKEND_URL}/api/emergency/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertType: alert.type,
          severity: alert.severity,
          description: alert.description,
          location: alert.location,
          userId: 'mobile-user',
          contacts: trustedContacts
        })
      });

      // Notify trusted contacts
      trustedContacts.forEach(contact => {
        if (contact.phone !== '911') {
          // Here you would implement SMS/call functionality
          console.log(`Notifying ${contact.name} at ${contact.phone}`);
        }
      });

      Alert.alert('Emergency Alert Sent', 'Your trusted contacts have been notified.');
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      Alert.alert('Error', 'Failed to send emergency alert');
    }
  };

  const startWalkingSession = async () => {
    if (!hasPermission || !locationPermission) {
      Alert.alert('Permissions Required', 'Camera and location permissions are required for SafeWalk.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);

      const session: WalkingSession = {
        id: 'session-' + Date.now(),
        startTime: new Date().toISOString(),
        route: [location],
        status: 'active',
        aiCompanionActive: aiCompanionActive,
        destinationName: destination || 'Unknown destination'
      };

      setCurrentSession(session);
      setIsWalkingActive(true);
      
      // Start monitoring
      setupSensorListeners();
      setupLocationTracking();

      // Send to backend
      const response = await fetch(`${BACKEND_URL}/api/walking-session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      Alert.alert('SafeWalk Started', 'Your walking session is now being monitored.');
    } catch (error) {
      console.error('Error starting walking session:', error);
      Alert.alert('Error', 'Failed to start SafeWalk session');
    }
  };

  const endWalkingSession = async () => {
    if (!currentSession) return;

    try {
      const endTime = new Date().toISOString();
      const duration = Math.round((new Date(endTime).getTime() - new Date(currentSession.startTime).getTime()) / 1000 / 60);

      const updatedSession = {
        ...currentSession,
        endTime,
        duration,
        status: 'completed' as const
      };

      await fetch(`${BACKEND_URL}/api/walking-session/${currentSession.id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSession)
      });

      setIsWalkingActive(false);
      setCurrentSession(null);
      cleanupListeners();
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('SafeWalk Ended', `You walked safely for ${duration} minutes.`);
    } catch (error) {
      console.error('Error ending walking session:', error);
      Alert.alert('Error', 'Failed to end SafeWalk session');
    }
  };

  const triggerPanicButton = async () => {
    const alert: SafetyAlert = {
      id: Date.now().toString(),
      type: 'panic_button',
      severity: 'high',
      description: 'Panic button activated by user',
      timestamp: new Date().toISOString(),
      location: currentLocation || undefined,
      resolved: false
    };

    setSafetyAlerts(prev => [alert, ...prev]);
    await triggerEmergencyAlert(alert);
  };

  const triggerManualEmergency = async () => {
    if (!emergencyMessage.trim()) {
      Alert.alert('Error', 'Please describe the emergency situation');
      return;
    }

    const alert: SafetyAlert = {
      id: Date.now().toString(),
      type: 'panic_button',
      severity: 'high',
      description: emergencyMessage,
      timestamp: new Date().toISOString(),
      location: currentLocation || undefined,
      resolved: false
    };

    setSafetyAlerts(prev => [alert, ...prev]);
    await triggerEmergencyAlert(alert);
    
    setShowEmergencyModal(false);
    setEmergencyMessage('');
  };

  const startWellnessCall = async (callId?: string) => {
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera permission is required for video calls.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const response = await fetch(`${BACKEND_URL}/api/calls/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: callId || 'manual-call-' + Date.now(),
          patientName: 'Mobile User',
          type: 'wellness-check'
        })
      });

      const callData = await response.json();
      setCurrentCall(callData);
      setIsCallActive(true);
    } catch (error) {
      console.error('Error starting call:', error);
      Alert.alert('Error', 'Failed to start wellness call');
    }
  };

  const endCall = async () => {
    if (!currentCall) return;

    try {
      await fetch(`${BACKEND_URL}/api/calls/${currentCall.id}/end`, {
        method: 'POST'
      });

      setIsCallActive(false);
      setCurrentCall(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error ending call:', error);
      Alert.alert('Error', 'Failed to end call');
    }
  };

  if (hasPermission === null || locationPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false || locationPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          SafeWalk requires camera and location permissions for your safety
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#1e3c72', '#2a5298']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>SafeWalk AI</Text>
        <Text style={styles.headerSubtitle}>Your Personal Safety Companion</Text>
        {isWalkingActive && (
          <View style={styles.sessionStatus}>
            <Text style={styles.sessionText}>🚶‍♂️ Active Session</Text>
            <Text style={styles.sessionDuration}>
              {currentSession?.destinationName || 'Walking...'}
            </Text>
          </View>
        )}
        {isCallActive && (
          <View style={styles.sessionStatus}>
            <Text style={styles.sessionText}>🎥 Video Call Active</Text>
            <Text style={styles.sessionDuration}>
              {currentCall?.patientName || 'Wellness Check'}
            </Text>
          </View>
        )}
      </LinearGradient>

      {isCallActive ? (
        <View style={styles.callContainer}>
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front"
            />
          </View>
          
          <View style={styles.callInfo}>
            <Text style={styles.callTitle}>Wellness Check in Progress</Text>
            <Text style={styles.callSubtitle}>
              {currentCall?.patientName || 'Unknown Patient'}
            </Text>
          </View>

          <View style={styles.callControls}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.endCallButton]}
              onPress={endCall}
            >
              <Text style={styles.controlButtonText}>End Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isWalkingActive ? (
        <View style={styles.activeSessionContainer}>
          <View style={styles.cameraContainer}>
            {aiCompanionActive && (
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="front"
              />
            )}
            {!aiCompanionActive && (
              <View style={styles.cameraPlaceholder}>
                <Text style={styles.cameraPlaceholderText}>
                  AI Companion Off
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.sessionControls}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.panicButton]}
              onPress={triggerPanicButton}
            >
              <Text style={styles.controlButtonText}>🚨 PANIC</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.endSessionButton]}
              onPress={endWalkingSession}
            >
              <Text style={styles.controlButtonText}>End Walk</Text>
            </TouchableOpacity>
          </View>

          {currentLocation && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                📍 Lat: {currentLocation.coords.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                📍 Lng: {currentLocation.coords.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView style={styles.dashboard} showsVerticalScrollIndicator={false}>          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Start Your Safe Walk</Text>
            
            <TouchableOpacity 
              style={[styles.primaryButton]}
              onPress={() => setShowDestinationModal(true)}
            >
              <Text style={styles.primaryButtonText}>🚶‍♂️ Start SafeWalk</Text>
            </TouchableOpacity>

            <View style={styles.settingsRow}>
              <Text style={styles.settingLabel}>AI Video Companion</Text>
              <Switch
                value={aiCompanionActive}
                onValueChange={setAiCompanionActive}
                trackColor={{ false: '#767577', true: '#1e3c72' }}
                thumbColor={aiCompanionActive ? '#2a5298' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => startWellnessCall()}
              >
                <Text style={styles.actionButtonText}>🎥</Text>
                <Text style={styles.actionButtonLabel}>Start Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.panicAction]}
                onPress={triggerPanicButton}
              >
                <Text style={styles.actionButtonText}>🚨</Text>
                <Text style={styles.actionButtonLabel}>Panic Button</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.emergencyAction]}
                onPress={() => setShowEmergencyModal(true)}
              >
                <Text style={styles.actionButtonText}>📞</Text>
                <Text style={styles.actionButtonLabel}>Call Help</Text>
              </TouchableOpacity>
            </View>
          </View>{/* Upcoming Video Calls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Calls ({upcomingCalls.length})</Text>
            {upcomingCalls.map((call) => (
              <View key={call.id} style={styles.callCard}>
                <View style={styles.callCardInfo}>
                  <Text style={styles.callCardTitle}>{call.patientName}</Text>
                  <Text style={styles.callCardTime}>
                    {new Date(call.scheduledTime).toLocaleTimeString()}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.joinButton}
                  onPress={() => startWellnessCall(call.id)}
                >
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              </View>
            ))}
            {upcomingCalls.length === 0 && (
              <Text style={styles.emptyText}>No upcoming calls scheduled</Text>
            )}
          </View>

          {/* Trusted Contacts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trusted Contacts</Text>
              <TouchableOpacity 
                style={styles.manageButton}
                onPress={() => setShowContactsModal(true)}
              >
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
            {trustedContacts.slice(0, 3).map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
            ))}
          </View>

          {/* Recent Safety Alerts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Safety Alerts</Text>
            {safetyAlerts.slice(0, 3).map((alert) => (
              <View 
                key={alert.id} 
                style={[
                  styles.alertCard, 
                  alert.severity === 'high' ? styles.alertHigh : 
                  alert.severity === 'medium' ? styles.alertMedium : styles.alertLow
                ]}
              >
                <View style={styles.alertHeader}>
                  <Text style={styles.alertType}>{alert.type.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.alertTime}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.alertDescription}>{alert.description}</Text>
                {alert.resolved && <Text style={styles.alertResolved}>✓ Resolved</Text>}
              </View>
            ))}
            {safetyAlerts.length === 0 && (
              <Text style={styles.emptyText}>No recent safety alerts</Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* Destination Modal */}
      <Modal
        visible={showDestinationModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Start SafeWalk</Text>
            <Text style={styles.modalSubtitle}>
              Where are you walking to?
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Destination (e.g., Home, Store, Friend's place)"
              value={destination}
              onChangeText={setDestination}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDestinationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.startButton]}
                onPress={() => {
                  setShowDestinationModal(false);
                  startWalkingSession();
                }}
              >
                <Text style={styles.startButtonText}>Start Walking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Emergency Modal */}
      <Modal
        visible={showEmergencyModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Emergency Help</Text>
            <Text style={styles.modalSubtitle}>
              Describe your emergency:
            </Text>
            
            <TextInput
              style={styles.emergencyInput}
              multiline
              numberOfLines={4}
              placeholder="What's happening?"
              value={emergencyMessage}
              onChangeText={setEmergencyMessage}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEmergencyModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.emergencyButton]}
                onPress={triggerManualEmergency}
              >
                <Text style={styles.emergencyButtonText}>Send Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Contacts Modal */}
      <Modal
        visible={showContactsModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Trusted Contacts</Text>
            <ScrollView style={styles.contactsList}>
              {trustedContacts.map((contact) => (
                <View key={contact.id} style={styles.contactModalCard}>
                  <Text style={styles.contactModalName}>{contact.name}</Text>
                  <Text style={styles.contactModalPhone}>{contact.phone}</Text>
                  <Text style={styles.contactModalPriority}>Priority: {contact.priority}</Text>
                </View>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.primaryButton]}
              onPress={() => setShowContactsModal(false)}
            >
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 5,
  },
  sessionStatus: {
    marginTop: 15,
    alignItems: 'center',
  },
  sessionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionDuration: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  dashboard: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  manageButton: {
    backgroundColor: '#1e3c72',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manageButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#1e3c72',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  panicAction: {
    backgroundColor: '#dc3545',
  },
  emergencyAction: {
    backgroundColor: '#fd7e14',
  },
  actionButtonText: {
    fontSize: 30,
    marginBottom: 10,
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  contactCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  alertCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  alertHigh: {
    borderLeftColor: '#dc3545',
  },
  alertMedium: {
    borderLeftColor: '#ffc107',
  },
  alertLow: {
    borderLeftColor: '#28a745',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  alertDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  alertResolved: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  button: {
    backgroundColor: '#1e3c72',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  activeSessionContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  sessionControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  panicButton: {
    backgroundColor: '#dc3545',
  },
  endSessionButton: {
    backgroundColor: '#6c757d',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfo: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 80 : 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  },
  locationText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 25,
    borderRadius: 15,
    width: width - 40,
    maxWidth: 400,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  emergencyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  startButton: {
    backgroundColor: '#1e3c72',
  },
  emergencyButton: {
    backgroundColor: '#dc3545',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emergencyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  contactsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  contactModalCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  contactModalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactModalPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  contactModalPriority: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },  // Video call styles
  callContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  callInfo: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 80 : 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  },
  callTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  callSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  callControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 80 : 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  endCallButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
  },
  
  // Call card styles
  callCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  callCardInfo: {
    flex: 1,
  },
  callCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  callCardTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  primaryAction: {
    backgroundColor: '#667eea',
  },
});
