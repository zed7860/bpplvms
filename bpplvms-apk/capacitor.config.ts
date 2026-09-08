import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bpplvms.app',
  appName: 'BPPLVMS',
  webDir: 'www',
  server: {
    url: 'https://bpplvms.vercel.app/',
    cleartext: false
  }
};

export default config;
