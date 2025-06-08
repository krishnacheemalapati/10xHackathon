// Configuration settings for the mobile app

// Network configuration
export const NETWORK_CONFIG = {
  // When running on a device, you need to use the development machine's IP address
  // instead of localhost, as localhost refers to the device itself
  
  // For emulators, you can use:
  // - Android emulator: 10.0.2.2 (instead of localhost)
  // - iOS simulator: localhost
  
  // For physical devices on the same network as your dev machine:
  // Use your dev machine's local IP address (e.g., 192.168.1.100)
  
  // Production backend URL (when deploying)
  PROD_BACKEND_URL: 'https://your-production-backend.com',
  
  // Development backend URL
  DEV_BACKEND_URL: 'http://localhost:3002', // Replace with your computer's IP address
  
  // Function to get the right backend URL based on environment
  getBackendUrl: () => {
    if (__DEV__) {
      // When using a real device, use your machine's IP address
      return NETWORK_CONFIG.DEV_BACKEND_URL;
    } else {
      return NETWORK_CONFIG.PROD_BACKEND_URL;
    }
  }
};

// App feature flags
export const FEATURES = {
  ENABLE_FALL_DETECTION: true,
  ENABLE_EMERGENCY_ALERTS: true,
  ENABLE_LOCATION_TRACKING: true,
  ENABLE_VIDEO_CALLS: true
};

// Default settings
export const DEFAULT_SETTINGS = {
  DARK_MODE: false,
  NOTIFICATIONS: true,
  LOCATION_SERVICES: true,
  AI_COMPANION: true,
  EMERGENCY_CONTACTS: true,
  AUTO_EMERGENCY: true
};

// Timeout settings (in milliseconds)
export const TIMEOUTS = {
  FALL_DETECTION_RESPONSE: 10000, // 10 seconds
  EMERGENCY_AUTO_TRIGGER: 30000,  // 30 seconds
  SESSION_INACTIVITY: 300000,     // 5 minutes
  SOCKET_RECONNECT: 5000,         // 5 seconds
  API_REQUEST: 8000               // 8 seconds
};
