
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.wealthtracker',
  appName: 'wealth-tracker-ai',
  webDir: 'dist',
  server: {
    url: 'https://6dc5bf1a-eee8-4949-bf57-4e4cd1c08af7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  // Enhanced iOS and Android configurations for mobile optimization
  ios: {
    contentInset: 'always',
    backgroundColor: '#FFFFFF',
    allowsLinkPreview: false,
    scrollEnabled: true,
    // Handle safe areas and notched devices
    webContentsDebuggingEnabled: false,
  },
  android: {
    backgroundColor: "#FFFFFF",
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Optimize for mobile performance
    loggingBehavior: 'none',
  },
  // Global plugins configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#FFFFFF",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
    },
    Keyboard: {
      resize: 'ionic',
      style: 'DARK',
      resizeOnFullScreen: true,
    }
  }
};

export default config;
