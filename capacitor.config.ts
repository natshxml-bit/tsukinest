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
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
      clientId: "620991996534-6kfqvrrtpfq80ncj21un29bg0uphm40t.apps.googleusercontent.com"
    }
  }
};

export default config;
