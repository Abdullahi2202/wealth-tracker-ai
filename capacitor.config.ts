
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.wealthtracker',
  appName: 'wealth-tracker-ai',
  webDir: 'dist',
  server: {
    url: 'https://6dc5bf1a-eee8-4949-bf57-4e4cd1c08af7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  // Add iOS and Android specific configurations
  ios: {
    contentInset: 'always',
  },
  android: {
    backgroundColor: "#FFFFFF",
  }
};

export default config;
