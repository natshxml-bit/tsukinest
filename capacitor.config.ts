import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tsukinest.app',
  appName: 'TsukiNest',
  webDir: 'public',
  server: {
    url: 'https://tsukinest.my.id',
    cleartext: false
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '620991996534-6kfqvrrtpfq80ncj21un29bg0uphm40t.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;