
import type { CapacitorConfig } from '@capacitor/cli';
import 'dotenv/config';

const config: CapacitorConfig = {
  appId: 'com.brightnet.app',
  appName: 'Bright-Net',
  webDir: 'out',
  plugins: {

  },
  server: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002',
    cleartext: true,
  }
};

export default config;
