import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tsukinest.app',
  appName: 'TsukiNest',
  webDir: 'public',
  server: {
    url: 'https://tsukinest.my.id',
    cleartext: false
  },
  // Karena Anda menggunakan plugin Firebase, 
  // konfigurasi Firebase biasanya diatur secara otomatis 
  // melalui file google-services.json di dalam folder android/app/
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    }
  }
};

export default config;
