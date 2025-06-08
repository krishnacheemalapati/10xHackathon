import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { NETWORK_CONFIG, DEFAULT_SETTINGS } from '@/constants/Config';
import { useAppContext } from '@/context/AppContext';

// Define valid icon names for type safety
type ValidIconName = 
  | 'bell.fill'
  | 'person.crop.circle.fill.badge.plus'
  | 'location.fill'
  | 'person.fill'
  | 'person.crop.circle.fill'
  | 'network'
  | 'lock.fill'
  | 'questionmark.circle.fill'
  | 'info.circle.fill'
  | 'arrow.right.square.fill'
  | 'chevron.right';

interface SettingsOption {
  id: string;
  title: string;
  description: string;
  type: 'toggle' | 'action' | 'navigation';
  value?: boolean;
  onPress?: () => void;
  icon: ValidIconName;
  badge?: string;
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { isConnectedToBackend, refreshDashboardData } = useAppContext();
    // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(true);
  const [aiCompanionEnabled, setAiCompanionEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI state
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [appVersion] = useState('1.0.2'); // Hardcoded for now, would come from a config file in a real app

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkBackendConnection();
    await refreshDashboardData();
    setRefreshing(false);
  }, [refreshDashboardData]);

  // Separate logout function to handle async operations
  const performLogout = async () => {
    try {
      // Clear all user settings
      await AsyncStorage.multiRemove([
        'notificationsEnabled', 
        'locationTrackingEnabled',
        'aiCompanionEnabled'
      ]);
      
      // Show success message
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'You have been logged out successfully');
      
      // Reset settings to defaults
      setNotificationsEnabled(DEFAULT_SETTINGS.NOTIFICATIONS);
      setLocationTrackingEnabled(DEFAULT_SETTINGS.LOCATION_SERVICES);
      setAiCompanionEnabled(DEFAULT_SETTINGS.AI_COMPANION);
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  // Separate function for backend URL reset
  const performBackendReset = async () => {
    try {
      // In a real app, this would store the setting and update the Config
      Alert.alert('Backend connection reset');
      await checkBackendConnection();
    } catch (error) {
      console.error('Error resetting backend URL:', error);
    }
  };
  
  useEffect(() => {
    // Load saved settings
  const loadSettings = async () => {
      try {
        // Use defaults from config if no saved settings exist
        const notificationsValue = await AsyncStorage.getItem('notificationsEnabled');
        setNotificationsEnabled(
          notificationsValue !== null 
            ? notificationsValue === 'true' 
            : DEFAULT_SETTINGS.NOTIFICATIONS
        );
        
        const locationValue = await AsyncStorage.getItem('locationTrackingEnabled');
        setLocationTrackingEnabled(
          locationValue !== null
            ? locationValue === 'true'
            : DEFAULT_SETTINGS.LOCATION_SERVICES
        );
        
        const aiValue = await AsyncStorage.getItem('aiCompanionEnabled');
        setAiCompanionEnabled(
          aiValue !== null
            ? aiValue === 'true'
            : DEFAULT_SETTINGS.AI_COMPANION
        );

        // Load app connection status
        checkBackendConnection();
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Check if backend is reachable
  const checkBackendConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const response = await fetch(`${NETWORK_CONFIG.getBackendUrl()}/api/health`, { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Short timeout to prevent long waiting
        signal: AbortSignal.timeout(3000)
      });
      
      // Get response data if available
      if (response.ok) {
        const data = await response.json();
        console.log('Backend health status:', data);
      }
    } catch (error) {
      console.error('Backend connection check failed:', error);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const saveSettings = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
      // Show success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const toggleSetting = (key: string, value: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    Haptics.selectionAsync(); // Provide haptic feedback
    setter(value);
    saveSettings(key, value);
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => void performLogout()
        },
      ]
    );
  };

  const handleResetBackendURL = () => {
    Alert.alert(
      'Reset Backend URL',
      'This will reset the connection to the default backend URL. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },        { 
          text: 'Reset', 
          onPress: () => void performBackendReset()
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Haptics.selectionAsync();
    Linking.openURL('https://www.example.com/privacy-policy');
  };

  const settingsOptions: SettingsOption[] = [
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Enable push notifications for alerts and updates',
      type: 'toggle',
      value: notificationsEnabled,
      icon: 'bell.fill',
      onPress: () => toggleSetting('notificationsEnabled', !notificationsEnabled, setNotificationsEnabled)
    },
    {
      id: 'emergencyContacts',
      title: 'Emergency Contacts',
      description: 'Manage your emergency contact list',
      type: 'navigation',
      icon: 'person.crop.circle.fill.badge.plus',
      badge: '3',
      onPress: () => {
        Haptics.selectionAsync();
        Alert.alert('Emergency Contacts', 'This would navigate to contacts management');
      }
    },
    {
      id: 'locationTracking',
      title: 'Location Tracking',
      description: 'Allow the app to track your location during walks',
      type: 'toggle',
      value: locationTrackingEnabled,
      icon: 'location.fill',
      onPress: () => toggleSetting('locationTrackingEnabled', !locationTrackingEnabled, setLocationTrackingEnabled)
    },
    {
      id: 'aiCompanion',
      title: 'AI Companion',
      description: 'Enable the AI safety companion during walks',
      type: 'toggle',
      value: aiCompanionEnabled,
      icon: 'person.fill',
      onPress: () => toggleSetting('aiCompanionEnabled', !aiCompanionEnabled, setAiCompanionEnabled)
    },
    {
      id: 'account',
      title: 'Account Settings',
      description: 'Manage your account details and preferences',
      type: 'navigation',
      icon: 'person.crop.circle.fill',
      onPress: () => {
        Haptics.selectionAsync();
        Alert.alert('Account Settings', 'This would navigate to account management');
      }
    },
    {
      id: 'connection',
      title: 'Backend Connection',
      description: 'Configure the connection to the backend server',
      type: 'navigation',
      icon: 'network',
      onPress: handleResetBackendURL
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      description: 'Review our privacy policy',
      type: 'navigation',
      icon: 'lock.fill',
      onPress: openPrivacyPolicy
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help with using the app',
      type: 'navigation',
      icon: 'questionmark.circle.fill',
      onPress: () => {
        Haptics.selectionAsync();
        Alert.alert('Help & Support', 'This would navigate to help center');
      }
    },
    {
      id: 'about',
      title: 'About',
      description: 'Learn more about our app and services',
      type: 'navigation',
      icon: 'info.circle.fill',
      onPress: () => {
        Haptics.selectionAsync();
        Alert.alert('About', `AI Video Call Platform v${appVersion}`);
      }
    },
    {
      id: 'logout',
      title: 'Logout',
      description: 'Sign out of your account',
      type: 'action',
      icon: 'arrow.right.square.fill',
      onPress: handleLogout
    },
  ];

  const renderSettingItem = (option: SettingsOption) => (
    <TouchableOpacity
      key={option.id}
      style={styles.settingItem}
      onPress={option.onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.settingIconContainer,
        { backgroundColor: Colors[colorScheme ?? 'light'].tint + '15' }
      ]}>
        <IconSymbol 
          name={option.icon} 
          size={24} 
          color={Colors[colorScheme ?? 'light'].tint} 
        />
      </View>
      <View style={styles.settingContent}>
        <ThemedText style={styles.settingTitle}>{option.title}</ThemedText>
        <ThemedText style={styles.settingDescription}>{option.description}</ThemedText>
      </View>
      {option.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{option.badge}</Text>
        </View>
      )}
      {option.type === 'toggle' && (
        <Switch
          value={option.value}
          onValueChange={option.onPress}
          trackColor={{ 
            false: '#767577', 
            true: Colors[colorScheme ?? 'light'].tint + '80' 
          }}
          thumbColor={option.value ? Colors[colorScheme ?? 'light'].tint : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
        />
      )}
      {option.type === 'navigation' && (
        <IconSymbol 
          name="chevron.right" 
          size={20} 
          color={Colors[colorScheme ?? 'light'].text + '80'} 
        />
      )}
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors[colorScheme ?? 'light'].tint]}
            tintColor={Colors[colorScheme ?? 'light'].tint}
          />
        }
      >
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Settings</ThemedText>
          
          {/* Backend Connection Status */}
          <TouchableOpacity 
            style={[
              styles.connectionStatus,
              isConnectedToBackend ? styles.connectionStatusConnected : styles.connectionStatusDisconnected
            ]}
            onPress={checkBackendConnection}
          >
            <View style={[
              styles.statusIndicator, 
              isConnectedToBackend ? styles.statusConnected : styles.statusDisconnected
            ]} />            <ThemedText style={styles.connectionText}>
              {(() => {
                if (isCheckingConnection) return "Checking connection...";
                if (isConnectedToBackend) return "Connected to backend";
                return "Backend disconnected";
              })()}
            </ThemedText>
            {isCheckingConnection && (
              <ActivityIndicator 
                size="small" 
                color={Colors[colorScheme ?? 'light'].tint} 
                style={{marginLeft: 5}} 
              />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingsContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>App Settings</ThemedText>
          </View>
          
          {/* First settings group */}
          <View style={styles.settingsGroup}>
            {settingsOptions.slice(0, 4).map(renderSettingItem)}
          </View>
          
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Account & Support</ThemedText>
          </View>
          
          {/* Second settings group */}
          <View style={styles.settingsGroup}>
            {settingsOptions.slice(4, 9).map(renderSettingItem)}
          </View>
          
          {/* Logout separate for emphasis */}
          <View style={[styles.settingsGroup, styles.logoutGroup]}>
            {renderSettingItem(settingsOptions[9])}
          </View>
        </View>
        
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            AI Video Call Platform v{appVersion}
          </ThemedText>
          <ThemedText style={styles.footerText}>
            © 2025 AIWellnessPlatform Inc.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  connectionStatusConnected: {
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderColor: 'rgba(76, 217, 100, 0.3)',
  },
  connectionStatusDisconnected: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
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
    fontSize: 14,
    opacity: 0.8,
  },
  settingsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    marginTop: 25,
    marginBottom: 10,
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.7,
  },
  settingsGroup: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutGroup: {
    marginTop: 30,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    opacity: 0.5,
    marginBottom: 5,
  },
});
