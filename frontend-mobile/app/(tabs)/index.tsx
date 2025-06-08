// AI Video Call Platform - Mobile App

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useAppContext } from '@/context/AppContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');

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

export default function HomeScreen() {
  // Use the app context to access shared state and actions
  const { 
    isLoading, 
    isConnectedToBackend,
    currentCall, 
    isCallActive, 
    upcomingCalls,
    emergencyAlerts,
    refreshDashboardData,
    startWellnessCall, 
    endCall, 
    reportEmergency 
  } = useAppContext();

  // Local state
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const cameraRef = useRef<CameraView | null>(null);
  const colorScheme = useColorScheme();

  // Request camera permissions
  const requestPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshDashboardData();
    setRefreshing(false);
  }, [refreshDashboardData]);

  // Handle emergency reporting
  const handleEmergencyReport = async () => {
    if (await reportEmergency(emergencyMessage)) {
      setShowEmergencyModal(false);
      setEmergencyMessage('');
      // Trigger haptic feedback on success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Request camera permissions when component loads
  React.useEffect(() => {
    requestPermissions();
  }, []);

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required for video calls</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={requestPermissions}
          onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>AI Wellness Platform</Text>
        <Text style={styles.headerSubtitle}>Mobile Companion</Text>
        
        {/* Connection status indicator */}
        <View style={styles.connectionStatus}>
          <View style={[
            styles.statusIndicator, 
            isConnectedToBackend ? styles.statusConnected : styles.statusDisconnected
          ]}/>
          <Text style={styles.connectionText}>
            {isConnectedToBackend ? 'Connected to backend' : 'Not connected to backend'}
          </Text>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      ) : isCallActive ? (
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
              {currentCall?.patientName ?? 'Unknown Patient'}
            </Text>
          </View>

          <View style={styles.callControls}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.endCallButton]}
              onPress={endCall}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
            >
              <Text style={styles.controlButtonText}>End Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView 
          style={styles.dashboard} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#667eea']} 
              tintColor="#667eea"
            />
          }
        >
          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  startWellnessCall();
                }}
              >
                <Text style={styles.actionButtonText}>🎥</Text>
                <Text style={styles.actionButtonLabel}>Start Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.emergencyAction]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  setShowEmergencyModal(true);
                }}
              >
                <Text style={styles.actionButtonText}>🚨</Text>
                <Text style={styles.actionButtonLabel}>Emergency</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Upcoming Calls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Calls ({upcomingCalls.length})</Text>
            {upcomingCalls.length > 0 ? upcomingCalls.map((call) => (
              <View key={call.id} style={styles.callCard}>
                <View style={styles.callCardInfo}>
                  <Text style={styles.callCardTitle}>{call.patientName}</Text>
                  <Text style={styles.callCardTime}>
                    {new Date(call.scheduledTime).toLocaleTimeString()}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.joinButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    startWellnessCall(call.id);
                  }}
                >
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              </View>
            )) : (
              <Text style={styles.emptyText}>No upcoming calls scheduled</Text>
            )}
          </View>

          {/* Emergency Alerts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Alerts ({emergencyAlerts.length})</Text>
            {emergencyAlerts.length > 0 ? emergencyAlerts.map((alert) => (
              <View 
                key={alert.id} 
                style={[
                  styles.alertCard, 
                  (() => {
                    if (alert.severity === 'high') return styles.alertHigh;
                    if (alert.severity === 'medium') return styles.alertMedium;
                    return styles.alertLow;
                  })()
                ]}
              >
                <View style={styles.alertHeader}>
                  <Text style={styles.alertSeverity}>{alert.severity.toUpperCase()}</Text>
                  <Text style={styles.alertTime}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.alertDescription}>{alert.description}</Text>
                {alert.patientName && <Text style={styles.alertPatient}>{alert.patientName}</Text>}
              </View>
            )) : (
              <Text style={styles.emptyText}>No recent emergency alerts</Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* Emergency Modal */}
      <Modal
        visible={showEmergencyModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Report Emergency</Text>
            <Text style={styles.modalSubtitle}>
              Describe the emergency situation:
            </Text>
            
            <TextInput
              style={styles.emergencyInput}
              multiline
              numberOfLines={4}
              placeholder="Emergency description..."
              value={emergencyMessage}
              onChangeText={setEmergencyMessage}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowEmergencyModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.emergencyButton]}
                onPress={handleEmergencyReport}
                disabled={!emergencyMessage.trim()}
              >
                <Text style={styles.emergencyButtonText}>Report Emergency</Text>
              </TouchableOpacity>
            </View>
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
    marginTop: 10,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontSize: 24,
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
  connectionStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusConnected: {
    backgroundColor: '#4cd964',
  },
  statusDisconnected: {
    backgroundColor: '#ff3b30',
  },
  connectionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  dashboard: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
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
  primaryAction: {
    backgroundColor: '#667eea',
  },
  emergencyAction: {
    backgroundColor: '#ff6b6b',
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
    borderLeftColor: '#ff6b6b',
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
  alertSeverity: {
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
  alertPatient: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  callContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  camera: {
    flex: 1,
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
  controlButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
  endCallButton: {
    backgroundColor: '#ff6b6b',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
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
  emergencyButton: {
    backgroundColor: '#ff6b6b',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  emergencyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#667eea',
  },
});
