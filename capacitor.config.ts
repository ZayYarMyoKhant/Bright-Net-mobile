
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.brightnet.app',
  appName: 'Bright-Net',
  webDir: 'out',
  server: {
    url: 'https://bright-net-mobile.vercel.app',
    cleartext: true
  },
  plugins: {

  },
  android: {
    versionCode: 2,
    versionName: "1.0.1"
  }
};

export default config;
