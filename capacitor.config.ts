
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
    CapacitorAdMob: {
      appId: 'ca-app-pub-2750761696337886~8419627987',
    },
  }
};

export default config;
