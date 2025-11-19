
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.brightnet.app',
  appName: 'Bright-Net',
  webDir: 'out',
  server: {
    url: 'https://bright-net-mobile.vercel.app',
    cleartext: true
  }
};

export default config;
