import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tsukinest.app',
  appName: 'TsukiNest',
  webDir: 'public',
  server: {
    url: 'https://tsukinest.my.id',
    cleartext: false
  }
};

export default config;